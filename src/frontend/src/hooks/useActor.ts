import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";

// Shared ref so waitForActorReady can access the latest actor outside of React
let _latestActor: backendInterface | null = null;

export function getLatestActor(): backendInterface | null {
  return _latestActor;
}

/**
 * Wait up to `timeoutMs` for the actor to become available.
 * Call this in mutations instead of checking `actor` directly.
 */
export async function waitForActorReady(
  getActor: () => backendInterface | null = getLatestActor,
  timeoutMs = 8000,
): Promise<backendInterface> {
  const interval = 100;
  let elapsed = 0;
  while (elapsed < timeoutMs) {
    const a = getActor();
    if (a) return a;
    await new Promise((r) => setTimeout(r, interval));
    elapsed += interval;
  }
  throw new Error("Actor not ready after timeout");
}

export function useActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const isAuthenticated = !!identity;

      if (!isAuthenticated) {
        const actor = await createActorWithConfig();
        _latestActor = actor;
        return actor;
      }

      const actorOptions = {
        agentOptions: {
          identity,
        },
      };

      const actor = await createActorWithConfig(actorOptions);
      const adminToken = getSecretParameter("caffeineAdminToken") || "";
      await actor._initializeAccessControlWithSecret(adminToken);
      _latestActor = actor;
      return actor;
    },
    staleTime: Number.POSITIVE_INFINITY,
    enabled: true,
  });

  // Keep _latestActor in sync whenever actorQuery.data changes
  const prevActorRef = useRef<backendInterface | null>(null);
  if (actorQuery.data && actorQuery.data !== prevActorRef.current) {
    prevActorRef.current = actorQuery.data;
    _latestActor = actorQuery.data;
  }

  // When the actor changes, invalidate dependent queries
  useEffect(() => {
    if (actorQuery.data) {
      queryClient.invalidateQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        },
      });
      queryClient.refetchQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        },
      });
    }
  }, [actorQuery.data, queryClient]);

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
    getLatestActor,
  };
}

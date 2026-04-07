import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";

// Module-level actor cache so getLatestActor/waitForActorReady can access it
// without needing to be inside a React component.
let _latestActor: backendInterface | null = null;
let _actorReadyListeners: Array<(actor: backendInterface) => void> = [];

export function getLatestActor(): backendInterface | null {
  return _latestActor;
}

export async function waitForActorReady(
  getActor?: () => backendInterface | null,
  timeoutMs = 8000,
): Promise<backendInterface> {
  const resolveActor = getActor ?? getLatestActor;
  const current = resolveActor();
  if (current) return current;

  return new Promise<backendInterface>((resolve, reject) => {
    const timer = setTimeout(() => {
      _actorReadyListeners = _actorReadyListeners.filter((l) => l !== listener);
      reject(new Error("Actor not ready after timeout"));
    }, timeoutMs);

    const listener = (actor: backendInterface) => {
      clearTimeout(timer);
      resolve(actor);
    };
    _actorReadyListeners.push(listener);
  });
}

export function useActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const isAuthenticated = !!identity;

      if (!isAuthenticated) {
        // Return anonymous actor if not authenticated
        const anonActor = await createActorWithConfig();
        _latestActor = anonActor;
        for (const l of _actorReadyListeners) {
          l(anonActor);
        }
        _actorReadyListeners = [];
        return anonActor;
      }

      const actorOptions = {
        agentOptions: {
          identity,
        },
      };

      const actor = await createActorWithConfig(actorOptions);
      const adminToken = getSecretParameter("caffeineAdminToken") || "";
      await actor._initializeAccessControlWithSecret(adminToken);

      // Update module-level cache and notify waiters
      _latestActor = actor;
      for (const l of _actorReadyListeners) {
        l(actor);
      }
      _actorReadyListeners = [];

      return actor;
    },
    // Only refetch when identity changes
    staleTime: Number.POSITIVE_INFINITY,
    // This will cause the actor to be recreated when the identity changes
    enabled: true,
  });

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
  };
}

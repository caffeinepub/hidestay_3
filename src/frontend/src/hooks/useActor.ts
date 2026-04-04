import type { Identity } from "@icp-sdk/core/agent";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";

// Internal helper to build an actor for a given identity
async function buildActor(
  identity: Identity | undefined,
): Promise<backendInterface> {
  if (!identity) {
    return await createActorWithConfig();
  }
  const actorOptions = {
    agentOptions: {
      identity,
    },
  };
  const actor = await createActorWithConfig(actorOptions);
  const adminToken = getSecretParameter("caffeineAdminToken") || "";
  await actor._initializeAccessControlWithSecret(adminToken);
  return actor;
}

/**
 * Waits up to `timeoutMs` for the actor to become available.
 * Pass the `getLatestActor` function returned by useActor.
 */
export async function waitForActorReady(
  getLatest: () => backendInterface | null,
  timeoutMs = 8000,
): Promise<backendInterface> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const a = getLatest();
    if (a) return a;
    await new Promise((res) => setTimeout(res, 100));
  }
  // One final attempt
  const a = getLatest();
  if (a) return a;
  throw new Error("Actor not ready. Please try again.");
}

export function useActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      return await buildActor(identity || undefined);
    },
    staleTime: Number.POSITIVE_INFINITY,
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

  // getLatestActor: always returns the currently cached actor
  const getLatestActor = useCallback((): backendInterface | null => {
    const cached = queryClient.getQueryData<backendInterface>([
      ACTOR_QUERY_KEY,
      identity?.getPrincipal().toString(),
    ]);
    return cached || actorQuery.data || null;
  }, [queryClient, identity, actorQuery.data]);

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
    getLatestActor,
  };
}

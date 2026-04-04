import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useEffect } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";
export function useActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const isAuthenticated = !!identity;

      if (!isAuthenticated) {
        // Return anonymous actor if not authenticated
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

  // Returns the latest actor directly from query cache (avoids stale closure)
  const getLatestActor = useCallback((): backendInterface | null => {
    return (
      queryClient.getQueryData<backendInterface>([
        ACTOR_QUERY_KEY,
        identity?.getPrincipal().toString(),
      ]) ?? null
    );
  }, [queryClient, identity]);

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
    getLatestActor,
  };
}

/**
 * Polls the query cache via getLatestActor until an actor is available.
 * Waits up to maxWaitMs (default 8s) before throwing.
 */
export async function waitForActorReady(
  getLatestActor: () => backendInterface | null,
  maxWaitMs = 8000,
): Promise<backendInterface> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const a = getLatestActor();
    if (a) return a;
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("Backend not ready. Please try again.");
}

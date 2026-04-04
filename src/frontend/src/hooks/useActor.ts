import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";

// Exported helper: waits up to 10s for actor to be ready, then returns it
export async function waitForActorReady(
  getActor: () => backendInterface | null,
  maxWaitMs = 10000,
): Promise<backendInterface> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function check() {
      const actor = getActor();
      if (actor) {
        resolve(actor);
        return;
      }
      if (Date.now() - start > maxWaitMs) {
        reject(new Error("Actor not ready. Please refresh and try again."));
        return;
      }
      setTimeout(check, 200);
    }
    check();
  });
}

export function useActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  // Keep a ref to the latest actor so getLatestActor always returns current value
  const actorRef = useRef<backendInterface | null>(null);

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
    enabled: true,
  });

  // Keep the ref in sync with the latest actor data
  useEffect(() => {
    if (actorQuery.data) {
      actorRef.current = actorQuery.data;
    }
  }, [actorQuery.data]);

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

  // Stable callback that always returns the latest actor from the ref
  const getLatestActor = useCallback(() => {
    return actorRef.current;
  }, []);

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
    getLatestActor,
  };
}

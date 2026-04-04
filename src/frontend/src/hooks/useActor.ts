import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";

// Module-level actor cache so mutations can access it outside React hooks
let _latestActor: backendInterface | null = null;
let _actorReadyResolvers: Array<(actor: backendInterface) => void> = [];

/**
 * Returns the latest actor synchronously, or null if not yet ready.
 * Used by mutations in useQueries.ts.
 */
export function getLatestActor(): backendInterface | null {
  return _latestActor;
}

/**
 * Waits until the actor is ready (up to 10 seconds), then returns it.
 * Used by mutations in useQueries.ts to avoid race conditions on page load.
 */
export async function waitForActorReady(
  _getActor?: () => backendInterface | null,
): Promise<backendInterface> {
  if (_latestActor) {
    return _latestActor;
  }
  // Wait up to 10 seconds for actor to become available
  return new Promise<backendInterface>((resolve, reject) => {
    const timeout = setTimeout(() => {
      _actorReadyResolvers = _actorReadyResolvers.filter((r) => r !== resolve);
      reject(new Error("Actor not ready after 10 seconds"));
    }, 10_000);

    const wrappedResolve = (actor: backendInterface) => {
      clearTimeout(timeout);
      resolve(actor);
    };
    _actorReadyResolvers.push(wrappedResolve);
  });
}

function notifyActorReady(actor: backendInterface) {
  _latestActor = actor;
  const resolvers = _actorReadyResolvers.splice(0);
  for (const resolve of resolvers) {
    resolve(actor);
  }
}

export function useActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const prevActorRef = useRef<backendInterface | null>(null);

  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const isAuthenticated = !!identity;

      if (!isAuthenticated) {
        // Return anonymous actor if not authenticated
        const anonActor = await createActorWithConfig();
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
      return actor;
    },
    // Only refetch when identity changes
    staleTime: Number.POSITIVE_INFINITY,
    enabled: true,
  });

  // Keep module-level cache in sync and notify any waiting mutations
  useEffect(() => {
    if (actorQuery.data && actorQuery.data !== prevActorRef.current) {
      prevActorRef.current = actorQuery.data;
      notifyActorReady(actorQuery.data);
      // Invalidate dependent queries when actor changes
      queryClient.invalidateQueries({
        predicate: (query) => !query.queryKey.includes(ACTOR_QUERY_KEY),
      });
      queryClient.refetchQueries({
        predicate: (query) => !query.queryKey.includes(ACTOR_QUERY_KEY),
      });
    }
  }, [actorQuery.data, queryClient]);

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
  };
}

import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Booking,
  Property,
  ShoppingItem,
  StripeConfiguration,
  UserApprovalInfo,
  UserProfile,
} from "../backend";
import { type ApprovalStatus, Variant_admin_owner_student } from "../backend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

// === Auth / Profile ===
export function useCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsApproved() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isApproved"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerApproved();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["callerProfile"] });
      qc.invalidateQueries({ queryKey: ["isAdmin"] });
    },
  });
}

export function useRequestApproval() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      await actor.requestApproval();
    },
  });
}

// === Properties ===
export function useApprovedProperties() {
  const { actor, isFetching } = useActor();
  return useQuery<Property[]>({
    queryKey: ["approvedProperties"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getApprovedProperties();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllProperties() {
  const { actor, isFetching } = useActor();
  return useQuery<Property[]>({
    queryKey: ["allProperties"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getProperties();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useProperty(id: bigint | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<Property | null>({
    queryKey: ["property", id?.toString()],
    queryFn: async () => {
      if (!actor || id === undefined) return null;
      return actor.getProperty(id);
    },
    enabled: !!actor && !isFetching && id !== undefined,
  });
}

export function useListProperty() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (property: Property) => {
      if (!actor) throw new Error("Not connected");
      await actor.listProperty(property);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approvedProperties"] });
      qc.invalidateQueries({ queryKey: ["allProperties"] });
    },
  });
}

export function useUpdateProperty() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      property,
    }: { id: bigint; property: Property }) => {
      if (!actor) throw new Error("Not connected");
      await actor.updateProperty(id, property);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approvedProperties"] });
      qc.invalidateQueries({ queryKey: ["allProperties"] });
    },
  });
}

export function useApproveProperty() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (propertyId: bigint) => {
      if (!actor) throw new Error("Not connected");
      await actor.approveProperty(propertyId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approvedProperties"] });
      qc.invalidateQueries({ queryKey: ["allProperties"] });
    },
  });
}

// === Bookings ===
export function useMyBookings(principal: Principal | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<Booking[]>({
    queryKey: ["myBookings", principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return [];
      return actor.getUserBookings(principal);
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useAllBookings() {
  const { actor, isFetching } = useActor();
  return useQuery<Booking[]>({
    queryKey: ["allBookings"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBookings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePropertyBookings(propertyId: bigint | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<Booking[]>({
    queryKey: ["propertyBookings", propertyId?.toString()],
    queryFn: async () => {
      if (!actor || propertyId === undefined) return [];
      return actor.getPropertyBookings(propertyId);
    },
    enabled: !!actor && !isFetching && propertyId !== undefined,
  });
}

export function useBookProperty() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (booking: Booking) => {
      if (!actor) throw new Error("Not connected");
      await actor.bookProperty(booking);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myBookings"] });
      qc.invalidateQueries({ queryKey: ["allBookings"] });
    },
  });
}

// === Admin User Approval ===
export function useListApprovals() {
  const { actor, isFetching } = useActor();
  return useQuery<UserApprovalInfo[]>({
    queryKey: ["approvals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listApprovals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetApproval() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      principal,
      status,
    }: {
      principal: Principal;
      status: ApprovalStatus;
    }) => {
      if (!actor) throw new Error("Not connected");
      await actor.setApproval(principal, status);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approvals"] });
    },
  });
}

// === Stripe ===
export function useIsStripeConfigured() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["stripeConfigured"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetStripeConfig() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config: StripeConfiguration) => {
      if (!actor) throw new Error("Not connected");
      await actor.setStripeConfiguration(config);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stripeConfigured"] });
    },
  });
}

export function useCreateCheckoutSession() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      items,
      successUrl,
      cancelUrl,
    }: {
      items: ShoppingItem[];
      successUrl: string;
      cancelUrl: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createCheckoutSession(items, successUrl, cancelUrl);
    },
  });
}

export function useStripeSessionStatus(sessionId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["stripeSession", sessionId],
    queryFn: async () => {
      if (!actor || !sessionId) return null;
      return actor.getStripeSessionStatus(sessionId);
    },
    enabled: !!actor && !isFetching && !!sessionId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 3000;
      if (data.__kind__ === "completed" || data.__kind__ === "failed")
        return false;
      return 3000;
    },
  });
}

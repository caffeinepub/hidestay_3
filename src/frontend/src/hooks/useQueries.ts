import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Announcement,
  Booking,
  Inquiry,
  Notification,
  Property,
  Report,
  ShoppingItem,
  StripeConfiguration,
  UserApprovalInfo,
  UserProfile,
} from "../backend";
import type {
  ApprovalStatus,
  Variant_bookVisit_contactOwner,
  Variant_rejected_accepted,
} from "../backend";
import { useActor } from "./useActor";

// Review type (defined locally as it may not be exported from backend.ts)
export interface Review {
  propertyId: bigint;
  student: Principal;
  rating: bigint;
  comment: string;
  timestamp: bigint;
}

export interface DailyActiveUserCount {
  date: string;
  count: bigint;
}

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

export function useCancelBooking() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: bigint) => {
      if (!actor) throw new Error("Not connected");
      await (actor as any).cancelBooking(bookingId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myBookings"] });
      qc.invalidateQueries({ queryKey: ["allBookings"] });
      qc.invalidateQueries({ queryKey: ["propertyBookings"] });
    },
  });
}

export function useConfirmBooking() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: bigint) => {
      if (!actor) throw new Error("Not connected");
      await (actor as any).confirmBooking(bookingId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allBookings"] });
      qc.invalidateQueries({ queryKey: ["propertyBookings"] });
    },
  });
}

export function useRejectBooking() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: bigint) => {
      if (!actor) throw new Error("Not connected");
      await (actor as any).rejectBooking(bookingId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allBookings"] });
      qc.invalidateQueries({ queryKey: ["propertyBookings"] });
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

// === Reviews ===
export function usePropertyReviews(propertyId: bigint | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<Review[]>({
    queryKey: ["reviews", propertyId?.toString()],
    queryFn: async () => {
      if (!actor || propertyId === undefined) return [];
      const a = actor as any;
      return (await a.getReviews(propertyId)) as Review[];
    },
    enabled: !!actor && !isFetching && propertyId !== undefined,
  });
}

export function useAddReview() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      propertyId,
      rating,
      comment,
    }: {
      propertyId: bigint;
      rating: bigint;
      comment: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as any;
      await a.addReview(propertyId, rating, comment);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: ["reviews", variables.propertyId.toString()],
      });
    },
  });
}

export function useDeleteReview() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      propertyId,
      reviewer,
    }: {
      propertyId: bigint;
      reviewer: Principal;
    }) => {
      if (!actor) throw new Error("Not connected");
      const a = actor as any;
      await a.deleteReview(propertyId, reviewer);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: ["reviews", variables.propertyId.toString()],
      });
    },
  });
}

// === Inquiries ===
export function useOwnerInquiries() {
  const { actor, isFetching } = useActor();
  return useQuery<Inquiry[]>({
    queryKey: ["ownerInquiries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOwnerInquiries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateInquiry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      propertyId,
      studentName,
      studentPhone,
      inquiryType,
      message,
    }: {
      propertyId: bigint;
      studentName: string;
      studentPhone: string;
      inquiryType: Variant_bookVisit_contactOwner;
      message: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      await actor.createInquiry(
        propertyId,
        studentName,
        studentPhone,
        inquiryType,
        message,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerInquiries"] });
    },
  });
}

export function useUpdateInquiryStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      inquiryId,
      status,
    }: {
      inquiryId: bigint;
      status: Variant_rejected_accepted;
    }) => {
      if (!actor) throw new Error("Not connected");
      await actor.updateInquiryStatus(inquiryId, status);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerInquiries"] });
    },
  });
}

// === Notifications ===
export function useOwnerNotifications() {
  const { actor, isFetching } = useActor();
  return useQuery<Notification[]>({
    queryKey: ["ownerNotifications"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOwnerNotifications();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUnreadNotificationCount() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["unreadNotificationCount"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getUnreadNotificationCount();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: bigint) => {
      if (!actor) throw new Error("Not connected");
      await actor.markNotificationRead(notificationId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerNotifications"] });
      qc.invalidateQueries({ queryKey: ["unreadNotificationCount"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      await actor.markAllNotificationsRead();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ownerNotifications"] });
      qc.invalidateQueries({ queryKey: ["unreadNotificationCount"] });
    },
  });
}

// === Delete Property ===
export function useDeleteProperty() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (propertyId: bigint) => {
      if (!actor) throw new Error("Not connected");
      await actor.deleteProperty(propertyId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allProperties"] });
      qc.invalidateQueries({ queryKey: ["approvedProperties"] });
    },
  });
}

// === Block / Unblock Users ===
export function useBlockUser() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("Not connected");
      await actor.blockUser(user);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approvals"] });
    },
  });
}

export function useUnblockUser() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("Not connected");
      await actor.unblockUser(user);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approvals"] });
    },
  });
}

// === Verify Property ===
export function useVerifyProperty() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (propertyId: bigint) => {
      if (!actor) throw new Error("Not connected");
      await actor.verifyProperty(propertyId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allProperties"] });
      qc.invalidateQueries({ queryKey: ["approvedProperties"] });
    },
  });
}

// === Reports ===
export function useSubmitReport() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      targetPropertyId,
      reason,
      description,
    }: {
      targetPropertyId: bigint;
      reason: string;
      description: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      await actor.submitReport(targetPropertyId, reason, description);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useGetReports() {
  const { actor, isFetching } = useActor();
  return useQuery<Report[]>({
    queryKey: ["reports"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getReports();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useResolveReport() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      reportId,
      actionTaken,
    }: {
      reportId: bigint;
      actionTaken: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      await actor.resolveReport(reportId, actionTaken);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useDismissReport() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reportId: bigint) => {
      if (!actor) throw new Error("Not connected");
      await actor.dismissReport(reportId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

// === Announcements ===
export function useCreateAnnouncement() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      message,
      expiresAt,
    }: {
      title: string;
      message: string;
      expiresAt: bigint | null;
    }) => {
      if (!actor) throw new Error("Not connected");
      await actor.createAnnouncement(title, message, expiresAt);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activeAnnouncements"] });
    },
  });
}

export function useGetActiveAnnouncements() {
  const { actor, isFetching } = useActor();
  return useQuery<Announcement[]>({
    queryKey: ["activeAnnouncements"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getActiveAnnouncements();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDeactivateAnnouncement() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      await actor.deactivateAnnouncement(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activeAnnouncements"] });
    },
  });
}

// === Analytics ===
export function useAnalyticsSummary() {
  const { actor, isFetching } = useActor();
  return useQuery<{
    pendingListings: bigint;
    totalProperties: bigint;
    activeListings: bigint;
    totalReports: bigint;
    totalBookings: bigint;
    totalUsers: bigint;
    totalInquiries: bigint;
  } | null>({
    queryKey: ["analyticsSummary"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAnalyticsSummary();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTrackPropertyView() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (propertyId: bigint) => {
      if (!actor) throw new Error("Not connected");
      await actor.trackPropertyView(propertyId);
    },
  });
}

export function useGetDailyActiveUserCounts() {
  const { actor, isFetching } = useActor();
  return useQuery<DailyActiveUserCount[]>({
    queryKey: ["dailyActiveUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDailyActiveUserCounts() as Promise<
        DailyActiveUserCount[]
      >;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetStripePayments() {
  const { actor, isFetching } = useActor();
  return useQuery<string>({
    queryKey: ["stripePayments"],
    queryFn: async () => {
      if (!actor) return "";
      return actor.getStripePayments();
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
  });
}

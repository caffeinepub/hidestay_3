import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  AlertCircle,
  Bell,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Inbox,
  PlusCircle,
  ShieldCheck,
  ShieldX,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Variant_pending_rejected_accepted } from "../../backend";
import RouteGuard from "../../components/RouteGuard";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import {
  useAllBookings,
  useAllProperties,
  useIsApproved,
  useOwnerInquiries,
  useUnreadNotificationCount,
} from "../../hooks/useQueries";
import type { IDVRequest } from "../admin/AdminIdVerificationPage";
import { getIdvRequests } from "../admin/AdminIdVerificationPage";

export default function OwnerDashboardPage() {
  return (
    <RouteGuard requiredRole="owner">
      <OwnerDashboardInner />
    </RouteGuard>
  );
}

const bookingStatusColors: Record<string, string> = {
  paid: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  rejected: "bg-gray-100 text-gray-600 border-gray-200",
};

function IdVerificationCard({ principal }: { principal: string }) {
  const [request, setRequest] = useState<IDVRequest | null>(() => {
    const requests = getIdvRequests();
    return requests.find((r) => r.principal === principal) ?? null;
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit() {
    if (!preview) {
      toast.error("Please select an ID document");
      return;
    }
    setSubmitting(true);
    try {
      const newRequest: IDVRequest = {
        principal,
        status: "pending",
        submittedAt: Date.now(),
        fileDataUrl: preview,
        notes: "",
      };

      const existing = getIdvRequests().filter(
        (r) => r.principal !== principal,
      );
      const updated = [newRequest, ...existing];
      localStorage.setItem("hidestay_idv_requests", JSON.stringify(updated));
      localStorage.setItem(`hidestay_idv_${principal}`, "pending");
      setRequest(newRequest);
      setPreview(null);
      toast.success(
        "ID proof submitted for review. Admin will verify within 24 hours.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const localFlag = localStorage.getItem(`hidestay_idv_${principal}`);
  const isApproved = request?.status === "approved" || localFlag === "approved";
  const isRejected =
    request?.status === "rejected" || localFlag?.startsWith("rejected:");
  const isPending = request?.status === "pending" || localFlag === "pending";

  return (
    <Card className="border-border shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          ID Verification
          {isApproved && (
            <Badge className="bg-green-100 text-green-700 border-green-200 border ml-auto">
              <ShieldCheck className="w-3 h-3 mr-1" /> Verified
            </Badge>
          )}
          {isPending && !isApproved && (
            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 border ml-auto">
              Pending Review
            </Badge>
          )}
          {isRejected && (
            <Badge className="bg-red-100 text-red-700 border-red-200 border ml-auto">
              <ShieldX className="w-3 h-3 mr-1" /> Rejected
            </Badge>
          )}
          {!isApproved && !isPending && !isRejected && (
            <Badge variant="outline" className="text-muted-foreground ml-auto">
              Not Submitted
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isApproved ? (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
            <p className="text-sm text-green-800">
              Your identity has been verified. A verified badge is displayed on
              your listings.
            </p>
          </div>
        ) : isPending ? (
          <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
            <p className="text-sm text-yellow-800">
              Your ID proof is under review. Admin will verify within 24 hours.
            </p>
          </div>
        ) : isRejected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <ShieldX className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-sm text-red-800">
                Your ID verification was rejected. Please upload a clearer
                document.
              </p>
            </div>
            <UploadSection
              preview={preview}
              fileRef={fileRef}
              onFileChange={handleFileChange}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Upload a government-issued ID (Aadhar, PAN, Passport) to get a
              verified badge on your listings.
            </p>
            <UploadSection
              preview={preview}
              fileRef={fileRef}
              onFileChange={handleFileChange}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UploadSection({
  preview,
  fileRef,
  onFileChange,
  onSubmit,
  submitting,
}: {
  preview: string | null;
  fileRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <div className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />
      <button
        type="button"
        className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors w-full"
        onClick={() => fileRef.current?.click()}
        data-ocid="owner.id_upload.dropzone"
      >
        {preview ? (
          <img
            src={preview}
            alt="ID preview"
            className="max-h-32 mx-auto rounded object-contain"
          />
        ) : (
          <>
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Click to upload ID proof
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Aadhar, PAN, Passport (JPG/PNG)
            </p>
          </>
        )}
      </button>
      {preview && (
        <Button
          onClick={onSubmit}
          disabled={submitting}
          size="sm"
          className="w-full"
          data-ocid="owner.id_upload.submit.button"
        >
          <Upload className="w-4 h-4 mr-2" />
          {submitting ? "Submitting..." : "Submit for Verification"}
        </Button>
      )}
    </div>
  );
}

function OwnerDashboardInner() {
  const router = useRouter();
  const { identity } = useInternetIdentity();
  const { data: allProperties, isLoading: propsLoading } = useAllProperties();
  const { data: allBookings, isLoading: bookingsLoading } = useAllBookings();
  const { data: isApproved } = useIsApproved();
  const { data: inquiries, isLoading: inquiriesLoading } = useOwnerInquiries();
  const { data: unreadCount } = useUnreadNotificationCount();

  const principal = identity?.getPrincipal().toString();

  const myProperties = (allProperties ?? []).filter(
    (p) => p.owner.toString() === principal,
  );
  const myPropertyIds = new Set(myProperties.map((p) => p.id.toString()));
  const myBookings = (allBookings ?? []).filter((b) =>
    myPropertyIds.has(b.propertyId.toString()),
  );

  const approvedCount = myProperties.filter((p) => p.approved).length;

  const pendingLeads = (inquiries ?? []).filter(
    (i) => i.status === Variant_pending_rejected_accepted.pending,
  ).length;

  const notifCount = Number(unreadCount ?? BigInt(0));
  const notifDisplay = notifCount > 9 ? "9+" : notifCount.toString();

  const pendingBookings = myBookings.filter(
    (b) => b.status === "pending",
  ).length;

  const recentBookings = [...myBookings]
    .sort((a, b) => Number(b.startDate - a.startDate))
    .slice(0, 5);

  return (
    <div className="container max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl mb-1">
            Owner Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your properties and track bookings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="relative"
            onClick={() => router.navigate({ to: "/owner/notifications" })}
            data-ocid="owner.notifications.button"
            aria-label={`Notifications${
              notifCount > 0 ? ` (${notifCount} unread)` : ""
            }`}
          >
            <Bell className="w-4 h-4" />
            {notifCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1"
                data-ocid="owner.notification.count.badge"
              >
                {notifDisplay}
              </span>
            )}
          </Button>
          <Button
            onClick={() => router.navigate({ to: "/owner/listings/new" })}
            data-ocid="owner.new_listing.button"
          >
            <PlusCircle className="w-4 h-4 mr-2" /> Add Listing
          </Button>
        </div>
      </div>

      {/* Approval Banner */}
      {isApproved === false && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-800">
            Your owner account is pending admin approval. You can create
            listings but they won&apos;t be visible to students until approved.
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Total Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {propsLoading ? (
              <Skeleton
                className="h-8 w-16"
                data-ocid="owner.listings_count.loading_state"
              />
            ) : (
              <p className="text-3xl font-bold">{myProperties.length}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" /> Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            {propsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">{approvedCount}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">{myBookings.length}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Inbox className="w-4 h-4 text-amber-500" /> New Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {inquiriesLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold">{pendingLeads}</p>
                {pendingLeads > 0 && (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 border text-xs">
                    pending
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Button
          variant="outline"
          className="h-14 text-sm"
          onClick={() => router.navigate({ to: "/owner/listings" })}
          data-ocid="owner.manage_listings.button"
        >
          <Building2 className="w-4 h-4 mr-2" /> Manage Listings
        </Button>
        <Button
          variant="outline"
          className="h-14 text-sm"
          onClick={() => router.navigate({ to: "/owner/listings/new" })}
          data-ocid="owner.create_listing.button"
        >
          <PlusCircle className="w-4 h-4 mr-2" /> Add Listing
        </Button>
        <Button
          variant="outline"
          className="h-14 text-sm relative"
          onClick={() => router.navigate({ to: "/owner/leads" })}
          data-ocid="owner.view_leads.button"
        >
          <Inbox className="w-4 h-4 mr-2" /> View Leads
          {pendingLeads > 0 && (
            <Badge className="ml-1 bg-amber-100 text-amber-700 border-amber-200 border text-xs">
              {pendingLeads}
            </Badge>
          )}
        </Button>
        <Button
          variant="outline"
          className="h-14 text-sm relative"
          onClick={() => router.navigate({ to: "/owner/listings" })}
          data-ocid="owner.view_bookings.button"
        >
          <Calendar className="w-4 h-4 mr-2" /> View Bookings
          {pendingBookings > 0 && (
            <Badge className="ml-1 bg-blue-100 text-blue-700 border-blue-200 border text-xs">
              {pendingBookings}
            </Badge>
          )}
        </Button>
      </div>

      {/* ID Verification Card */}
      {principal && (
        <div className="mb-10">
          <IdVerificationCard principal={principal} />
        </div>
      )}

      {/* Recent Bookings Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-xl flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" /> Recent Bookings
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.navigate({ to: "/owner/listings" })}
            className="text-xs gap-1 text-muted-foreground hover:text-foreground"
            data-ocid="owner.all_bookings.button"
          >
            View All <ExternalLink className="w-3 h-3" />
          </Button>
        </div>

        {bookingsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : recentBookings.length === 0 ? (
          <div
            className="bg-card border border-border rounded-xl p-8 text-center"
            data-ocid="owner.bookings.empty_state"
          >
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No bookings yet. They&apos;ll appear here once students book your
              properties.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentBookings.map((booking, i) => {
              const isPaidBooking = booking.totalPrice > 0n;
              const prop = myProperties.find(
                (p) => p.id.toString() === booking.propertyId.toString(),
              );

              return (
                <div
                  key={booking.id.toString()}
                  className="bg-card border border-border rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  data-ocid={`owner.bookings.item.${i + 1}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm truncate">
                        {prop?.title ?? `Property #${booking.propertyIdText}`}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs border ${
                          bookingStatusColors[booking.status] ?? ""
                        }`}
                      >
                        {booking.status}
                      </Badge>
                      {isPaidBooking && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-green-50 text-green-700 border-green-200"
                        >
                          Paid
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(
                        Number(booking.startDate / 1_000_000n),
                        "MMM d, yyyy",
                      )}{" "}
                      &bull; {booking.userDetails.name} &bull;{" "}
                      {booking.userDetails.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {isPaidBooking ? (
                      <p className="font-bold text-sm">
                        ₹{Number(booking.totalPrice).toLocaleString("en-IN")}
                      </p>
                    ) : (
                      <p className="text-sm text-blue-600 font-medium">
                        Free Visit
                      </p>
                    )}
                    {prop && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() =>
                          router.navigate({
                            to: `/owner/listings/${prop.id.toString()}/bookings` as any,
                          })
                        }
                        data-ocid={`owner.booking_detail.button.${i + 1}`}
                      >
                        Details <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

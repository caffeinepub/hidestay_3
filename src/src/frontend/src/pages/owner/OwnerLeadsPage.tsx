import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Inbox,
  Loader2,
  Phone,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Variant_bookVisit_contactOwner,
  Variant_pending_rejected_accepted,
  Variant_rejected_accepted,
} from "../../backend";
import RouteGuard from "../../components/RouteGuard";
import {
  useOwnerInquiries,
  useUpdateInquiryStatus,
} from "../../hooks/useQueries";

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function OwnerLeadsPage() {
  return (
    <RouteGuard requiredRole="owner">
      <OwnerLeadsInner />
    </RouteGuard>
  );
}

function OwnerLeadsInner() {
  const router = useRouter();
  const { data: inquiries, isLoading } = useOwnerInquiries();
  const updateStatus = useUpdateInquiryStatus();

  const pending = (inquiries ?? []).filter(
    (i) => i.status === Variant_pending_rejected_accepted.pending,
  );
  const rest = (inquiries ?? []).filter(
    (i) => i.status !== Variant_pending_rejected_accepted.pending,
  );
  const sorted = [...pending, ...rest];

  async function handleAccept(id: bigint) {
    try {
      await updateStatus.mutateAsync({
        inquiryId: id,
        status: Variant_rejected_accepted.accepted,
      });
      toast.success("Inquiry accepted!");
    } catch {
      toast.error("Failed to accept inquiry.");
    }
  }

  async function handleReject(id: bigint) {
    try {
      await updateStatus.mutateAsync({
        inquiryId: id,
        status: Variant_rejected_accepted.rejected,
      });
      toast.success("Inquiry rejected.");
    } catch {
      toast.error("Failed to reject inquiry.");
    }
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.navigate({ to: "/owner/dashboard" })}
          data-ocid="owner_leads.back.button"
          className="-ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display font-bold text-3xl">
              Leads &amp; Inquiries
            </h1>
            {!isLoading && (
              <Badge
                className="text-sm px-2.5 py-0.5"
                data-ocid="owner_leads.count.badge"
              >
                {sorted.length}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Student inquiries for your properties
          </p>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4" data-ocid="owner_leads.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && sorted.length === 0 && (
        <div className="text-center py-20" data-ocid="owner_leads.empty_state">
          <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="font-semibold text-lg mb-1">No leads yet</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            They'll appear here when students contact your properties.
          </p>
        </div>
      )}

      {/* Leads List */}
      {!isLoading && sorted.length > 0 && (
        <div className="space-y-4">
          {sorted.map((inquiry, idx) => {
            const isPending =
              inquiry.status === Variant_pending_rejected_accepted.pending;
            const isAccepted =
              inquiry.status === Variant_pending_rejected_accepted.accepted;
            const maskedPhone = `****${inquiry.studentPhone.slice(-4)}`;

            return (
              <Card
                key={inquiry.id.toString()}
                className={`border transition-all ${
                  isPending
                    ? "border-amber-200 bg-amber-50/30 dark:bg-amber-950/10"
                    : "border-border"
                }`}
                data-ocid={`owner_leads.item.${idx + 1}`}
              >
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Left: Student info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-semibold text-base">
                          {inquiry.studentName}
                        </span>
                        <span className="text-sm text-muted-foreground font-mono">
                          {maskedPhone}
                        </span>
                        {/* Inquiry type badge */}
                        {inquiry.inquiryType ===
                        Variant_bookVisit_contactOwner.bookVisit ? (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200 border text-xs">
                            Book Visit
                          </Badge>
                        ) : (
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200 border text-xs">
                            Contact
                          </Badge>
                        )}
                        {/* Status badge */}
                        {isPending && (
                          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 border text-xs">
                            Pending
                          </Badge>
                        )}
                        {isAccepted && (
                          <Badge className="bg-green-100 text-green-700 border-green-200 border text-xs">
                            Accepted
                          </Badge>
                        )}
                        {inquiry.status ===
                          Variant_pending_rejected_accepted.rejected && (
                          <Badge
                            variant="outline"
                            className="text-muted-foreground text-xs"
                          >
                            Rejected
                          </Badge>
                        )}
                      </div>

                      {/* Property ID */}
                      <p className="text-xs text-muted-foreground mb-2">
                        Property #{inquiry.propertyId.toString()}
                      </p>

                      {/* Message */}
                      <p className="text-sm text-foreground line-clamp-2 mb-2">
                        {inquiry.message}
                      </p>

                      {/* Timestamp */}
                      <p className="text-xs text-muted-foreground">
                        {formatDate(inquiry.timestamp)}
                      </p>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                      {/* Call button (pending or accepted) */}
                      {(isPending || isAccepted) && (
                        <a
                          href={`tel:${inquiry.studentPhone}`}
                          data-ocid={`owner_leads.call.button.${idx + 1}`}
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 w-full"
                          >
                            <Phone className="w-3.5 h-3.5" /> Call
                          </Button>
                        </a>
                      )}

                      {/* Accept / Reject (pending only) */}
                      {isPending && (
                        <>
                          <Button
                            size="sm"
                            className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleAccept(inquiry.id)}
                            disabled={updateStatus.isPending}
                            data-ocid={`owner_leads.accept.button.${idx + 1}`}
                          >
                            {updateStatus.isPending ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-destructive border-destructive/40 hover:bg-destructive/5"
                            onClick={() => handleReject(inquiry.id)}
                            disabled={updateStatus.isPending}
                            data-ocid={`owner_leads.reject.button.${idx + 1}`}
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

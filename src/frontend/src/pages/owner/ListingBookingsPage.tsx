import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useParams, useRouter } from "@tanstack/react-router";
import { format } from "date-fns";
import { Calendar, ChevronLeft, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import RouteGuard from "../../components/RouteGuard";
import {
  useConfirmBooking,
  useProperty,
  usePropertyBookings,
  useRejectBooking,
} from "../../hooks/useQueries";

const statusColors: Record<string, string> = {
  paid: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

export default function ListingBookingsPage() {
  return (
    <RouteGuard requiredRole="owner">
      <ListingBookingsInner />
    </RouteGuard>
  );
}

function ListingBookingsInner() {
  const { id } = useParams({ strict: false }) as { id: string };
  const router = useRouter();
  const { data: property } = useProperty(BigInt(id ?? "0"));
  const { data: bookings, isLoading } = usePropertyBookings(BigInt(id ?? "0"));
  const confirmMutation = useConfirmBooking();
  const rejectMutation = useRejectBooking();

  const handleConfirm = async (bookingId: bigint) => {
    try {
      await confirmMutation.mutateAsync(bookingId);
      toast.success("Visit confirmed!");
    } catch {
      toast.error("Failed to confirm. Please try again.");
    }
  };

  const handleReject = async (bookingId: bigint) => {
    try {
      await rejectMutation.mutateAsync(bookingId);
      toast.success("Booking rejected.");
    } catch {
      toast.error("Failed to reject. Please try again.");
    }
  };

  return (
    <div className="container max-w-5xl mx-auto px-4 py-10">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.history.back()}
        className="mb-6 -ml-2"
        data-ocid="listing_bookings.back.button"
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      <h1 className="font-display font-bold text-3xl mb-1">
        Bookings for {property?.title ?? `Property #${id}`}
      </h1>
      <p className="text-muted-foreground mb-8">
        {bookings?.length ?? 0} booking(s) total
      </p>

      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2].map((i) => (
              <Skeleton
                key={i}
                className="h-14 w-full"
                data-ocid="listing_bookings.loading_state"
              />
            ))}
          </div>
        ) : !bookings || bookings.length === 0 ? (
          <div
            className="text-center py-16"
            data-ocid="listing_bookings.empty_state"
          >
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold mb-1">No bookings yet</p>
            <p className="text-muted-foreground text-sm">
              Bookings will appear here once students book your property
            </p>
          </div>
        ) : (
          <Table data-ocid="listing_bookings.table">
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b, i) => {
                const isVisit = b.totalPrice === 0n;
                const isPending = b.status === "pending";
                const isConfirming =
                  confirmMutation.isPending &&
                  confirmMutation.variables === b.id;
                const isRejecting =
                  rejectMutation.isPending && rejectMutation.variables === b.id;

                return (
                  <TableRow
                    key={b.id.toString()}
                    data-ocid={`listing_bookings.item.${i + 1}`}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{b.userDetails.name}</p>
                        <a
                          href={`tel:${b.userDetails.phone}`}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          {b.userDetails.phone}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          isVisit
                            ? "bg-blue-50 text-blue-700 border-blue-200 text-xs"
                            : "bg-green-50 text-green-700 border-green-200 text-xs"
                        }
                      >
                        {isVisit ? "Visit" : "Paid"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(Number(b.startDate / 1_000_000n), "MMM d, yyyy")}
                      {b.startDate !== b.endDate && (
                        <>
                          {" — "}
                          {format(
                            Number(b.endDate / 1_000_000n),
                            "MMM d, yyyy",
                          )}
                        </>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {isVisit ? (
                        <span className="text-blue-600 text-sm">Free</span>
                      ) : (
                        `₹${Number(b.totalPrice).toLocaleString("en-IN")}`
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs border ${statusColors[b.status] || ""}`}
                        variant="outline"
                      >
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isPending ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs text-green-700 border-green-300 hover:bg-green-50 h-7 px-2"
                            onClick={() => handleConfirm(b.id)}
                            disabled={isConfirming || isRejecting}
                            data-ocid={`listing_bookings.confirm_button.${i + 1}`}
                          >
                            {isConfirming ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              "Confirm"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10 h-7 px-2"
                            onClick={() => handleReject(b.id)}
                            disabled={isConfirming || isRejecting}
                            data-ocid={`listing_bookings.delete_button.${i + 1}`}
                          >
                            {isRejecting ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              "Reject"
                            )}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

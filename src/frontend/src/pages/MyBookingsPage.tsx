import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { AlertTriangle, Building2, Calendar } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import RouteGuard from "../components/RouteGuard";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCancelBooking, useMyBookings } from "../hooks/useQueries";

const statusColors: Record<string, string> = {
  paid: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

export default function MyBookingsPage() {
  return (
    <RouteGuard requiredRole="student">
      <MyBookingsInner />
    </RouteGuard>
  );
}

function MyBookingsInner() {
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal();
  const { data: bookings, isLoading } = useMyBookings(principal);
  const cancelMutation = useCancelBooking();
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const handleCancel = async (bookingId: bigint) => {
    try {
      await cancelMutation.mutateAsync(bookingId);
      toast.success("Booking cancelled successfully");
      setConfirmCancelId(null);
    } catch {
      toast.error("Failed to cancel booking. Please try again.");
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-display font-bold text-3xl mb-2">My Bookings</h1>
      <p className="text-muted-foreground mb-8">
        Track all your property bookings
      </p>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              className="h-28 w-full rounded-xl"
              data-ocid="bookings.loading_state"
            />
          ))}
        </div>
      ) : !bookings || bookings.length === 0 ? (
        <div
          className="text-center py-20 bg-card border border-border rounded-xl"
          data-ocid="bookings.empty_state"
        >
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold mb-1">No bookings yet</p>
          <p className="text-muted-foreground text-sm mb-4">
            Find a property and make your first booking!
          </p>
          <Link to="/search">
            <Badge variant="outline" className="cursor-pointer">
              Browse Properties
            </Badge>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking, i) => {
            const isVisit = booking.totalPrice === 0n;
            const isPending = booking.status === "pending";
            const isCancellingThis =
              cancelMutation.isPending &&
              confirmCancelId === booking.id.toString();
            const showConfirm = confirmCancelId === booking.id.toString();

            return (
              <div
                key={booking.id.toString()}
                className="bg-card border border-border rounded-xl p-5 shadow-xs"
                data-ocid={`bookings.item.${i + 1}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold">
                        Property #{booking.propertyIdText}
                      </span>
                      {/* Booking type badge */}
                      <Badge
                        variant="outline"
                        className={
                          isVisit
                            ? "bg-blue-50 text-blue-700 border-blue-200 text-xs"
                            : isPending
                              ? "bg-yellow-50 text-yellow-700 border-yellow-200 text-xs"
                              : "bg-green-50 text-green-700 border-green-200 text-xs"
                        }
                      >
                        {isVisit ? "Visit Booking" : "Paid Booking"}
                      </Badge>
                      {/* Status badge */}
                      <Badge
                        className={`text-xs border ${
                          statusColors[booking.status] || ""
                        }`}
                        variant="outline"
                      >
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {format(
                          Number(booking.startDate / 1_000_000n),
                          "MMM d, yyyy",
                        )}
                        {booking.startDate !== booking.endDate
                          ? ` — ${format(Number(booking.endDate / 1_000_000n), "MMM d, yyyy")}`
                          : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      {isVisit ? (
                        <p className="font-semibold text-blue-600">Free</p>
                      ) : (
                        <p className="font-bold text-lg">
                          ₹{Number(booking.totalPrice).toLocaleString("en-IN")}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {isVisit ? "Visit booking" : "Advance paid"}
                      </p>
                    </div>

                    {/* Cancel button for pending bookings */}
                    {isPending && !showConfirm && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs"
                        onClick={() =>
                          setConfirmCancelId(booking.id.toString())
                        }
                        data-ocid={`bookings.delete_button.${i + 1}`}
                      >
                        Cancel Booking
                      </Button>
                    )}
                  </div>
                </div>

                {/* Inline cancel confirmation */}
                {showConfirm && (
                  <div className="mt-3 pt-3 border-t border-border flex items-center gap-3 bg-red-50/50 -mx-5 -mb-5 px-5 pb-4 rounded-b-xl">
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                    <p className="text-sm flex-1">
                      Are you sure you want to cancel this booking?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => setConfirmCancelId(null)}
                        disabled={isCancellingThis}
                        data-ocid={`bookings.cancel_button.${i + 1}`}
                      >
                        No
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleCancel(booking.id)}
                        disabled={isCancellingThis}
                        data-ocid={`bookings.confirm_button.${i + 1}`}
                      >
                        {isCancellingThis ? "Cancelling..." : "Yes, Cancel"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

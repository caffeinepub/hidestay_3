import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { Building2, Calendar } from "lucide-react";
import { Variant_cancelled_pending_paid_rejected } from "../backend";
import RouteGuard from "../components/RouteGuard";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useMyBookings } from "../hooks/useQueries";

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
          {bookings.map((booking, i) => (
            <div
              key={booking.id.toString()}
              className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
              data-ocid={`bookings.item.${i + 1}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">
                    Property #{booking.propertyIdText}
                  </span>
                  <Badge
                    className={`text-xs border ${statusColors[booking.status] || ""}`}
                    variant="outline"
                  >
                    {booking.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(
                      Number(booking.startDate / 1_000_000n),
                      "MMM d, yyyy",
                    )}{" "}
                    -{" "}
                    {format(
                      Number(booking.endDate / 1_000_000n),
                      "MMM d, yyyy",
                    )}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">
                  ₹{Number(booking.totalPrice).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Total paid</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

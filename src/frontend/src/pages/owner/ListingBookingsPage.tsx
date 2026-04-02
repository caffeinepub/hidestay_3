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
import { Calendar, ChevronLeft } from "lucide-react";
import RouteGuard from "../../components/RouteGuard";
import { useProperty, usePropertyBookings } from "../../hooks/useQueries";

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
                <TableHead>Dates</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b, i) => (
                <TableRow
                  key={b.id.toString()}
                  data-ocid={`listing_bookings.item.${i + 1}`}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{b.userDetails.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.userDetails.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(Number(b.startDate / 1_000_000n), "MMM d, yyyy")} —{" "}
                    {format(Number(b.endDate / 1_000_000n), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="font-semibold">
                    ₹{Number(b.totalPrice).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-xs border ${statusColors[b.status] || ""}`}
                      variant="outline"
                    >
                      {b.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

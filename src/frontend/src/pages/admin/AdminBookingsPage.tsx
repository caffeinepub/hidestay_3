import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import RouteGuard from "../../components/RouteGuard";
import { useAllBookings } from "../../hooks/useQueries";

const statusColors: Record<string, string> = {
  paid: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

export default function AdminBookingsPage() {
  return (
    <RouteGuard requiredRole="admin">
      <AdminBookingsInner />
    </RouteGuard>
  );
}

function AdminBookingsInner() {
  const { data: bookings, isLoading } = useAllBookings();

  return (
    <div className="container max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl mb-1">
          Bookings Overview
        </h1>
        <p className="text-muted-foreground">
          {bookings?.length ?? 0} total bookings across the platform
        </p>
      </div>

      <div
        className="bg-card border border-border rounded-xl shadow-xs overflow-hidden"
        data-ocid="admin_bookings.table"
      >
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="h-14 w-full"
                data-ocid="admin_bookings.loading_state"
              />
            ))}
          </div>
        ) : !bookings || bookings.length === 0 ? (
          <div
            className="text-center py-20"
            data-ocid="admin_bookings.empty_state"
          >
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">No bookings yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Property ID</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b, i) => (
                <TableRow
                  key={b.id.toString()}
                  data-ocid={`admin_bookings.item.${i + 1}`}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{b.userDetails.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.userDetails.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    #{b.propertyIdText}
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(Number(b.startDate / 1_000_000n), "MMM d")} —{" "}
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

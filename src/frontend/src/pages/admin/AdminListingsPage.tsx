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
import { Link } from "@tanstack/react-router";
import { Building2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Variant_apartment_sharedRoom_single } from "../../backend";
import RouteGuard from "../../components/RouteGuard";
import { useAllProperties, useApproveProperty } from "../../hooks/useQueries";

const roomTypeLabels: Record<Variant_apartment_sharedRoom_single, string> = {
  [Variant_apartment_sharedRoom_single.apartment]: "Apartment",
  [Variant_apartment_sharedRoom_single.sharedRoom]: "Shared Room",
  [Variant_apartment_sharedRoom_single.single]: "Single Room",
};

export default function AdminListingsPage() {
  return (
    <RouteGuard requiredRole="admin">
      <AdminListingsInner />
    </RouteGuard>
  );
}

function AdminListingsInner() {
  const { data: properties, isLoading } = useAllProperties();
  const approveProperty = useApproveProperty();

  const handleApprove = async (id: bigint) => {
    try {
      await approveProperty.mutateAsync(id);
      toast.success("Property approved!");
    } catch {
      toast.error("Failed to approve property.");
    }
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl mb-1">
          Listings Management
        </h1>
        <p className="text-muted-foreground">
          Review, approve, and manage all property listings
        </p>
      </div>

      <div
        className="bg-card border border-border rounded-xl shadow-xs overflow-hidden"
        data-ocid="admin_listings.table"
      >
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton
                key={i}
                className="h-14 w-full"
                data-ocid="admin_listings.loading_state"
              />
            ))}
          </div>
        ) : !properties || properties.length === 0 ? (
          <div
            className="text-center py-20"
            data-ocid="admin_listings.empty_state"
          >
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">No listings yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((p, i) => (
                <TableRow
                  key={p.id.toString()}
                  data-ocid={`admin_listings.item.${i + 1}`}
                >
                  <TableCell>
                    <div>
                      <Link
                        to="/property/$id"
                        params={{ id: p.id.toString() }}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {p.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {p.address.city}, {p.address.state}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {roomTypeLabels[p.roomType]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    ₹{Number(p.pricePerMonth).toLocaleString()}/mo
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {p.owner.toString().slice(0, 10)}...
                  </TableCell>
                  <TableCell>
                    {p.approved ? (
                      <Badge
                        className="bg-green-100 text-green-700 border-green-200 border"
                        variant="outline"
                      >
                        Approved
                      </Badge>
                    ) : (
                      <Badge
                        className="bg-yellow-100 text-yellow-700 border-yellow-200 border"
                        variant="outline"
                      >
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      {!p.approved && (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(p.id)}
                          disabled={approveProperty.isPending}
                          data-ocid={`admin_listings.approve.button.${i + 1}`}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                        </Button>
                      )}
                    </div>
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

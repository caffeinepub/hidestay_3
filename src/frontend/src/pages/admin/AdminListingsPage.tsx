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
import { Building2, CheckCircle2, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PropertyType } from "../../backend";
import RouteGuard from "../../components/RouteGuard";
import {
  useAllProperties,
  useApproveProperty,
  useDeleteProperty,
  useVerifyProperty,
} from "../../hooks/useQueries";

const roomTypeLabels: Record<PropertyType, string> = {
  [PropertyType.apartment]: "Apartment",
  [PropertyType.sharedRoom]: "Shared Room",
  [PropertyType.single]: "Single Room",
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
  const verifyProperty = useVerifyProperty();
  const deleteProperty = useDeleteProperty();

  const [confirmDeleteId, setConfirmDeleteId] = useState<bigint | null>(null);

  const handleApprove = async (id: bigint) => {
    try {
      await approveProperty.mutateAsync(id);
      toast.success("Property approved!");
    } catch {
      toast.error("Failed to approve property.");
    }
  };

  const handleVerify = async (id: bigint) => {
    try {
      await verifyProperty.mutateAsync(id);
      toast.success("Property verified!");
    } catch {
      toast.error("Failed to verify property.");
    }
  };

  const handleDelete = async (id: bigint) => {
    try {
      await deleteProperty.mutateAsync(id);
      toast.success("Property removed.");
      setConfirmDeleteId(null);
    } catch {
      toast.error("Failed to remove property.");
    }
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl mb-1">
          Listings Management
        </h1>
        <p className="text-muted-foreground">
          Review, approve, verify, and manage all property listings
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
                    <div className="flex items-center gap-1 flex-wrap">
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
                      {p.verified && (
                        <Badge
                          className="bg-blue-100 text-blue-700 border-blue-200 border"
                          variant="outline"
                        >
                          <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2 flex-wrap">
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
                      {!p.verified ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerify(p.id)}
                          disabled={verifyProperty.isPending}
                          data-ocid={`admin_listings.verify.button.${i + 1}`}
                        >
                          <ShieldCheck className="w-4 h-4 mr-1" /> Verify
                        </Button>
                      ) : (
                        <Badge
                          className="bg-blue-50 text-blue-600 border-blue-200 border"
                          variant="outline"
                        >
                          <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                        </Badge>
                      )}
                      {confirmDeleteId === p.id ? (
                        <>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(p.id)}
                            disabled={deleteProperty.isPending}
                            data-ocid={`admin_listings.confirm.button.${i + 1}`}
                          >
                            {deleteProperty.isPending
                              ? "Removing..."
                              : "Confirm"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmDeleteId(null)}
                            data-ocid={`admin_listings.cancel.button.${i + 1}`}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setConfirmDeleteId(p.id)}
                          data-ocid={`admin_listings.delete_button.${i + 1}`}
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> Remove
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

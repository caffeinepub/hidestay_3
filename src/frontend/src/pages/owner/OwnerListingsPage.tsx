import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { useRouter } from "@tanstack/react-router";
import {
  Building2,
  Calendar,
  Edit,
  Eye,
  Loader2,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PropertyType } from "../../backend";
import RouteGuard from "../../components/RouteGuard";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import {
  useAllProperties,
  useDeleteProperty,
  useUpdateProperty,
} from "../../hooks/useQueries";

const roomTypeLabels: Record<PropertyType, string> = {
  [PropertyType.apartment]: "Apartment",
  [PropertyType.sharedRoom]: "Shared Room",
  [PropertyType.single]: "Single Room",
};

export default function OwnerListingsPage() {
  return (
    <RouteGuard requiredRole="owner">
      <OwnerListingsInner />
    </RouteGuard>
  );
}

function OwnerListingsInner() {
  const router = useRouter();
  const { identity } = useInternetIdentity();
  const { data: allProperties, isLoading } = useAllProperties();
  const deleteProperty = useDeleteProperty();
  const updateProperty = useUpdateProperty();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const principal = identity?.getPrincipal().toString();
  const myProperties = (allProperties ?? []).filter(
    (p) => p.owner.toString() === principal,
  );

  async function handleDelete(id: bigint) {
    setDeletingId(id.toString());
    try {
      await deleteProperty.mutateAsync(id);
      toast.success("Property deleted successfully.");
    } catch {
      toast.error("Failed to delete property.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleAvailability(
    id: bigint,
    currentAmenities: string[],
  ) {
    setTogglingId(id.toString());
    const isUnavailable = currentAmenities.includes("unavailable");
    const newAmenities = isUnavailable
      ? currentAmenities.filter((a) => a !== "unavailable")
      : [...currentAmenities, "unavailable"];

    const property = myProperties.find((p) => p.id === id);
    if (!property) {
      setTogglingId(null);
      return;
    }

    try {
      await updateProperty.mutateAsync({
        id,
        property: { ...property, amenities: newAmenities },
      });
      toast.success(
        isUnavailable ? "Marked as Available." : "Marked as Occupied.",
      );
    } catch {
      toast.error("Failed to update availability.");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl mb-1">My Listings</h1>
          <p className="text-muted-foreground">
            {myProperties.length} propert
            {myProperties.length !== 1 ? "ies" : "y"} listed
          </p>
        </div>
        <Button
          onClick={() => router.navigate({ to: "/owner/listings/new" })}
          data-ocid="owner_listings.new.button"
        >
          <PlusCircle className="w-4 h-4 mr-2" /> New Listing
        </Button>
      </div>

      <div
        className="bg-card border border-border rounded-xl shadow-xs overflow-hidden"
        data-ocid="owner_listings.table"
      >
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="h-14 w-full"
                data-ocid="owner_listings.loading_state"
              />
            ))}
          </div>
        ) : myProperties.length === 0 ? (
          <div
            className="text-center py-20"
            data-ocid="owner_listings.empty_state"
          >
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold mb-1">No listings yet</p>
            <p className="text-muted-foreground text-sm mb-4">
              Create your first property listing
            </p>
            <Button
              onClick={() => router.navigate({ to: "/owner/listings/new" })}
              data-ocid="owner_listings.create.button"
            >
              <PlusCircle className="w-4 h-4 mr-2" /> Create Listing
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myProperties.map((p, i) => {
                const isUnavailable = p.amenities.includes("unavailable");
                const isTogglingThis = togglingId === p.id.toString();
                const isDeletingThis = deletingId === p.id.toString();

                return (
                  <TableRow
                    key={p.id.toString()}
                    data-ocid={`owner_listings.item.${i + 1}`}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{p.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {p.address.city}, {p.address.state}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {roomTypeLabels[p.roomType]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        ₹{Number(p.pricePerMonth).toLocaleString()}/mo
                      </span>
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
                      <Button
                        size="sm"
                        variant="outline"
                        className={`text-xs ${
                          isUnavailable
                            ? "border-red-300 text-red-600 hover:bg-red-50"
                            : "border-green-300 text-green-700 hover:bg-green-50"
                        }`}
                        onClick={() =>
                          handleToggleAvailability(p.id, p.amenities)
                        }
                        disabled={isTogglingThis}
                        data-ocid={`owner_listings.availability.toggle.${i + 1}`}
                      >
                        {isTogglingThis ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : null}
                        {isUnavailable ? "Occupied" : "Available"}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            router.navigate({
                              to: "/property/$id",
                              params: { id: p.id.toString() },
                            })
                          }
                          data-ocid={`owner_listings.view.button.${i + 1}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            router.navigate({
                              to: "/owner/listings/$id/edit",
                              params: { id: p.id.toString() },
                            })
                          }
                          data-ocid={`owner_listings.edit.button.${i + 1}`}
                        >
                          <Edit className="w-4 h-4 mr-1" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            router.navigate({
                              to: "/owner/listings/$id/bookings",
                              params: { id: p.id.toString() },
                            })
                          }
                          data-ocid={`owner_listings.bookings.button.${i + 1}`}
                        >
                          <Calendar className="w-4 h-4 mr-1" /> Bookings
                        </Button>

                        {/* Delete */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10"
                              disabled={isDeletingThis}
                              data-ocid={`owner_listings.delete_button.${i + 1}`}
                            >
                              {isDeletingThis ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent
                            data-ocid={`owner_listings.delete.dialog.${i + 1}`}
                          >
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete this property?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete &quot;{p.title}
                                &quot;? This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel
                                data-ocid={`owner_listings.delete.cancel.${i + 1}`}
                              >
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(p.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                data-ocid={`owner_listings.delete.confirm.${i + 1}`}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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

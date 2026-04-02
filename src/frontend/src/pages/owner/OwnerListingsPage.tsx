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
import { Building2, Calendar, Edit, Eye, PlusCircle } from "lucide-react";
import { Variant_apartment_sharedRoom_single } from "../../backend";
import RouteGuard from "../../components/RouteGuard";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useAllProperties } from "../../hooks/useQueries";

const roomTypeLabels: Record<Variant_apartment_sharedRoom_single, string> = {
  [Variant_apartment_sharedRoom_single.apartment]: "Apartment",
  [Variant_apartment_sharedRoom_single.sharedRoom]: "Shared Room",
  [Variant_apartment_sharedRoom_single.single]: "Single Room",
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

  const principal = identity?.getPrincipal().toString();
  const myProperties = (allProperties ?? []).filter(
    (p) => p.owner.toString() === principal,
  );

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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myProperties.map((p, i) => (
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

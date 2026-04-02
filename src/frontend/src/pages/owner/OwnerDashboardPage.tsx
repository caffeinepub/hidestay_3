import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@tanstack/react-router";
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  PlusCircle,
} from "lucide-react";
import RouteGuard from "../../components/RouteGuard";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import {
  useAllBookings,
  useAllProperties,
  useIsApproved,
} from "../../hooks/useQueries";

export default function OwnerDashboardPage() {
  return (
    <RouteGuard requiredRole="owner">
      <OwnerDashboardInner />
    </RouteGuard>
  );
}

function OwnerDashboardInner() {
  const router = useRouter();
  const { identity } = useInternetIdentity();
  const { data: allProperties, isLoading: propsLoading } = useAllProperties();
  const { data: allBookings, isLoading: bookingsLoading } = useAllBookings();
  const { data: isApproved } = useIsApproved();

  const principal = identity?.getPrincipal().toString();

  const myProperties = (allProperties ?? []).filter(
    (p) => p.owner.toString() === principal,
  );
  const myPropertyIds = new Set(myProperties.map((p) => p.id.toString()));
  const myBookings = (allBookings ?? []).filter((b) =>
    myPropertyIds.has(b.propertyId.toString()),
  );

  const approvedCount = myProperties.filter((p) => p.approved).length;

  return (
    <div className="container max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl mb-1">
            Owner Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your properties and track bookings
          </p>
        </div>
        <Button
          onClick={() => router.navigate({ to: "/owner/listings/new" })}
          data-ocid="owner.new_listing.button"
        >
          <PlusCircle className="w-4 h-4 mr-2" /> Add Listing
        </Button>
      </div>

      {/* Approval Banner */}
      {isApproved === false && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-800">
            Your owner account is pending admin approval. You can create
            listings but they won't be visible to students until approved.
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Total Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {propsLoading ? (
              <Skeleton
                className="h-8 w-16"
                data-ocid="owner.listings_count.loading_state"
              />
            ) : (
              <p className="text-3xl font-bold">{myProperties.length}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" /> Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            {propsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">{approvedCount}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">{myBookings.length}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button
          variant="outline"
          className="h-14 text-base"
          onClick={() => router.navigate({ to: "/owner/listings" })}
          data-ocid="owner.manage_listings.button"
        >
          <Building2 className="w-5 h-5 mr-2" /> Manage My Listings
        </Button>
        <Button
          variant="outline"
          className="h-14 text-base"
          onClick={() => router.navigate({ to: "/owner/listings/new" })}
          data-ocid="owner.create_listing.button"
        >
          <PlusCircle className="w-5 h-5 mr-2" /> Create New Listing
        </Button>
      </div>
    </div>
  );
}

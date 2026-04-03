import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@tanstack/react-router";
import {
  Building2,
  Calendar,
  Check,
  Clock,
  MessageSquare,
  Settings,
  Users,
} from "lucide-react";
import { ApprovalStatus } from "../../backend";
import RouteGuard from "../../components/RouteGuard";
import {
  useAllBookings,
  useAllProperties,
  useListApprovals,
} from "../../hooks/useQueries";

export default function AdminDashboardPage() {
  return (
    <RouteGuard requiredRole="admin">
      <AdminDashboardInner />
    </RouteGuard>
  );
}

function AdminDashboardInner() {
  const router = useRouter();
  const { data: properties, isLoading: propsLoading } = useAllProperties();
  const { data: bookings, isLoading: bookingsLoading } = useAllBookings();
  const { data: approvals, isLoading: approvalsLoading } = useListApprovals();

  const pendingListings = (properties ?? []).filter((p) => !p.approved).length;
  const approvedListings = (properties ?? []).filter((p) => p.approved).length;
  const pendingUsers = (approvals ?? []).filter(
    (a) => a.status === ApprovalStatus.pending,
  ).length;
  const approvedUsers = (approvals ?? []).filter(
    (a) => a.status === ApprovalStatus.approved,
  ).length;

  const stats = [
    {
      label: "Total Properties",
      value: (properties ?? []).length,
      icon: Building2,
      color: "text-blue-500",
    },
    {
      label: "Approved Listings",
      value: approvedListings,
      icon: Check,
      color: "text-green-500",
    },
    {
      label: "Pending Listings",
      value: pendingListings,
      icon: Clock,
      color: "text-yellow-500",
    },
    {
      label: "Total Bookings",
      value: (bookings ?? []).length,
      icon: Calendar,
      color: "text-purple-500",
    },
    {
      label: "Approved Users",
      value: approvedUsers,
      icon: Users,
      color: "text-teal-500",
    },
    {
      label: "Pending Users",
      value: pendingUsers,
      icon: Users,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="container max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl mb-1">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Platform overview and management
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border shadow-xs">
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {propsLoading || bookingsLoading || approvalsLoading ? (
                <Skeleton
                  className="h-8 w-12"
                  data-ocid="admin.stats.loading_state"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  <span className="text-2xl font-bold">{stat.value}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Button
          variant="outline"
          className="h-14 text-sm"
          onClick={() => router.navigate({ to: "/admin/listings" })}
          data-ocid="admin.listings.button"
        >
          <Building2 className="w-4 h-4 mr-2" /> Manage Listings
        </Button>
        <Button
          variant="outline"
          className="h-14 text-sm"
          onClick={() => router.navigate({ to: "/admin/users" })}
          data-ocid="admin.users.button"
        >
          <Users className="w-4 h-4 mr-2" /> Manage Users
        </Button>
        <Button
          variant="outline"
          className="h-14 text-sm"
          onClick={() => router.navigate({ to: "/admin/bookings" })}
          data-ocid="admin.bookings.button"
        >
          <Calendar className="w-4 h-4 mr-2" /> View Bookings
        </Button>
        <Button
          variant="outline"
          className="h-14 text-sm"
          onClick={() => router.navigate({ to: "/admin/reviews" })}
          data-ocid="admin.reviews.button"
        >
          <MessageSquare className="w-4 h-4 mr-2" /> Reviews
        </Button>
        <Button
          variant="outline"
          className="h-14 text-sm"
          onClick={() => router.navigate({ to: "/admin/stripe" })}
          data-ocid="admin.stripe.button"
        >
          <Settings className="w-4 h-4 mr-2" /> Stripe Config
        </Button>
      </div>
    </div>
  );
}

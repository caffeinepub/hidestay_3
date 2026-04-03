import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Megaphone,
  MessageSquare,
  Settings,
  Users,
} from "lucide-react";
import RouteGuard from "../../components/RouteGuard";
import { useAnalyticsSummary } from "../../hooks/useQueries";

export default function AdminDashboardPage() {
  return (
    <RouteGuard requiredRole="admin">
      <AdminDashboardInner />
    </RouteGuard>
  );
}

function AdminDashboardInner() {
  const router = useRouter();
  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary();

  const pendingReports = 0; // Could be fetched separately if needed

  const stats = summary
    ? [
        {
          label: "Total Users",
          value: Number(summary.totalUsers),
          icon: Users,
          color: "text-blue-500",
        },
        {
          label: "Total Properties",
          value: Number(summary.totalProperties),
          icon: Building2,
          color: "text-indigo-500",
        },
        {
          label: "Active Listings",
          value: Number(summary.activeListings),
          icon: Check,
          color: "text-green-500",
        },
        {
          label: "Pending Listings",
          value: Number(summary.pendingListings),
          icon: Clock,
          color: "text-yellow-500",
        },
        {
          label: "Total Bookings",
          value: Number(summary.totalBookings),
          icon: Calendar,
          color: "text-purple-500",
        },
        {
          label: "Total Inquiries",
          value: Number(summary.totalInquiries),
          icon: MessageSquare,
          color: "text-teal-500",
        },
        {
          label: "Total Reports",
          value: Number(summary.totalReports),
          icon: AlertTriangle,
          color: "text-red-500",
        },
        {
          label: "Pending Reports",
          value: pendingReports,
          icon: Activity,
          color: "text-orange-500",
        },
      ]
    : [];

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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {summaryLoading
          ? [
              "users",
              "props",
              "active",
              "pending",
              "books",
              "inquiries",
              "reports",
              "pendingr",
            ].map((k) => (
              <Card
                key={`stat-skeleton-${k}`}
                className="border-border shadow-xs"
              >
                <CardHeader className="pb-1 pt-4 px-4">
                  <Skeleton className="h-3 w-20" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <Skeleton
                    className="h-8 w-12"
                    data-ocid="admin.stats.loading_state"
                  />
                </CardContent>
              </Card>
            ))
          : stats.map((stat) => (
              <Card key={stat.label} className="border-border shadow-xs">
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="flex items-center gap-2">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    <span className="text-2xl font-bold">
                      {stat.value.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
        <Button
          variant="outline"
          className="h-14 text-sm"
          onClick={() => router.navigate({ to: "/admin/reports" })}
          data-ocid="admin.reports.button"
        >
          <AlertTriangle className="w-4 h-4 mr-2" /> Reports
        </Button>
        <Button
          variant="outline"
          className="h-14 text-sm"
          onClick={() => router.navigate({ to: "/admin/payments" })}
          data-ocid="admin.payments.button"
        >
          <CreditCard className="w-4 h-4 mr-2" /> Payments
        </Button>
        <Button
          variant="outline"
          className="h-14 text-sm"
          onClick={() => router.navigate({ to: "/admin/analytics" })}
          data-ocid="admin.analytics.button"
        >
          <BarChart3 className="w-4 h-4 mr-2" /> Analytics
        </Button>
        <Button
          variant="outline"
          className="h-14 text-sm"
          onClick={() => router.navigate({ to: "/admin/announcements" })}
          data-ocid="admin.announcements.button"
        >
          <Bell className="w-4 h-4 mr-2" /> Announcements
        </Button>
        <Button
          variant="outline"
          className="h-14 text-sm"
          onClick={() => router.navigate({ to: "/admin/create" })}
          data-ocid="admin.create.button"
        >
          <Megaphone className="w-4 h-4 mr-2" /> Create Admin
        </Button>
      </div>
    </div>
  );
}

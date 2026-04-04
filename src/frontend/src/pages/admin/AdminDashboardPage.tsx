import { Badge } from "@/components/ui/badge";
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
  Flag,
  Megaphone,
  MessageSquare,
  Settings,
  ShieldCheck,
  Tag,
  Users,
  Wallet,
} from "lucide-react";
import RouteGuard from "../../components/RouteGuard";
import {
  useAllProperties,
  useAnalyticsSummary,
  useGetReports,
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
  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary();
  const { data: allProperties } = useAllProperties();
  const { data: reports } = useGetReports();

  const pendingApprovals = (allProperties ?? [])
    .filter((p) => !p.approved)
    .slice(0, 5);

  const recentReports = (reports ?? []).slice(0, 5);

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
          value: recentReports.filter((r) => r.status === "pending").length,
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-10">
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
        <Button
          variant="outline"
          className="h-14 text-sm"
          onClick={() => router.navigate({ to: "/admin/id-verification" })}
          data-ocid="admin.id_verification.button"
        >
          <ShieldCheck className="w-4 h-4 mr-2" /> ID Verification
        </Button>
        <Button
          variant="outline"
          className="h-14 text-sm"
          onClick={() => router.navigate({ to: "/admin/coupons" })}
          data-ocid="admin.coupons.button"
        >
          <Tag className="w-4 h-4 mr-2" /> Coupons
        </Button>
        <Button
          variant="outline"
          className="h-14 text-sm"
          onClick={() => router.navigate({ to: "/admin/payouts" })}
          data-ocid="admin.payouts.button"
        >
          <Wallet className="w-4 h-4 mr-2" /> Payouts
        </Button>
      </div>

      {/* Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <div>
          <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            Pending Approvals
          </h2>
          {pendingApprovals.length === 0 ? (
            <div
              className="bg-card border border-border rounded-xl p-6 text-center text-sm text-muted-foreground"
              data-ocid="admin.pending_approvals.empty_state"
            >
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
              All listings are approved!
            </div>
          ) : (
            <div className="space-y-2">
              {pendingApprovals.map((p, i) => (
                <div
                  key={p.id.toString()}
                  className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                  data-ocid={`admin.pending_approvals.item.${i + 1}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.address.city}, {p.address.state}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200 shrink-0"
                  >
                    Pending
                  </Badge>
                </div>
              ))}
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-xs text-muted-foreground"
            onClick={() => router.navigate({ to: "/admin/listings" })}
            data-ocid="admin.view_all_listings.button"
          >
            View all listings →
          </Button>
        </div>

        {/* Recent Reports */}
        <div>
          <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-500" />
            Recent Reports
          </h2>
          {recentReports.length === 0 ? (
            <div
              className="bg-card border border-border rounded-xl p-6 text-center text-sm text-muted-foreground"
              data-ocid="admin.recent_reports.empty_state"
            >
              No recent reports.
            </div>
          ) : (
            <div className="space-y-2">
              {recentReports.map((report, i) => (
                <div
                  key={report.id.toString()}
                  className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                  data-ocid={`admin.recent_reports.item.${i + 1}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                      <Flag className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {report.reason}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {report.description.slice(0, 60)}...
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs shrink-0 ${
                      report.status === "resolved"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : report.status === "dismissed"
                          ? "bg-gray-50 text-gray-600 border-gray-200"
                          : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {report.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-xs text-muted-foreground"
            onClick={() => router.navigate({ to: "/admin/reports" })}
            data-ocid="admin.view_all_reports.button"
          >
            View all reports →
          </Button>
        </div>
      </div>
    </div>
  );
}

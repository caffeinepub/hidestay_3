import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock,
  MessageSquare,
  Users,
} from "lucide-react";
import RouteGuard from "../../components/RouteGuard";
import {
  useAnalyticsSummary,
  useGetDailyActiveUserCounts,
} from "../../hooks/useQueries";

export default function AdminAnalyticsPage() {
  return (
    <RouteGuard requiredRole="admin">
      <AdminAnalyticsInner />
    </RouteGuard>
  );
}

function AdminAnalyticsInner() {
  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary();
  const { data: dauData, isLoading: dauLoading } =
    useGetDailyActiveUserCounts();

  const conversionRate =
    summary && Number(summary.totalInquiries) > 0
      ? (
          (Number(summary.totalBookings) / Number(summary.totalInquiries)) *
          100
        ).toFixed(1)
      : "0.0";

  const summaryCards = summary
    ? [
        {
          label: "Total Users",
          value: Number(summary.totalUsers),
          icon: Users,
          color: "text-blue-500",
          isString: false,
        },
        {
          label: "Total Properties",
          value: Number(summary.totalProperties),
          icon: Building2,
          color: "text-indigo-500",
          isString: false,
        },
        {
          label: "Active Listings",
          value: Number(summary.activeListings),
          icon: CheckCircle2,
          color: "text-green-500",
          isString: false,
        },
        {
          label: "Pending Listings",
          value: Number(summary.pendingListings),
          icon: Clock,
          color: "text-yellow-500",
          isString: false,
        },
        {
          label: "Total Bookings",
          value: Number(summary.totalBookings),
          icon: BookOpen,
          color: "text-purple-500",
          isString: false,
        },
        {
          label: "Total Inquiries",
          value: Number(summary.totalInquiries),
          icon: MessageSquare,
          color: "text-teal-500",
          isString: false,
        },
        {
          label: "Total Reports",
          value: Number(summary.totalReports),
          icon: AlertTriangle,
          color: "text-red-500",
          isString: false,
        },
        {
          label: "Conversion Rate",
          value: `${conversionRate}%`,
          icon: Activity,
          color: "text-orange-500",
          isString: true,
        },
      ]
    : [];

  const maxCount = dauData
    ? Math.max(...dauData.map((d) => Number(d.count)), 1)
    : 1;

  return (
    <div className="container max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl mb-1">Analytics</h1>
        <p className="text-muted-foreground">
          Platform statistics and user activity insights
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {summaryLoading
          ? ["u", "t", "a", "p", "b", "i", "r", "c"].map((k) => (
              <Card key={`stat-skeleton-${k}`}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton
                    className="h-8 w-16"
                    data-ocid="admin_analytics.loading_state"
                  />
                </CardContent>
              </Card>
            ))
          : summaryCards.map((card) => (
              <Card key={card.label} className="border-border shadow-xs">
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {card.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="flex items-center gap-2">
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                    <span className="text-2xl font-bold">
                      {card.isString
                        ? card.value
                        : (card.value as number).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-lg">
            Daily Active Users (Last 30 Days)
          </h2>
        </div>

        {dauLoading ? (
          <div className="space-y-2" data-ocid="admin_analytics.loading_state">
            {["a", "b", "c", "d", "e"].map((k) => (
              <Skeleton key={`bar-skeleton-${k}`} className="h-6 w-full" />
            ))}
          </div>
        ) : !dauData || dauData.length === 0 ? (
          <div
            className="text-center py-12 text-muted-foreground"
            data-ocid="admin_analytics.empty_state"
          >
            <Activity className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No activity data yet</p>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
            {[...dauData]
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((day) => {
                const count = Number(day.count);
                const barWidth =
                  maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
                return (
                  <div
                    key={day.date}
                    className="flex items-center gap-3"
                    data-ocid="admin_analytics.row"
                  >
                    <span className="text-xs text-muted-foreground w-24 shrink-0 font-mono">
                      {day.date}
                    </span>
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-8 text-right shrink-0">
                      {count}
                    </span>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

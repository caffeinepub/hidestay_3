import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Variant_resolved_pending_dismissed } from "../../backend";
import RouteGuard from "../../components/RouteGuard";
import {
  useDismissReport,
  useGetReports,
  useResolveReport,
} from "../../hooks/useQueries";

type FilterTab = "all" | "pending" | "resolved" | "dismissed";

const statusConfig: Record<
  Variant_resolved_pending_dismissed,
  { label: string; className: string }
> = {
  [Variant_resolved_pending_dismissed.pending]: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  [Variant_resolved_pending_dismissed.resolved]: {
    label: "Resolved",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  [Variant_resolved_pending_dismissed.dismissed]: {
    label: "Dismissed",
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
};

export default function AdminReportsPage() {
  return (
    <RouteGuard requiredRole="admin">
      <AdminReportsInner />
    </RouteGuard>
  );
}

function AdminReportsInner() {
  const { data: reports, isLoading } = useGetReports();
  const resolveReport = useResolveReport();
  const dismissReport = useDismissReport();

  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<bigint | null>(null);
  const [actionText, setActionText] = useState("");

  const filtered = (reports ?? []).filter((r) => {
    if (activeTab === "all") return true;
    return r.status === activeTab;
  });

  const pendingCount = (reports ?? []).filter(
    (r) => r.status === Variant_resolved_pending_dismissed.pending,
  ).length;

  function openResolveDialog(reportId: bigint) {
    setSelectedReportId(reportId);
    setActionText("");
    setResolveDialogOpen(true);
  }

  async function handleResolve() {
    if (!selectedReportId) return;
    if (!actionText.trim()) {
      toast.error("Please describe the action taken");
      return;
    }
    try {
      await resolveReport.mutateAsync({
        reportId: selectedReportId,
        actionTaken: actionText.trim(),
      });
      toast.success("Report resolved!");
      setResolveDialogOpen(false);
    } catch {
      toast.error("Failed to resolve report");
    }
  }

  async function handleDismiss(reportId: bigint) {
    try {
      await dismissReport.mutateAsync(reportId);
      toast.success("Report dismissed");
    } catch {
      toast.error("Failed to dismiss report");
    }
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="font-display font-bold text-3xl mb-1">
          Reports & Complaints
        </h1>
        <p className="text-muted-foreground">
          Review and action user-submitted reports
          {pendingCount > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              <AlertTriangle className="w-3 h-3" />
              {pendingCount} pending
            </span>
          )}
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as FilterTab)}
        className="mb-6"
        data-ocid="admin_reports.tab"
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
        </TabsList>
      </Tabs>

      <div
        className="bg-card border border-border rounded-xl shadow-xs overflow-hidden"
        data-ocid="admin_reports.table"
      >
        {isLoading ? (
          <div
            className="p-6 space-y-3"
            data-ocid="admin_reports.loading_state"
          >
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="text-center py-20"
            data-ocid="admin_reports.empty_state"
          >
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">No reports found</p>
            <p className="text-sm text-muted-foreground">
              {activeTab !== "all"
                ? `No ${activeTab} reports`
                : "No reports have been submitted yet"}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reporter</TableHead>
                <TableHead>Property ID</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((report, i) => {
                const dateStr = new Date(
                  Number(report.timestamp / 1_000_000n),
                ).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
                const statusInfo = statusConfig[report.status];
                return (
                  <TableRow
                    key={report.id.toString()}
                    data-ocid={`admin_reports.item.${i + 1}`}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {report.reporterId.toString().slice(0, 8)}...
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      #{report.targetPropertyId.toString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {report.reason}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {report.description}
                      </p>
                      {report.actionTaken && (
                        <p className="text-xs text-green-600 mt-1">
                          Action: {report.actionTaken}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs border ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {dateStr}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {report.status ===
                          Variant_resolved_pending_dismissed.pending && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => openResolveDialog(report.id)}
                              disabled={resolveReport.isPending}
                              data-ocid={`admin_reports.resolve.button.${i + 1}`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Resolve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDismiss(report.id)}
                              disabled={dismissReport.isPending}
                              data-ocid={`admin_reports.dismiss.button.${i + 1}`}
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Dismiss
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent className="sm:max-w-md" data-ocid="admin_reports.dialog">
          <DialogHeader>
            <DialogTitle>Resolve Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="action-text">Action Taken</Label>
            <Textarea
              id="action-text"
              placeholder="Describe the action taken (e.g., listing removed, user warned)..."
              value={actionText}
              onChange={(e) => setActionText(e.target.value)}
              rows={4}
              data-ocid="admin_reports.action.textarea"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResolveDialogOpen(false)}
              data-ocid="admin_reports.cancel.button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              disabled={resolveReport.isPending}
              data-ocid="admin_reports.confirm.button"
            >
              {resolveReport.isPending ? "Resolving..." : "Resolve Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

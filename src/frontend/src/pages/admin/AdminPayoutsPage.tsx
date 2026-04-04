import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Check, IndianRupee, Loader2, Star, X } from "lucide-react";
import { toast } from "sonner";
import RouteGuard from "../../components/RouteGuard";
import {
  useApprovePayoutRequest,
  useGetPayoutRequests,
  useRejectPayoutRequest,
} from "../../hooks/useQueries";

export default function AdminPayoutsPage() {
  return (
    <RouteGuard requiredRole="admin">
      <AdminPayoutsInner />
    </RouteGuard>
  );
}

function AdminPayoutsInner() {
  const { data: requests, isLoading } = useGetPayoutRequests();
  const approveMutation = useApprovePayoutRequest();
  const rejectMutation = useRejectPayoutRequest();

  const pendingCount = (requests ?? []).filter(
    (r) => r.status === "pending",
  ).length;

  const handleApprove = async (id: bigint) => {
    try {
      await approveMutation.mutateAsync(id);
      toast.success("Payout request approved!");
    } catch {
      toast.error("Failed to approve payout request.");
    }
  };

  const handleReject = async (id: bigint) => {
    try {
      await rejectMutation.mutateAsync(id);
      toast.success("Payout request rejected. Points restored to student.");
    } catch {
      toast.error("Failed to reject payout request.");
    }
  };

  const statusStyle: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    approved: "bg-green-50 text-green-700 border-green-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="font-display font-bold text-2xl flex items-center gap-2">
            <IndianRupee className="w-6 h-6 text-primary" />
            Payout Requests
          </h1>
          {pendingCount > 0 && (
            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
              {pendingCount} pending
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          Review and approve student reward point payout requests (₹800 each)
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="w-4 h-4 text-purple-500" />
            All Payout Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !requests || requests.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-ocid="payouts.empty_state"
            >
              <IndianRupee className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No payout requests yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => {
                    const isApproving = approveMutation.isPending;
                    const isRejecting = rejectMutation.isPending;
                    return (
                      <TableRow key={req.id.toString()}>
                        <TableCell className="font-mono text-xs">
                          {req.student.toString().slice(0, 10)}…
                        </TableCell>
                        <TableCell className="font-medium">
                          {Number(req.pointsRequested)} pts
                        </TableCell>
                        <TableCell className="font-bold text-primary">
                          ₹800
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusStyle[req.status] ?? ""}
                          >
                            {req.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">
                          {req.notes ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(
                            Number(req.timestamp / 1_000_000n),
                            "MMM d, yyyy",
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {req.status === "pending" && (
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleApprove(req.id)}
                                disabled={isApproving}
                                data-ocid={`payouts.approve.${req.id}`}
                              >
                                {isApproving ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                onClick={() => handleReject(req.id)}
                                disabled={isRejecting}
                                data-ocid={`payouts.reject.${req.id}`}
                              >
                                {isRejecting ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <X className="w-3.5 h-3.5" />
                                )}
                                Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

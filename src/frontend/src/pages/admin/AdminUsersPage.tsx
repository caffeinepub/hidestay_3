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
import { CheckCircle2, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import { ApprovalStatus } from "../../backend";
import RouteGuard from "../../components/RouteGuard";
import { useListApprovals, useSetApproval } from "../../hooks/useQueries";

const statusColors: Record<ApprovalStatus, string> = {
  [ApprovalStatus.approved]: "bg-green-100 text-green-700 border-green-200",
  [ApprovalStatus.pending]: "bg-yellow-100 text-yellow-700 border-yellow-200",
  [ApprovalStatus.rejected]: "bg-red-100 text-red-700 border-red-200",
};

export default function AdminUsersPage() {
  return (
    <RouteGuard requiredRole="admin">
      <AdminUsersInner />
    </RouteGuard>
  );
}

function AdminUsersInner() {
  const { data: approvals, isLoading } = useListApprovals();
  const setApproval = useSetApproval();

  const handleSetApproval = async (principal: any, status: ApprovalStatus) => {
    try {
      await setApproval.mutateAsync({ principal, status });
      toast.success(
        `User ${status === ApprovalStatus.approved ? "approved" : "rejected"} successfully!`,
      );
    } catch {
      toast.error("Failed to update user status.");
    }
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl mb-1">
          User Management
        </h1>
        <p className="text-muted-foreground">
          Approve or reject property owners requesting access
        </p>
      </div>

      <div
        className="bg-card border border-border rounded-xl shadow-xs overflow-hidden"
        data-ocid="admin_users.table"
      >
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="h-14 w-full"
                data-ocid="admin_users.loading_state"
              />
            ))}
          </div>
        ) : !approvals || approvals.length === 0 ? (
          <div
            className="text-center py-20"
            data-ocid="admin_users.empty_state"
          >
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">No approval requests yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Principal ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvals.map((a, i) => (
                <TableRow
                  key={a.principal.toString()}
                  data-ocid={`admin_users.item.${i + 1}`}
                >
                  <TableCell className="font-mono text-sm">
                    {a.principal.toString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-xs border ${statusColors[a.status]}`}
                      variant="outline"
                    >
                      {a.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      {a.status !== ApprovalStatus.approved && (
                        <Button
                          size="sm"
                          onClick={() =>
                            handleSetApproval(
                              a.principal,
                              ApprovalStatus.approved,
                            )
                          }
                          disabled={setApproval.isPending}
                          data-ocid={`admin_users.approve.button.${i + 1}`}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                        </Button>
                      )}
                      {a.status !== ApprovalStatus.rejected && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleSetApproval(
                              a.principal,
                              ApprovalStatus.rejected,
                            )
                          }
                          disabled={setApproval.isPending}
                          data-ocid={`admin_users.reject.button.${i + 1}`}
                        >
                          <XCircle className="w-4 h-4 mr-1" /> Reject
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

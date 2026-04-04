import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ShieldX,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import RouteGuard from "../../components/RouteGuard";
import { useAllProperties } from "../../hooks/useQueries";
import { useVerifyProperty } from "../../hooks/useQueries";

export interface IDVRequest {
  principal: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: number;
  fileDataUrl: string;
  notes: string;
}

export function getIdvRequests(): IDVRequest[] {
  try {
    const raw = localStorage.getItem("hidestay_idv_requests");
    return raw ? (JSON.parse(raw) as IDVRequest[]) : [];
  } catch {
    return [];
  }
}

function saveIdvRequests(requests: IDVRequest[]) {
  localStorage.setItem("hidestay_idv_requests", JSON.stringify(requests));
}

const statusConfig = {
  pending: {
    label: "Pending Review",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
  },
};

export default function AdminIdVerificationPage() {
  return (
    <RouteGuard requiredRole="admin">
      <AdminIdVerificationInner />
    </RouteGuard>
  );
}

function AdminIdVerificationInner() {
  const router = useRouter();
  const { data: allProperties } = useAllProperties();
  const verifyProperty = useVerifyProperty();

  const [requests, setRequests] = useState<IDVRequest[]>(() =>
    getIdvRequests(),
  );
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  async function handleApprove(request: IDVRequest) {
    try {
      // Verify all properties owned by this principal
      const ownerProps = (allProperties ?? []).filter(
        (p) => p.owner.toString() === request.principal,
      );

      for (const prop of ownerProps) {
        await verifyProperty.mutateAsync(prop.id);
      }

      const updated = requests.map((r) =>
        r.principal === request.principal
          ? {
              ...r,
              status: "approved" as const,
              notes: notes[request.principal] ?? "",
            }
          : r,
      );
      setRequests(updated);
      saveIdvRequests(updated);

      // Update owner localStorage flag
      localStorage.setItem(`hidestay_idv_${request.principal}`, "approved");

      toast.success(
        `Owner verified. ${ownerProps.length} propert${
          ownerProps.length === 1 ? "y" : "ies"
        } marked as verified.`,
      );
    } catch {
      toast.error("Failed to verify owner. Please try again.");
    }
  }

  function handleReject(request: IDVRequest) {
    const updated = requests.map((r) =>
      r.principal === request.principal
        ? {
            ...r,
            status: "rejected" as const,
            notes: notes[request.principal] ?? "",
          }
        : r,
    );
    setRequests(updated);
    saveIdvRequests(updated);

    // Update owner localStorage flag
    localStorage.setItem(
      `hidestay_idv_${request.principal}`,
      `rejected:${notes[request.principal] ?? ""}`,
    );

    toast.success("ID verification rejected.");
  }

  return (
    <div className="container max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.navigate({ to: "/admin/dashboard" })}
          data-ocid="admin_idv.back.button"
          className="-ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div>
          <h1 className="font-display font-bold text-3xl flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-primary" />
            ID Verification
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Review and verify owner identity documents
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold">{requests.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-yellow-600">
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-green-600">
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-green-600">
              {requests.filter((r) => r.status === "approved").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div
          className="bg-card border border-border rounded-xl p-16 text-center"
          data-ocid="admin_idv.empty_state"
        >
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="font-semibold text-lg mb-1">
            No verification requests yet
          </p>
          <p className="text-sm text-muted-foreground">
            Owner ID verification requests will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req, idx) => {
            const config = statusConfig[req.status];
            const StatusIcon = config.icon;
            const isExpanded = expandedId === req.principal;

            return (
              <div
                key={req.principal}
                className="bg-card border border-border rounded-xl overflow-hidden"
                data-ocid={`admin_idv.item.${idx + 1}`}
              >
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <StatusIcon
                        className={`w-5 h-5 ${config.color.split(" ")[1]}`}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-sm truncate">
                        {req.principal}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="outline"
                          className={`text-xs border ${config.color}`}
                        >
                          {config.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(req.submittedAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : req.principal)
                    }
                    data-ocid={`admin_idv.expand.button.${idx + 1}`}
                  >
                    {isExpanded ? "Collapse" : "Review"}
                  </Button>
                </div>

                {/* Expanded Review Panel */}
                {isExpanded && (
                  <div className="border-t border-border px-5 py-5 space-y-4">
                    {/* ID Document Preview */}
                    {req.fileDataUrl && (
                      <div>
                        <p className="text-sm font-medium mb-2">ID Document</p>
                        <img
                          src={req.fileDataUrl}
                          alt="ID proof"
                          className="max-h-64 rounded-lg border border-border object-contain"
                        />
                      </div>
                    )}

                    {/* Admin Notes */}
                    {req.status === "pending" && (
                      <div className="space-y-2">
                        <Label htmlFor={`notes-${req.principal}`}>
                          Notes (optional)
                        </Label>
                        <Textarea
                          id={`notes-${req.principal}`}
                          placeholder="Add notes for your records..."
                          rows={2}
                          value={notes[req.principal] ?? ""}
                          onChange={(e) =>
                            setNotes((prev) => ({
                              ...prev,
                              [req.principal]: e.target.value,
                            }))
                          }
                          data-ocid={`admin_idv.notes.textarea.${idx + 1}`}
                        />
                      </div>
                    )}

                    {req.notes && req.status !== "pending" && (
                      <div className="bg-muted/50 rounded-lg px-3 py-2">
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">
                          Notes
                        </p>
                        <p className="text-sm">{req.notes}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {req.status === "pending" && (
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleApprove(req)}
                          disabled={verifyProperty.isPending}
                          data-ocid={`admin_idv.approve.button.${idx + 1}`}
                        >
                          <ShieldCheck className="w-4 h-4 mr-2" />
                          Approve & Verify
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleReject(req)}
                          data-ocid={`admin_idv.reject.button.${idx + 1}`}
                        >
                          <ShieldX className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

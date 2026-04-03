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
import { useRouter } from "@tanstack/react-router";
import { AlertTriangle, CreditCard, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import RouteGuard from "../../components/RouteGuard";
import {
  useGetStripePayments,
  useIsStripeConfigured,
} from "../../hooks/useQueries";

interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  customer?: string;
  created: number;
  description?: string;
}

const statusColors: Record<string, string> = {
  succeeded: "bg-green-100 text-green-700 border-green-200",
  requires_payment_method: "bg-yellow-100 text-yellow-700 border-yellow-200",
  requires_confirmation: "bg-yellow-100 text-yellow-700 border-yellow-200",
  processing: "bg-blue-100 text-blue-700 border-blue-200",
  canceled: "bg-red-100 text-red-700 border-red-200",
  requires_capture: "bg-orange-100 text-orange-700 border-orange-200",
};

export default function AdminPaymentsPage() {
  return (
    <RouteGuard requiredRole="admin">
      <AdminPaymentsInner />
    </RouteGuard>
  );
}

function AdminPaymentsInner() {
  const router = useRouter();
  const { data: stripeConfigured, isLoading: configLoading } =
    useIsStripeConfigured();
  const {
    data: rawPaymentsJson,
    isLoading: paymentsLoading,
    refetch,
    isFetched,
  } = useGetStripePayments();

  const [parseError, setParseError] = useState<string | null>(null);

  let paymentIntents: StripePaymentIntent[] = [];
  if (rawPaymentsJson && rawPaymentsJson.trim() !== "") {
    try {
      const parsed = JSON.parse(rawPaymentsJson);
      if (Array.isArray(parsed)) {
        paymentIntents = parsed;
      } else if (parsed?.data && Array.isArray(parsed.data)) {
        paymentIntents = parsed.data;
      } else if (
        parsed?.payment_intents &&
        Array.isArray(parsed.payment_intents)
      ) {
        paymentIntents = parsed.payment_intents;
      }
    } catch {
      if (!parseError) {
        setParseError(
          "Failed to parse Stripe response. The format may have changed.",
        );
      }
    }
  }

  const totalAmount = paymentIntents
    .filter((p) => p.status === "succeeded")
    .reduce((sum, p) => sum + p.amount, 0);

  function handleLoadPayments() {
    setParseError(null);
    refetch().catch(() => toast.error("Failed to fetch payments"));
  }

  if (configLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-10">
        <Skeleton
          className="h-8 w-64 mb-4"
          data-ocid="admin_payments.loading_state"
        />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl mb-1">
          Payment Management
        </h1>
        <p className="text-muted-foreground">
          Track Stripe transactions and revenue
        </p>
      </div>

      {!stripeConfigured && (
        <div
          className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6"
          data-ocid="admin_payments.error_state"
        >
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-yellow-800">
              Stripe Not Configured
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              You haven't set up your Stripe secret key yet. Payment data won't
              be available until Stripe is configured.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 border-yellow-300 text-yellow-800 hover:bg-yellow-100"
              onClick={() => router.navigate({ to: "/admin/stripe" })}
              data-ocid="admin_payments.stripe.button"
            >
              Configure Stripe →
            </Button>
          </div>
        </div>
      )}

      {isFetched && paymentIntents.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <span className="text-3xl font-bold">
                  {paymentIntents.length}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue (Succeeded)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">
                ₹
                {(totalAmount / 100).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      {!isFetched && (
        <div className="text-center py-12 bg-card border border-border rounded-xl mb-6">
          <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="font-semibold mb-2">Load Stripe Payments</p>
          <p className="text-sm text-muted-foreground mb-4">
            Click below to fetch real-time payment data from Stripe
          </p>
          <Button
            onClick={handleLoadPayments}
            disabled={paymentsLoading || !stripeConfigured}
            data-ocid="admin_payments.primary_button"
          >
            {paymentsLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" /> Load Payments
              </>
            )}
          </Button>
        </div>
      )}

      {isFetched && (
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadPayments}
            disabled={paymentsLoading}
            data-ocid="admin_payments.secondary_button"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${paymentsLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      )}

      {parseError && (
        <div
          className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4"
          data-ocid="admin_payments.error_state"
        >
          {parseError}
        </div>
      )}

      {isFetched && !paymentsLoading && paymentIntents.length > 0 && (
        <div
          className="bg-card border border-border rounded-xl overflow-hidden"
          data-ocid="admin_payments.table"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentIntents.map((pi, i) => {
                const amount = pi.amount / 100;
                const dateStr = new Date(pi.created * 1000).toLocaleDateString(
                  "en-IN",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  },
                );
                const colorClass =
                  statusColors[pi.status] ??
                  "bg-gray-100 text-gray-600 border-gray-200";
                return (
                  <TableRow
                    key={pi.id}
                    data-ocid={`admin_payments.item.${i + 1}`}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {pi.id.slice(0, 16)}...
                    </TableCell>
                    <TableCell className="font-semibold">
                      ₹
                      {amount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="uppercase text-sm">
                      {pi.currency}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs border ${colorClass}`}
                      >
                        {pi.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {pi.customer ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {dateStr}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {isFetched &&
        !paymentsLoading &&
        paymentIntents.length === 0 &&
        !parseError && (
          <div
            className="text-center py-20 bg-card border border-border rounded-xl"
            data-ocid="admin_payments.empty_state"
          >
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">No payments found</p>
            <p className="text-sm text-muted-foreground">
              No payment transactions have been recorded yet.
            </p>
          </div>
        )}
    </div>
  );
}

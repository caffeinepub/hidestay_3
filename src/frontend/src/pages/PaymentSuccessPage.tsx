import { Button } from "@/components/ui/button";
import { useRouter, useSearch } from "@tanstack/react-router";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect } from "react";
import { useBookProperty, useStripeSessionStatus } from "../hooks/useQueries";

export default function PaymentSuccessPage() {
  const search = useSearch({ strict: false }) as Record<string, string>;
  const sessionId = search.session_id ?? null;
  const router = useRouter();

  const { data: status, isLoading } = useStripeSessionStatus(sessionId);

  return (
    <div className="container max-w-lg mx-auto px-4 py-20 text-center">
      {isLoading ? (
        <div data-ocid="payment.loading_state">
          <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
          <h2 className="font-display font-bold text-2xl mb-2">
            Processing Payment...
          </h2>
          <p className="text-muted-foreground">
            Please wait while we confirm your payment.
          </p>
        </div>
      ) : status?.__kind__ === "completed" ? (
        <div data-ocid="payment.success_state">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="font-display font-bold text-2xl mb-2">
            Booking Confirmed!
          </h2>
          <p className="text-muted-foreground mb-6">
            Your payment was successful and your booking is confirmed.
          </p>
          <Button
            onClick={() => router.navigate({ to: "/my-bookings" })}
            data-ocid="payment.view_bookings.button"
          >
            View My Bookings
          </Button>
        </div>
      ) : status?.__kind__ === "failed" ? (
        <div data-ocid="payment.error_state">
          <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="font-display font-bold text-2xl mb-2">
            Payment Failed
          </h2>
          <p className="text-muted-foreground mb-6">
            {status.failed.error || "Something went wrong. Please try again."}
          </p>
          <Button
            variant="outline"
            onClick={() => router.navigate({ to: "/search" })}
            data-ocid="payment.retry.button"
          >
            Back to Search
          </Button>
        </div>
      ) : (
        <div data-ocid="payment.pending_state">
          <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
          <h2 className="font-display font-bold text-2xl mb-2">
            Confirming your booking...
          </h2>
          <p className="text-muted-foreground">This may take a moment.</p>
        </div>
      )}
    </div>
  );
}

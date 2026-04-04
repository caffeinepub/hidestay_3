import { Button } from "@/components/ui/button";
import { useRouter, useSearch } from "@tanstack/react-router";
import { CheckCircle2, Copy, Loader2, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useConfirmStripeBooking,
  useStripeSessionStatus,
} from "../hooks/useQueries";

export default function PaymentSuccessPage() {
  const search = useSearch({ strict: false }) as Record<string, string>;
  const sessionId = search.session_id ?? null;
  const bookingIdStr = search.bookingId ?? null;
  const router = useRouter();

  const { data: status, isLoading } = useStripeSessionStatus(sessionId);
  const confirmMutation = useConfirmStripeBooking();
  const confirmedRef = useRef(false);
  const [copied, setCopied] = useState(false);

  // Once Stripe confirms payment as completed, update the backend booking status
  useEffect(() => {
    if (
      status?.__kind__ === "completed" &&
      sessionId &&
      bookingIdStr &&
      !confirmedRef.current &&
      !confirmMutation.isPending
    ) {
      confirmedRef.current = true;
      confirmMutation.mutate(
        { bookingId: BigInt(bookingIdStr), sessionId },
        {
          onError: () => {
            // Non-fatal: booking was still created, just status update failed
            toast.error(
              "Could not sync booking status. Please check My Bookings.",
            );
          },
        },
      );
    }
  }, [status, sessionId, bookingIdStr, confirmMutation]);

  const shortBookingId = bookingIdStr ? `#${bookingIdStr.slice(-8)}` : "";

  const shareText =
    status?.__kind__ === "completed" && bookingIdStr
      ? `My Hidestay booking is confirmed! Booking ID: ${shortBookingId}. Advance payment received via Stripe.`
      : "";

  const handleCopy = async () => {
    if (!shareText) return;
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <h2 className="font-display font-bold text-3xl mb-2">
            Booking Confirmed!
          </h2>
          <p className="text-muted-foreground mb-6">
            Your advance payment was successful. The property is reserved for
            you.
          </p>

          {/* Booking Details Card */}
          <div className="bg-card border border-border rounded-xl p-5 text-left mb-5 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Booking Details
            </p>
            {bookingIdStr && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Booking ID</span>
                <span className="font-mono font-medium">{shortBookingId}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="text-green-600 font-semibold">Paid</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment</span>
              <span className="font-medium">Stripe (Advance 10%)</span>
            </div>
          </div>

          {/* Shareable confirmation */}
          <div className="bg-accent/30 border border-border rounded-lg p-4 text-left mb-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Share this confirmation
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {shareText}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full gap-2"
              onClick={handleCopy}
              data-ocid="payment.copy.button"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? "Copied!" : "Copy Confirmation"}
            </Button>
          </div>

          <Button
            className="w-full mb-3"
            onClick={() => router.navigate({ to: "/my-bookings" })}
            data-ocid="payment.view_bookings.button"
          >
            View My Bookings
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.navigate({ to: "/search" })}
            data-ocid="payment.browse_more.button"
          >
            Browse More Properties
          </Button>
        </div>
      ) : status?.__kind__ === "failed" ? (
        <div data-ocid="payment.error_state">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
          </div>
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

import { Button } from "@/components/ui/button";
import { useRouter } from "@tanstack/react-router";
import { XCircle } from "lucide-react";

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div
      className="container max-w-lg mx-auto px-4 py-20 text-center"
      data-ocid="payment_cancel.page"
    >
      <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
      <h2 className="font-display font-bold text-2xl mb-2">
        Payment Cancelled
      </h2>
      <p className="text-muted-foreground mb-6">
        Your payment was cancelled. Your booking has not been confirmed.
      </p>
      <div className="flex justify-center gap-3">
        <Button
          variant="outline"
          onClick={() => router.navigate({ to: "/search" })}
          data-ocid="payment_cancel.search.button"
        >
          Browse Properties
        </Button>
        <Button
          onClick={() => router.history.back()}
          data-ocid="payment_cancel.back.button"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}

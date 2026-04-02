import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import RouteGuard from "../../components/RouteGuard";
import {
  useIsStripeConfigured,
  useSetStripeConfig,
} from "../../hooks/useQueries";

export default function AdminStripePage() {
  return (
    <RouteGuard requiredRole="admin">
      <AdminStripeInner />
    </RouteGuard>
  );
}

function AdminStripeInner() {
  const { data: isConfigured } = useIsStripeConfigured();
  const setStripeConfig = useSetStripeConfig();
  const [secretKey, setSecretKey] = useState("");
  const [allowedCountries, setAllowedCountries] = useState("IN,US,GB");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setStripeConfig.mutateAsync({
        secretKey,
        allowedCountries: allowedCountries
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
      });
      toast.success("Stripe configuration saved!");
      setSecretKey("");
    } catch {
      toast.error("Failed to save Stripe config.");
    }
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl mb-1">
          Stripe Configuration
        </h1>
        <p className="text-muted-foreground">
          Configure Stripe for payment processing
        </p>
      </div>

      {/* Status */}
      <div
        className={`flex items-center gap-3 p-4 rounded-xl border mb-6 ${
          isConfigured
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-yellow-50 border-yellow-200 text-yellow-800"
        }`}
        data-ocid="admin_stripe.status.card"
      >
        {isConfigured ? (
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
        ) : (
          <CreditCard className="w-5 h-5 text-yellow-600 shrink-0" />
        )}
        <div>
          <p className="font-semibold text-sm">
            Stripe is {isConfigured ? "configured" : "not configured"}
          </p>
          <p className="text-xs mt-0.5">
            {isConfigured
              ? "Payments are enabled. Update your configuration below."
              : "Enter your Stripe secret key to enable payments."}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-8 shadow-xs">
        <form
          onSubmit={handleSubmit}
          className="space-y-5"
          data-ocid="admin_stripe.form"
        >
          <div className="space-y-2">
            <Label htmlFor="stripe-key">Stripe Secret Key</Label>
            <Input
              id="stripe-key"
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="sk_live_... or sk_test_..."
              required
              data-ocid="admin_stripe.secret_key.input"
            />
            <p className="text-xs text-muted-foreground">
              Your Stripe secret key. Starts with sk_live_ (production) or
              sk_test_ (testing).
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="allowed-countries">
              Allowed Countries (comma-separated)
            </Label>
            <Input
              id="allowed-countries"
              value={allowedCountries}
              onChange={(e) => setAllowedCountries(e.target.value)}
              placeholder="IN,US,GB"
              data-ocid="admin_stripe.countries.input"
            />
            <p className="text-xs text-muted-foreground">
              ISO country codes where payments are accepted. e.g. IN,US,GB,CA
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={setStripeConfig.isPending}
            data-ocid="admin_stripe.save.button"
          >
            {setStripeConfig.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              "Save Configuration"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

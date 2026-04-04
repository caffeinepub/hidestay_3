import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, Smartphone } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

export default function PhoneEntryPage() {
  const router = useRouter();
  const { generateOTP } = useAuth();
  const [phone, setPhone] = useState("");
  const [demoOTP, setDemoOTP] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const role = (sessionStorage.getItem("hidestay_pending_role") ?? "student") as
    | "student"
    | "owner";

  function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const otp = generateOTP(digits);
      setDemoOTP(otp);
      setIsLoading(false);
    }, 800);
  }

  function handleContinue() {
    const digits = phone.replace(/\D/g, "");
    router.navigate({ to: "/auth/otp", search: { phone: digits, role } });
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-16">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <button
          type="button"
          onClick={() => router.navigate({ to: "/auth/role" })}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          data-ocid="phone.back.button"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
          <div className="flex items-center justify-center mb-6">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Smartphone className="w-7 h-7 text-primary" />
            </div>
          </div>

          <h1 className="font-display font-bold text-2xl text-center text-foreground mb-1">
            Enter your mobile number
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            We&apos;ll send an OTP to verify your number.
          </p>

          {/* Demo OTP Banner */}
          {demoOTP && (
            <motion.div
              className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              data-ocid="phone.demo.banner"
            >
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-amber-800">Demo Mode</p>
                <p className="text-amber-700">
                  Your OTP is:{" "}
                  <span className="font-bold text-xl tracking-widest">
                    {demoOTP}
                  </span>
                </p>
              </div>
            </motion.div>
          )}

          <form
            onSubmit={handleSendOTP}
            className="space-y-4"
            data-ocid="phone.form"
          >
            <div className="space-y-2">
              <Label htmlFor="phone">Mobile Number</Label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 py-2 bg-muted border border-input rounded-md text-sm font-medium text-muted-foreground shrink-0">
                  🇮🇳 +91
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={15}
                  disabled={!!demoOTP}
                  required
                  data-ocid="phone.input"
                />
              </div>
              {error && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="phone.error_state"
                >
                  {error}
                </p>
              )}
            </div>

            {!demoOTP ? (
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-ocid="phone.send_otp.button"
              >
                {isLoading ? "Sending..." : "Send OTP"}
              </Button>
            ) : (
              <Button
                type="button"
                className="w-full"
                onClick={handleContinue}
                data-ocid="phone.continue.button"
              >
                Continue to Verify OTP →
              </Button>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
}

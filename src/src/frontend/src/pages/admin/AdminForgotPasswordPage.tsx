import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, KeyRound } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

export default function AdminForgotPasswordPage() {
  const router = useRouter();
  const { adminForgotPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setTimeout(() => {
      const result = adminForgotPassword(email);
      setIsLoading(false);
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      setResetCode(result.code ?? "");
      setSubmitted(true);
    }, 500);
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
          onClick={() => router.navigate({ to: "/admin/login" })}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          data-ocid="forgot.back.button"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </button>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
          <div className="flex items-center justify-center mb-6">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <KeyRound className="w-7 h-7 text-primary" />
            </div>
          </div>

          <h1 className="font-display font-bold text-2xl text-center mb-1">
            Forgot Password
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Enter your admin email to receive a reset code
          </p>

          {!submitted ? (
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
              data-ocid="forgot.form"
            >
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Admin Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@hidestay.com"
                  required
                  data-ocid="forgot.email.input"
                />
              </div>

              {error && (
                <div
                  className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2"
                  data-ocid="forgot.error_state"
                >
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-ocid="forgot.submit.button"
              >
                {isLoading ? "Sending..." : "Send Reset Code"}
              </Button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-5"
              data-ocid="forgot.success_state"
            >
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-800">
                    Demo Mode — Reset Code
                  </p>
                  <p className="text-amber-700">
                    Your reset code for <strong>{email}</strong> is:{" "}
                    <span className="font-bold text-xl tracking-widest">
                      {resetCode}
                    </span>
                  </p>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => router.navigate({ to: "/admin/reset-password" })}
                data-ocid="forgot.continue.button"
              >
                Enter Reset Code →
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

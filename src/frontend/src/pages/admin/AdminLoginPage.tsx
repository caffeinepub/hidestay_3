import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@tanstack/react-router";
import { Eye, EyeOff, KeyRound, Loader2, Shield } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth";

export default function AdminLoginPage() {
  const router = useRouter();
  const { adminLogin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setTimeout(() => {
      const ok = adminLogin(email, password);
      setIsLoading(false);
      if (!ok) {
        setError("Invalid email or password. Please try again.");
        return;
      }
      toast.success("Welcome back, Admin!");
      router.navigate({ to: "/admin/dashboard" });
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
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-full bg-primary/10 items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground mb-1">
            Admin Login
          </h1>
          <p className="text-sm text-muted-foreground">
            Secure access to the Hidestay control panel
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            data-ocid="admin.login.form"
          >
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email Address</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@hidestay.com"
                required
                autoComplete="email"
                data-ocid="admin.login.email.input"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="admin-password">Password</Label>
                <button
                  type="button"
                  onClick={() =>
                    router.navigate({ to: "/admin/forgot-password" })
                  }
                  className="text-xs text-primary hover:underline"
                  data-ocid="admin.forgot.link"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  data-ocid="admin.login.password.input"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2"
                data-ocid="admin.login.error_state"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-ocid="admin.login.submit.button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing
                  in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-5 pt-5 border-t border-border text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              First time? Set up the admin account:
            </p>
            <button
              type="button"
              onClick={() => router.navigate({ to: "/admin/create" })}
              className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
              data-ocid="admin.create.link"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Create Admin Account
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

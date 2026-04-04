import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, UserPlus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

export default function AdminCreatePage() {
  const router = useRouter();
  const { adminRegister, adminSession } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPass) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      const result = adminRegister(email, password, name);
      setIsLoading(false);
      if (!result.ok) {
        setError(result.error ?? "Registration failed.");
        return;
      }
      setSuccess(true);
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
          data-ocid="create.back.button"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </button>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
          <div className="flex items-center justify-center mb-6">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-7 h-7 text-primary" />
            </div>
          </div>

          <h1 className="font-display font-bold text-2xl text-center mb-1">
            Create Admin Account
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            {adminSession
              ? "Create a new admin for your team"
              : "Set up the first admin account"}
          </p>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
              data-ocid="create.success_state"
            >
              <div className="flex justify-center">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </div>
              <p className="font-medium text-foreground">
                Admin account created!
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>{email}</strong> can now log in to the admin panel.
              </p>
              <Button
                className="w-full"
                onClick={() => router.navigate({ to: "/admin/login" })}
                data-ocid="create.goto.login.button"
              >
                Go to Login
              </Button>
            </motion.div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
              data-ocid="create.form"
            >
              <div className="space-y-2">
                <Label htmlFor="create-name">Full Name</Label>
                <Input
                  id="create-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Admin Name"
                  required
                  data-ocid="create.name.input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-email">Email Address</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@hidestay.com"
                  required
                  data-ocid="create.email.input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-password">Password</Label>
                <div className="relative">
                  <Input
                    id="create-password"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    data-ocid="create.password.input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
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

              <div className="space-y-2">
                <Label htmlFor="create-confirm">Confirm Password</Label>
                <Input
                  id="create-confirm"
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  data-ocid="create.confirm.input"
                />
              </div>

              {error && (
                <div
                  className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2"
                  data-ocid="create.error_state"
                >
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-ocid="create.submit.button"
              >
                {isLoading ? "Creating..." : "Create Admin Account"}
              </Button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { useRouter, useSearch } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { type ChangeEvent, type KeyboardEvent, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";

type SearchParams = {
  phone?: string;
  role?: string;
};

const OTP_POSITIONS = [0, 1, 2, 3, 4, 5] as const;

export default function OTPVerifyPage() {
  const router = useRouter();
  const search = useSearch({ strict: false }) as SearchParams;
  const phone = search.phone ?? "";
  const role = (search.role ?? "student") as "student" | "owner";
  const { verifyOTP, generateOTP } = useAuth();

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [resendOTP, setResendOTP] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(idx: number, e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    if (val && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  }

  function handleKeyDown(idx: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const otp = digits.join("");
    if (otp.length < 6) {
      setError("Please enter all 6 digits.");
      return;
    }
    setIsVerifying(true);
    setTimeout(() => {
      const ok = verifyOTP(phone, otp);
      setIsVerifying(false);
      if (!ok) {
        setError("Invalid OTP. Please try again.");
        return;
      }
      router.navigate({ to: "/auth/profile", search: { phone, role } });
    }, 600);
  }

  function handleResend() {
    const code = generateOTP(phone);
    setResendOTP(code);
    setDigits(["", "", "", "", "", ""]);
    setError("");
    inputRefs.current[0]?.focus();
  }

  const maskedPhone = phone ? `+91 XXXXX ${phone.slice(-5)}` : "your number";

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
          onClick={() => router.navigate({ to: "/auth/phone" })}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          data-ocid="otp.back.button"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
          <div className="flex items-center justify-center mb-6">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-primary" />
            </div>
          </div>

          <h1 className="font-display font-bold text-2xl text-center text-foreground mb-1">
            Verify OTP
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Enter the 6-digit code sent to{" "}
            <span className="font-medium text-foreground">{maskedPhone}</span>
          </p>

          {/* Resend OTP demo banner */}
          {resendOTP && (
            <motion.div
              className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-amber-800">
                  New OTP (Demo Mode)
                </p>
                <p className="text-amber-700">
                  Your OTP is:{" "}
                  <span className="font-bold text-xl tracking-widest">
                    {resendOTP}
                  </span>
                </p>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleVerify} data-ocid="otp.form">
            {/* 6-digit OTP input */}
            <div className="flex gap-2 justify-center mb-6">
              {OTP_POSITIONS.map((pos) => (
                <input
                  key={`otp-digit-${pos}`}
                  ref={(el) => {
                    inputRefs.current[pos] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digits[pos]}
                  onChange={(e) => handleChange(pos, e)}
                  onKeyDown={(e) => handleKeyDown(pos, e)}
                  className="w-11 h-12 text-center text-lg font-bold border-2 border-input rounded-xl bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                  data-ocid={`otp.digit.${pos + 1}`}
                />
              ))}
            </div>

            {error && (
              <p
                className="text-center text-sm text-destructive mb-4"
                data-ocid="otp.error_state"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full mb-3"
              disabled={isVerifying || digits.join("").length < 6}
              data-ocid="otp.verify.button"
            >
              {isVerifying ? "Verifying..." : "Verify OTP"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Didn&apos;t receive it?{" "}
              <button
                type="button"
                onClick={handleResend}
                className="text-primary font-medium hover:underline"
                data-ocid="otp.resend.button"
              >
                Resend OTP
              </button>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

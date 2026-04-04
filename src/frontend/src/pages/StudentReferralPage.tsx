import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Copy,
  Gift,
  Share2,
  Star,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import RouteGuard from "../components/RouteGuard";
import {
  useApplyReferralCode,
  useGetReferralCode,
  useGetUserPoints,
} from "../hooks/useQueries";

export default function StudentReferralPage() {
  return (
    <RouteGuard requiredRole="student">
      <StudentReferralInner />
    </RouteGuard>
  );
}

function StudentReferralInner() {
  const navigate = useNavigate();
  const { data: referralCode, isLoading } = useGetReferralCode();
  const { data: points } = useGetUserPoints();
  const applyMutation = useApplyReferralCode();

  const [friendCode, setFriendCode] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    if (!referralCode) return;
    await navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success("Referral code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = referralCode
    ? `Join Hidestay with my referral code ${referralCode} and get 10% off your first booking! Find student PGs & flats near college.`
    : "";

  const handleShare = async () => {
    if (!shareText) return;
    if (navigator.share) {
      await navigator.share({ title: "Join Hidestay", text: shareText });
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success("Share message copied to clipboard!");
    }
  };

  const handleApplyCode = async () => {
    if (!friendCode.trim()) {
      toast.error("Please enter a referral code");
      return;
    }
    try {
      await applyMutation.mutateAsync(friendCode.trim().toUpperCase());
      toast.success("Referral code applied successfully!");
      setFriendCode("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("already applied")) {
        toast.error("You have already used a referral code.");
      } else if (msg.includes("not found") || msg.includes("Invalid")) {
        toast.error("Invalid referral code. Please check and try again.");
      } else {
        toast.error("Failed to apply referral code. Please try again.");
      }
    }
  };

  const steps = [
    {
      icon: Share2,
      title: "Share your code",
      desc: "Send your unique code to friends looking for student accommodation",
    },
    {
      icon: Users,
      title: "Friend signs up",
      desc: "They enter your referral code during profile setup",
    },
    {
      icon: Star,
      title: "You earn points",
      desc: "Get 10 reward points when your friend joins using your code",
    },
    {
      icon: Gift,
      title: "They save money",
      desc: "Your friend gets 10% off their first paid booking",
    },
  ];

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ to: "/student/profile" })}
        className="mb-6 -ml-2"
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Profile
      </Button>

      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl mb-1">
          Refer &amp; Earn
        </h1>
        <p className="text-muted-foreground">
          Share your code, earn points, help friends find great PGs
        </p>
      </div>

      {/* Referral Code Card */}
      <Card className="mb-6 shadow-sm border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Gift className="w-4 h-4 text-orange-500" />
            Your Referral Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-14 w-full rounded-xl" />
          ) : (
            <div className="bg-muted/40 border border-border rounded-xl p-4 flex items-center justify-between gap-4">
              <span className="font-mono font-bold text-2xl tracking-widest text-primary select-all">
                {referralCode || "..."}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                disabled={!referralCode}
                data-ocid="referral.copy.button"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1 text-green-500" />{" "}
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" /> Copy
                  </>
                )}
              </Button>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={handleShare}
              disabled={!referralCode}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Code
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate({ to: "/student/rewards" })}
            >
              <Star className="w-4 h-4 mr-2" />
              My Points: {Number(points ?? 0n)}
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="mb-6 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">How it works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {steps.map((step, i) => (
              <div key={step.title} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <step.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                      {i + 1}
                    </Badge>
                    <p className="font-medium text-sm">{step.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Apply a friend's code */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Apply a Friend's Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Did someone refer you? Enter their referral code below to give them
            reward points.
          </p>
          <div className="space-y-2">
            <Label htmlFor="friend-code">Referral Code</Label>
            <div className="flex gap-2">
              <Input
                id="friend-code"
                placeholder="e.g. JOHN1234"
                value={friendCode}
                onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
                className="font-mono"
                data-ocid="referral.friend_code.input"
              />
              <Button
                onClick={handleApplyCode}
                disabled={!friendCode.trim() || applyMutation.isPending}
                data-ocid="referral.apply.button"
              >
                {applyMutation.isPending ? "Applying..." : "Apply"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

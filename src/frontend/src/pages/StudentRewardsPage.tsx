import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronLeft,
  Gift,
  IndianRupee,
  Loader2,
  Star,
  Trophy,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import RouteGuard from "../components/RouteGuard";
import {
  useGetReferralCode,
  useGetUserPoints,
  useRequestPayout,
} from "../hooks/useQueries";

export default function StudentRewardsPage() {
  return (
    <RouteGuard requiredRole="student">
      <StudentRewardsInner />
    </RouteGuard>
  );
}

function StudentRewardsInner() {
  const navigate = useNavigate();
  const { data: points, isLoading } = useGetUserPoints();
  const { data: referralCode } = useGetReferralCode();
  const payoutMutation = useRequestPayout();

  const [payoutNotes, setPayoutNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const pointsNum = Number(points ?? 0n);
  const PAYOUT_THRESHOLD = 800;
  const progress = Math.min((pointsNum / PAYOUT_THRESHOLD) * 100, 100);
  const canRequestPayout = pointsNum >= PAYOUT_THRESHOLD;

  const handleRequestPayout = async () => {
    try {
      await payoutMutation.mutateAsync(payoutNotes.trim() || null);
      toast.success(
        "Payout request submitted! Admin will review within 2-3 business days.",
      );
      setDialogOpen(false);
      setPayoutNotes("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("Insufficient points")) {
        toast.error("You need at least 800 points to request a payout.");
      } else {
        toast.error("Failed to submit payout request. Please try again.");
      }
    }
  };

  const earningWays = [
    {
      icon: Gift,
      label: "Referral",
      desc: "Each successful referral",
      points: "+10 pts",
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      icon: Star,
      label: "First Booking",
      desc: "Complete your first paid booking",
      points: "+10 pts",
      color: "text-purple-500",
      bg: "bg-purple-50",
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
        <h1 className="font-display font-bold text-2xl mb-1">My Rewards</h1>
        <p className="text-muted-foreground">
          Earn points and redeem for cash payouts
        </p>
      </div>

      {/* Points Balance Card */}
      <Card className="mb-6 shadow-sm border-primary/20 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Points</p>
              {isLoading ? (
                <Skeleton className="h-12 w-32" />
              ) : (
                <div className="flex items-end gap-2">
                  <span className="font-display font-bold text-5xl text-primary">
                    {pointsNum}
                  </span>
                  <span className="text-muted-foreground pb-1">pts</span>
                </div>
              )}
            </div>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
          </div>

          {/* Progress to payout */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress to ₹800 payout</span>
              <span>
                {pointsNum} / {PAYOUT_THRESHOLD} pts
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            {canRequestPayout ? (
              <p className="text-xs text-green-600 font-medium">
                🎉 You're eligible for a ₹800 payout!
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {PAYOUT_THRESHOLD - pointsNum} more points needed for ₹800
                payout
              </p>
            )}
          </div>
        </div>
        <CardContent className="pt-4">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="w-full"
                disabled={!canRequestPayout || payoutMutation.isPending}
                data-ocid="rewards.payout.button"
              >
                <IndianRupee className="w-4 h-4 mr-2" />
                {canRequestPayout
                  ? "Request ₹800 Payout"
                  : `Need ${PAYOUT_THRESHOLD - pointsNum} more points`}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request ₹800 Payout</DialogTitle>
                <DialogDescription>
                  800 points will be deducted from your balance. Your payout
                  request will be reviewed by our team within 2-3 business days.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="bg-muted/40 rounded-lg p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Points to deduct
                    </span>
                    <span className="font-medium">800 pts</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-muted-foreground">Payout amount</span>
                    <span className="font-bold text-primary">₹800</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="payout-notes" className="text-sm font-medium">
                    Notes / UPI ID (optional)
                  </label>
                  <Textarea
                    id="payout-notes"
                    placeholder="Add your UPI ID or bank details for faster processing..."
                    value={payoutNotes}
                    onChange={(e) => setPayoutNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleRequestPayout}
                  disabled={payoutMutation.isPending}
                  data-ocid="rewards.payout.confirm.button"
                >
                  {payoutMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                      Submitting...
                    </>
                  ) : (
                    "Confirm Request"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* How to earn */}
      <Card className="mb-6 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> How to Earn Points
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {earningWays.map((way) => (
            <div
              key={way.label}
              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full ${way.bg} flex items-center justify-center`}
                >
                  <way.icon className={`w-4 h-4 ${way.color}`} />
                </div>
                <div>
                  <p className="font-medium text-sm">{way.label}</p>
                  <p className="text-xs text-muted-foreground">{way.desc}</p>
                </div>
              </div>
              <Badge className="bg-primary/10 text-primary border-primary/20 font-bold">
                {way.points}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Referral code quick link */}
      {referralCode && (
        <Card className="shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm mb-0.5">Your Referral Code</p>
                <p className="font-mono font-bold text-lg text-primary">
                  {referralCode}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate({ to: "/student/referral" })}
              >
                <Gift className="w-4 h-4 mr-1.5" /> Refer Friends
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

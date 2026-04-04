import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useParams, useRouter } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  Eye,
  Loader2,
  Tag,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Booking, Coupon } from "../backend";
import { Variant_cancelled_pending_paid_rejected } from "../backend";
import RouteGuard from "../components/RouteGuard";
import { useAuth } from "../hooks/useAuth";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useBookProperty,
  useCallerProfile,
  useCreateCheckoutSession,
  useMarkCouponUsed,
  useProperty,
  useValidateCoupon,
} from "../hooks/useQueries";

type BookingType = "visit" | "paid";
type Step = "choose" | "details" | "confirmed";

interface ConfirmationData {
  bookingId: bigint;
  propertyName: string;
  visitDate: Date;
  studentName: string;
  studentPhone: string;
}

export default function BookingPage() {
  return (
    <RouteGuard requiredRole="student">
      <BookingPageInner />
    </RouteGuard>
  );
}

function BookingPageInner() {
  const { propertyId } = useParams({ strict: false }) as {
    propertyId: string;
  };
  const router = useRouter();
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { session } = useAuth();
  const { data: property, isLoading: propLoading } = useProperty(
    BigInt(propertyId ?? "0"),
  );
  const { data: profile } = useCallerProfile();
  const bookMutation = useBookProperty();
  const checkoutMutation = useCreateCheckoutSession();
  const validateCouponMutation = useValidateCoupon();
  const useCouponMutation = useMarkCouponUsed();

  const [step, setStep] = useState<Step>("choose");
  const [bookingType, setBookingType] = useState<BookingType>("visit");
  const [visitDate, setVisitDate] = useState<Date | undefined>(undefined);
  const [name, setName] = useState(profile?.name ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [phone, setPhone] = useState(session?.phone ?? profile?.phone ?? "");
  const [notes, setNotes] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationData | null>(
    null,
  );
  const [copied, setCopied] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");

  const advance = property
    ? Math.round(Number(property.pricePerMonth) * 0.1)
    : 0;

  const discountAmount = appliedCoupon
    ? Math.round((advance * Number(appliedCoupon.discountPercent)) / 100)
    : 0;
  const finalAmount = advance - discountAmount;

  const isPending = bookMutation.isPending || checkoutMutation.isPending;

  const handleSelectType = (type: BookingType) => {
    setBookingType(type);
    setStep("details");
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError("");
    try {
      const coupon = await validateCouponMutation.mutateAsync(
        couponCode.trim().toUpperCase(),
      );
      if (!coupon) {
        setCouponError(
          "Invalid or expired coupon code. Please check and try again.",
        );
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon(coupon);
        setCouponError("");
        toast.success(
          `Coupon applied! Save ₹${Math.round((advance * Number(coupon.discountPercent)) / 100).toLocaleString("en-IN")}`,
        );
      }
    } catch {
      setCouponError("Failed to validate coupon. Please try again.");
      setAppliedCoupon(null);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property || !visitDate || !identity) return;

    const principal = identity.getPrincipal();
    const bookingId = BigInt(Date.now());
    const dateNanos = BigInt(visitDate.getTime()) * 1_000_000n;

    const booking: Booking = {
      id: bookingId,
      status: Variant_cancelled_pending_paid_rejected.pending,
      propertyId: property.id,
      propertyIdText: property.id.toString(),
      student: principal,
      startDate: dateNanos,
      endDate: dateNanos,
      totalPrice: bookingType === "visit" ? 0n : BigInt(finalAmount),
      userDetails: {
        name,
        email: bookingType === "paid" ? email : notes ? `notes: ${notes}` : "",
        phone,
      },
    };

    try {
      await bookMutation.mutateAsync(booking);

      if (bookingType === "visit") {
        setConfirmation({
          bookingId,
          propertyName: property.title,
          visitDate,
          studentName: name,
          studentPhone: phone,
        });
        setStep("confirmed");
      } else {
        // If coupon was applied, mark it as used before redirecting to Stripe
        if (appliedCoupon) {
          try {
            await useCouponMutation.mutateAsync(appliedCoupon.code);
          } catch {
            // Proceed even if coupon marking fails
          }
        }

        const baseUrl = window.location.origin;
        const sessionUrl = await checkoutMutation.mutateAsync({
          items: [
            {
              productName: `Visit Advance – ${property.title}`,
              productDescription: `10% advance booking for ${property.address.city}${
                appliedCoupon ? " (coupon applied)" : ""
              }`,
              currency: "inr",
              quantity: 1n,
              priceInCents: BigInt(finalAmount * 100),
            },
          ],
          successUrl: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&bookingId=${bookingId.toString()}`,
          cancelUrl: `${baseUrl}/payment/cancel`,
        });
        window.location.href = sessionUrl;
      }
    } catch (err) {
      toast.error("Booking failed. Please try again.");
      console.error(err);
    }
  };

  const shareText = confirmation
    ? `I've booked a visit to ${confirmation.propertyName} on ${format(confirmation.visitDate, "MMMM d, yyyy")}. Booking ID: ${confirmation.bookingId.toString()}`
    : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (propLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // === Confirmation Screen ===
  if (step === "confirmed" && confirmation) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-16">
        <div
          className="bg-card border border-border rounded-2xl p-8 text-center shadow-sm"
          data-ocid="booking.success_state"
        >
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <h1 className="font-display font-bold text-2xl mb-1 text-foreground">
            Visit Booked!
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            Your visit has been scheduled successfully.
          </p>

          <div className="bg-muted/40 rounded-xl p-4 text-left space-y-2 mb-5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Property</span>
              <span className="font-medium text-right max-w-[55%] truncate">
                {confirmation.propertyName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Visit Date</span>
              <span className="font-medium">
                {format(confirmation.visitDate, "EEEE, MMMM d, yyyy")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{confirmation.studentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{confirmation.studentPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Booking ID</span>
              <span className="font-mono text-xs text-muted-foreground">
                #{confirmation.bookingId.toString().slice(-8)}
              </span>
            </div>
          </div>

          {/* Shareable message */}
          <div className="bg-accent/30 border border-border rounded-lg p-3 text-left mb-5">
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
              Share this booking
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {shareText}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              onClick={handleCopy}
              data-ocid="booking.copy.button"
            >
              {copied ? "Copied!" : "Copy Message"}
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1"
              onClick={() => navigate({ to: "/my-bookings" })}
              data-ocid="booking.view_bookings.button"
            >
              View My Bookings
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate({ to: "/search" })}
              data-ocid="booking.browse_more.button"
            >
              Browse More
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // === Step 1: Choose Booking Type ===
  if (step === "choose") {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.history.back()}
          className="mb-6 -ml-2"
          data-ocid="booking.back.button"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        {property && (
          <div className="mb-8">
            <h1 className="font-display font-bold text-2xl mb-1">
              {property.title}
            </h1>
            <p className="text-muted-foreground">
              ₹{Number(property.pricePerMonth).toLocaleString("en-IN")}/month
            </p>
          </div>
        )}

        <h2 className="font-semibold text-lg mb-4">
          How would you like to book?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Visit Booking */}
          <button
            type="button"
            className="bg-card border-2 border-border hover:border-primary rounded-xl p-6 text-left transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => handleSelectType("visit")}
            data-ocid="booking.visit_type.button"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-base mb-1">Book a Visit</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Schedule a free visit to check the property before deciding.
            </p>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200"
            >
              Free
            </Badge>
          </button>

          {/* Paid Booking */}
          <button
            type="button"
            className="bg-card border-2 border-border hover:border-primary rounded-xl p-6 text-left transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => handleSelectType("paid")}
            data-ocid="booking.paid_type.button"
          >
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-4">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-base mb-1">Book Now</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Reserve this property with a 10% advance payment via Stripe.
            </p>
            {property && (
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200"
              >
                ₹{advance.toLocaleString("en-IN")} advance
              </Badge>
            )}
          </button>
        </div>
      </div>
    );
  }

  // === Step 2: Details Form ===
  const isVisit = bookingType === "visit";

  return (
    <div className="container max-w-2xl mx-auto px-4 py-10">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setStep("choose")}
        className="mb-6 -ml-2"
        data-ocid="booking.back.button"
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      <div className="flex items-center gap-3 mb-1">
        <h1 className="font-display font-bold text-2xl">
          {isVisit ? "Schedule a Visit" : "Reserve Property"}
        </h1>
        <Badge
          variant="outline"
          className={
            isVisit
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-green-50 text-green-700 border-green-200"
          }
        >
          {isVisit ? "Free" : "Paid"}
        </Badge>
      </div>
      {property && (
        <p className="text-muted-foreground mb-6">
          {property.title} • ₹
          {Number(property.pricePerMonth).toLocaleString("en-IN")}/mo
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
        data-ocid="booking.form"
      >
        {/* Date Picker */}
        <div className="space-y-2">
          <Label>{isVisit ? "Visit Date" : "Move-in Date"}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                data-ocid="booking.date.button"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {visitDate ? format(visitDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={visitDate}
                onSelect={setVisitDate}
                disabled={(date) =>
                  date < new Date(new Date().setHours(0, 0, 0, 0))
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* User Details */}
        <div className="space-y-4">
          <h3 className="font-semibold">Your Details</h3>
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              data-ocid="booking.name.input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              data-ocid="booking.phone.input"
            />
          </div>
          {!isVisit && (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-ocid="booking.email.input"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any questions or special requests..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              data-ocid="booking.notes.textarea"
            />
          </div>
        </div>

        {/* Coupon code — paid booking only */}
        {!isVisit && (
          <div className="space-y-2">
            <Label htmlFor="coupon">Promo Code (optional)</Label>
            {appliedCoupon ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Tag className="w-4 h-4 text-green-600 shrink-0" />
                <div className="flex-1">
                  <span className="font-mono font-bold text-green-700">
                    {appliedCoupon.code}
                  </span>
                  <span className="text-sm text-green-600 ml-2">
                    — {Number(appliedCoupon.discountPercent)}% off applied! Save
                    ₹{discountAmount.toLocaleString("en-IN")}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive h-6 w-6 p-0"
                  onClick={handleRemoveCoupon}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  id="coupon"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponError("");
                  }}
                  className="font-mono uppercase"
                  data-ocid="booking.coupon.input"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleApplyCoupon}
                  disabled={
                    !couponCode.trim() || validateCouponMutation.isPending
                  }
                  data-ocid="booking.coupon.apply.button"
                >
                  {validateCouponMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </Button>
              </div>
            )}
            {couponError && (
              <p className="text-sm text-destructive">{couponError}</p>
            )}
          </div>
        )}

        {/* Paid booking summary */}
        {!isVisit && property && (
          <div className="bg-accent/40 rounded-xl p-4 space-y-2">
            <p className="text-sm font-medium mb-2">Payment Summary</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly Rent</span>
              <span>
                ₹{Number(property.pricePerMonth).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Advance (10%)</span>
              <span>₹{advance.toLocaleString("en-IN")}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-sm text-green-600">
                <span>
                  Coupon Discount ({Number(appliedCoupon.discountPercent)}%)
                </span>
                <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between text-sm border-t border-border/50 pt-2 mt-1">
              <span className="font-semibold">Amount to Pay</span>
              <span className="font-bold text-primary text-base">
                ₹{finalAmount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={
            isPending || !visitDate || !name || !phone || (!isVisit && !email)
          }
          data-ocid="booking.submit.button"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...
            </>
          ) : isVisit ? (
            "Confirm Visit"
          ) : (
            "Proceed to Payment"
          )}
        </Button>
      </form>
    </div>
  );
}

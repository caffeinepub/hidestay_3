import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useParams, useRouter } from "@tanstack/react-router";
import { differenceInDays, format } from "date-fns";
import { CalendarIcon, ChevronLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Variant_cancelled_pending_paid_rejected } from "../backend";
import type { Booking } from "../backend";
import RouteGuard from "../components/RouteGuard";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useBookProperty,
  useCallerProfile,
  useCreateCheckoutSession,
  useProperty,
} from "../hooks/useQueries";

export default function BookingPage() {
  return (
    <RouteGuard requiredRole="student">
      <BookingPageInner />
    </RouteGuard>
  );
}

function BookingPageInner() {
  const { propertyId } = useParams({ strict: false }) as { propertyId: string };
  const router = useRouter();
  const { identity } = useInternetIdentity();
  const { data: property, isLoading: propLoading } = useProperty(
    BigInt(propertyId ?? "0"),
  );
  const { data: profile } = useCallerProfile();
  const bookMutation = useBookProperty();
  const checkoutMutation = useCreateCheckoutSession();

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [name, setName] = useState(profile?.name ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");

  const months =
    startDate && endDate
      ? Math.max(1, Math.ceil(differenceInDays(endDate, startDate) / 30))
      : 0;
  const totalPrice = property ? Number(property.pricePerMonth) * months : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property || !startDate || !endDate || !identity) return;

    const principal = identity.getPrincipal();
    const bookingId = BigInt(Date.now());

    const booking: Booking = {
      id: bookingId,
      status: Variant_cancelled_pending_paid_rejected.pending,
      propertyId: property.id,
      propertyIdText: property.id.toString(),
      student: principal,
      startDate: BigInt(startDate.getTime()) * 1_000_000n,
      endDate: BigInt(endDate.getTime()) * 1_000_000n,
      totalPrice: BigInt(totalPrice),
      userDetails: { name, email, phone },
    };

    try {
      await bookMutation.mutateAsync(booking);

      // Create Stripe checkout
      const baseUrl = window.location.origin;
      const sessionUrl = await checkoutMutation.mutateAsync({
        items: [
          {
            productName: property.title,
            productDescription: `Monthly rental: ${property.address.city}`,
            currency: "inr",
            quantity: BigInt(months),
            priceInCents: property.pricePerMonth * 100n,
          },
        ],
        successUrl: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&bookingId=${bookingId.toString()}`,
        cancelUrl: `${baseUrl}/payment/cancel`,
      });

      window.location.href = sessionUrl;
    } catch (err) {
      toast.error("Booking failed. Please try again.");
      console.error(err);
    }
  };

  if (propLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isPending = bookMutation.isPending || checkoutMutation.isPending;

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

      <h1 className="font-display font-bold text-2xl mb-1">
        Complete Your Booking
      </h1>
      {property && (
        <p className="text-muted-foreground mb-6">
          {property.title} • ₹{Number(property.pricePerMonth).toLocaleString()}
          /mo
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
        data-ocid="booking.form"
      >
        {/* Date Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Check-in Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  data-ocid="booking.checkin.button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Check-out Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  data-ocid="booking.checkout.button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) => date <= (startDate ?? new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
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
        </div>

        {/* Price Summary */}
        {startDate && endDate && property && (
          <div className="bg-accent/40 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                ₹{Number(property.pricePerMonth).toLocaleString()} × {months}{" "}
                month{months > 1 ? "s" : ""}
              </span>
              <span className="font-medium">
                ₹{totalPrice.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary">
                ₹{totalPrice.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={
            isPending || !startDate || !endDate || !name || !email || !phone
          }
          data-ocid="booking.submit.button"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...
            </>
          ) : (
            "Proceed to Payment"
          )}
        </Button>
      </form>
    </div>
  );
}

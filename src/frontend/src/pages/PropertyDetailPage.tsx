import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useParams, useRouter } from "@tanstack/react-router";
import {
  BedDouble,
  Building2,
  CalendarDays,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Heart,
  Loader2,
  MapPin,
  MessageSquare,
  Phone,
  Star,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Variant_admin_owner_student,
  Variant_apartment_sharedRoom_single,
  Variant_boys_unisex_girls,
} from "../backend";
import { useAuth } from "../hooks/useAuth";
import {
  useAddReview,
  useCallerProfile,
  useProperty,
  usePropertyReviews,
} from "../hooks/useQueries";
import { useWishlist } from "../hooks/useWishlist";

const roomTypeLabels: Record<Variant_apartment_sharedRoom_single, string> = {
  [Variant_apartment_sharedRoom_single.apartment]: "PG / Flat",
  [Variant_apartment_sharedRoom_single.sharedRoom]: "Shared Room",
  [Variant_apartment_sharedRoom_single.single]: "Private Room",
};

const genderLabels: Record<Variant_boys_unisex_girls, string> = {
  [Variant_boys_unisex_girls.boys]: "Boys Only",
  [Variant_boys_unisex_girls.girls]: "Girls Only",
  [Variant_boys_unisex_girls.unisex]: "Unisex",
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-label="WhatsApp"
      role="img"
    >
      <title>WhatsApp</title>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <fieldset className="flex gap-1 border-none p-0 m-0">
      <legend className="sr-only">Star rating</legend>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className="p-0.5 rounded transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <Star
            className={`w-6 h-6 transition-colors ${
              n <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </fieldset>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-4 h-4 ${
            n <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

function ReviewsSection({ propertyId }: { propertyId: bigint }) {
  const { session, currentRole } = useAuth();
  const { data: profile } = useCallerProfile();
  const { data: reviews, isLoading: reviewsLoading } =
    usePropertyReviews(propertyId);
  const addReview = useAddReview();

  const isStudent =
    currentRole === "student" ||
    profile?.role === Variant_admin_owner_student.student;
  const isLoggedIn = !!session;

  // Use session phone as the user identifier (no Principal in session)
  const myReview = reviews?.find(
    (r) => r.student.toString().slice(-8) === session?.phone?.slice(-8),
  );

  const [rating, setRating] = useState(myReview ? Number(myReview.rating) : 0);
  const [comment, setComment] = useState(myReview?.comment ?? "");

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please write a comment");
      return;
    }
    try {
      await addReview.mutateAsync({
        propertyId,
        rating: BigInt(rating),
        comment: comment.trim(),
      });
      toast.success(myReview ? "Review updated!" : "Review posted!");
    } catch {
      toast.error("Failed to submit review. Please try again.");
    }
  };

  const reviewCount = reviews?.length ?? 0;

  return (
    <div className="mb-8" data-ocid="reviews.section">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        Reviews
        {reviewCount > 0 && (
          <span className="text-sm font-normal text-muted-foreground">
            ({reviewCount})
          </span>
        )}
      </h3>

      {/* Review form for logged-in students */}
      {isLoggedIn && isStudent && (
        <div
          className="bg-card border border-border rounded-xl p-5 mb-6"
          data-ocid="reviews.form.panel"
        >
          <p className="text-sm font-medium mb-3">
            {myReview ? "Update your review" : "Write a review"}
          </p>
          <StarPicker value={rating} onChange={(v) => setRating(v)} />
          <Textarea
            className="mt-3 resize-none"
            rows={3}
            placeholder="Share your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            data-ocid="reviews.textarea"
          />
          <Button
            className="mt-3"
            onClick={handleSubmit}
            disabled={addReview.isPending}
            data-ocid="reviews.submit.button"
          >
            {addReview.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : myReview ? (
              "Update Review"
            ) : (
              "Post Review"
            )}
          </Button>
        </div>
      )}

      {/* Login prompt for non-students */}
      {!isLoggedIn && (
        <div className="text-sm text-muted-foreground bg-muted/40 rounded-xl px-4 py-3 mb-5">
          <a
            href="/auth/role"
            className="text-primary underline underline-offset-2 font-medium"
          >
            Login
          </a>{" "}
          to leave a review.
        </div>
      )}

      {/* Reviews list */}
      {reviewsLoading ? (
        <div className="space-y-3" data-ocid="reviews.loading_state">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-9 h-9 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : reviews && reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review, idx) => {
            const principalStr = review.student.toString();
            const initials = principalStr.slice(0, 2).toUpperCase();
            const dateStr = new Date(
              Number(review.timestamp / 1_000_000n),
            ).toLocaleDateString("en-IN", {
              month: "short",
              year: "numeric",
            });
            return (
              <div
                key={principalStr}
                className="flex gap-3 py-4 border-b border-border last:border-0"
                data-ocid={`reviews.item.${idx + 1}`}
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StarDisplay rating={Number(review.rating)} />
                    <span className="text-xs text-muted-foreground">
                      {dateStr}
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {review.comment}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                    {principalStr.slice(0, 12)}...
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="text-center py-8 text-muted-foreground text-sm"
          data-ocid="reviews.empty_state"
        >
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No reviews yet. Be the first to review!
        </div>
      )}
    </div>
  );
}

export default function PropertyDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const router = useRouter();
  const { isAuthenticated, currentRole, session } = useAuth();
  const { data: profile } = useCallerProfile();
  const { data: property, isLoading } = useProperty(BigInt(id ?? "0"));
  const [photoIndex, setPhotoIndex] = useState(0);

  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist(
    session?.phone,
  );

  const { data: reviews } = usePropertyReviews(
    property ? property.id : undefined,
  );

  const fallbackImages = [
    "/assets/generated/property-studio.dim_800x500.jpg",
    "/assets/generated/property-pg-shared.dim_800x500.jpg",
    "/assets/generated/property-apartment.dim_800x500.jpg",
  ];

  if (isLoading) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-10">
        <Skeleton className="h-80 w-full rounded-xl mb-6" />
        <Skeleton className="h-8 w-1/2 mb-3" />
        <Skeleton className="h-4 w-1/3 mb-6" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-20 text-center">
        <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="font-semibold">Property not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.navigate({ to: "/search" })}
        >
          Back to Search
        </Button>
      </div>
    );
  }

  const photos =
    property.photos.length > 0
      ? property.photos.map((p) => p.getDirectURL())
      : fallbackImages;

  const currentPhoto = photos[photoIndex] || fallbackImages[0];

  const isStudent =
    currentRole === "student" ||
    profile?.role === Variant_admin_owner_student.student;

  const handleBook = () => {
    if (!isAuthenticated) {
      router.navigate({ to: "/auth/role" });
      return;
    }
    router.navigate({ to: "/booking/$propertyId", params: { propertyId: id } });
  };

  const availableDate = new Date(
    Number(property.availableFrom / 1_000_000n),
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const mockRating = Number((property.id % 10n) + 40n) / 10;
  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length
      : mockRating;
  const reviewCount = reviews?.length ?? 0;

  const propertyIdStr = property.id.toString();
  const wishlisted = isInWishlist(propertyIdStr);

  const lat = property.coordinates?.lat;
  const lng = property.coordinates?.lang;
  const hasRealCoords =
    lat && lng && lat !== "0" && lng !== "0" && lat !== "" && lng !== "";

  const mapSrc = hasRealCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${Number(lng) - 0.01},${Number(lat) - 0.01},${Number(lng) + 0.01},${Number(lat) + 0.01}&layer=mapnik`
    : null;

  const whatsappPhone = property.contactPhone
    ? property.contactPhone.replace(/\D/g, "")
    : "";

  return (
    <div className="container max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.history.back()}
        className="mb-6 -ml-2"
        data-ocid="property.back.button"
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Photo Carousel */}
          <div className="relative rounded-xl overflow-hidden aspect-video bg-muted mb-6 shadow-card">
            <img
              src={currentPhoto}
              alt={`${property.title} - view`}
              className="w-full h-full object-cover"
              data-ocid="property.photo.canvas_target"
            />
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-card/80 rounded-full p-2 shadow hover:bg-card transition-colors"
                  onClick={() =>
                    setPhotoIndex(
                      (i) => (i - 1 + photos.length) % photos.length,
                    )
                  }
                  data-ocid="property.photo.prev"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-card/80 rounded-full p-2 shadow hover:bg-card transition-colors"
                  onClick={() => setPhotoIndex((i) => (i + 1) % photos.length)}
                  data-ocid="property.photo.next"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {photos.map((photoUrl, dotIdx) => (
                    <button
                      key={photoUrl}
                      type="button"
                      className={`w-2 h-2 rounded-full transition-colors ${
                        dotIdx === photoIndex ? "bg-white" : "bg-white/40"
                      }`}
                      onClick={() => setPhotoIndex(dotIdx)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Title & Meta */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="font-display font-bold text-2xl sm:text-3xl">
                {property.title}
              </h1>
              <div className="flex items-center gap-2 shrink-0 mt-1">
                <Badge variant="secondary">
                  {roomTypeLabels[property.roomType]}
                </Badge>
                {property.approved && (
                  <Badge className="bg-green-600 text-white hover:bg-green-700">
                    <CheckCircle className="w-3 h-3 mr-1" /> Verified
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>
                  {property.address.blocknumber &&
                    `${property.address.blocknumber}, `}
                  {property.address.street}, {property.address.city},{" "}
                  {property.address.state}, {property.address.country}
                </span>
              </div>
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-foreground">
                  {avgRating.toFixed(1)}
                </span>
                {reviewCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({reviewCount} reviews)
                  </span>
                )}
              </div>
              {property.genderPreference && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{genderLabels[property.genderPreference]}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="prose prose-sm max-w-none mb-6">
            <h3 className="font-semibold text-base mb-2">
              About this property
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {property.description}
            </p>
          </div>

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-base mb-3">Amenities</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {property.amenities.map((a) => (
                  <div
                    key={a}
                    className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg"
                  >
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {a}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Map */}
          <div className="mb-6">
            <h3 className="font-semibold text-base mb-3">Location</h3>
            {mapSrc ? (
              <div
                className="rounded-xl overflow-hidden border border-border shadow-xs"
                style={{ height: 280 }}
              >
                <iframe
                  src={mapSrc}
                  title="Property Location"
                  width="100%"
                  height="280"
                  className="border-0"
                  loading="lazy"
                />
              </div>
            ) : (
              <div
                className="rounded-xl border border-border bg-muted/50 flex flex-col items-center justify-center p-8 gap-2"
                style={{ minHeight: 160 }}
              >
                <MapPin className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  {property.address.street}, {property.address.city},{" "}
                  {property.address.state}, {property.address.country}
                </p>
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <ReviewsSection propertyId={property.id} />

          {/* Availability */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent/40 px-4 py-3 rounded-lg">
            <CalendarDays className="w-4 h-4 text-primary" />
            Available from:{" "}
            <strong className="text-foreground">{availableDate}</strong>
          </div>
        </div>

        {/* Booking Card */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-xl p-6 shadow-card sticky top-24">
            <div className="mb-4">
              <span className="text-3xl font-bold text-foreground">
                ₹{Number(property.pricePerMonth).toLocaleString()}
              </span>
              <span className="text-muted-foreground text-sm">/month</span>
            </div>

            <div className="space-y-3 mb-6 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <BedDouble className="w-4 h-4 text-primary" />
                <span>{roomTypeLabels[property.roomType]}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>
                  {property.address.city}, {property.address.state}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="w-4 h-4 text-primary" />
                <span>Available: {availableDate}</span>
              </div>
              {property.genderPreference && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4 text-primary" />
                  <span>{genderLabels[property.genderPreference]}</span>
                </div>
              )}
            </div>

            {(!isAuthenticated || isStudent) && (
              <Button
                className="w-full mb-3"
                size="lg"
                onClick={handleBook}
                data-ocid="property.book.button"
              >
                {!isAuthenticated ? "Book Visit" : "Book Now"}
              </Button>
            )}
            {isAuthenticated && !isStudent && (
              <p className="text-sm text-muted-foreground text-center mb-3">
                Only students can book properties.
              </p>
            )}

            {/* Wishlist Button */}
            {session && (
              <Button
                variant="outline"
                className={`w-full gap-2 mb-3 ${
                  wishlisted
                    ? "border-red-500 text-red-500 hover:bg-red-50"
                    : ""
                }`}
                onClick={() =>
                  wishlisted
                    ? removeFromWishlist(propertyIdStr)
                    : addToWishlist(propertyIdStr)
                }
                data-ocid="property.wishlist.toggle"
              >
                <Heart
                  className={`w-4 h-4 ${
                    wishlisted ? "fill-red-500 text-red-500" : ""
                  }`}
                />
                {wishlisted ? "Saved to Wishlist" : "Save to Wishlist"}
              </Button>
            )}

            {/* Contact Owner */}
            {property.contactPhone && (
              <div className="space-y-2 pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Contact Owner
                </p>
                <a
                  href={`tel:${property.contactPhone}`}
                  className="flex-1"
                  data-ocid="property.call.button"
                >
                  <Button className="w-full gap-2" variant="default" size="sm">
                    <Phone className="w-4 h-4" /> Call Owner
                  </Button>
                </a>
                {whatsappPhone && (
                  <a
                    href={`https://wa.me/${whatsappPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-ocid="property.whatsapp.button"
                  >
                    <Button
                      className="w-full gap-2"
                      variant="outline"
                      size="sm"
                    >
                      <WhatsAppIcon className="w-4 h-4 text-green-600" />
                      WhatsApp
                    </Button>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

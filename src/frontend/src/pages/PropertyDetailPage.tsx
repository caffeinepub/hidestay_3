import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams, useRouter } from "@tanstack/react-router";
import {
  BedDouble,
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { useState } from "react";
import {
  Variant_admin_owner_student,
  Variant_apartment_sharedRoom_single,
} from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCallerProfile, useProperty } from "../hooks/useQueries";

const roomTypeLabels: Record<Variant_apartment_sharedRoom_single, string> = {
  [Variant_apartment_sharedRoom_single.apartment]: "Apartment",
  [Variant_apartment_sharedRoom_single.sharedRoom]: "Shared Room",
  [Variant_apartment_sharedRoom_single.single]: "Single Room",
};

export default function PropertyDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const router = useRouter();
  const { identity, login } = useInternetIdentity();
  const { data: profile } = useCallerProfile();
  const { data: property, isLoading } = useProperty(BigInt(id ?? "0"));
  const [photoIndex, setPhotoIndex] = useState(0);

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

  const isStudent = profile?.role === Variant_admin_owner_student.student;

  const handleBook = () => {
    if (!identity) {
      login();
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
              <Badge variant="secondary" className="shrink-0 mt-1">
                {roomTypeLabels[property.roomType]}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>
                {property.address.blocknumber &&
                  `${property.address.blocknumber}, `}
                {property.address.street}, {property.address.city},{" "}
                {property.address.state}, {property.address.country}
              </span>
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
            </div>

            {(!identity || isStudent) && (
              <Button
                className="w-full"
                size="lg"
                onClick={handleBook}
                data-ocid="property.book.button"
              >
                {!identity ? "Sign In to Book" : "Book Now"}
              </Button>
            )}
            {identity && !isStudent && (
              <p className="text-sm text-muted-foreground text-center">
                Only students can book properties.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

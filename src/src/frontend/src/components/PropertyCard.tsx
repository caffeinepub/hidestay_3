import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { CheckCircle, MapPin, ShieldCheck, Star } from "lucide-react";
import type { Property } from "../backend";
import { Variant_apartment_sharedRoom_single } from "../backend";
import { usePropertyReviews } from "../hooks/useQueries";

interface PropertyCardProps {
  property: Property;
  featured?: boolean;
  index?: number;
}

const roomTypeLabels: Record<Variant_apartment_sharedRoom_single, string> = {
  [Variant_apartment_sharedRoom_single.apartment]: "PG / Flat",
  [Variant_apartment_sharedRoom_single.sharedRoom]: "Shared Room",
  [Variant_apartment_sharedRoom_single.single]: "Private Room",
};

export default function PropertyCard({
  property,
  featured,
  index,
}: PropertyCardProps) {
  const photoUrl = property.photos?.[0]?.getDirectURL();
  const fallbackImages = [
    "/assets/generated/property-studio.dim_800x500.jpg",
    "/assets/generated/property-pg-shared.dim_800x500.jpg",
    "/assets/generated/property-apartment.dim_800x500.jpg",
  ];
  const imageUrl = photoUrl || fallbackImages[(index ?? 0) % 3];

  const { data: reviews } = usePropertyReviews(property.id);

  const mockRating = Number((property.id % 10n) + 40n) / 10;
  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length
      : mockRating;
  const reviewCount = reviews?.length ?? 0;

  return (
    <Link
      to="/property/$id"
      params={{ id: property.id.toString() }}
      className="block group"
      data-ocid={`properties.item.${(index ?? 0) + 1}`}
    >
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs hover:shadow-card transition-all duration-200 h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {featured && (
            <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground font-semibold">
              <Star className="w-3 h-3 mr-1" /> Featured
            </Badge>
          )}
          <Badge variant="secondary" className="absolute top-3 right-3 text-xs">
            {roomTypeLabels[property.roomType]}
          </Badge>
          {property.approved && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-green-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3" /> Verified
            </div>
          )}
          {/* Verified badge (admin-verified) */}
          {property.verified && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3" /> Verified
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-base line-clamp-1 mb-1 group-hover:text-primary transition-colors">
            {property.title}
          </h3>
          <div className="flex items-center gap-1 text-muted-foreground text-xs mb-2">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {property.address.city}, {property.address.state}
            </span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 text-xs text-amber-500 mb-2">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="font-medium text-foreground">
              {avgRating.toFixed(1)}
            </span>
            {reviewCount > 0 && (
              <span className="text-muted-foreground">({reviewCount})</span>
            )}
          </div>

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {property.amenities.slice(0, 3).map((a) => (
                <span
                  key={a}
                  className="text-xs px-2 py-0.5 bg-accent text-accent-foreground rounded-full"
                >
                  {a}
                </span>
              ))}
              {property.amenities.length > 3 && (
                <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                  +{property.amenities.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-foreground">
                ₹{Number(property.pricePerMonth).toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">/month</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

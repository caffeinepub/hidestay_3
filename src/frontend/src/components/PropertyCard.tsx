import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { BedDouble, MapPin, Star } from "lucide-react";
import type { Property } from "../backend";
import { Variant_apartment_sharedRoom_single } from "../backend";

interface PropertyCardProps {
  property: Property;
  featured?: boolean;
  index?: number;
}

const roomTypeLabels: Record<Variant_apartment_sharedRoom_single, string> = {
  [Variant_apartment_sharedRoom_single.apartment]: "Apartment",
  [Variant_apartment_sharedRoom_single.sharedRoom]: "Shared Room",
  [Variant_apartment_sharedRoom_single.single]: "Single Room",
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
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-base line-clamp-1 mb-1 group-hover:text-primary transition-colors">
            {property.title}
          </h3>
          <div className="flex items-center gap-1 text-muted-foreground text-xs mb-3">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {property.address.city}, {property.address.state}
            </span>
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
            <div className="flex items-center gap-1 text-muted-foreground">
              <BedDouble className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

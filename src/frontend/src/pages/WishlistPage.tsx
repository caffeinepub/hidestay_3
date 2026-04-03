import { Button } from "@/components/ui/button";
import { useRouter } from "@tanstack/react-router";
import { Heart, LogIn, Search } from "lucide-react";
import { useMemo } from "react";
import PropertyCard from "../components/PropertyCard";
import { useAuth } from "../hooks/useAuth";
import { useApprovedProperties } from "../hooks/useQueries";
import { useWishlist } from "../hooks/useWishlist";

export default function WishlistPage() {
  const router = useRouter();
  const { session } = useAuth();
  const { wishlist } = useWishlist(session?.phone);
  const { data: allProperties, isLoading } = useApprovedProperties();

  const savedProperties = useMemo(() => {
    if (!allProperties || wishlist.length === 0) return [];
    return allProperties.filter((p) => wishlist.includes(p.id.toString()));
  }, [allProperties, wishlist]);

  if (!session) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-20 text-center">
        <Heart className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
        <h1 className="font-display font-bold text-2xl mb-2">
          Sign in to view your Wishlist
        </h1>
        <p className="text-muted-foreground mb-6">
          Save your favourite properties and access them anytime.
        </p>
        <Button
          onClick={() => router.navigate({ to: "/auth/role" })}
          data-ocid="wishlist.login.button"
        >
          <LogIn className="w-4 h-4 mr-2" /> Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-foreground mb-1 flex items-center gap-3">
          <Heart className="w-7 h-7 text-red-500 fill-red-500" /> My Wishlist
        </h1>
        <p className="text-muted-foreground">
          {savedProperties.length} saved propert
          {savedProperties.length === 1 ? "y" : "ies"}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl h-72 animate-pulse"
              data-ocid="wishlist.loading_state"
            />
          ))}
        </div>
      ) : savedProperties.length === 0 ? (
        <div
          className="text-center py-20 bg-card border border-border rounded-xl"
          data-ocid="wishlist.empty_state"
        >
          <Heart className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-semibold text-lg mb-2">No saved properties</h2>
          <p className="text-muted-foreground mb-6">
            Browse properties and tap the heart button to save them here.
          </p>
          <Button
            onClick={() => router.navigate({ to: "/search" })}
            data-ocid="wishlist.browse.button"
          >
            <Search className="w-4 h-4 mr-2" /> Browse Properties
          </Button>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          data-ocid="wishlist.list"
        >
          {savedProperties.map((p, i) => (
            <PropertyCard key={p.id.toString()} property={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

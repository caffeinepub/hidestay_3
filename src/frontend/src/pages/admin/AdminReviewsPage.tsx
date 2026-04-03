import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Principal } from "@icp-sdk/core/principal";
import { useRouter } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageSquare,
  Star,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Property } from "../../backend";
import RouteGuard from "../../components/RouteGuard";
import {
  useAllProperties,
  useDeleteReview,
  usePropertyReviews,
} from "../../hooks/useQueries";

export default function AdminReviewsPage() {
  return (
    <RouteGuard requiredRole="admin">
      <AdminReviewsInner />
    </RouteGuard>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${
            n <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

function PropertyReviewsRow({ property }: { property: Property }) {
  const [expanded, setExpanded] = useState(false);
  const { data: reviews, isLoading } = usePropertyReviews(property.id);
  const deleteReview = useDeleteReview();

  const count = reviews?.length ?? 0;

  const handleDelete = async (reviewer: Principal) => {
    try {
      await deleteReview.mutateAsync({
        propertyId: property.id,
        reviewer,
      });
      toast.success("Review deleted");
    } catch {
      toast.error("Failed to delete review");
    }
  };

  return (
    <Card className="border-border shadow-xs" data-ocid="admin.reviews.card">
      <CardHeader
        className="pb-3 cursor-pointer select-none"
        onClick={() => count > 0 && setExpanded((v) => !v)}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <MessageSquare className="w-4 h-4 text-primary shrink-0" />
            <CardTitle className="text-sm font-medium truncate">
              {property.title}
            </CardTitle>
            <Badge variant="secondary" className="text-xs shrink-0">
              {property.address.city}
            </Badge>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm text-muted-foreground">
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                `${count} review${count !== 1 ? "s" : ""}`
              )}
            </span>
            {count > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded((v) => !v);
                }}
                data-ocid="admin.reviews.toggle"
              >
                {expanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {expanded && reviews && reviews.length > 0 && (
        <CardContent className="pt-0">
          <div className="divide-y divide-border">
            {reviews.map((review, idx) => {
              const principalStr = review.student.toString();
              const dateStr = new Date(
                Number(review.timestamp / 1_000_000n),
              ).toLocaleDateString("en-IN", {
                month: "short",
                year: "numeric",
              });
              return (
                <div
                  key={principalStr}
                  className="py-3 flex items-start gap-3"
                  data-ocid={`admin.reviews.item.${idx + 1}`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {principalStr.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <StarDisplay rating={Number(review.rating)} />
                      <span className="text-xs text-muted-foreground">
                        {dateStr}
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed mb-1">
                      {review.comment}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {principalStr.slice(0, 20)}...
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => handleDelete(review.student)}
                    disabled={deleteReview.isPending}
                    data-ocid={`admin.reviews.delete_button.${idx + 1}`}
                  >
                    {deleteReview.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function AdminReviewsInner() {
  const router = useRouter();
  const { data: properties, isLoading } = useAllProperties();

  return (
    <div className="container max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8 flex items-center gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl mb-1">Reviews</h1>
          <p className="text-muted-foreground">
            Moderate student reviews across all properties
          </p>
        </div>
        <div className="ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.navigate({ to: "/admin/dashboard" })}
            data-ocid="admin.reviews.back.button"
          >
            ← Dashboard
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3" data-ocid="admin.reviews.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : !properties || properties.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="admin.reviews.empty_state"
        >
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No properties found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {properties.map((property) => (
            <PropertyReviewsRow
              key={property.id.toString()}
              property={property}
            />
          ))}
        </div>
      )}
    </div>
  );
}

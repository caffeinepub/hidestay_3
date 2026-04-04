import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Loader2, Plus, Tag, ToggleLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import RouteGuard from "../../components/RouteGuard";
import {
  useCreateCoupon,
  useDeactivateCoupon,
  useGetCoupons,
} from "../../hooks/useQueries";

export default function AdminCouponsPage() {
  return (
    <RouteGuard requiredRole="admin">
      <AdminCouponsInner />
    </RouteGuard>
  );
}

function AdminCouponsInner() {
  const { data: coupons, isLoading } = useGetCoupons();
  const createMutation = useCreateCoupon();
  const deactivateMutation = useDeactivateCoupon();

  const [newCode, setNewCode] = useState("");
  const [maxUses, setMaxUses] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    const uses = Number(maxUses);
    if (maxUses && (Number.isNaN(uses) || uses < 0)) {
      toast.error("Max uses must be a non-negative number");
      return;
    }
    try {
      await createMutation.mutateAsync({
        code: newCode.trim().toUpperCase(),
        maxUses: BigInt(uses || 0),
      });
      toast.success(`Coupon "${newCode.trim().toUpperCase()}" created!`);
      setNewCode("");
      setMaxUses("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("already exists")) {
        toast.error("A coupon with this code already exists.");
      } else {
        toast.error("Failed to create coupon. Please try again.");
      }
    }
  };

  const handleDeactivate = async (code: string) => {
    try {
      await deactivateMutation.mutateAsync(code);
      toast.success(`Coupon "${code}" deactivated`);
    } catch {
      toast.error("Failed to deactivate coupon.");
    }
  };

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl mb-1 flex items-center gap-2">
          <Tag className="w-6 h-6 text-primary" />
          Coupon Management
        </h1>
        <p className="text-muted-foreground">
          Create and manage promo codes for student bookings
        </p>
      </div>

      {/* Create Coupon Form */}
      <Card className="mb-6 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create New Coupon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleCreate}
            className="flex flex-col sm:flex-row gap-3 items-end"
          >
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="coupon-code">Coupon Code</Label>
              <Input
                id="coupon-code"
                placeholder="e.g. WELCOME10"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                className="font-mono uppercase"
                required
                data-ocid="coupons.code.input"
              />
            </div>
            <div className="w-full sm:w-40 space-y-1.5">
              <Label htmlFor="max-uses">
                Max Uses{" "}
                <span className="text-muted-foreground">(0 = unlimited)</span>
              </Label>
              <Input
                id="max-uses"
                type="number"
                min={0}
                placeholder="0"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                data-ocid="coupons.maxuses.input"
              />
            </div>
            <Button
              type="submit"
              disabled={createMutation.isPending || !newCode.trim()}
              className="w-full sm:w-auto"
              data-ocid="coupons.create.button"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" /> Create Coupon
                </>
              )}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            All coupons offer a 10% discount on paid bookings.
          </p>
        </CardContent>
      </Card>

      {/* Coupons Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Coupons</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !coupons || coupons.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-ocid="coupons.empty_state"
            >
              <Tag className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No coupons yet. Create your first one above!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uses</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => (
                    <TableRow key={coupon.code}>
                      <TableCell className="font-mono font-bold">
                        {coupon.code}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-50 text-green-700 border-green-200">
                          {Number(coupon.discountPercent)}% Off
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            coupon.isActive
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {coupon.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {Number(coupon.useCount)}
                        {coupon.maxUses > 0n
                          ? ` / ${Number(coupon.maxUses)}`
                          : " / ∞"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(
                          Number(coupon.createdAt / 1_000_000n),
                          "MMM d, yyyy",
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {coupon.isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() => handleDeactivate(coupon.code)}
                            disabled={deactivateMutation.isPending}
                            data-ocid={`coupons.deactivate.${coupon.code}`}
                          >
                            <ToggleLeft className="w-3.5 h-3.5 mr-1" />
                            Deactivate
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

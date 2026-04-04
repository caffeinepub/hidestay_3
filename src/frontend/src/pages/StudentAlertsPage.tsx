import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bell,
  BellRing,
  Home,
  MapPin,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";

export interface PropertyAlert {
  id: string;
  location: string;
  propertyType: string;
  maxPrice: number;
  createdAt: number;
}

export function getAlerts(phone: string): PropertyAlert[] {
  try {
    const raw = localStorage.getItem(`hidestay_alerts_${phone}`);
    return raw ? (JSON.parse(raw) as PropertyAlert[]) : [];
  } catch {
    return [];
  }
}

function saveAlerts(phone: string, alerts: PropertyAlert[]) {
  localStorage.setItem(`hidestay_alerts_${phone}`, JSON.stringify(alerts));
}

const propertyTypeLabels: Record<string, string> = {
  all: "All Types",
  apartment: "PG / Flat",
  sharedRoom: "Shared Room",
  single: "Private Room",
};

export default function StudentAlertsPage() {
  const { session } = useAuth();
  const router = useRouter();
  const phone = session?.phone ?? "";

  const [alerts, setAlerts] = useState<PropertyAlert[]>(() => getAlerts(phone));

  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");

  function handleSave() {
    if (!location.trim()) {
      toast.error("Please enter a location");
      return;
    }
    const price = Number(maxPrice);
    if (!maxPrice || Number.isNaN(price) || price <= 0) {
      toast.error("Please enter a valid max price");
      return;
    }

    const newAlert: PropertyAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      location: location.trim(),
      propertyType,
      maxPrice: price,
      createdAt: Date.now(),
    };

    const updated = [newAlert, ...alerts];
    setAlerts(updated);
    saveAlerts(phone, updated);

    setLocation("");
    setPropertyType("all");
    setMaxPrice("");
    toast.success(
      "Alert saved! You'll be notified when matching properties are listed.",
    );
  }

  function handleDelete(id: string) {
    const updated = alerts.filter((a) => a.id !== id);
    setAlerts(updated);
    saveAlerts(phone, updated);
    toast.success("Alert removed");
  }

  if (!session) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-20 text-center">
        <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="font-semibold text-lg mb-2">Login required</p>
        <p className="text-muted-foreground text-sm mb-4">
          Please sign in to manage property alerts.
        </p>
        <Button onClick={() => router.navigate({ to: "/auth/role" })}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.history.back()}
          data-ocid="student_alerts.back.button"
          className="-ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div>
          <h1 className="font-display font-bold text-3xl flex items-center gap-2">
            <BellRing className="w-7 h-7 text-primary" />
            Property Alerts
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Get notified when new properties match your criteria
          </p>
        </div>
      </div>

      {/* Create Alert Form */}
      <Card className="mb-8 border-border shadow-xs">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-primary" />
            Create New Alert
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="alert-location">Location / City</Label>
              <Input
                id="alert-location"
                placeholder="e.g. Pune, Koramangala..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                data-ocid="student_alerts.location.input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alert-type">Property Type</Label>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger
                  id="alert-type"
                  data-ocid="student_alerts.property_type.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="apartment">PG / Flat</SelectItem>
                  <SelectItem value="sharedRoom">Shared Room</SelectItem>
                  <SelectItem value="single">Private Room</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alert-price">Max Price (₹/month)</Label>
            <Input
              id="alert-price"
              type="number"
              placeholder="e.g. 15000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              min={0}
              data-ocid="student_alerts.max_price.input"
            />
          </div>

          <Button
            onClick={handleSave}
            className="w-full sm:w-auto"
            data-ocid="student_alerts.save.button"
          >
            <Bell className="w-4 h-4 mr-2" />
            Save Alert
          </Button>
        </CardContent>
      </Card>

      {/* Saved Alerts List */}
      <div>
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          Your Alerts
          {alerts.length > 0 && (
            <Badge variant="secondary">{alerts.length}</Badge>
          )}
        </h2>

        {alerts.length === 0 ? (
          <div
            className="bg-card border border-border rounded-xl p-10 text-center"
            data-ocid="student_alerts.empty_state"
          >
            <Home className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No alerts yet. Create one above to get notified about new
              properties!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert, idx) => (
              <div
                key={alert.id}
                className="bg-card border border-border rounded-xl px-5 py-4 flex items-center justify-between gap-4"
                data-ocid={`student_alerts.item.${idx + 1}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{alert.location}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {propertyTypeLabels[alert.propertyType] ??
                          alert.propertyType}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Max ₹{alert.maxPrice.toLocaleString("en-IN")}/mo
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created{" "}
                      {new Date(alert.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => handleDelete(alert.id)}
                  data-ocid={`student_alerts.delete.button.${idx + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

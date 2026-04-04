import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useSearch } from "@tanstack/react-router";
import { Building2, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { GenderType, PropertyType } from "../backend";
import PropertyCard from "../components/PropertyCard";
import { useAuth } from "../hooks/useAuth";
import { useApprovedProperties } from "../hooks/useQueries";
import { getAlerts } from "./StudentAlertsPage";
import { pushStudentNotif } from "./StudentNotificationsPage";

const FACILITY_OPTIONS = ["WiFi", "Food", "AC", "Parking"];

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export default function SearchPage() {
  const searchParams = useSearch({ strict: false }) as Record<string, string>;
  const [cityFilter, setCityFilter] = useState(searchParams.city ?? "");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(50000);
  const [showFilters, setShowFilters] = useState(false);

  const { session } = useAuth();
  const { data: properties, isLoading } = useApprovedProperties();
  const alertCheckedRef = useRef(false);

  // Alert matching — run once when properties load
  useEffect(() => {
    if (!session?.phone || !properties || alertCheckedRef.current) return;
    alertCheckedRef.current = true;

    const phone = session.phone;
    const alerts = getAlerts(phone);
    if (alerts.length === 0) return;

    const now = Date.now();
    const sentKey = `hidestay_alert_sent_${phone}`;
    let sentIds: Set<string>;
    try {
      const raw = localStorage.getItem(sentKey);
      sentIds = new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      sentIds = new Set();
    }

    for (const prop of properties) {
      const propMs = Number(prop.availableFrom / 1_000_000n);
      const isNew = now - propMs <= TWENTY_FOUR_HOURS;
      if (!isNew) continue;

      const propIdStr = prop.id.toString();
      if (sentIds.has(propIdStr)) continue;

      for (const alert of alerts) {
        const matchCity = alert.location
          ? prop.address.city
              .toLowerCase()
              .includes(alert.location.toLowerCase()) ||
            prop.address.state
              .toLowerCase()
              .includes(alert.location.toLowerCase())
          : true;
        const matchType =
          alert.propertyType === "all" || prop.roomType === alert.propertyType;
        const matchPrice = Number(prop.pricePerMonth) <= alert.maxPrice;

        if (matchCity && matchType && matchPrice) {
          pushStudentNotif(phone, {
            type: "property_alert",
            message: `New property in ${prop.address.city} matches your alert! \"${prop.title}\" - ₹${Number(prop.pricePerMonth).toLocaleString("en-IN")}/month`,
          });
          sentIds.add(propIdStr);
          break; // one notification per property
        }
      }
    }

    // Persist sent IDs
    try {
      localStorage.setItem(sentKey, JSON.stringify([...sentIds]));
    } catch {
      // ignore
    }
  }, [properties, session?.phone]);

  function toggleFacility(facility: string) {
    setSelectedFacilities((prev) =>
      prev.includes(facility)
        ? prev.filter((f) => f !== facility)
        : [...prev, facility],
    );
  }

  const filtered = useMemo(() => {
    const all = properties ?? [];
    return all.filter((p) => {
      const matchCity = cityFilter
        ? p.address.city.toLowerCase().includes(cityFilter.toLowerCase()) ||
          p.address.state.toLowerCase().includes(cityFilter.toLowerCase()) ||
          p.description.toLowerCase().includes(cityFilter.toLowerCase())
        : true;
      const matchRoom =
        roomTypeFilter === "all" ? true : p.roomType === roomTypeFilter;
      const matchPrice = Number(p.pricePerMonth) <= maxPrice;
      const matchGender =
        genderFilter === "all" ? true : p.genderPreference === genderFilter;
      const matchFacilities =
        selectedFacilities.length === 0
          ? true
          : selectedFacilities.every((fac) =>
              p.amenities.some((a) =>
                a.toLowerCase().includes(fac.toLowerCase()),
              ),
            );
      return (
        matchCity && matchRoom && matchPrice && matchGender && matchFacilities
      );
    });
  }, [
    properties,
    cityFilter,
    roomTypeFilter,
    maxPrice,
    genderFilter,
    selectedFacilities,
  ]);

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-foreground mb-2">
          Find Your Stay
        </h1>
        <p className="text-muted-foreground">
          {filtered.length} propert{filtered.length === 1 ? "y" : "ies"} found
        </p>
      </div>

      {/* Search Bar + Filter Toggle */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by location or college"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="pl-9 h-11"
            data-ocid="search.city.input"
          />
        </div>
        <Button
          variant="outline"
          className="h-11 gap-2"
          onClick={() => setShowFilters((v) => !v)}
          data-ocid="search.filters.toggle"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-card border border-border rounded-xl p-5 mb-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Room Type */}
            <div className="space-y-2">
              <Label>Room Type</Label>
              <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
                <SelectTrigger data-ocid="search.roomtype.select">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={PropertyType.apartment}>
                    PG / Flat
                  </SelectItem>
                  <SelectItem value={PropertyType.sharedRoom}>
                    Shared Room
                  </SelectItem>
                  <SelectItem value={PropertyType.single}>
                    Private Room
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Gender Preference */}
            <div className="space-y-2">
              <Label>Gender Preference</Label>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger data-ocid="search.gender.select">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value={GenderType.boys}>Boys</SelectItem>
                  <SelectItem value={GenderType.girls}>Girls</SelectItem>
                  <SelectItem value={GenderType.unisex}>Unisex</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Max Price */}
            <div className="space-y-2">
              <Label>Max Price: ₹{maxPrice.toLocaleString()}/month</Label>
              <Slider
                min={1000}
                max={100000}
                step={1000}
                value={[maxPrice]}
                onValueChange={([v]) => setMaxPrice(v)}
                className="mt-2"
                data-ocid="search.price.slider"
              />
            </div>
          </div>

          {/* Facilities */}
          <div className="space-y-2">
            <Label>Facilities</Label>
            <div className="flex flex-wrap gap-4">
              {FACILITY_OPTIONS.map((fac) => (
                <div key={fac} className="flex items-center gap-2">
                  <Checkbox
                    id={`fac-${fac}`}
                    checked={selectedFacilities.includes(fac)}
                    onCheckedChange={() => toggleFacility(fac)}
                    data-ocid="search.facility.checkbox"
                  />
                  <Label
                    htmlFor={`fac-${fac}`}
                    className="cursor-pointer font-normal"
                  >
                    {fac}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl h-72 animate-pulse"
              data-ocid="search.loading_state"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="text-center py-20 bg-card border border-border rounded-xl"
          data-ocid="search.empty_state"
        >
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-foreground mb-1">
            No properties found
          </p>
          <p className="text-muted-foreground text-sm">
            Try adjusting your filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p, i) => (
            <PropertyCard key={p.id.toString()} property={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

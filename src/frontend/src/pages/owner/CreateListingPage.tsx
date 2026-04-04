import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@tanstack/react-router";
import { ChevronLeft, Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob, GenderType, PropertyType } from "../../backend";
import type { Property } from "../../backend";
import RouteGuard from "../../components/RouteGuard";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useListProperty } from "../../hooks/useQueries";

export default function CreateListingPage() {
  return (
    <RouteGuard requiredRole="owner">
      <CreateListingInner />
    </RouteGuard>
  );
}

function CreateListingInner() {
  const router = useRouter();
  const { identity } = useInternetIdentity();
  const listProperty = useListProperty();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pricePerMonth, setPricePerMonth] = useState("");
  const [roomType, setRoomType] = useState<PropertyType>(PropertyType.single);
  const [genderPreference, setGenderPreference] = useState<GenderType>(
    GenderType.unisex,
  );
  const [contactPhone, setContactPhone] = useState("");
  const [amenityInput, setAmenityInput] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [availableFrom, setAvailableFrom] = useState("");
  // Address
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [blocknumber, setBlocknumber] = useState("");
  const [bluenumber, setBluenumber] = useState("");
  // Photos
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);

  const handleAddAmenity = () => {
    const val = amenityInput.trim();
    if (val && !amenities.includes(val)) {
      setAmenities((prev) => [...prev, val]);
      setAmenityInput("");
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setPhotoFiles((prev) => [...prev, ...files]);
    for (const file of files) {
      const url = URL.createObjectURL(file);
      setPhotoPreviewUrls((prev) => [...prev, url]);
    }
  };

  const removePhoto = (i: number) => {
    setPhotoFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPhotoPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[i]);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity) return;

    try {
      const photos: ExternalBlob[] = [];
      for (const file of photoFiles) {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const blob = ExternalBlob.fromBytes(bytes);
        photos.push(blob);
      }

      const property: Property = {
        id: BigInt(0),
        title,
        owner: identity.getPrincipal(),
        description,
        amenities,
        availableFrom: availableFrom
          ? BigInt(new Date(availableFrom).getTime()) * 1_000_000n
          : BigInt(Date.now()) * 1_000_000n,
        approved: false,
        verified: false,
        viewCount: BigInt(0),
        genderPreference: genderPreference as GenderType,
        contactPhone,
        address: {
          street,
          city,
          state,
          country,
          blocknumber,
          bluenumber,
        },
        pricePerMonth: BigInt(Math.round(Number(pricePerMonth))),
        roomType,
        photos,
        coordinates: { lat: "0", lang: "0" },
      };

      await listProperty.mutateAsync(property);
      toast.success("Property listed! Pending admin approval.");
      router.navigate({ to: "/owner/listings" });
    } catch (err) {
      toast.error("Failed to list property. Please try again.");
      console.error(err);
    }
  };

  return (
    <div className="container max-w-3xl mx-auto px-4 py-10">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.history.back()}
        className="mb-6 -ml-2"
        data-ocid="create_listing.back.button"
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      <h1 className="font-display font-bold text-3xl mb-2">
        List Your Property
      </h1>
      <p className="text-muted-foreground mb-8">
        Fill in the details below to list your property
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-8"
        data-ocid="create_listing.form"
      >
        {/* Basic Info */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="font-semibold text-lg">Basic Information</h2>

          <div className="space-y-2">
            <Label htmlFor="listing-title">Property Title *</Label>
            <Input
              id="listing-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cozy Single Room near IIT Delhi"
              required
              data-ocid="create_listing.title.input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="listing-desc">Description *</Label>
            <Textarea
              id="listing-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe your property..."
              required
              data-ocid="create_listing.description.textarea"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="listing-price">Price per Month (INR) *</Label>
              <Input
                id="listing-price"
                type="number"
                min="0"
                value={pricePerMonth}
                onChange={(e) => setPricePerMonth(e.target.value)}
                placeholder="e.g. 8000"
                required
                data-ocid="create_listing.price.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Room Type *</Label>
              <Select
                value={roomType}
                onValueChange={(v) => setRoomType(v as PropertyType)}
              >
                <SelectTrigger data-ocid="create_listing.roomtype.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PropertyType.single}>
                    Private Room
                  </SelectItem>
                  <SelectItem value={PropertyType.sharedRoom}>
                    Shared Room
                  </SelectItem>
                  <SelectItem value={PropertyType.apartment}>
                    PG / Flat
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Contact Phone Number *</Label>
              <Input
                id="contact-phone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+91 9876543210"
                required
                data-ocid="create_listing.contact_phone.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Gender Preference *</Label>
              <Select
                value={genderPreference}
                onValueChange={(v) => setGenderPreference(v as GenderType)}
              >
                <SelectTrigger data-ocid="create_listing.gender.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={GenderType.unisex}>Unisex</SelectItem>
                  <SelectItem value={GenderType.boys}>Boys Only</SelectItem>
                  <SelectItem value={GenderType.girls}>Girls Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="available-from">Available From</Label>
            <Input
              id="available-from"
              type="date"
              value={availableFrom}
              onChange={(e) => setAvailableFrom(e.target.value)}
              data-ocid="create_listing.available_from.input"
            />
          </div>
        </section>

        {/* Address */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="font-semibold text-lg">Address</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>House/Block Number</Label>
              <Input
                value={blocknumber}
                onChange={(e) => setBlocknumber(e.target.value)}
                placeholder="e.g. 42"
                data-ocid="create_listing.blocknumber.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Flat/Unit Number</Label>
              <Input
                value={bluenumber}
                onChange={(e) => setBluenumber(e.target.value)}
                placeholder="e.g. A-101"
                data-ocid="create_listing.bluenumber.input"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Street *</Label>
            <Input
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="e.g. Main Street"
              required
              data-ocid="create_listing.street.input"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>City *</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Delhi"
                required
                data-ocid="create_listing.city.input"
              />
            </div>
            <div className="space-y-2">
              <Label>State *</Label>
              <Input
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Delhi"
                required
                data-ocid="create_listing.state.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                data-ocid="create_listing.country.input"
              />
            </div>
          </div>
        </section>

        {/* Amenities */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Amenities</h2>
          <div className="flex gap-2">
            <Input
              value={amenityInput}
              onChange={(e) => setAmenityInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddAmenity();
                }
              }}
              placeholder="e.g. WiFi, AC, Laundry..."
              data-ocid="create_listing.amenity.input"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddAmenity}
              data-ocid="create_listing.amenity.button"
            >
              Add
            </Button>
          </div>
          {amenities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {amenities.map((a) => (
                <span
                  key={a}
                  className="flex items-center gap-1.5 bg-accent text-accent-foreground text-sm px-3 py-1 rounded-full"
                >
                  {a}
                  <button
                    type="button"
                    onClick={() =>
                      setAmenities((prev) => prev.filter((x) => x !== a))
                    }
                    className="hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Photos */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Photos</h2>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-20 border-dashed"
            data-ocid="create_listing.upload.button"
          >
            <Upload className="w-5 h-5 mr-2" /> Upload Photos
          </Button>
          {photoPreviewUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {photoPreviewUrls.map((url, photoIdx) => (
                <div
                  key={url}
                  className="relative aspect-video rounded-lg overflow-hidden group"
                >
                  <img
                    src={url}
                    alt="Property preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(photoIdx)}
                    className="absolute top-1 right-1 bg-card/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={listProperty.isPending}
          data-ocid="create_listing.submit.button"
        >
          {listProperty.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
            </>
          ) : (
            "Submit for Approval"
          )}
        </Button>
      </form>
    </div>
  );
}

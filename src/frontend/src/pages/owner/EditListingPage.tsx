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
import { useParams, useRouter } from "@tanstack/react-router";
import { ChevronLeft, Loader2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ExternalBlob,
  Variant_apartment_sharedRoom_single,
  Variant_boys_unisex_girls,
} from "../../backend";
import RouteGuard from "../../components/RouteGuard";
import { useProperty, useUpdateProperty } from "../../hooks/useQueries";

export default function EditListingPage() {
  return (
    <RouteGuard requiredRole="owner">
      <EditListingInner />
    </RouteGuard>
  );
}

function EditListingInner() {
  const { id } = useParams({ strict: false }) as { id: string };
  const router = useRouter();
  const { data: property, isLoading } = useProperty(BigInt(id ?? "0"));
  const updateProperty = useUpdateProperty();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pricePerMonth, setPricePerMonth] = useState("");
  const [roomType, setRoomType] = useState<Variant_apartment_sharedRoom_single>(
    Variant_apartment_sharedRoom_single.single,
  );
  const [genderPreference, setGenderPreference] =
    useState<Variant_boys_unisex_girls>(Variant_boys_unisex_girls.unisex);
  const [contactPhone, setContactPhone] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [amenityInput, setAmenityInput] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [blocknumber, setBlocknumber] = useState("");
  const [bluenumber, setBluenumber] = useState("");
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([]);
  const [newPhotoPreviewUrls, setNewPhotoPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    if (property) {
      setTitle(property.title);
      setDescription(property.description);
      setPricePerMonth(property.pricePerMonth.toString());
      setRoomType(property.roomType);
      setGenderPreference(
        property.genderPreference ?? Variant_boys_unisex_girls.unisex,
      );
      setContactPhone(property.contactPhone ?? "");
      setAmenities(property.amenities);
      const date = new Date(Number(property.availableFrom / 1_000_000n));
      setAvailableFrom(date.toISOString().split("T")[0]);
      setStreet(property.address.street);
      setCity(property.address.city);
      setState(property.address.state);
      setCountry(property.address.country);
      setBlocknumber(property.address.blocknumber);
      setBluenumber(property.address.bluenumber);
    }
  }, [property]);

  const handleAddAmenity = () => {
    const val = amenityInput.trim();
    if (val && !amenities.includes(val)) {
      setAmenities((prev) => [...prev, val]);
      setAmenityInput("");
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setNewPhotoFiles((prev) => [...prev, ...files]);
    for (const file of files) {
      const url = URL.createObjectURL(file);
      setNewPhotoPreviewUrls((prev) => [...prev, url]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;

    try {
      const existingPhotos = property.photos;
      const newPhotos: ExternalBlob[] = [];
      for (const file of newPhotoFiles) {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        newPhotos.push(ExternalBlob.fromBytes(bytes));
      }

      await updateProperty.mutateAsync({
        id: property.id,
        property: {
          ...property,
          title,
          description,
          pricePerMonth: BigInt(Math.round(Number(pricePerMonth))),
          roomType,
          genderPreference,
          contactPhone,
          amenities,
          availableFrom: availableFrom
            ? BigInt(new Date(availableFrom).getTime()) * 1_000_000n
            : property.availableFrom,
          address: { street, city, state, country, blocknumber, bluenumber },
          photos: [...existingPhotos, ...newPhotos],
        },
      });

      toast.success("Property updated successfully!");
      router.navigate({ to: "/owner/listings" });
    } catch (_err) {
      toast.error("Failed to update property.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-10">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.history.back()}
        className="mb-6 -ml-2"
        data-ocid="edit_listing.back.button"
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      <h1 className="font-display font-bold text-3xl mb-8">Edit Property</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-8"
        data-ocid="edit_listing.form"
      >
        <section className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="font-semibold text-lg">Basic Information</h2>
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              data-ocid="edit_listing.title.input"
            />
          </div>
          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
              data-ocid="edit_listing.description.textarea"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Price/month (INR) *</Label>
              <Input
                type="number"
                value={pricePerMonth}
                onChange={(e) => setPricePerMonth(e.target.value)}
                required
                data-ocid="edit_listing.price.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Room Type</Label>
              <Select
                value={roomType}
                onValueChange={(v) =>
                  setRoomType(v as Variant_apartment_sharedRoom_single)
                }
              >
                <SelectTrigger data-ocid="edit_listing.roomtype.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value={Variant_apartment_sharedRoom_single.single}
                  >
                    Private Room
                  </SelectItem>
                  <SelectItem
                    value={Variant_apartment_sharedRoom_single.sharedRoom}
                  >
                    Shared Room
                  </SelectItem>
                  <SelectItem
                    value={Variant_apartment_sharedRoom_single.apartment}
                  >
                    PG / Flat
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-contact-phone">Contact Phone Number *</Label>
              <Input
                id="edit-contact-phone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+91 9876543210"
                required
                data-ocid="edit_listing.contact_phone.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Gender Preference *</Label>
              <Select
                value={genderPreference}
                onValueChange={(v) =>
                  setGenderPreference(v as Variant_boys_unisex_girls)
                }
              >
                <SelectTrigger data-ocid="edit_listing.gender.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Variant_boys_unisex_girls.unisex}>
                    Unisex
                  </SelectItem>
                  <SelectItem value={Variant_boys_unisex_girls.boys}>
                    Boys Only
                  </SelectItem>
                  <SelectItem value={Variant_boys_unisex_girls.girls}>
                    Girls Only
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Available From</Label>
            <Input
              type="date"
              value={availableFrom}
              onChange={(e) => setAvailableFrom(e.target.value)}
              data-ocid="edit_listing.available_from.input"
            />
          </div>
        </section>

        <section className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Address</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>House Number</Label>
              <Input
                value={blocknumber}
                onChange={(e) => setBlocknumber(e.target.value)}
                data-ocid="edit_listing.blocknumber.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Flat/Unit</Label>
              <Input
                value={bluenumber}
                onChange={(e) => setBluenumber(e.target.value)}
                data-ocid="edit_listing.bluenumber.input"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Street</Label>
            <Input
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              required
              data-ocid="edit_listing.street.input"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                data-ocid="edit_listing.city.input"
              />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
                data-ocid="edit_listing.state.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                data-ocid="edit_listing.country.input"
              />
            </div>
          </div>
        </section>

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
              placeholder="Add amenity"
              data-ocid="edit_listing.amenity.input"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddAmenity}
              data-ocid="edit_listing.amenity.button"
            >
              Add
            </Button>
          </div>
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
        </section>

        <section className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Add More Photos</h2>
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
            className="w-full h-16 border-dashed"
            data-ocid="edit_listing.upload.button"
          >
            <Upload className="w-4 h-4 mr-2" /> Upload Photos
          </Button>
          {newPhotoPreviewUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {newPhotoPreviewUrls.map((url) => (
                <div
                  key={url}
                  className="relative aspect-video rounded-lg overflow-hidden"
                >
                  <img
                    src={url}
                    alt="Property preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={updateProperty.isPending}
          data-ocid="edit_listing.save.button"
        >
          {updateProperty.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </form>
    </div>
  );
}

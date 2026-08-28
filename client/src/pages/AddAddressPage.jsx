import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { addressService } from "../config/constants.js";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LuLocateFixed, LuArrowLeft } from "react-icons/lu";
import { BiLoader, BiCheck } from "react-icons/bi";
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  useMapEvents, 
  useMap 
} from "react-leaflet";

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Click-to-select location component
const LocationPicker = ({ setLocation }) => {
  useMapEvents({
    click(e) {
      setLocation(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Locate me button component
const LocateMeButton = ({ onLocate }) => {
  const map = useMap();

  const locateUser = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 16, { animate: true });
        onLocate(latitude, longitude);
      },
      () => toast.error("Location permission denied")
    );
  };

  return (
    <button
      type="button"
      onClick={locateUser}
      className="absolute right-3 top-3 z-[1000] flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold shadow hover:bg-gray-100 text-gray-700 cursor-pointer"
    >
      <LuLocateFixed size={16} className="text-[#E23744]" />
      Use current location
    </button>
  );
};

const AddAddressPage = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [label, setLabel] = useState("Home");
  const [recipientName, setRecipientName] = useState("");
  const [countryDialCode, setCountryDialCode] = useState("+91");
  const [countryCode, setCountryCode] = useState("IN");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [formattedAddress, setFormattedAddress] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  // Reverse geocoding from OpenStreetMap Nominatim
  const fetchFormattedAddress = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await res.json();
      if (data) {
        setFormattedAddress(data.display_name || "");

        const addr = data.address || {};
        if (!city) {
          setCity(addr.city || addr.town || addr.village || addr.suburb || "");
        }
        if (!stateName) {
          setStateName(addr.state || "");
        }
        if (!postalCode && addr.postcode) {
          setPostalCode(addr.postcode);
        }
        if (addr.country_code) {
          setCountryCode(addr.country_code.toUpperCase());
        }
      }
    } catch {
      toast.error("Failed to retrieve location details");
    }
  };

  const handleSetLocation = (lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
    fetchFormattedAddress(lat, lng);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (latitude === null || longitude === null) {
      toast.error("Please pick a location on the map");
      return;
    }

    if (!recipientName.trim()) {
      toast.error("Recipient Name is required");
      return;
    }

    if (!phone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    if (!addressLine1.trim()) {
      toast.error("Address Line 1 is required");
      return;
    }

    if (!city.trim() || !stateName.trim() || !postalCode.trim()) {
      toast.error("City, State, and Postal Code are required");
      return;
    }

    // Format dial code + phone number for backend E.164 (e.g. +9191938611118)
    const dialCode = countryDialCode.trim().startsWith("+")
      ? countryDialCode.trim()
      : `+${countryDialCode.trim()}`;
    const rawNumber = phone.trim().replace(/^[+]/, "");
    const fullPhone = `${dialCode}${rawNumber}`;

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");

      await axios.post(
        `${addressService}/add`,
        {
          label,
          recipientName: recipientName.trim(),
          phone: fullPhone,
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim(),
          landmark: landmark.trim(),
          city: city.trim(),
          state: stateName.trim(),
          postalCode: postalCode.trim(),
          countryCode: countryCode.trim() || "IN",
          latitude,
          longitude,
          formattedAddress: formattedAddress.trim() || addressLine1.trim(),
          isDefault,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Address added successfully");
      navigate("/address");

    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add address");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/address")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow hover:bg-gray-100 cursor-pointer"
          >
            <LuArrowLeft size={18} className="text-gray-700" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Add New Address</h1>
            <p className="text-xs text-gray-500">Pick map location and enter delivery details</p>
          </div>
        </div>

        {/* Map Location Selector */}
        <div className="space-y-2 rounded-xl bg-white p-4 shadow-sm">
          <label className="text-sm font-semibold text-gray-700">Select Location on Map</label>
          <div className="relative h-64 w-full overflow-hidden rounded-lg border">
            <MapContainer
              center={[latitude || 28.6139, longitude || 77.209]}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <LocationPicker setLocation={handleSetLocation} />
              <LocateMeButton onLocate={handleSetLocation} />
              {latitude && longitude && <Marker position={[latitude, longitude]} />}
            </MapContainer>
          </div>

          {formattedAddress ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-800">
              📍 <span className="font-medium">Selected Location:</span> {formattedAddress}
            </div>
          ) : (
            <p className="text-xs text-gray-500">Click anywhere on the map or use your current location to pick coordinates.</p>
          )}
        </div>

        {/* Address Form */}
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
          {/* Label selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Address Type</label>
            <div className="flex gap-2">
              {["Home", "Work", "Other"].map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => setLabel(tag)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition cursor-pointer ${
                    label === tag
                      ? "bg-[#E23744] text-white shadow"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Recipient Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Recipient Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#E23744] focus:outline-none"
            />
          </div>

          {/* Phone Number, Dial Code, Country Code */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Country *</label>
              <select
                value={countryCode}
                onChange={(e) => {
                  const iso = e.target.value;
                  setCountryCode(iso);
                  if (iso === "IN") setCountryDialCode("+91");
                  else if (iso === "US" || iso === "CA") setCountryDialCode("+1");
                  else if (iso === "GB") setCountryDialCode("+44");
                  else if (iso === "AE") setCountryDialCode("+971");
                  else if (iso === "AU") setCountryDialCode("+61");
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#E23744] focus:outline-none bg-white cursor-pointer"
              >
                <option value="IN">🇮🇳 India (IN)</option>
                <option value="US">🇺🇸 United States (US)</option>
                <option value="GB">🇬🇧 United Kingdom (GB)</option>
                <option value="AE">🇦🇪 UAE (AE)</option>
                <option value="CA">🇨🇦 Canada (CA)</option>
                <option value="AU">🇦🇺 Australia (AU)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Dial Code *</label>
              <input
                type="text"
                required
                placeholder="+91"
                value={countryDialCode}
                onChange={(e) => setCountryDialCode(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#E23744] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                placeholder="91938611118"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#E23744] focus:outline-none"
              />
            </div>
          </div>
          <p className="text-[11px] text-gray-500">
            Combined number sent to backend: <span className="font-mono text-gray-800 font-bold">{countryDialCode}{phone.trim().replace(/^[+]/, "") || "91938611118"}</span>
          </p>

          {/* Address Line 1 */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">House / Flat No., Building, Street *</label>
            <input
              type="text"
              required
              placeholder="e.g. Flat 302, Green Acres Apartment"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#E23744] focus:outline-none"
            />
          </div>

          {/* Address Line 2 & Landmark */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Area / Locality (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Sector 14"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#E23744] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Landmark (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Near City Mall"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#E23744] focus:outline-none"
              />
            </div>
          </div>

          {/* City, State, Postal Code */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">City *</label>
              <input
                type="text"
                required
                placeholder="e.g. New Delhi"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#E23744] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">State *</label>
              <input
                type="text"
                required
                placeholder="e.g. Delhi"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#E23744] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Postal Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. 110001"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#E23744] focus:outline-none"
              />
            </div>
          </div>

          {/* Default Address Checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#E23744] focus:ring-[#E23744] cursor-pointer"
            />
            <label htmlFor="isDefault" className="text-xs font-medium text-gray-700 cursor-pointer">
              Set as my default delivery address
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate("/address")}
              className="w-1/3 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-2/3 flex items-center justify-center gap-2 rounded-lg bg-[#E23744] py-2.5 text-sm font-semibold text-white hover:bg-[#d32f3a] disabled:opacity-50 shadow cursor-pointer"
            >
              {submitting ? <BiLoader className="animate-spin" size={18} /> : <BiCheck size={18} />}
              Save Address
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAddressPage;

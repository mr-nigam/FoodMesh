import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    BiUser,
    BiIdCard,
    BiMapPin,
    BiCar,
    BiUpload
} from "react-icons/bi";
import useAppData from "../../../context/useAppData.js";
import { registerRider } from "../services/riderService.js";


const RiderOnboarding = ({ onCompleted }) => {
    const { user } = useAppData();
    const navigate = useNavigate();

    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [aadharNumber, setAadharNumber] = useState("");
    const [drivingLicenseNumber, setDrivingLicenseNumber] = useState("");
    const [gender, setGender] = useState(user?.gender ?? "not_shared");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [vehicleType, setVehicleType] = useState("motorcycle");
    const [registrationNumber, setRegistrationNumber] = useState("");
    const [model, setModel] = useState("");
    const [location, setLocation] = useState({ longitude: null, latitude: null, accuracy: null });
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);


    const acquireLocation = () => {
        if(!navigator.geolocation){
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({
                    longitude: pos.coords.longitude,
                    latitude: pos.coords.latitude,
                    accuracy: pos.coords.accuracy
                });
                setGettingLocation(false);
                toast.success("GPS location captured!");
            },
            (err) => {
                console.warn("Geo error:", err.message);
                setGettingLocation(false);
                // Fallback default coordinates (Delhi) for local dev testing
                setLocation({
                    longitude: 77.2090,
                    latitude: 28.6139,
                    accuracy: 50
                });
                toast("Using default location coordinates for registration");
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    useEffect(() => {        
        const loadLocation = async ()=>{
            acquireLocation();
        }

        loadLocation();
    }, []);

    const handleFileChange = (e) => {
        const selected = e.target.files?.[0];
        if(selected){
            setFile(selected);
            setPreviewUrl(URL.createObjectURL(selected));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if(!name.trim()) return toast.error("Please enter your name");
        if(!email.trim()) return toast.error("Please enter your email");
        if(!aadharNumber.trim() || !/^\d{12}$/.test(aadharNumber.trim())){
            return toast.error("Aadhar number must be exactly 12 digits");
        }
        if(!drivingLicenseNumber.trim()){
            return toast.error("Please enter your driving license number");
        }
        if(location.longitude === null || location.latitude === null){
            return toast.error("Please allow GPS location access to continue");
        }

        try{
            setLoading(true);
            const formData = new FormData();
            formData.append("name", name.trim());
            formData.append("email", email.trim());
            if (phone.trim()) formData.append("phone", phone.trim().startsWith("+") ? phone.trim() : `+91${phone.trim()}`);
            formData.append("aadharNumber", aadharNumber.trim());
            formData.append("drivingLicenseNumber", drivingLicenseNumber.trim());
            formData.append("gender", gender);
            if (dateOfBirth) formData.append("dateOfBirth", dateOfBirth);
            formData.append("longitude", location.longitude);
            formData.append("latitude", location.latitude);
            formData.append("vehicleType", vehicleType);
            if (registrationNumber.trim()) formData.append("registrationNumber", registrationNumber.trim());
            if (model.trim()) formData.append("model", model.trim());
            if (file) formData.append("file", file);

            await registerRider({
                formData
            });

            toast.success("Rider profile registered successfully!");
            if(onCompleted){
                onCompleted();
            }else{
                navigate("/rider");
            }

        }catch (err){
            const msg = 
                err.response?.data?.message || 
                err.response?.data?.errors || 
                err.message;
                
            toast.error(typeof msg === "object" ? JSON.stringify(msg) : String(msg));
        }finally{
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-linear-to-r from-orange-500 to-amber-500 px-6 py-6 text-white">
                    <h1 className="text-2xl font-bold">Rider Partner Onboarding</h1>
                    <p className="text-orange-100 text-sm mt-1">
                        Register your details to start accepting deliveries and earning with FoodMesh.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Personal Details */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                            <BiUser className="text-orange-500 text-xl" /> Personal Information
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Email Address *</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="john@example.com"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number (+91...)</label>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+919876543210"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Gender</label>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                                >
                                    <option value="not_shared">Prefer not to say</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Date of Birth</label>
                                <input
                                    type="date"
                                    value={dateOfBirth}
                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Government Verification */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                            <BiIdCard className="text-orange-500 text-xl" /> Document Verification
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Aadhar Number (12 digits) *</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={12}
                                    value={aadharNumber}
                                    onChange={(e) => setAadharNumber(e.target.value.replace(/\D/g, ""))}
                                    placeholder="123456789012"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Driving License Number *</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={16}
                                    value={drivingLicenseNumber}
                                    onChange={(e) => setDrivingLicenseNumber(e.target.value.toUpperCase())}
                                    placeholder="DL1420110012345"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Primary Vehicle */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                            <BiCar className="text-orange-500 text-xl" /> Vehicle Details
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle Type *</label>
                                <select
                                    value={vehicleType}
                                    onChange={(e) => setVehicleType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                                >
                                    <option value="motorcycle">Motorcycle / Bike</option>
                                    <option value="scooter">Scooter / EV</option>
                                    <option value="bicycle">Bicycle</option>
                                    <option value="car">Car</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Registration Number</label>
                                <input
                                    type="text"
                                    value={registrationNumber}
                                    onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                                    placeholder="DL01AB1234"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Model / Brand</label>
                                <input
                                    type="text"
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    placeholder="Honda Activa / Splendor"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Profile Image & GPS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Profile Photo</label>
                            <div className="flex items-center gap-3">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-14 h-14 rounded-full object-cover border" />
                                ) : (
                                    <div className="w-14 h-14 rounded-full bg-gray-100 border flex items-center justify-center text-gray-400">
                                        <BiUpload className="text-xl" />
                                    </div>
                                )}
                                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium transition">
                                    Choose Photo
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">GPS Location Status</label>
                            <div className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg text-xs">
                                <span className="flex items-center gap-1.5 text-gray-700">
                                    <BiMapPin className="text-orange-500 text-sm" />
                                    {location.latitude
                                        ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                                        : "Acquiring coordinates..."}
                                </span>
                                <button
                                    type="button"
                                    onClick={acquireLocation}
                                    disabled={gettingLocation}
                                    className="text-orange-600 font-semibold hover:underline"
                                >
                                    {gettingLocation ? "Refreshing..." : "Re-sync"}
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl shadow-md transition duration-150 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? "Registering Profile..." : "Complete Rider Registration"}
                    </button>
                </form>
            </div>
        </div>
    );
};


export default RiderOnboarding;

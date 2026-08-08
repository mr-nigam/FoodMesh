import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BiUpload, BiMapPin } from "react-icons/bi";
import axios from "axios";
import toast from "react-hot-toast";
import useAppData from "../context/useAppData";
import { restaurantService } from "../config/constants";


const AddRestaurant = () => {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [description, setDescription] = useState("");
    const [phone, setPhone] = useState("");
    const [image, setImage] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const { loadingLocation, location } = useAppData();

    const handleSubmit = async () => {
        if(
            !name ||
            !email ||
            !phone ||
            !description ||
            !image ||
            !location
        ){
            toast.error("All fields are required.");
            return;
        }

        const formData = new FormData();

        formData.append("name", name);
        formData.append("email", email);
        formData.append("description", description);
        formData.append("phone", phone);
        formData.append("longitude", location.longitude);
        formData.append("latitude", location.latitude);
        formData.append(
            "formattedAddress",
            location.formattedAddress
        );
        formData.append("file", image);

        try{
            setSubmitting(true);

            await axios.post(
                `${restaurantService}/restaurant/add`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            toast.success("Restaurant added successfully.");

            navigate("/restaurant", { replace: true });

        }catch(error){
            // console.log("STATUS:", error.response?.status);
            // console.log("DATA:", error.response?.data);
            // console.log("ERROR:", error);

            toast.error(
                error?.response?.data?.message ||
                "Something went wrong."
            );

        }finally{
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-6">
            <div className="mx-auto max-w-lg rounded-xl bg-white p-6 shadow-md space-y-5">

                <h1 className="text-2xl font-semibold">
                    Add Your Restaurant
                </h1>

                {/* Restaurant Name */}
                <input
                    type="text"
                    placeholder="Restaurant Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border px-4 py-2"
                />

                {/* Restaurant Email */}
                <input
                    type="email"
                    placeholder="Restaurant Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border px-4 py-2"
                />

                {/* Contact Number */}
                <input
                    type="tel"
                    placeholder="Contact Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border px-4 py-2"
                />

                {/* Description */}
                <textarea
                    rows={4}
                    placeholder="Restaurant Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-lg border px-4 py-2"
                />

                {/* Restaurant Image */}
                <label
                    htmlFor="restaurant-image"
                    className="flex cursor-pointer items-center gap-3 rounded-lg border p-4"
                >
                    <BiUpload />
                    <span>
                        {image
                            ? image.name
                            : "Upload Restaurant Image"}
                    </span>
                </label>

                <input
                    hidden
                    id="restaurant-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                        setImage(e.target.files?.[0])
                    }
                />

                {/* Location */}
                <div className="rounded-lg border p-3">
                    <BiMapPin />

                    {loadingLocation ? (
                        <p>Fetching location...</p>
                    ) : (
                        <p>
                            {location?.formattedAddress ??
                                "Location unavailable"}
                        </p>
                    )}
                </div>

                {/* Submit */}
                <button
                    disabled={submitting || loadingLocation}
                    onClick={handleSubmit}
                    className="w-full rounded-lg bg-red-500 py-3 text-white"
                >
                    {submitting
                        ? "Adding Restaurant..."
                        : "Add Restaurant"}
                </button>

            </div>
        </div>
    );
};


export default AddRestaurant;
import { useState } from "react";
import axios from "axios";
import { restaurantService } from "../config/constants";
import toast from "react-hot-toast";
import { BiUpload } from "react-icons/bi";


const AddMenuItem = ({ onItemAdded }) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [price, setPrice] = useState("");
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);

    const resetForm = () => {
        setName("");
        setDescription("");
        setCategory("");
        setPrice("");
        setImage(null);

        // Reset file input manually
        const fileInput = document.getElementById("menu-image");
        if(fileInput){
            fileInput.value = "";
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];

        if(!file){
            setImage(null);
            return;
        }

        // Optional client-side validation
        if(!file.type.startsWith("image/")){
            toast.error("Please select a valid image");
            e.target.value = "";
            setImage(null);
            return;
        }

        setImage(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if(loading) return;

        const trimmedName = name.trim();
        const trimmedDescription = description.trim();
        const trimmedCategory = category.trim();

        // Required field validation
        if(!trimmedName){
            toast.error("Item name is required");
            return;
        }

        if(!trimmedDescription){
            toast.error("Item description is required");
            return;
        }

        if(!image){
            toast.error("Item image is required");
            return;
        }

        // Price validation
        const priceInRupees  = Number(price);

        if(!Number.isFinite(priceInRupees ) || priceInRupees  <= 0){
            toast.error("Price must be a valid number greater than 0");
            return;
        }
        
        const priceInPaise = Math.round(priceInRupees * 100);

        const formData = new FormData();

        formData.append("name", trimmedName);
        formData.append("description", trimmedDescription);
        formData.append("price", String(priceInPaise));
        formData.append("file", image);
        formData.append("category", trimmedCategory);

        try {
            setLoading(true);

            const { data } = await axios.post(
                `${restaurantService}/menu/add-item`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            toast.success(
                data?.message ||
                data?.data?.message ||
                "Menu item added successfully"
            );

            resetForm();

            if(onItemAdded){
                onItemAdded();
            }

        } catch (error) {
            console.error("Failed to add menu item:", error);

            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to add menu item";

            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto">
            <form
                onSubmit={handleSubmit}
                className="space-y-4"
            >
                <h2 className="text-xl font-semibold">
                    Add Menu Item
                </h2>

                {/* Name */}
                <div>
                    <label
                        htmlFor="menu-name"
                        className="block mb-1 text-sm font-medium"
                    >
                        Name
                    </label>

                    <input
                        id="menu-name"
                        type="text"
                        placeholder="Item name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                        className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2"
                    />
                </div>

                {/* Description */}
                <div>
                    <label
                        htmlFor="menu-description"
                        className="block mb-1 text-sm font-medium"
                    >
                        Description
                    </label>

                    <textarea
                        id="menu-description"
                        placeholder="Item description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={loading}
                        rows={4}
                        className="w-full rounded-lg border px-4 py-2 text-sm outline-none resize-none focus:ring-2"
                    />
                </div>

                {/* Category */}
                <div>
                    <label
                        htmlFor="menu-category"
                        className="block mb-1 text-sm font-medium"
                    >
                        Category
                    </label>

                    <input
                        id="menu-category"
                        type="text"
                        placeholder="e.g. Pizza, Burger, Dessert"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        disabled={loading}
                        className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2"
                    />
                </div>

                {/* Price */}
                <div>
                    <label
                        htmlFor="menu-price"
                        className="block mb-1 text-sm font-medium"
                    >
                        Price
                    </label>

                    <input
                        id="menu-price"
                        type="number"
                        placeholder="Enter price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        disabled={loading}
                        min="0.01"
                        step="0.01"
                        className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2"
                    />
                </div>

                {/* Image */}
                <div>
                    <label
                        htmlFor="menu-image"
                        className="block mb-1 text-sm font-medium"
                    >
                        Image
                    </label>
                    <BiUpload className="h-5 w-5 text-red-500"/>
                    
                    <input
                        id="menu-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={loading}
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                    />

                    {image && (
                        <p className="mt-1 text-xs text-gray-500">
                            Selected: {image.name}
                        </p>
                    )}
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? "Adding..." : "Add Menu Item"}
                </button>
            </form>
        </div>
    );
};


export default AddMenuItem;
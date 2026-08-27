import { useState } from "react";
import axios from "axios";
import { restaurantService } from "../config/constants.js";
import toast, { LoaderIcon } from "react-hot-toast";
import { BiTrash } from "react-icons/bi";
import { BsCartPlus, BsEye } from "react-icons/bs";
import { FiEyeOff } from "react-icons/fi";
import useAppData from "../context/useAppData.js";


const MenuItems = ({
  items = [],
  restaurantId,
  onItemDeleted,
  onAvailabilityChanged,
  onAddToCart,
  isSeller = false,
}) => {
    
  const [loadingItemId, setLoadingItemId] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);

  const { cart, refreshCart, updateQuantity } = useAppData();

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const getCartQuantity = (itemId) => {
    if (!cart || !Array.isArray(cart)) return 0;
    for (const restaurantCart of cart) {
      if (restaurantCart?.items) {
        const found = restaurantCart.items.find(
          (i) => i.item_id === itemId || i.id === itemId
        );
        if (found) return found.quantity || 0;
      }
    }
    return 0;
  };

  const handleUpdateQuantity = async (itemId, action) => {
    setLoadingItemId(itemId);
    try {
      await updateQuantity(itemId, action);
    } catch (error) {
      toast.error(error?.message || "Failed to update quantity");
    } finally {
      setLoadingItemId(null);
    }
  };

  const toggleItemAvailability = async (itemId) => {
    try{
      setLoadingItemId(itemId);
      setLoadingAction("availability");

      const { data } = await axios.patch(
        `${restaurantService}/menu/${itemId}/availability`,
        {},
        {
          headers: getAuthHeaders(),
        }
      );

      toast.success(
        data?.message ||
          data?.data?.message ||
          "Item availability updated successfully"
      );

      if(onAvailabilityChanged) {
        onAvailabilityChanged();
      }else if (onItemDeleted){
        // Backward compatibility with your existing parent component
        onItemDeleted();
      }

    }catch(error){
      console.error("Failed to update availability:", error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update item availability";

      toast.error(message);
    }finally{

      setLoadingItemId(null);
      setLoadingAction(null);
    }
  };

  const handleAddToCart = async (item) => {
    if(!item.is_available){
      toast.error("This item is currently unavailable");
      return;
    }

    const itemId = item.id;
    const targetRestaurantId = item.restaurant_id || item.restaurantId || restaurantId;
    const price = item.price;
    
    setLoadingItemId(item.id);

    try{

      const {data} = await axios.post(
        `${restaurantService}/cart/add`,
        {
          restaurantId: targetRestaurantId, itemId, price
        },
        {
          headers: {
            Authorization:`Bearer ${localStorage.getItem("token")}`
          }
        }
      );
      
      toast.success(
        data?.message ??
        data?.data?.message ??
        `${item.name} added to cart`
      );

      const cartRefresher = refreshCart;
      if (cartRefresher) {
        await cartRefresher();
      }

      if (onAddToCart) {
        onAddToCart(item);
      }
      
    }catch(error){
      
      console.error(
        "Error while doing add to cart",
        error
      );

      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to add item to cart"
      );

    }finally{

      setLoadingItemId(null);
    }
  };

  const handleDelete = async (itemId) => {
    const confirmed = window.confirm(
        "Are you sure you want to delete this item?"
    );

    if(!confirmed){
        return;
    }

    try {
        setLoadingItemId(itemId);
        setLoadingAction("delete");

        const { data } = await axios.delete(
            `${restaurantService}/menu/${itemId}`,
            {
                headers: getAuthHeaders(),
            }
        );

        toast.success(
            data?.message ||
            data?.data?.message ||
            "Item deleted successfully"
        );

        onItemDeleted?.();

    }catch(error){
        console.error(
            "Failed to delete menu item:",
            error
        );

        const message =
            error?.response?.data?.message ||
            error?.message ||
            "Failed to delete item";

        toast.error(message);

    }finally{
        setLoadingItemId(null);
        setLoadingAction(null);
    }
  };

  const formatPrice = (price) => {
    const amount = Number(price) / 100;

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if(!items.length){
    return (
      <div className="flex min-h-40 items-center justify-center rounded-lg bg-white p-6 text-gray-500 shadow-sm">
        No menu items found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => {
        const isLoading = loadingItemId === item.id;
        const imageUrl = item?.pictures_urls?.[0];

        return (
          <div
            key={item.id}
            className={`relative flex gap-4 rounded-lg bg-white p-4 shadow-sm transition ${
              !item.is_available ? "opacity-70" : ""
            }`}
          >
            {/* Image */}
            <div className="relative shrink-0">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={item.name || "Menu item"}
                  className={`h-20 w-20 rounded object-cover ${
                    !item.is_available
                      ? "grayscale brightness-75"
                      : ""
                  }`}
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                  No image
                </div>
              )}

              {!item.is_available && (
                <span className="absolute inset-0 flex items-center justify-center rounded bg-black/60 text-xs font-semibold text-white">
                  Not Available
                </span>
              )}
            </div>

            {/* Item details */}
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div>
                <h3 className="truncate font-semibold text-gray-800">
                  {item.name}
                </h3>

                {item.description && (
                  <p className="line-clamp-2 text-sm text-gray-500">
                    {item.description}
                  </p>
                )}
              </div>

              <p className="font-medium text-gray-800">
                {formatPrice(item.price)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-2">
              {isSeller ? (
                <>
                  {/* Availability */}
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => toggleItemAvailability(item.id)}
                    title={
                      item.is_available
                        ? "Mark unavailable"
                        : "Mark available"
                    }
                    className={`rounded-lg p-2 transition ${
                      isLoading
                        ? "cursor-not-allowed text-gray-400"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {isLoading && loadingAction === "availability" ? (
                      <LoaderIcon size={18} className="animate-spin" />
                    ) : item.is_available ? (
                      <BsEye size={18} />
                    ) : (
                      <FiEyeOff size={18} />
                    )}
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleDelete(item.id)}
                    title="Delete item"
                    className={`rounded-lg p-2 transition ${
                      isLoading
                        ? "cursor-not-allowed text-gray-300"
                        : "text-red-500 hover:bg-red-50"
                    }`}
                  >
                    {isLoading && loadingAction === "delete" ? (
                      <LoaderIcon size={18} className="animate-spin" />
                    ) : (
                      <BiTrash size={18} />
                    )}
                  </button>
                </>
              ) : (() => {
                const cartQty = getCartQuantity(item.id);
                if (cartQty > 0) {
                  return (
                    <div className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 p-1">
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleUpdateQuantity(item.id, "dec")}
                        title="Decrease quantity"
                        className="flex h-7 w-7 items-center justify-center rounded bg-white text-sm font-bold text-red-500 shadow-sm transition hover:bg-red-100 disabled:opacity-50"
                      >
                        -
                      </button>

                      <span className="min-w-[1.25rem] text-center text-sm font-bold text-gray-800">
                        {isLoading ? (
                          <LoaderIcon size={14} className="animate-spin inline" />
                        ) : (
                          cartQty
                        )}
                      </span>

                      <button
                        type="button"
                        disabled={!item.is_available || isLoading}
                        onClick={() => handleUpdateQuantity(item.id, "inc")}
                        title="Increase quantity"
                        className="flex h-7 w-7 items-center justify-center rounded bg-red-500 text-sm font-bold text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                  );
                }

                return (
                  <button
                    type="button"
                    disabled={!item.is_available || isLoading}
                    onClick={() => handleAddToCart(item)}
                    title={
                      item.is_available
                        ? "Add to cart"
                        : "Item unavailable"
                    }
                    className={`flex items-center justify-center rounded-lg p-2 transition ${
                      !item.is_available || isLoading
                        ? "cursor-not-allowed text-gray-400"
                        : "text-red-500 hover:bg-red-50"
                    }`}
                  >
                    {isLoading ? (
                      <LoaderIcon size={18} className="animate-spin" />
                    ) : (
                      <BsCartPlus size={18} />
                    )}
                  </button>
                );
              })()}
            </div>
          </div>
        );
      })}
    </div>
  );
};


export default MenuItems;
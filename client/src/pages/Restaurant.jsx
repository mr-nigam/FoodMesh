import { useEffect, useState } from "react";
import axios from "axios";
import { restaurantService } from "../config/constants.js";
import AddRestaurant from "../components/AddRestaurant";
import RestaurantProfile from "../components/restaurantProfile";
import MenuItems from "../components/MenuItems";
import AddMenuItem from "../components/AddMenuItem.jsx";
import toast from "react-hot-toast";
import { BsCart } from "react-icons/bs";


const Restaurant = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("menu");
  const [cart, setCart] = useState([]);

  // null = menu not loaded yet
  // [] = menu loaded but empty
  const [menuItems, setMenuItems] = useState(null);

  /*
   * Fetch restaurant
   */
  useEffect(() => {
    const fetchMyRestaurant = async () => {
      try {
        const token = localStorage.getItem("token");

        const { data } = await axios.get(
          `${restaurantService}/my`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setRestaurant(data?.data?.restaurant ?? null);

        if (data?.data?.token) {
          localStorage.setItem("token", data.data.token);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          setRestaurant(null);
        } else if (error.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
          return;
        } else {
          toast.error(
            error.response?.data?.message ||
              "Failed to fetch restaurant"
          );

          setRestaurant(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMyRestaurant();
  }, []);

  /*
   * Fetch menu items
   */
  const fetchMenuItems = async (restaurantId) => {
    if (!restaurantId) return [];

    const token = localStorage.getItem("token");

    const { data } = await axios.get(
      `${restaurantService}/menu/all/${restaurantId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return data?.data?.menuItems ?? data?.menuItems ?? [];
  };

  /*
   * Refresh menu items
   */
  const refreshMenuItems = async () => {
    try {
      const items = await fetchMenuItems(restaurant.id);
      setMenuItems(items);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to fetch menu items"
      );
    }
  };

  /*
   * Fetch menu whenever restaurant ID changes
   */
  useEffect(() => {
    if (!restaurant?.id) return;

    const loadMenu = async () => {
      try {
        const items = await fetchMenuItems(restaurant.id);
        setMenuItems(items);
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            "Failed to fetch menu items"
        );

        setMenuItems([]);
      }
    };

    loadMenu();
  }, [restaurant?.id]);

  /*
   * Add item to cart
   */
  const addToCart = (item) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (cartItem) => cartItem.id === item.id
      );

      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? {
                ...cartItem,
                quantity: cartItem.quantity + 1,
              }
            : cartItem
        );
      }

      return [
        ...prevCart,
        {
          id: item.id,
          restaurant_id: item.restaurant_id,
          name: item.name,
          price: item.price,
          picture_url: item.pictures_urls?.[0] || null,
          quantity: 1,
        },
      ];
    });

    toast.success(`${item.name} added to cart`);
  };

  /*
   * Cart item count
   */
  const cartItemCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  /*
   * Cart total
   * Price is stored in paise.
   */
  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  /*
   * Initial restaurant loading
   */
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg font-medium">
          Loading your restaurant...
        </p>
      </div>
    );
  }

  /*
   * Restaurant doesn't exist
   */
  if (!restaurant) {
    return <AddRestaurant />;
  }

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 px-4 py-6">

      <RestaurantProfile
        restaurant={restaurant}
        onUpdate={setRestaurant}
        isSeller={true}
      />

      <div className="rounded-xl bg-white shadow-sm">

        {/* Tabs */}
        <div className="flex border-b">
          {[
            { key: "sales", label: "Sales" },
            { key: "menu", label: "Menu Items" },
            { key: "add-item", label: "Add Item" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 px-3 py-4 text-sm font-medium transition ${
                t.key === tab
                  ? "border-b-2 border-red-500 text-red-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-4">

          {tab === "sales" && (
            <p>Sales</p>
          )}

          {tab === "menu" && (
            menuItems === null ? (
              <div className="py-10 text-center">
                <p className="text-gray-500">
                  Loading menu items...
                </p>
              </div>
            ) : (
              <>
                <MenuItems
                  items={menuItems}
                  isSeller={true}
                  onItemDeleted={refreshMenuItems}
                  onAvailabilityChanged={refreshMenuItems}
                  onAddToCart={addToCart}
                />

                {/* Cart summary */}
                {cart.length > 0 && (
                  <div className="mt-6 flex items-center justify-between rounded-lg bg-red-50 p-4">
                    <div className="flex items-center gap-3">
                      <BsCart
                        size={22}
                        className="text-red-500"
                      />

                      <div>
                        <p className="font-semibold text-gray-800">
                          Cart
                        </p>

                        <p className="text-sm text-gray-500">
                          {cartItemCount}{" "}
                          {cartItemCount === 1 ? "item" : "items"}
                        </p>
                      </div>
                    </div>

                    <p className="font-semibold text-gray-800">
                      ₹{(cartTotal / 100).toFixed(2)}
                    </p>
                  </div>
                )}
              </>
            )
          )}

          {tab === "add-item" && (
            <AddMenuItem
              onItemAdded={refreshMenuItems}
            />
          )}

        </div>
      </div>
    </div>
  );
};

export default Restaurant;
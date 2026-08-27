import { useEffect, useState } from "react";
import { authService, restaurantService } from "../config/constants";
import axios from "axios";
import AppContext from "./context";
import { Toaster } from "react-hot-toast";


const AppProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuth, setIsAuth] = useState(false);
    const [loading, setLoading] = useState(true);

    const [location, setLocation] = useState(null);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [city, setCity] = useState("Fetching location");

    const [cart, setCart] = useState([]);
    const [allTotalQty, setAllTotalQty] = useState(0);
    const [allTotalValue, setAllTotalValue] = useState(0);
    const [loadingCart, setLoadingCart] = useState(false);


    /*
     * Fetch authenticated user
     *
     * Dependencies:
     * []
     *
     * Correct because everything used by this effect is either:
     * - defined inside the effect
     * - a stable React state setter
     * - localStorage
     * - axios
     */
    useEffect(() => {
        let ignore = false;

        const fetchUser = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                if (!ignore) {
                    setUser(null);
                    setIsAuth(false);
                    setLoading(false);
                }

                return;
            }

            try {
                const { data: response } = await axios.get(
                    `${authService}/me`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (ignore) {
                    return;
                }

                const currentUser =
                    response?.data?.user ??
                    response?.user ??
                    null;

                if (currentUser) {
                    setUser(currentUser);
                    setIsAuth(true);
                } else {
                    setUser(null);
                    setIsAuth(false);
                }

            } catch (error) {
                if(ignore) {
                    return;
                }

                console.error(
                    "Error while fetching user:",
                    error
                );

                setUser(null);
                setIsAuth(false);

            }finally{
                if(!ignore){
                    setLoading(false);
                }
            }
        };


        /*
         * Fetch current location
         *
         * Dependencies:
         * []
         *
         * Correct because this function does not read any
         * reactive value from outside the effect.
         */
        const fetchLocation = () => {
            setLoadingLocation(true);

            if (!navigator.geolocation) {
                if (!ignore) {
                    setCity("Location not supported");
                    setLoadingLocation(false);
                }

                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    if (ignore) {
                        return;
                    }

                    const {
                        latitude,
                        longitude
                    } = position.coords;

                    try {
                        const { data } = await axios.get(
                            "https://nominatim.openstreetmap.org/reverse",
                            {
                                params: {
                                    lat: latitude,
                                    lon: longitude,
                                    format: "json",
                                },
                            }
                        );

                        if (ignore) {
                            return;
                        }

                        const address = data?.address ?? {};

                        setLocation({
                            latitude,
                            longitude,
                            formattedAddress:
                                data?.display_name ??
                                "Current Location",
                        });

                        setCity(
                            address.city ??
                            address.town ??
                            address.village ??
                            address.state_district ??
                            "Unknown location"
                        );

                    } catch (error) {
                        if (ignore) {
                            return;
                        }

                        console.error(
                            "Error while fetching location:",
                            error
                        );

                        setLocation({
                            latitude,
                            longitude,
                            formattedAddress:
                                "Current Location",
                        });

                        setCity("Unable to load");

                    } finally {
                        if (!ignore) {
                            setLoadingLocation(false);
                        }
                    }
                },

                (error) => {
                    if (ignore) {
                        return;
                    }

                    console.error(
                        "Error while getting location:",
                        error
                    );

                    setCity("Location access denied");
                    setLoadingLocation(false);
                }
            );
        };


        fetchUser();
        fetchLocation();


        return () => {
            ignore = true;
        };

    }, []);


    /*
     * Fetch cart for authenticated customer user and update state.
     */
    const fetchCart = async () => {
        const token = localStorage.getItem("token");

        if (!user || user.role !== "customer" || !token) {
            await Promise.resolve();
            setCart([]);
            setAllTotalQty(0);
            setAllTotalValue(0);
            setLoadingCart(false);
            return [];
        }

        try {
            const { data: response } = await axios.get(
                `${restaurantService}/cart/my`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const responseData = response?.data ?? response;
            const rawCart = responseData?.restaurants ?? [];
            
            // Clean up items with quantity <= 0 and empty restaurants
            const restaurantWiseCart = rawCart
                .map((r) => ({
                    ...r,
                    items: (r.items || []).filter((i) => Number(i.quantity) > 0),
                }))
                .filter((r) => r.items.length > 0);

            const totalQuantity = Number(responseData?.allTotalQty ?? 0);
            const totalValue = Number(responseData?.allTotalValue ?? 0);

            setCart(restaurantWiseCart);
            setAllTotalQty(totalQuantity);
            setAllTotalValue(totalValue);

            return restaurantWiseCart;

        } catch (error) {
            console.error("Error while fetching cart:", error);
            setCart([]);
            setAllTotalQty(0);
            setAllTotalValue(0);
            return [];

        } finally {
            setLoadingCart(false);
        }
    };

    const refreshCart = fetchCart;

    /*
     * Update item quantity in cart (action: "inc" | "dec")
     */
    const updateQuantity = async (itemId, action) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const { data } = await axios.put(
                `${restaurantService}/cart/update`,
                { itemId, action },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            await fetchCart();
            return data;
        } catch (error) {
            console.error("Error updating cart quantity:", error);
            throw error;
        }
    };

    /*
     * Fetch cart whenever authenticated user changes.
     */
    useEffect(() => {
        let isMounted = true;

        const loadCartData = async () => {
            if (isMounted) {
                await fetchCart();
            }
        };

        loadCartData();

        return () => {
            isMounted = false;
        };
    }, [user]);


    return (
        <AppContext.Provider
            value={{
                user,
                setUser,

                isAuth,
                setIsAuth,

                loading,
                setLoading,

                location,
                loadingLocation,
                city,

                cart,
                allTotalQty,
                allTotalValue,
                loadingCart,

                refreshCart,
                updateQuantity,
            }}
        >
            {children}

            <Toaster />
        </AppContext.Provider>
    );
};


export default AppProvider;
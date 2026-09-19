import { useEffect, useState, useCallback } from "react";
import axios from "axios";

import { authService, restaurantService } from "../config/constants";
import { AppContext } from "./context";
import getAuthHeader from "../config/getAuthHeader.js";


const AppProvider = ({ 
    children
}) => {

    // =========================================================
    // AUTH STATE
    // =========================================================

    const [user, setUser] = useState(null);
    const [isAuth, setIsAuth] = useState(false);
    const [loading, setLoading] = useState(true);


    // =========================================================
    // LOCATION STATE
    // =========================================================

    const [location, setLocation] = useState(() => {
        try {
            const cached = sessionStorage.getItem("foodmesh_location");
            return cached ? JSON.parse(cached) : null;
        } catch {
            return null;
        }
    });
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [city, setCity] = useState(() => {
        return sessionStorage.getItem("foodmesh_city") || "Current Location";
    });


    // =========================================================
    // CART STATE
    // =========================================================

    const [cart, setCart] = useState([]);
    const [allTotalQty, setAllTotalQty] = useState(0);
    const [allTotalValue, setAllTotalValue] = useState(0);
    const [loadingCart, setLoadingCart] = useState(false);


    // =========================================================
    // FETCH CURRENT USER
    // =========================================================

    useEffect(() => {

        let ignore = false;

        const fetchUser = async () => {

            try {

                const authConfig = getAuthHeader();

                const { data: response } = await axios.get(
                    `${authService}/me`,
                    authConfig
                );

                if (ignore) return;

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

                if (ignore) return;

                /*
                 * 401 simply means that there is currently
                 * no authenticated user.
                 *
                 * This should NOT break the application.
                 */

                if (error?.response?.status === 401) {

                    console.log(
                        "No authenticated user."
                    );

                } else {

                    console.error(
                        "Error while fetching user:",
                        error
                    );

                }

                setUser(null);
                setIsAuth(false);

            } finally {

                /*
                 * VERY IMPORTANT
                 *
                 * Even when /me returns 401,
                 * loading must become false.
                 */

                if (!ignore) {
                    setLoading(false);
                }

            }
        };


        fetchUser();


        return () => {
            ignore = true;
        };

    }, []);


    // =========================================================
    // FETCH LOCATION
    // =========================================================

    useEffect(() => {

        let ignore = false;

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

                    if (ignore) return;


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


                        if (ignore) return;


                        const address =
                            data?.address ?? {};


                        const resolvedLocation = {
                            latitude,
                            longitude,
                            formattedAddress:
                                data?.display_name ??
                                "Current Location",
                        };

                        const resolvedCity =
                            address.city ??
                            address.town ??
                            address.village ??
                            address.state_district ??
                            "Unknown location";

                        setLocation(resolvedLocation);
                        setCity(resolvedCity);

                        try {
                            sessionStorage.setItem("foodmesh_location", JSON.stringify(resolvedLocation));
                            sessionStorage.setItem("foodmesh_city", resolvedCity);
                        }catch(e){
                            console.log(e);
                        }


                    } catch (error) {

                        if (ignore) return;


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

                    if (ignore) return;


                    console.error(
                        "Error while getting location:",
                        error
                    );


                    setCity("Location access denied");
                    setLoadingLocation(false);

                },


                {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 60000,
                }

            );
        };


        fetchLocation();


        return () => {
            ignore = true;
        };

    }, []);


    // =========================================================
    // FETCH CART
    // =========================================================

    const fetchCart = useCallback(async () => {

        /*
         * Cart only belongs to customers.
         */

        if (!user || user.role !== "customer") {

            setCart([]);
            setAllTotalQty(0);
            setAllTotalValue(0);
            setLoadingCart(false);

            return [];

        }


        setLoadingCart(true);


        try {

            const { data: response } = await axios.get(
                `${restaurantService}/cart/my`,
                getAuthHeader()
            );


            const responseData =
                response?.data ?? response;


            const rawCart =
                responseData?.restaurants ?? [];


            /*
             * Remove:
             *
             * - items with quantity <= 0
             * - restaurants with no items
             */

            const restaurantWiseCart = rawCart

                .map((restaurant) => ({

                    ...restaurant,

                    items: (restaurant.items || [])
                        .filter(
                            (item) =>
                                Number(item.quantity) > 0
                        ),

                }))

                .filter(
                    (restaurant) =>
                        restaurant.items.length > 0
                );


            const totalQuantity =
                Number(
                    responseData?.allTotalQty ?? 0
                );


            const totalValue =
                Number(
                    responseData?.allTotalValue ?? 0
                );


            setCart(restaurantWiseCart);
            setAllTotalQty(totalQuantity);
            setAllTotalValue(totalValue);


            return restaurantWiseCart;


        } catch (error) {

            /*
             * A cart failure should not destroy the
             * authentication state.
             */

            if (error?.response?.status === 401) {

                console.log(
                    "Unable to fetch cart: user is unauthorized."
                );

            } else {

                console.error(
                    "Error while fetching cart:",
                    error
                );

            }


            setCart([]);
            setAllTotalQty(0);
            setAllTotalValue(0);


            return [];


        } finally {

            setLoadingCart(false);

        }

    }, [user]);


    // =========================================================
    // REFRESH CART
    // =========================================================

    const refreshCart = useCallback(async () => {

        return await fetchCart();

    }, [fetchCart]);


    // =========================================================
    // UPDATE CART QUANTITY
    // =========================================================

    const updateQuantity = async (itemId, action) => {

        try {

            const { data } = await axios.put(
                `${restaurantService}/cart/update`,
                {
                    itemId,
                    action
                },
                getAuthHeader()
            );


            await fetchCart();


            return data;


        } catch (error) {

            console.error(
                "Error updating cart quantity:",
                error
            );

            throw error;

        }

    };


    // =========================================================
    // LOAD CART WHEN USER CHANGES
    // =========================================================

    useEffect(() => {

        if(!user || user.role !== "customer"){

            const loadData = ()=>{
                setCart([]);
                setAllTotalQty(0);
                setAllTotalValue(0);
                setLoadingCart(false);
            }
            loadData();
            return;
        }


        const loadCart = async ()=>{
            await fetchCart();
        }

        loadCart();
        
    }, [user, fetchCart]);


    // =========================================================
    // CONTEXT
    // =========================================================

    return (
        <AppContext.Provider
            value={{

                // Authentication
                user,
                setUser,

                isAuth,
                setIsAuth,

                loading,
                setLoading,


                // Location
                location,
                loadingLocation,
                city,


                // Cart
                cart,
                allTotalQty,
                allTotalValue,
                loadingCart,

                refreshCart,
                updateQuantity,

            }}
        >
            {children}
        </AppContext.Provider>
    );
};


export default AppProvider;
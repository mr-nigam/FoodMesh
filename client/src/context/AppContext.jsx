import { useEffect, useState, useCallback } from "react";
import axios from "axios";

import { authService, restaurantService } from "../config/constants";
import { AppContext } from "./context";
import getAuthHeader from "../config/getAuthHeader.js";


const AppProvider = ({ 
    children
}) => {

    const [user, setUser] = useState(null);
    const [isAuth, setIsAuth] = useState(false);
    const [loading, setLoading] = useState(true);


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


    const [cart, setCart] = useState([]);
    const [allTotalQty, setAllTotalQty] = useState(0);
    const [allTotalValue, setAllTotalValue] = useState(0);
    const [loadingCart, setLoadingCart] = useState(false);


    useEffect(() => {

        let ignore = false;

        const fetchUser = async () => {
            try{

                const { data} = await axios.get(
                    `${authService}/me`,
                    getAuthHeader()
                );

                if(ignore) return;

                const user =
                    data?.data?.user ??
                    data?.user ??
                    null;

                if(user){
                    setUser(user);
                    setIsAuth(true);

                }else{
                    setUser(null);
                    setIsAuth(false);
                }

            }catch(error){

                if(ignore) return;


                if(error?.response?.status === 401){
                    console.log("No authenticated user.");
                }else{

                    console.error(
                        "Error while fetching user:",
                        error
                    );
                }

                setUser(null);
                setIsAuth(false);

            }finally{

                if(!ignore){
                    setLoading(false);
                }
            }
        };

        fetchUser();

        return () => {
            ignore = true;
        };
    }, []);


    useEffect(() => {

        let ignore = false;

        const fetchLocation = () => {

            setLoadingLocation(true);

            if(!navigator.geolocation){

                if(!ignore){
                    setCity("Location not supported");
                    setLoadingLocation(false);
                }

                return;
            }

            navigator.geolocation.getCurrentPosition(
                
                async (position) => {
                    if(ignore) return;

                    const {
                        latitude,
                        longitude
                    } = position.coords;

                    try{

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

                        if(ignore) return;

                        const address =
                            data?.address ??
                            data?.data?.address ??
                            {};

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

                    }catch(error){

                        if(ignore) return;
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

                    }finally{

                        if(!ignore){
                            setLoadingLocation(false);
                        }

                    }
                },


                (error) => {

                    if(ignore) return;

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


    const fetchCart = useCallback(async () => {

        if(!user || user.role !== "customer"){

            setCart([]);
            setAllTotalQty(0);
            setAllTotalValue(0);
            setLoadingCart(false);

            return [];
        }

        setLoadingCart(true);

        try {

            const { data } = await axios.get(
                `${restaurantService}/cart/my`,
                getAuthHeader()
            );

            const restaurants = 
                data?.restaurants ??
                data?.data?.restaurants ??
                []


            /*
             * Remove:
             *
             * - items with quantity <= 0
             * - restaurants with no items
             */

            const restaurantWiseCart = restaurants
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
                    data?.allTotalQty ??
                    data?.data?.allTotalQty ?? 
                    0
                );

            const totalValue =
                Number(
                    data?.allTotalValue ??
                    data?.data?.allTotalValue ??
                     0
                );

            setCart(restaurantWiseCart);
            setAllTotalQty(totalQuantity);
            setAllTotalValue(totalValue);

            return restaurantWiseCart;

        }catch(error){

            if(error?.response?.status === 401){
                console.log(
                    "Unable to fetch cart: user is unauthorized."
                );

            }else{
                console.error(
                    "Error while fetching cart:",
                    error
                );
            }

            setCart([]);
            setAllTotalQty(0);
            setAllTotalValue(0);

            return [];

        }finally{
            setLoadingCart(false);
        }

    }, [user]);


    const refreshCart = useCallback(async () => {
        return await fetchCart();
    }, [fetchCart]);


    const updateQuantity = async (itemId, action) => {
        try{

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

        }catch(error){

            console.error(
                "Error updating cart quantity:",
                error
            );

            throw error;

        }

    };

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
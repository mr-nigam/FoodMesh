import { useEffect, useState } from "react";
import axios from "axios";

import {AppContext} from "./context";
import getAuthHeader from '../config/getAuthHeader.js';
import { 
    authService,
    restaurantService 
} from "../config/constants";


const AppProvider = ({ 
    children
}) => {
    
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

    
    useEffect(() => {
        let ignore = false;

        const fetchUser = async () => {

            try {
                const { data: response } = await axios.get(
                    `${authService}/me`,
                    getAuthHeader(),
                );

                if(ignore) return;

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

            }catch(error){
                if(ignore) return;

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
                    if(ignore) return;

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

                        if(ignore) return;

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

                    } catch(error){
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

                    } finally {
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

        fetchUser();
        fetchLocation();

        return () => {
            ignore = true;
        };

    }, []);

    const fetchCart = async () => {
        if(!user || user.role !== "customer"){
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
                getAuthHeader()
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

        }catch(error){
            console.error("Error while fetching cart:", error);
            setCart([]);
            setAllTotalQty(0);
            setAllTotalValue(0);
            return [];

        }finally{
            setLoadingCart(false);
        }
    };

    const refreshCart = fetchCart;

    const updateQuantity = async (itemId, action) => {
        try {
            const { data } = await axios.put(
                `${restaurantService}/cart/update`,
                { itemId, action },
                getAuthHeader()
            );

            await fetchCart();
            return data;

        }catch(error){
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
            if(isMounted){
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
        </AppContext.Provider>
    );
};


export default AppProvider;


import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';

import { authService } from '../../config/constants.js';
import useAppData from '../../context/useAppData';

const GOOGLE_CLIENT_ID =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    "888593240527-qds9kk6ql0inp9gi9qgqnghv9e06p41f.apps.googleusercontent.com";


const Login = () => {
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setUser, setIsAuth } = useAppData();

    // Exchange code if redirected from Google
    useEffect(() => {
        const code = searchParams.get('code');
        if (!code) return;

        const exchangeCode = async () => {
            setLoading(true);
            try {
                const redirectUri = window.location.origin + '/login';
                const { data } = await axios.post(
                    `${authService}/login`,
                    {
                        code,
                        redirect_uri: redirectUri
                    }
                );

                const token = data?.token || data?.data?.token; 
                if (token) {
                    localStorage.setItem("token", token);
                }

                toast.success(data?.message || "Logged in successfully");
                setUser(data?.data?.user || data?.user);
                setIsAuth(true);
                navigate("/", { replace: true });
            } catch (error) {
                console.error("Redirect exchange error:", error);
                const msg = error?.response?.data?.message || "Problem while logging in";
                toast.error(msg);
                navigate("/login", { replace: true });
            } finally {
                setLoading(false);
            }
        };

        exchangeCode();
    }, [searchParams, navigate, setUser, setIsAuth]);

    const handleGoogleLogin = () => {
        setLoading(true);
        const redirectUri = window.location.origin + '/login';
        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
            redirectUri
        )}&response_type=code&scope=${encodeURIComponent(
            'openid email profile'
        )}&prompt=select_account`;

        window.location.href = googleAuthUrl;
    };

    return (
        <div className='flex min-h-screen items-center justify-center bg-white px-4'>
            <div className='w-full max-w-sm space-y-6'>
                <h1 className='text-center text-3xl font-bold text-[#E23774]'>
                    FoodMesh
                </h1>
                <p className='text-center text-sm text-gray-500'>
                    Log in or sign up to continue
                </p>
                <button 
                    type="button"
                    onClick={handleGoogleLogin} 
                    disabled={loading} 
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 hover:bg-gray-50 transition cursor-pointer disabled:opacity-60"
                >
                    <FcGoogle size={20}/>
                    <span>{loading ? "Signing in..." : "Continue with Google"}</span>
                </button>

                <p className='text-center text-xs text-gray-400'>
                    By continuing, you agree with our {" "} 
                    <span className='text-[#E23774]'>Terms of Service</span> &{" "}
                    <span className='text-[#E23774]'>Privacy Policy</span>
                </p>
            </div>
        </div>
    );
};


export default Login;
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";

import { authService } from "../../config/constants.js";
import useAppData from "../../context/useAppData";


const GOOGLE_CLIENT_ID =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    "888593240527-qds9kk6ql0inp9gi9qgqnghv9e06p41f.apps.googleusercontent.com";


const Login = () => {

    const [loading, setLoading] = useState(false);

    const [searchParams] = useSearchParams();

    const navigate = useNavigate();

    const {
        setUser,
        setIsAuth
    } = useAppData();


    // =========================================================
    // GOOGLE CALLBACK
    // =========================================================

    useEffect(() => {

        const code = searchParams.get("code");

        /*
         * Normal visit to /login.
         * Nothing to exchange.
         */
        if (!code) {
            return;
        }


        const exchangeCode = async () => {

            setLoading(true);

            try {

                const redirectUri =
                    `${window.location.origin}/login`;


                const { data: response } = await axios.post(
                    `${authService}/login`,
                    {
                        code,
                        redirect_uri: redirectUri,
                    }
                );


                /*
                 * Your backend response is:
                 *
                 * {
                 *     data: {
                 *         user,
                 *         token
                 *     }
                 * }
                 */

                const responseData =
                    response?.data ?? response;


                const token =
                    responseData?.token ?? null;


                const user =
                    responseData?.user ?? null;


                /*
                 * Token is mandatory.
                 */

                if (!token) {

                    throw new Error(
                        "Access token was not returned by the server"
                    );

                }


                /*
                 * Store JWT.
                 *
                 * getAuthHeader() reads this exact key.
                 */

                localStorage.setItem(
                    "token",
                    token
                );


                /*
                 * Update global authentication state.
                 */

                if (user) {

                    setUser(user);
                    setIsAuth(true);

                }


                toast.success(
                    response?.message ||
                    "Logged in successfully"
                );


                /*
                 * Remove ?code=... from URL.
                 */

                navigate(
                    "/",
                    {
                        replace: true
                    }
                );


            } catch (error) {

                console.error(
                    "Google login error:",
                    error
                );


                /*
                 * Do not leave an invalid token behind.
                 */

                localStorage.removeItem("token");

                setUser(null);
                setIsAuth(false);


                const message =
                    error?.response?.data?.message ||
                    error?.message ||
                    "Problem while logging in";


                toast.error(message);


                navigate(
                    "/login",
                    {
                        replace: true
                    }
                );


            } finally {

                setLoading(false);

            }
        };


        exchangeCode();

    }, [
        searchParams,
        navigate,
        setUser,
        setIsAuth
    ]);


    // =========================================================
    // START GOOGLE LOGIN
    // =========================================================

    const handleGoogleLogin = () => {

        setLoading(true);


        const redirectUri =
            `${window.location.origin}/login`;


        const googleAuthUrl =
            `https://accounts.google.com/o/oauth2/v2/auth` +
            `?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&response_type=code` +
            `&scope=${encodeURIComponent("openid email profile")}` +
            `&prompt=select_account`;


        window.location.href = googleAuthUrl;
    };


    // =========================================================
    // UI
    // =========================================================

    return (
        <div className="flex min-h-screen items-center justify-center bg-white px-4">

            <div className="w-full max-w-sm space-y-6">

                <h1 className="text-center text-3xl font-bold text-[#E23774]">
                    FoodMesh
                </h1>


                <p className="text-center text-sm text-gray-500">
                    Log in or sign up to continue
                </p>


                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 transition hover:bg-gray-50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >

                    <FcGoogle size={20} />

                    <span>
                        {loading
                            ? "Signing in..."
                            : "Continue with Google"
                        }
                    </span>

                </button>


                <p className="text-center text-xs text-gray-400">

                    By continuing, you agree with our{" "}

                    <span className="text-[#E23774]">
                        Terms of Service
                    </span>

                    {" "}and{" "}

                    <span className="text-[#E23774]">
                        Privacy Policy
                    </span>

                </p>

            </div>

        </div>
    );
};


export default Login;
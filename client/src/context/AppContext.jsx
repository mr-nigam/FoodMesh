import { useEffect, useState } from 'react';
import { authService } from '../config/constants';
import axios from 'axios';
import { AppContext } from './context';


export const AppProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuth, setIsAuth] = useState(false);
    const [loading, setLoading] = useState(true);

    const [location, setLocation] = useState(null);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [city, setCity] = useState("Fetching location");

    useEffect(() => {
        console.log("AppProvider mounted");
        let ignore = false;

        async function fetchUser(){
            const token = localStorage.getItem("token");

            if(!token){
                if(!ignore){
                    setLoading(false);
                }
                return;
            }

            try {
                const { data } = await axios.get(`${authService}/auth/me`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                });

                if(!ignore){
                    setUser(data.data.user);
                    setIsAuth(true);
                }

            } catch (error) {
                console.log(error);
            } finally {
                if (!ignore) setLoading(false);
            }
        }

        function fetchLocation() {
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

                    const { latitude, longitude } = position.coords;
                    setLocation({ latitude, longitude });

                    try {
                        const { data } = await axios.get(
                            `https://nominatim.openstreetmap.org/reverse`,
                            { params: { lat: latitude, lon: longitude, format: 'json' } }
                        );
                        if (!ignore) {
                            setCity(data?.address?.city || data?.address?.town || "Unknown location");
                        }
                    } catch (error) {
                        console.log(error);
                        if (!ignore) setCity("Unable to fetch city");
                    } finally {
                        if (!ignore) setLoadingLocation(false);
                    }
                },
                (error) => {
                    console.log(error);
                    if (!ignore) {
                        setCity("Location access denied");
                        setLoadingLocation(false);
                    }
                }
            );
        }

        fetchUser();
        fetchLocation();

        return () => {
            ignore = true;
        };
    }, []);

    return (
        <AppContext.Provider
            value={{
                user,
                setUser,
                isAuth,
                setIsAuth,
                loading,
                location,
                loadingLocation,
                city,
                setLoading
            }}
        >
            {children}
        </AppContext.Provider>
    );
};
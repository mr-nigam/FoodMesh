import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { restaurantService } from "../config/constants";
import axios from "axios";
import { useEffect, useState } from "react";
import RestaurantProfile from "../components/RestaurantProfile";
import MenuItems from "../components/MenuItems";
import getAuthHeader from '../config/getAuthHeader.js';


const RestaurantPages = () => {
    const { restaurantId } = useParams();

    const [restaurant, setRestaurant] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!restaurantId) {
            return;
        }

        const loadRestaurantPage = async () => {

            try {
                setLoading(true);

                /*
                 * =========================
                 * Fetch Restaurant
                 * =========================
                 */

                const {data} = await axios.get(
                    `${restaurantService}/${restaurantId}`,
                    getAuthHeader()
                );

                const restaurantData =
                    data?.restaurant ||
                    data?.data?.restaurant ||
                    [];

                if (!restaurantData) {
                    toast.error("Restaurant not found");
                    setRestaurant(null);
                    setMenuItems([]);
                    return;
                }

                setRestaurant(restaurantData);

                /*
                 * =========================
                 * Fetch Menu
                 * =========================
                 */

                try {
                    const {data} = await axios.get(
                        `${restaurantService}/menu/all/${restaurantId}`,
                        getAuthHeader()
                    );

                    const items =
                        data?.menuItems ||
                        data?.data?.menuItems ||
                        [];

                    setMenuItems(items);

                } catch (error) {
                    console.error(
                        "Failed to fetch menu items:",
                        error
                    );

                    toast.error(
                        error?.response?.data?.message ||
                        "Failed to fetch menu items"
                    );

                    setMenuItems([]);
                }
            } catch (error) {
                console.error(
                    "Failed to fetch restaurant:",
                    error
                );

                toast.error(
                    error?.response?.data?.message ||
                    "Failed to fetch restaurant"
                );

                setRestaurant(null);
                setMenuItems([]);
            } finally {
                setLoading(false);
            }
        };

        loadRestaurantPage();
    }, [restaurantId]);

    /*
     * =========================
     * Invalid Restaurant ID
     * =========================
     */

    if(!restaurantId){
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-gray-500">
                    Invalid restaurant.
                </p>
            </div>
        );
    }

    /*
     * =========================
     * Loading
     * =========================
     */

    if(loading){
        return (
                <div className="flex min-h-screen items-center justify-center">
                    <p className="text-gray-500">
                        Loading restaurant...
                    </p>
                </div>
        );
    }

    /*
     * =========================
     * Restaurant Not Found
     * =========================
     */

    if(!restaurant){
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-gray-500">
                    Restaurant not found.
                </p>
            </div> 
        );
    }

    // const restaurantImage = restaurant.pictures_urls?.[0] || null;

    return (
        <>
            <div className="min -h screen bg-gray-50 px-4 py-6 space-y-6">
                <RestaurantProfile 
                    restaurant={restaurant} 
                    onUpdate={setRestaurant} 
                    isSeller={false}
                />
            </div>

            <div className="rounded-xl bg-white shadow-sm p-4">
                <MenuItems 
                    isSeller={false} 
                    items={menuItems} 
                    restaurantId={restaurantId}
                />
            </div>
        </>
    )    
};


export default RestaurantPages;
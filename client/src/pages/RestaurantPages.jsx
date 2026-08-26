import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { restaurantService } from "../config/constants";
import axios from "axios";
import { useEffect, useState } from "react";
import RestaurantProfile from "../components/RestaurantProfile";
import MenuItems from "../components/MenuItems";


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
            const token = localStorage.getItem("token");

            try {
                setLoading(true);

                /*
                 * =========================
                 * Fetch Restaurant
                 * =========================
                 */

                const {data} = await axios.get(
                    `${restaurantService}/${restaurantId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                console.log(
                    "Restaurant response:",
                    data
                );

                const restaurantData =
                    data?.restaurant ||
                    data?.data?.restaurant ||
                    [];

                console.log(
                    "Restaurant data:",
                    restaurantData
                );

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
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );

                    console.log(
                        "Menu response:",
                        data
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

    // return (
    //     <div className="min-h-screen bg-gray-50">

    //         {/* =========================
    //             Restaurant
    //         ========================= */}

    //         <div className="bg-white shadow-sm">
    //             <div className="mx-auto max-w-6xl">

    //                 {restaurantImage && (
    //                     <div className="h-125 w-full overflow-hidden">
    //                         <img
    //                             src={restaurantImage}
    //                             alt={restaurant.name}
    //                             className="h-full w-full object-cover"
    //                         />
    //                     </div>
    //                 )}

    //                 <div className="px-6 py-6">

    //                     <div className="flex items-start justify-between gap-4">

    //                         <div>
    //                             <h1 className="text-3xl font-bold text-gray-900">
    //                                 {restaurant.name}
    //                             </h1>

    //                             {restaurant.description && (
    //                                 <p className="mt-2 text-gray-600">
    //                                     {restaurant.description}
    //                                 </p>
    //                             )}

    //                             {restaurant.address && (
    //                                 <p className="mt-3 text-sm text-gray-500">
    //                                     {restaurant.address}
    //                                 </p>
    //                             )}
    //                         </div>

    //                         <div>
    //                             {restaurant.is_open ? (
    //                                 <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
    //                                     Open
    //                                 </span>
    //                             ) : (
    //                                 <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
    //                                     Closed
    //                                 </span>
    //                             )}
    //                         </div>

    //                     </div>
    //                 </div>
    //             </div>
    //         </div>

    //         {/* =========================
    //             Menu
    //         ========================= */}

    //         <div className="mx-auto max-w-6xl px-6 py-8">

    //             <h2 className="mb-6 text-2xl font-bold text-gray-900">
    //                 Menu
    //             </h2>

    //             {menuItems.length === 0 ? (
    //                 <div className="rounded-lg bg-white p-8 text-center shadow-sm">
    //                     <p className="text-gray-500">
    //                         No menu items available.
    //                     </p>
    //                 </div>
    //             ) : (
    //                 <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">

    //                     {menuItems.map((item) => {

    //                         const itemImage =
    //                             item.pictures_urls?.[0] || null;

    //                         return (
    //                             <div
    //                                 key={item.id}
    //                                 className="overflow-hidden rounded-lg bg-white shadow-sm"
    //                             >

    //                                 {/* Menu Image */}

    //                                 {itemImage && (
    //                                     <img
    //                                         src={itemImage}
    //                                         alt={item.name}
    //                                         className="h-48 w-full object-cover"
    //                                     />
    //                                 )}

    //                                 <div className="p-5">

    //                                     <div className="flex items-start justify-between gap-4">

    //                                         <h3 className="text-lg font-semibold text-gray-900">
    //                                             {item.name}
    //                                         </h3>

    //                                         <span className="whitespace-nowrap font-semibold text-green-600">
    //                                             ₹
    //                                             {(
    //                                                 Number(item.price) / 100
    //                                             ).toFixed(2)}
    //                                         </span>

    //                                     </div>

    //                                     {item.category && (
    //                                         <p className="mt-1 text-sm text-gray-500">
    //                                             {item.category}
    //                                         </p>
    //                                     )}

    //                                     {item.description && (
    //                                         <p className="mt-3 text-sm text-gray-600">
    //                                             {item.description}
    //                                         </p>
    //                                     )}

    //                                     <div className="mt-4">

    //                                         {item.is_available ? (
    //                                             <span className="font-medium text-green-600">
    //                                                 Available
    //                                             </span>
    //                                         ) : (
    //                                             <span className="font-medium text-red-500">
    //                                                 Currently unavailable
    //                                             </span>
    //                                         )}

    //                                     </div>
    //                                 </div>
    //                             </div>
    //                         );
    //                     })}

    //                 </div>
    //             )}

    //         </div>
    //     </div>
    // );
};


export default RestaurantPages;
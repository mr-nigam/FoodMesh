import { useEffect, useState } from "react";
import useAppData from "../context/useAppData";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { restaurantService } from "../config/constants";
import axios from "axios";
import RestaurantCard from "../components/RestaurantCard";


const Home = () => {
  const { location } = useAppData();
  const [searchParams] = useSearchParams();

  const search = searchParams.get("search") || "";

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchRestaurants = async () => {
      if (
        location?.latitude === undefined ||
        location?.longitude === undefined
      ) {
        return;
      }

      try {
        if (isMounted) setLoading(true);

        const { data } = await axios.get(
          `${restaurantService}/all-nearby`,
          {
            params: {
              latitude: location.latitude,
              longitude: location.longitude,
              search,
            },
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!isMounted) return;

        const restaurantsData =
          data?.data?.restaurants ||
          data?.restaurants ||
          [];

        setRestaurants(restaurantsData);
      } catch (error) {
        if (!isMounted) return;

        console.error(
          "Failed to fetch nearby restaurants:",
          error
        );

        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to fetch nearby restaurants";

        toast.error(message);

        setRestaurants([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRestaurants();

    return () => {
      isMounted = false;
    };
  }, [
    location?.latitude,
    location?.longitude,
    search,
  ]);

  /*
   * Location not available
   */
  if (
    location?.latitude === undefined ||
    location?.longitude === undefined
  ) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">
          Please allow location access to find restaurants near you.
        </p>
      </div>
    );
  }

  /*
   * Loading
   */
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">
          Finding restaurants near you...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">

      {/* Heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {search
            ? `Restaurants for "${search}"`
            : "Restaurants near you"}
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          {restaurants.length > 0
            ? `${restaurants.length} restaurant${
                restaurants.length > 1 ? "s" : ""
              } found`
            : "No restaurants found"}
        </p>
      </div>

      {/* Restaurant List */}
      {restaurants.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">

          {restaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
            />
          ))}
        </div>
      ) : (
        /*
         * Empty State
         */
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">

          <div className="mb-3 text-5xl">
            🍽️
          </div>

          <h2 className="text-xl font-semibold text-gray-800">
            No restaurants found
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {search
              ? `No restaurants matched "${search}".`
              : "There are no open restaurants near your location."}
          </p>

        </div>
      )}

    </div>
  );
};


export default Home;
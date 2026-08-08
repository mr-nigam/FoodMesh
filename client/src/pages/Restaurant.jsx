import { useEffect, useState } from "react";
import axios from "axios";
import { restaurantService } from '../config/constants.js';
import AddRestaurant from "../components/AddRestaurant";


const Restaurant = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyRestaurant = async () => {
      try{
        const token = localStorage.getItem("token");

        const { data } = await axios.get(
          `${restaurantService}/restaurant/my`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setRestaurant(data?.data?.restaurant ?? null);

        if(data?.data?.token){
          localStorage.setItem("token", data.data.token);
        }

      }catch(error){
        // console.error("Restaurant fetch error:", error);

        if(error.response?.status === 404){
          
          setRestaurant(null);
        
        }else if (error.response?.status === 401) {
          
          localStorage.removeItem("token");
          window.location.href = "/login";
          return;

        }else {
          setRestaurant(null);
        }

      }finally{
        setLoading(false);
      }
    };

    fetchMyRestaurant();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg font-medium">
          Loading your restaurant...
        </p>
      </div>
    );
  }

  if (!restaurant) {
    return <AddRestaurant />;
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-3xl font-bold">
        Restaurant Dashboard
      </h1>

      <div className="rounded-lg border bg-white p-6 shadow">
        <h2 className="text-2xl font-semibold">
          {restaurant.name}
        </h2>

        {restaurant.description && (
          <p className="mt-3 text-gray-600">
            {restaurant.description}
          </p>
        )}

        {restaurant.phone && (
          <p className="mt-2">
            <span className="font-medium">Phone:</span>{" "}
            {restaurant.phone}
          </p>
        )}

        {restaurant.address && (
          <p className="mt-2">
            <span className="font-medium">Address:</span>{" "}
            {restaurant.address}
          </p>
        )}

        {restaurant.image && (
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="mt-6 h-64 w-full rounded-lg object-cover"
          />
        )}
      </div>
    </div>
  );
};


export default Restaurant;
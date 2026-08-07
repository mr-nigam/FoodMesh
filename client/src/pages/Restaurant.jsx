import { useEffect, useState } from "react";
import axios from "axios";
import { restaurantService } from "../config/constants";
import AddRestaurant from "../components/AddRestaurant";


const Restaurant = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMyRestaurant = async () => {
    try {
      const token = localStorage.getItem("token");

      const { data } = await axios.get(`${restaurantService}/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(data);

      setRestaurant(data?.data?.restaurant ?? null);

      // Update token if backend sends a new one
      if(data?.data?.token) {
        localStorage.setItem("token", data.data.token);
      }

    }catch(error){
      console.error(error);

      // If restaurant doesn't exist
      if (error.response?.status === 404) {
        setRestaurant(null);
      }

      // If token is invalid/expired
      else if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      // Any other error
      else {
        setRestaurant(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRestaurant();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500 text-lg">
          Loading your restaurant...
        </p>
      </div>
    );
  }

  if (!restaurant) {
    return <AddRestaurant onSuccess={fetchMyRestaurant} />;
  }

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6">Restaurant Dashboard</h1>

      <div className="rounded-lg border bg-white p-6 shadow">
        <h2 className="text-2xl font-semibold">{restaurant.name}</h2>

        {restaurant.description && (
          <p className="mt-3 text-gray-600">{restaurant.description}</p>
        )}

        {restaurant.phone && (
          <p className="mt-2">
            <span className="font-medium">Phone:</span> {restaurant.phone}
          </p>
        )}

        {restaurant.address && (
          <p className="mt-2">
            <span className="font-medium">Address:</span> {restaurant.address}
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
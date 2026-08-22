import { useEffect, useState } from "react";
import axios from "axios";
import { restaurantService } from '../config/constants.js';
import AddRestaurant from "../components/AddRestaurant";
import RestaurantProfile from '../components/RestaurantProfile';


const Restaurant = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyRestaurant = async () => {
      try{
        const token = localStorage.getItem("token");

        const { data } = await axios.get(
          `${restaurantService}/my`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setRestaurant(data?.data?.restaurant ?? null);

        if(data?.data?.token){
          localStorage.setItem("token", data.data.token);
          // window.location.reload();
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

  if(loading){
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg font-medium">
          Loading your restaurant...
        </p>
      </div>
    );
  }

  
if(!restaurant) {
    return <AddRestaurant />;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 space-y-6">
      <
        RestaurantProfile 
        restaurant={restaurant} 
        onUpdate={setRestaurant} 
        isSeller={true}
      />
    </div>
  );
};


export default Restaurant;
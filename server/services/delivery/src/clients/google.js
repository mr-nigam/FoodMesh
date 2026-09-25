import axios from "axios";


const GOOGLE_ROUTES_URL =
    "https://routes.googleapis.com/directions/v2:computeRoutes";


const getRoadDistanceAndTime  = async({
    pickupLongitude,
    pickupLatitude,
    dropLongitude,
    dropLatitude
})=>{

    try{
        const {data} = await axios.post(
            GOOGLE_ROUTES_URL,
            {
                origin:{
                    location:{
                        latLng:{
                            latitude: Number(pickupLatitude),
                            longitude: Number(pickupLongitude)
                        }
                    }
                },
                destination:{
                    location:{
                        latLng:{
                            latitude: Number(dropLatitude),
                            longitude: Number(dropLongitude)
                        }
                    }
                },

                travelMode: "DRIVE",
                routingPreference: "TRAFFIC_AWARE"
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,
                    "X-Goog-FieldMask": "routes.distanceMeters,routes.duration"
                }
            }
        );

        const route = data?.routes?.[0];

        if(!route){
            throw new Error("No route found");
        }
        
        return{
            estimatedDistanceMeters: route.distanceMeters,

            estimatedDurationSeconds: parseInt(
                route.duration.replace("s", ""),
                10
            ),
        }

    }catch(error){

        console.error(
            "Google Routes API error:",
            error.response?.data || error.message
        );

        throw error;
    }
};


export {
    getRoadDistanceAndTime
};
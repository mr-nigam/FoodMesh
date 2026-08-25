import { useNavigate } from "react-router-dom";

const RestaurantCard = ({ restaurant }) => {

    const navigate = useNavigate();

  const formatDistance = (distance) => {
    const meters = Number(distance);

    if (!Number.isFinite(meters)) {
      return "";
    }

    if(meters < 1000){
      return `${Math.round(meters)} m`;
    }

    return `${(meters / 1000).toFixed(1)} km`;
  };

  const getRestaurantTypeStyle = (type) => {
    switch (type?.toLowerCase()) {
      case "veg":
        return {
          label: "Veg",
          className: "bg-green-100 text-green-700",
        };

      case "non-veg":
        return {
          label: "Non-Veg",
          className: "bg-red-100 text-red-700",
        };

      case "both":
        return {
          label: "Veg & Non-Veg",
          className: "bg-orange-100 text-orange-700",
        };

      default:
        return {
          label: "Unknown",
          className: "bg-gray-100 text-gray-600",
        };
    }
  };

  const typeStyle = getRestaurantTypeStyle(
    restaurant.type
  );

  return (

    <div
      className={`cursor-pointer overflow-hidden rounded-xl border border-gray-200 
            bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md
            ${!restaurant.is_open ? "opacity-80" :""}}`
        }

        onClick={()=>navigate(`/restaurant/${restaurant.id}`)}
    >

      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden bg-gray-100">

        {restaurant.pictures_urls ? (
          <img
            src={restaurant.pictures_urls[0]}
            alt={restaurant.name}
            className={`h-full w-full object-cover transition duration-300 hover:scale-105
                ${!restaurant.is_open?"grayscale":""}`}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            No image
          </div>
        )}

        {/* Open / Closed */}
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium ${
            restaurant.is_open
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {restaurant.is_open ? "Open" : "Closed"}
        </span>

      </div>

      {/* Details */}
      <div className="p-4">

        {/* Name + Type */}
        <div className="flex items-start justify-between gap-2">

          <h2 className="min-w-0 truncate text-lg font-semibold text-gray-900">
            {restaurant.name}
          </h2>

          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${typeStyle.className}`}
          >
            {typeStyle.label}
          </span>

        </div>

        {/* Description */}
        {restaurant.description && (
          <p className="mt-1 line-clamp-2 text-sm text-gray-500">
            {restaurant.description}
          </p>
        )}

        {/* Rating + Distance */}
        <div className="mt-3 flex items-center justify-between">

          <div className="flex items-center gap-1">
            <span className="text-yellow-500">
              ★
            </span>

            <span className="text-sm font-medium text-gray-700">
              {restaurant.rating
                ? Number(restaurant.rating).toFixed(1)
                : "New"}
            </span>
          </div>

          <span className="text-sm font-medium text-gray-500">
            {formatDistance(restaurant.distance)}
          </span>

        </div>

        {/* Address */}
        {restaurant.address && (
          <p className="mt-2 truncate text-sm text-gray-400">
            {restaurant.address}
          </p>
        )}

      </div>
    </div>
  );
};


export default RestaurantCard;
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";
const realtimeService = import.meta.env.VITE_REALTIME_URL || "http://localhost:5000";

export {
    apiBaseUrl,
    realtimeService
};

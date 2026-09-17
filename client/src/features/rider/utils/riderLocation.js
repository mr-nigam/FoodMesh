// Utility for acquiring and tracking rider GPS coordinates accurately

export const getCurrentRiderCoords = () => {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            console.warn("Geolocation not supported by browser. Using fallback coordinates.");
            resolve({
                longitude: 77.2090,
                latitude: 28.6139,
                accuracy: 50,
                isFallback: true
            });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lon = Number(pos.coords.longitude);
                const lat = Number(pos.coords.latitude);
                resolve({
                    longitude: lon,
                    latitude: lat,
                    accuracy: pos.coords.accuracy,
                    isFallback: false
                });
            },
            (err) => {
                console.warn(`Geolocation error (${err.code}): ${err.message}. Using fallback coordinates.`);
                resolve({
                    longitude: 77.2090,
                    latitude: 28.6139,
                    accuracy: 100,
                    isFallback: true,
                    error: err.message
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 30000
            }
        );
    });
};

export const startRiderLocationWatch = (onCoordsUpdate) => {
    if (!navigator.geolocation) return null;

    let lastLon = null;
    let lastLat = null;
    let lastSentTime = 0;

    const watchId = navigator.geolocation.watchPosition(
        (pos) => {
            const lon = Number(pos.coords.longitude);
            const lat = Number(pos.coords.latitude);
            const now = Date.now();

            // Only fire if coordinates moved noticeably or 30s elapsed
            const hasMoved =
                lastLon === null ||
                Math.abs(lon - lastLon) > 0.0001 ||
                Math.abs(lat - lastLat) > 0.0001;
            const timePassed = now - lastSentTime > 30000;

            if (hasMoved || timePassed) {
                lastLon = lon;
                lastLat = lat;
                lastSentTime = now;

                onCoordsUpdate({
                    longitude: lon,
                    latitude: lat,
                    accuracy: pos.coords.accuracy
                });
            }
        },
        (err) => {
            console.warn("Location watch error:", err.message);
        },
        {
            enableHighAccuracy: true,
            maximumAge: 15000,
            timeout: 20000
        }
    );

    return watchId;
};

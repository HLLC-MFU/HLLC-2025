export function calculateDistance(
    userLat: number,
    userLong: number,
    latitude: number,
    longitude: number
): number {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371000; // Earth's radius in meters

    const dLat = toRad(latitude - userLat);
    const dLon = toRad(longitude - userLong);

    const lat1 = toRad(userLat);
    const lat2 = toRad(latitude);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}
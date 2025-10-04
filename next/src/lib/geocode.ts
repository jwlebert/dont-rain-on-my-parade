// Geocoding utilities (OpenStreetMap Nominatim)

export interface GeocodeResult {
  lat: number;
  lon: number;
  displayName: string;
}

export async function geocodeCity(city: string): Promise<GeocodeResult> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
    city
  )}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Geocoding request failed");
  const data = await res.json();
  if (!data || data.length === 0) throw new Error("Location not found");
  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    displayName: data[0].display_name as string,
  };
}

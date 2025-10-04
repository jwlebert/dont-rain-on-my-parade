'use client'

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Place {
  place_id: number;
  display_name: string;
  lat: number;
  lon: number;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [dateStr, setDateStr] = useState('');
  
  useEffect(() => {
    if (query.length < 2) return;

    const timeout = setTimeout(async () => {
      console.log(query);
      const q = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=3`;
      const res = await fetch(q);

      setPlaces(await res.json());
      console.log(places)
    }, 300);

    return () => clearTimeout(timeout);
  }, [query])

  const router = useRouter();
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (places.length == 0) return;
    const [lat, lon] = [places[0].lat, places[0].lon];
    const placeId = places[0].place_id;

    if (dateStr === '') return;
    const data = [lat, lon, placeId, dateStr];

    const str = JSON.stringify(data);
    const b64 = btoa(str);

    router.push(`/${encodeURIComponent(b64)}`)
  } 
  
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          Where to? 
          <input type="search" name="where" className="border-b-2 w-96" 
            onChange={e => setQuery(e.target.value)} value={query} />
        </label>
        <label>
          When are we going? 
          <input type="date" name="when"
            onChange={e => setDateStr(e.target.value)}/>
        </label>
        <button type="submit">Will it rain on my parade?</button>
      </form>
      { places.length > 0 && (
        places.filter(place => place.display_name === query).length != 1 // 
      ) && ( // ^ check if we picked one
            <ul>
              {places.map(place => (
                <li
                  key={place.place_id}
                  onClick={() => setQuery(place.display_name)}
                >
                  {place.display_name}
                </li>
              ))}
            </ul>
          )}
    </div>
  );
}

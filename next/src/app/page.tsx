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
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [dateStr, setDateStr] = useState('');
  
  useEffect(() => {
    if (query.length < 2) return;

    const timeout = setTimeout(async () => {
      const q = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=3`;
      // ^ query to fuzzy search Nominatim for address/place listed
      const res = await fetch(q);
      setPlaces(await res.json());
    }, 300);

    return () => clearTimeout(timeout);
  }, [query])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (dateStr === '') return;
    
    const searched = places.filter(p => p.display_name === query);
    if (searched.length == 0) return; // if our query matches a place returned by Nominatim
    const place = searched[0];

    const data = [place.lat, place.lon, place.place_id, dateStr];
    const b64 = btoa(JSON.stringify(data));

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
        {places.length > 0 && places.filter(place => place.display_name === query).length != 1 &&
        // ^ matches at least one place, and we haven't already selected it
        <ul>
          {places.map(place => 
            <li key={place.place_id}
              onClick={() => setQuery(place.display_name)}
            > {place.display_name} </li>
        )}
        </ul>}
    </div>
  );
}

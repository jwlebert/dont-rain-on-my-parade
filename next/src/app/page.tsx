'use client'

import { useEffect, useState } from "react";

interface Place {
  place_id: number;
  display_name: string;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [autoPlaces, setAutoPlaces] = useState<Place[]>([]);
  
  useEffect(() => {
    if (query.length < 2) return;

    const timeout = setTimeout(async () => {
      console.log(query);
      const q = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=3`;
      const res = await fetch(q);

      setAutoPlaces(await res.json());
      console.log(autoPlaces)
    }, 300);

    return () => clearTimeout(timeout);
  }, [query])

  const handleSubmit = () => {
    return;
  } 
  
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          Where to? 
          <input type="search" value={query} name="where" className="border-b-2 w-96" 
            onChange={e => setQuery(e.target.value)} />
        </label>
        <label>
          When are we going? 
          <input type="date" name="when" />
        </label>
        <button type="submit">Will it rain on my parade?</button>
      </form>
      { autoPlaces.length > 0 && (
        autoPlaces.filter(place => place.display_name === query).length != 1 // 
      ) && ( // ^ check if we picked one
            <ul>
              {autoPlaces.map(place => (
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

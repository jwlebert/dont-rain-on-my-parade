'use client';

import { notFound } from "next/navigation";
import React, { useEffect, useState } from "react";

interface Position {
  lat: number;
  lon: number;
}

export default function Planning({ params }: { params: Promise<{ slug: string }> }) {
  const [pos, setPos] = useState<Position>();
  const [placeId, setPlaceId] = useState(0);
  const [dateStr, setDateStr] = useState('');

  const {slug} = React.use(params);
  useEffect(() => {
    try {
      const decoded = JSON.parse(atob(decodeURIComponent(slug)));
      if (!Array.isArray(decoded)) throw Error("invalid slug");
      const [lat, lon, id, dateStr] = decoded;
  
      setPos({lat, lon});
      setPlaceId(id);
      setDateStr(dateStr);
    } catch (e) {
      console.error(e);
      notFound();
    }
  }, [slug]);
  
  return <div>My Post: {placeId}</div>
}
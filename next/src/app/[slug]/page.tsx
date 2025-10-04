'use client';

import React from "react";

export default function Planning({ params }: { params: Promise<{ slug: string }> }) {
  const {slug} = React.use(params);
  const decoded = JSON.parse(atob(decodeURIComponent(slug)))
  const [lat, lon, placeId, dateStr] = decoded;

  return <div>My Post: {placeId}</div>
}
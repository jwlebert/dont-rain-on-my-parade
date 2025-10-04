// Core NASA POWER utilities (fetching, transforming, CSV export)
export const START_YEAR = 2015;
export const END_YEAR = 2024;

export const POWER_PARAMS = [
  "T2M", // Temperature at 2m (°C)
  "T2M_MAX", // Max temperature (°C)
  "T2M_MIN", // Min temperature (°C)
  "PRECTOTCORR", // Precipitation (mm/day)
  "WS2M", // Wind speed at 2m (m/s)
  "RH2M", // Relative humidity (%)
  "PS", // Surface pressure (kPa)
] as const;

export type PowerParam = (typeof POWER_PARAMS)[number];

export interface PowerRow {
  date: string; // YYYY-MM-DD
  [key: string]: number | string | null;
}

export function buildNasaPowerUrl(
  lat: number,
  lon: number,
  params: readonly PowerParam[] = POWER_PARAMS
) {
  const start = `${START_YEAR}0101`;
  const end = `${END_YEAR}1231`;
  const paramsStr = params.join(",");
  return `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${paramsStr}&community=RE&longitude=${lon}&latitude=${lat}&start=${start}&end=${end}&format=JSON`;
}

export async function fetchNasaPower(
  lat: number,
  lon: number,
  params: readonly PowerParam[] = POWER_PARAMS
) {
  const url = buildNasaPowerUrl(lat, lon, params);
  const res = await fetch(url);
  if (!res.ok) throw new Error("NASA POWER request failed");
  return res.json();
}

export function transformPowerToRows(
  powerJson: any,
  params: readonly PowerParam[] = POWER_PARAMS
): PowerRow[] {
  const param = powerJson?.properties?.parameter;
  if (!param) return [];

  const dateSet = new Set<string>();
  for (const p of params) {
    const series = param[p as string];
    if (series) Object.keys(series).forEach((d) => dateSet.add(d));
  }
  const dates = Array.from(dateSet).sort();

  return dates.map((d) => {
    const row: PowerRow = {
      date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
    };
    for (const p of params) {
      const v = param[p as string]?.[d];
      row[p as string] = v === -999 || v === undefined ? null : v;
    }
    return row;
  });
}

export function toCsv(
  rows: PowerRow[],
  params: readonly PowerParam[] = POWER_PARAMS
): string {
  if (rows.length === 0) return "";
  const headers = ["date", ...params];
  const lines = [headers.join(",")];
  for (const r of rows) {
    const line = headers
      .map((h) => (r[h] ?? "").toString().replace(/,/g, ""))
      .join(",");
    lines.push(line);
  }
  return lines.join("\n");
}

export function validateLatLon(lat: number, lon: number) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error("Latitude/Longitude must be numbers");
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new Error("Latitude must be [-90, 90] and longitude [-180, 180]");
  }
}

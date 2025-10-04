// scoring.ts - All scoring types and functions

import type { PowerRow } from "./nasaPower";

export type rainLevel = "none" | "light" | "moderate" | "heavy";
export type windLevel = "none" | "light" | "moderate" | "heavy";

export interface Preferences {
  tempMin?: number;
  tempMax?: number;
  desiredRainMm?: number;
  desiredRainLevel?: rainLevel;
  desiredWindMs?: number;
  desiredWindLevel?: windLevel;
  weights?: { Rain?: number; wind?: number; temp?: number };
  tolerances?: { Rain?: number; wind?: number; temp?: number };
}

export interface ScoreBreakdown {
  date: string;
  rainScore: number; // 0..1
  windScore: number; // 0..1
  tempScore: number; // 0..1
  combined: number; // 0..1
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function mapRainLevelToMm(l: rainLevel): number {
  switch (l) {
    case "none":
      return 0;
    case "light":
      return 5;
    case "moderate":
      return 20;
    case "heavy":
      return 40;
    default:
      return 0;
  }
}

function mapWindLevelToMs(l: windLevel): number {
  switch (l) {
    case "none":
      return 0;
    case "light":
      return 3.5;
    case "moderate":
      return 9.0;
    case "heavy":
      return 17;
    default:
      return 0;
  }
}

export function scoreRow(row: PowerRow, prefs: Preferences): ScoreBreakdown {
  const rain = row["PRECTOTCORR"] as number | null | undefined;
  const wind = row["WS2M"] as number | null | undefined;
  const temp = row["T2M"] as number | null | undefined;

  const targetRain =
    prefs.desiredRainMm ??
    (prefs.desiredRainLevel
      ? mapRainLevelToMm(prefs.desiredRainLevel)
      : undefined);
  const targetWind =
    prefs.desiredWindMs ??
    (prefs.desiredWindLevel
      ? mapWindLevelToMs(prefs.desiredWindLevel)
      : undefined);

  const tolRain =
    prefs.tolerances?.Rain ??
    (() => {
      if (targetRain === undefined) return 5.0;
      if (targetRain === 0) return 3.0;
      if (targetRain <= 10) return 6.0;
      return targetRain * 0.6;
    })();

  const tolWind = prefs.tolerances?.wind ?? 3.0;
  const tolTemp = prefs.tolerances?.temp ?? 5.0;

  // Precipitation score
  let rainScore = 1;
  if (targetRain === undefined) {
    const defaultTarget = 0;
    if (!Number.isFinite(rain as number)) {
      rainScore = 0.5;
    } else {
      const diff = Math.abs((rain as number) - defaultTarget);
      rainScore = clamp01(1 - diff / 3.0);
    }
  } else if (!Number.isFinite(rain as number)) {
    rainScore = 0.5;
  } else {
    const diff = Math.abs((rain as number) - targetRain);
    rainScore = clamp01(1 - diff / tolRain);
  }

  // Wind score
  let windScore = 1;
  if (targetWind === undefined) {
    const defaultTarget = 2.0;
    if (!Number.isFinite(wind as number)) {
      windScore = 0.5;
    } else {
      const diff = Math.abs((wind as number) - defaultTarget);
      windScore = clamp01(1 - diff / 4.0);
    }
  } else if (!Number.isFinite(wind as number)) {
    windScore = 0.5;
  } else {
    const diff = Math.abs((wind as number) - targetWind);
    windScore = clamp01(1 - diff / tolWind);
  }

  // Temperature score
  let tempScore = 1;
  if (prefs.tempMin === undefined && prefs.tempMax === undefined) {
    if (!Number.isFinite(temp as number)) {
      tempScore = 0.5;
    } else {
      const t = temp as number;
      const idealMin = 18;
      const idealMax = 26;

      if (t >= idealMin && t <= idealMax) {
        tempScore = 1;
      } else if (t < idealMin) {
        const diff = idealMin - t;
        tempScore = clamp01(1 - diff / tolTemp);
      } else {
        const diff = t - idealMax;
        tempScore = clamp01(1 - diff / tolTemp);
      }
    }
  } else if (!Number.isFinite(temp as number)) {
    tempScore = 0.5;
  } else {
    const t = temp as number;
    const min = prefs.tempMin ?? -Infinity;
    const max = prefs.tempMax ?? Infinity;

    if (t >= min && t <= max) {
      tempScore = 1;
    } else {
      const dist = t < min ? min - t : t - max;
      tempScore = clamp01(1 - dist / tolTemp);
    }
  }

  // Combine with weights
  const w = prefs.weights ?? {
    Rain: 0.5,
    wind: 0.2,
    temp: 0.3,
  };

  const sumW = (w.Rain ?? 0) + (w.wind ?? 0) + (w.temp ?? 0);
  const wp = (w.Rain ?? 0) / (sumW || 1);
  const ww = (w.wind ?? 0) / (sumW || 1);
  const wt = (w.temp ?? 0) / (sumW || 1);

  const combined = clamp01(rainScore * wp + windScore * ww + tempScore * wt);

  return {
    date: row.date,
    rainScore,
    windScore,
    tempScore,
    combined,
  };
}

export function toParadeScore(combined: number): number {
  const curved = Math.pow(combined, 0.9);
  return Math.round(curved * 100);
}

/**
 * Score multiple rows and return with parade scores
 */
export function scoreRows(rows: PowerRow[], prefs: Preferences) {
  return rows.map((row) => {
    const breakdown = scoreRow(row, prefs);
    return {
      ...breakdown,
      paradeScore: toParadeScore(breakdown.combined),
    };
  });
}

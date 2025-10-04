// stats.ts - All statistical analysis

import type { PowerRow } from "./nasaPower";
import type { ScoreBreakdown, Preferences } from "./scoring";
import { scoreRow, toParadeScore } from "./scoring";

export interface WeatherStats {
  avgScore: number;
  maxScore: number;
  minScore: number;
  goodYears: number;
  totalYears: number;
  percentGood: number;
  yearsWithRain: number;
  avgTemp: number;
  avgRain: number;
  avgWind: number;
}

export function calculateDateStats(
  rows: PowerRow[],
  prefs: Preferences
): WeatherStats {
  const breakdowns = rows.map((r) => scoreRow(r, prefs));
  const paradeScores = breakdowns.map((b) => toParadeScore(b.combined));

  const temps = rows
    .map((r) => r["T2M"] as number)
    .filter((t) => Number.isFinite(t));
  const avgTemp =
    temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 0;

  const rains = rows
    .map((r) => r["PRECTOTCORR"] as number)
    .filter((r) => Number.isFinite(r));
  const avgRain =
    rains.length > 0 ? rains.reduce((a, b) => a + b, 0) / rains.length : 0;
  const yearsWithRain = rains.filter((r) => r > 1.0).length;

  const winds = rows
    .map((r) => r["WS2M"] as number)
    .filter((w) => Number.isFinite(w));
  const avgWind =
    winds.length > 0 ? winds.reduce((a, b) => a + b, 0) / winds.length : 0;

  return {
    avgScore: Math.round(
      paradeScores.reduce((a, b) => a + b, 0) / paradeScores.length
    ),
    maxScore: Math.max(...paradeScores),
    minScore: Math.min(...paradeScores),
    goodYears: paradeScores.filter((s) => s >= 70).length,
    totalYears: paradeScores.length,
    percentGood: Math.round(
      (paradeScores.filter((s) => s >= 70).length / paradeScores.length) * 100
    ),
    yearsWithRain,
    avgTemp: Math.round(avgTemp * 10) / 10,
    avgRain: Math.round(avgRain * 10) / 10,
    avgWind: Math.round(avgWind * 10) / 10,
  };
}

export interface HistoricalTrendPoint {
  year: string;
  score: number;
  avgTemp: number | null;
  extremeDays?: number;
}

export function getHistoricalTrend(
  rows: PowerRow[],
  prefs: Preferences
): HistoricalTrendPoint[] {
  const byYear = new Map<number, PowerRow>();
  rows.forEach((row) => {
    const year = parseInt(row.date.split("-")[0]);
    byYear.set(year, row);
  });

  return Array.from(byYear.entries())
    .map(([year, row]) => {
      const breakdown = scoreRow(row, prefs);
      const temp = row["T2M"] as number;
      return {
        year: year.toString(),
        score: toParadeScore(breakdown.combined),
        avgTemp: Number.isFinite(temp) ? Math.round(temp * 10) / 10 : null,
      };
    })
    .sort((a, b) => parseInt(a.year) - parseInt(b.year));
}

export interface AlternativeDate {
  date: string;
  score: number;
  improvement: number;
}

export function findAlternativeDates(
  allRows: PowerRow[],
  targetDate: string,
  prefs: Preferences,
  maxAlternatives = 3
): AlternativeDate[] {
  const [targetYear, targetMonth] = targetDate.split("-").map(Number);
  const targetRow = allRows.find((r) => r.date === targetDate);

  if (!targetRow) return [];

  const targetBreakdown = scoreRow(targetRow, prefs);
  const targetScore = toParadeScore(targetBreakdown.combined);

  const sameMonth = allRows.filter((row) => {
    const [year, month] = row.date.split("-").map(Number);
    return (
      year === targetYear && month === targetMonth && row.date !== targetDate
    );
  });

  const scored = sameMonth.map((row) => {
    const breakdown = scoreRow(row, prefs);
    const score = toParadeScore(breakdown.combined);
    return {
      date: row.date,
      score,
      improvement: Math.round(((score - targetScore) / targetScore) * 100),
    };
  });

  return scored
    .filter((s) => s.score > targetScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxAlternatives);
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Coordinate } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function haversineDistance(coords1: Coordinate, coords2: Coordinate): number {
  const toRad = (x: number) => x * Math.PI / 180;

  const R = 6371; // Kilometres
  const φ1 = toRad(coords1.lat);
  const φ2 = toRad(coords2.lat);
  const Δφ = toRad(coords2.lat - coords1.lat);
  const Δλ = toRad(coords2.lon - coords1.lon);

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in kilometres
}

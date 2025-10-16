import type { ThematicRoute, PointOfInterest } from './types';
import routesData from './data/kula-routes.json';
import poisData from './data/kula-pois.json';

// A simple in-memory cache to simulate a database and avoid re-reading files.
const routes: ThematicRoute[] = routesData.routes;
const pois: PointOfInterest[] = poisData.pois;

export async function getRoutes(): Promise<ThematicRoute[]> {
  return routes;
}

export async function getPois(): Promise<PointOfInterest[]> {
  return pois;
}

export async function getRouteBySlug(slug: string): Promise<ThematicRoute | undefined> {
  return routes.find(route => route.slug === slug);
}

export async function getPoiById(id: string): Promise<PointOfInterest | undefined> {
  return pois.find(poi => poi.id === id);
}

export async function getPoisByIds(ids: string[]): Promise<PointOfInterest[]> {
    return pois.filter(poi => ids.includes(poi.id));
}

export async function getFeaturedRoute(): Promise<ThematicRoute | undefined> {
    return routes.find(route => route.isFeatured);
}

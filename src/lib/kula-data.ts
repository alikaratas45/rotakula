import type { ThematicRoute, PointOfInterest, Story } from './types';
import routesData from './data/kula-routes.json';
import poisData from './data/kula-pois.json';
import storiesData from './data/kula-stories.json';

// A simple in-memory cache to simulate a database and avoid re-reading files.
const routes: ThematicRoute[] = routesData.routes;
const pois: PointOfInterest[] = poisData.pois;
const stories: Story[] = storiesData.stories;

// Adding a delay to simulate network latency
const DELAY = 50;

export async function getRoutes(): Promise<ThematicRoute[]> {
  await new Promise(resolve => setTimeout(resolve, DELAY));
  return routes;
}

export async function getPois(): Promise<PointOfInterest[]> {
  await new Promise(resolve => setTimeout(resolve, DELAY));
  return pois;
}

export async function getStories(): Promise<Story[]> {
  await new Promise(resolve => setTimeout(resolve, DELAY));
  return stories;
}

export async function getRouteBySlug(slug: string): Promise<ThematicRoute | undefined> {
  await new Promise(resolve => setTimeout(resolve, DELAY));
  return routes.find(route => route.slug === slug);
}

export async function getStoryBySlug(slug: string): Promise<Story | undefined> {
  await new Promise(resolve => setTimeout(resolve, DELAY));
  return stories.find(story => story.slug === slug);
}

export async function getPoiById(id: string): Promise<PointOfInterest | undefined> {
  await new Promise(resolve => setTimeout(resolve, DELAY));
  return pois.find(poi => poi.id === id);
}

export async function getPoisByIds(ids: string[]): Promise<PointOfInterest[]> {
    await new Promise(resolve => setTimeout(resolve, DELAY));
    return pois.filter(poi => ids.includes(poi.id));
}

export async function getFeaturedRoute(): Promise<ThematicRoute | undefined> {
    await new Promise(resolve => setTimeout(resolve, DELAY));
    return routes.find(route => route.isFeatured);
}

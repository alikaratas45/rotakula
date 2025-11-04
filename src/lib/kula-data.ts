
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

function translateItem<T extends { [key: string]: any }>(item: T, lang: string): T {
    if (lang !== 'tr') { // Default is Turkish, so only translate if not Turkish
        const translatedItem = { ...item };
        Object.keys(item).forEach(key => {
            const langKey = `${key}_${lang}`;
            if (langKey in item) {
                translatedItem[key] = item[langKey];
            }
        });
        return translatedItem;
    }
    return item;
}

export async function getRoutes(lang: string = 'tr'): Promise<ThematicRoute[]> {
  await new Promise(resolve => setTimeout(resolve, DELAY));
  return routes.map(route => translateItem(route, lang));
}

export async function getPois(lang: string = 'tr'): Promise<PointOfInterest[]> {
  await new Promise(resolve => setTimeout(resolve, DELAY));
  return pois.map(poi => translateItem(poi, lang));
}

export async function getStories(lang: string = 'tr'): Promise<Story[]> {
  await new Promise(resolve => setTimeout(resolve, DELAY));
  return stories.map(story => translateItem(story, lang));
}

export async function getRouteBySlug(slug: string, lang: string = 'tr'): Promise<ThematicRoute | undefined> {
  await new Promise(resolve => setTimeout(resolve, DELAY));
  const route = routes.find(route => route.slug === slug);
  return route ? translateItem(route, lang) : undefined;
}

export async function getStoryBySlug(slug: string, lang: string = 'tr'): Promise<Story | undefined> {
  await new Promise(resolve => setTimeout(resolve, DELAY));
  const story = stories.find(story => story.slug === slug);
  return story ? translateItem(story, lang) : undefined;
}

export async function getPoiBySlug(slug: string, lang: string = 'tr'): Promise<PointOfInterest | undefined> {
  await new Promise(resolve => setTimeout(resolve, DELAY));
  const poi = pois.find(poi => poi.slug === slug);
  return poi ? translateItem(poi, lang) : undefined;
}


export async function getPoiById(id: string, lang: string = 'tr'): Promise<PointOfInterest | undefined> {
  await new Promise(resolve => setTimeout(resolve, DELAY));
  const poi = pois.find(poi => poi.id === id);
  return poi ? translateItem(poi, lang) : undefined;
}

export async function getPoisByIds(ids: string[], lang: string = 'tr'): Promise<PointOfInterest[]> {
    await new Promise(resolve => setTimeout(resolve, DELAY));
    const filteredPois = pois.filter(poi => ids.includes(poi.id));
    return filteredPois.map(poi => translateItem(poi, lang));
}

export async function getFeaturedRoute(lang: string = 'tr'): Promise<ThematicRoute | undefined> {
    await new Promise(resolve => setTimeout(resolve, DELAY));
    if (routes.length === 0) {
        return undefined;
    }
    // Return the first route as the featured route to avoid hydration issues with date-fns.
    const route = routes[0];
    return route ? translateItem(route, lang) : undefined;
}

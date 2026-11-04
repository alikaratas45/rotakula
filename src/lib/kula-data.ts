

import type { ThematicRoute, PointOfInterest, Story, BikeRoute, WalkingRoute } from './types';
import routesData from './data/kula-routes.json';
import poisData from './data/kula-pois.json';
import storiesData from './data/kula-stories.json';
import bikeRoutesData from './data/bike-routes.json';
import walkingRoutesData from './data/walking-routes.json';
import audioNarrations from './data/audio-narrations.json';
import { collection, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';


// A simple in-memory cache to simulate a database and avoid re-reading files.
const routes: ThematicRoute[] = routesData.routes;
const pois: PointOfInterest[] = poisData.pois as PointOfInterest[];
const stories: Story[] = storiesData.stories;
const bikeRoutes: BikeRoute[] = bikeRoutesData.bikeRoutes;
const walkingRoutes: WalkingRoute[] = walkingRoutesData.walkingRoutes;

type StoredPoi = PointOfInterest & { deleted?: boolean };
type StoredRoute<T> = T & { deleted?: boolean };

// Adding a delay to simulate network latency
const DELAY = 50;

async function getAllPois(): Promise<PointOfInterest[]> {
  await new Promise(resolve => setTimeout(resolve, DELAY));

  const poiMap = new Map(pois.map(poi => [poi.id, poi]));
  const snapshot = await getDocs(collection(initializeFirebase().firestore, 'pois'));

  snapshot.forEach(document => {
    const storedPoi = { ...document.data(), id: document.id } as StoredPoi;
    if (storedPoi.deleted) {
      poiMap.delete(document.id);
      return;
    }

    const { deleted: _deleted, ...poi } = storedPoi;
    const bundledPoi = poiMap.get(document.id);
    const mergedPoi = {
      ...bundledPoi,
      ...poi,
      id: document.id,
    } as PointOfInterest & Record<string, unknown>;

    if (bundledPoi) {
      const bundledRecord = bundledPoi as PointOfInterest & Record<string, unknown>;
      const storedRecord = poi as PointOfInterest & Record<string, unknown>;
      Object.keys(bundledPoi).forEach(key => {
        const localizedField = key.match(/^(.+)_(en|fr|de)$/);
        if (!localizedField) return;

        const [, baseField] = localizedField;
        const bundledTranslation = bundledRecord[key];
        const storedTranslation = storedRecord[key];
        const storedBaseValue = storedRecord[baseField];
        const bundledBaseValue = bundledRecord[baseField];

        if (
          typeof bundledTranslation === 'string' &&
          bundledTranslation.trim() &&
          (typeof storedTranslation !== 'string' ||
            !storedTranslation.trim() ||
            (typeof storedBaseValue === 'string' && storedTranslation === storedBaseValue) ||
            (typeof bundledBaseValue === 'string' && storedTranslation === bundledBaseValue))
        ) {
          mergedPoi[key] = bundledTranslation;
        }
      });
    }

    poiMap.set(document.id, mergedPoi);
  });

  return Array.from(poiMap.values());
}

async function getRoutesWithOverrides<T extends { id: string }>(
  bundledRoutes: T[],
  collectionName: string
): Promise<T[]> {
  const routeMap = new Map(bundledRoutes.map(route => [route.id, route]));
  const snapshot = await getDocs(collection(initializeFirebase().firestore, collectionName));

  snapshot.forEach(document => {
    const storedRoute = { ...document.data(), id: document.id } as StoredRoute<T>;
    if (storedRoute.deleted) {
      routeMap.delete(document.id);
      return;
    }

    const { deleted: _deleted, ...route } = storedRoute;
    routeMap.set(document.id, { ...routeMap.get(document.id), ...route, id: document.id } as T);
  });

  return Array.from(routeMap.values());
}

function translateItem<T extends { [key: string]: any }>(item: T, lang: string): T {
  if (lang === 'tr') return item;

  const suffix = `_${lang}`;
  const translatedItem: Record<string, any> = { ...item };
  Object.keys(item).forEach(key => {
    if (key.endsWith(suffix)) return;

    const localizedValue = item[`${key}${suffix}`];
    if (typeof localizedValue === 'string' && localizedValue.trim()) {
      translatedItem[key] = localizedValue;
    }
  });

  return translatedItem as T;
}

export async function getRoutes(lang: string = 'tr'): Promise<ThematicRoute[]> {
  await new Promise(resolve => setTimeout(resolve, DELAY));
  return routes.map(route => translateItem(route, lang));
}

export async function getBikeRoutes(lang: string = 'tr'): Promise<BikeRoute[]> {
  const allRoutes = await getRoutesWithOverrides(bikeRoutes, 'bikeRoutes');
  return allRoutes.map(route => translateItem(route, lang));
}

export async function getWalkingRoutes(lang: string = 'tr'): Promise<WalkingRoute[]> {
  const allRoutes = await getRoutesWithOverrides(walkingRoutes, 'walkingRoutes');
  return allRoutes.map(route => translateItem(route, lang));
}

export async function getPois(lang: string = 'tr'): Promise<PointOfInterest[]> {
  const allPois = await getAllPois();
  return allPois.map(poi => translateItem(poi, lang));
}

export async function getStories(lang: string = 'tr'): Promise<Story[]> {
  await new Promise(resolve => setTimeout(resolve, DELAY));
  const famousProductSlugs = ['kula-halisi', 'kula-leblebisi'];
  const filteredStories = stories.filter(story => !famousProductSlugs.includes(story.slug));
  return filteredStories.map(story => translateItem(story, lang));
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
  const poi = (await getAllPois()).find(poi => poi.slug === slug);
  return poi ? translateItem(poi, lang) : undefined;
}


export async function getPoiById(id: string, lang: string = 'tr'): Promise<PointOfInterest | undefined> {
  const poi = (await getAllPois()).find(poi => poi.id === id);
  return poi ? translateItem(poi, lang) : undefined;
}

export async function getPoisByIds(ids: string[], lang: string = 'tr'): Promise<PointOfInterest[]> {
    const poiMap = new Map((await getAllPois()).map(poi => [poi.id, poi]));
    const orderedPois = ids.map(id => poiMap.get(id)).filter((poi): poi is PointOfInterest => !!poi);
    return orderedPois.map(poi => translateItem(poi, lang));
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

export function getAudioUrl(slug: string): string | null {
  const narrations: { [key: string]: string } = (audioNarrations as any).narrations;
  const fileUrl = narrations[slug];
  
  // The value in the JSON should be the full URL.
  // If it's an empty string or a placeholder, return null.
  if (fileUrl && fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  
  return null;
}

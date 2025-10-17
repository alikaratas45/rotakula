export type Coordinate = {
  lat: number;
  lon: number;
};

export type PointOfInterest = {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  category: 'geopark' | 'history' | 'food' | 'nature' | 'accommodation';
  imageId: string;
  latitude: number;
  longitude: number;
  mapQuery?: string;
};

export type ThematicRoute = {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  imageId: string;
  poiIds: string[];
};

export type Story = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  imageId: string;
};

export type TtsInput = string;
export type TtsOutput = {
  media: string;
};

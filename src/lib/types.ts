export type PointOfInterest = {
  id: string;
  name: string;
  description: string;
  category: 'geopark' | 'history' | 'food' | 'nature' | 'accommodation';
  imageId: string;
  latitude: number;
  longitude: number;
};

export type ThematicRoute = {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  imageId: string;
  poiIds: string[];
  isFeatured?: boolean;
};


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
  name_en?: string;
  description_en?: string;
  longDescription_en?: string;
  category_en?: string;
  name_fr?: string;
  description_fr?: string;
  longDescription_fr?: string;
  category_fr?: string;
  name_de?: string;
  description_de?: string;
  longDescription_de?: string;
  category_de?: string;
  badgeId?: string;
  points?: number;
};

export type ThematicRoute = {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  imageId: string;
  poiIds: string[];
  title_en?: string;
  description_en?: string;
  longDescription_en?: string;
  title_fr?: string;
  description_fr?: string;
  longDescription_fr?: string;
  title_de?: string;
  description_de?: string;
  longDescription_de?: string;
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
  title_en?: string;
  excerpt_en?: string;
  content_en?: string;
  title_fr?: string;
  excerpt_fr?: string;
  content_fr?: string;
  title_de?: string;
  excerpt_de?: string;
  content_de?: string;
};

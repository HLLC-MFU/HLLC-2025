// src/types/coin-hunting.ts

import { Lang } from './lang';

export type Marker = {
  x: number;
  y: number;
  image: string;
  description: Lang;
  mapsUrl: string;
  _id: string;
  coinImage?: string;
};

export type MapApiResponse = {
  data: {
    data: Array<{ map: string }>;
  };
};

export type LandmarkApiItem = {
  _id: string;
  mapCoordinates?: { x?: number; y?: number };
  hintImage?: string;
  hint?: { th?: string; en?: string };
  location?: { mapUrl?: string };
  coinImage?: string;
  order?: number;
};

export type LandmarkApiResponse = {
  data: {
    data: LandmarkApiItem[];
  };
};

export type CoinCollectionLandmark = {
  landmark?: LandmarkApiItem;
};

export type CoinCollectionApiItem = {
  landmarks?: CoinCollectionLandmark[];
};

export type CoinCollectionApiResponse = {
  data?: {
    data?: CoinCollectionApiItem[];
  };
};

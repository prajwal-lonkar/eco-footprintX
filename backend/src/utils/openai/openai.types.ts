export interface Coordinates {
  latitude: number;
  longitude: number;
}

export enum TransportMode {
  ROAD = 'road',
  RAIL = 'rail',
  SEA = 'sea',
  AIR = 'air',
}

export enum UserTransportMethod {
  TRAIN = 'train',
  AIRCRAFT = 'aircraft',
  SEA = 'sea',
}

export interface TravelRoute {
  origin: Coordinates;
  destination: Coordinates;
  transportMethod: UserTransportMethod;
  distanceKm: number;
  routeDescription: string;
}

export interface ImpactCategoryInput {
  productName: string;
  productCategory: string;
  productSize: string;
  productUnit: string;
  comparisonProductDescription: string | undefined;
}

export interface ImpactCategoryEntry {
  value: number;
  unit: string;
  calculationSteps: string;
  sources: string[];
}

export interface ImpactCategoryResult {
  carbonEmissions: ImpactCategoryEntry;
  waterUsage: ImpactCategoryEntry;
  landUse: ImpactCategoryEntry;
  wasteGeneration: ImpactCategoryEntry;
}

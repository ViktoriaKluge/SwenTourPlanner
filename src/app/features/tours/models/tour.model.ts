export type TransportType = 'walking' | 'running' | 'cycling';

export type Tour = {
  id: string;
  username: string;
  title: string;
  transportType: TransportType;
  accessible: boolean;
  favorite: boolean;
  description: string;
  startPoint: Location;
  endPoint: Location;
  poi: Location[];
  route: Route;
  logs: TourLog[];
  popularity?: number;
  childFriendliness?: string;
};

export type Location = {
  name: string;
  latitude: number;
  longitude: number;
};

export type Route = {
  distance: number;
  durationMin: number;
  geometry?: [number, number][];
};

export type TourLog = {
  id: string;
  date: Date;
  comment: string;
  difficulty: number;
  totalDistance: number;
  totalTime: number;
  rating: number;
};

export type Weather = {
  providerConfigured: boolean;
  coverageLabel?: string;
  locationName?: string;
  description?: string;
  temperatureCelsius?: number;
  temperatureMinCelsius?: number;
  temperatureMaxCelsius?: number;
  feelsLikeCelsius?: number;
  feelsLikeMinCelsius?: number;
  feelsLikeMaxCelsius?: number;
  humidity?: number;
  windKmh?: number;
  sampleCount?: number;
  clothingAdvice: string;
  message?: string;
};

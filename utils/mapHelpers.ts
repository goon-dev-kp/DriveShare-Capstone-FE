import bbox from '@turf/bbox';
import { point, lineString } from '@turf/helpers';

/**
 * Calculate bounding box for a route with padding
 */
export const calculateRouteBounds = (
  coordinates: GeoJSON.Position[]
): { ne: [number, number]; sw: [number, number] } | null => {
  if (!coordinates || coordinates.length === 0) {
    return null;
  }

  const line = lineString(coordinates);
  const [minLng, minLat, maxLng, maxLat] = bbox(line);

  return {
    ne: [maxLng, maxLat],
    sw: [minLng, minLat],
  };
};

/**
 * Calculate bounds for multiple points
 */
export const calculatePointsBounds = (
  points: GeoJSON.Position[]
): { ne: [number, number]; sw: [number, number] } | null => {
  if (!points || points.length === 0) {
    return null;
  }

  let minLng = points[0][0];
  let maxLng = points[0][0];
  let minLat = points[0][1];
  let maxLat = points[0][1];

  points.forEach(([lng, lat]) => {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  });

  return {
    ne: [maxLng, maxLat],
    sw: [minLng, minLat],
  };
};

/**
 * Add padding to bounds (in degrees)
 */
export const addPaddingToBounds = (
  bounds: { ne: [number, number]; sw: [number, number] },
  paddingPercent: number = 0.1
): { ne: [number, number]; sw: [number, number] } => {
  const lngPadding = (bounds.ne[0] - bounds.sw[0]) * paddingPercent;
  const latPadding = (bounds.ne[1] - bounds.sw[1]) * paddingPercent;

  return {
    ne: [bounds.ne[0] + lngPadding, bounds.ne[1] + latPadding],
    sw: [bounds.sw[0] - lngPadding, bounds.sw[1] - latPadding],
  };
};

/**
 * Camera animation configurations
 */
export const CameraAnimations = {
  flyTo: {
    animationMode: 'flyTo' as const,
    animationDuration: 2000,
  },
  easeTo: {
    animationMode: 'easeTo' as const,
    animationDuration: 1000,
  },
  moveTo: {
    animationMode: 'moveTo' as const,
    animationDuration: 500,
  },
};

/**
 * Generate camera config for fitting route
 */
export const getCameraConfigForRoute = (
  coordinates: GeoJSON.Position[],
  options?: {
    padding?: number;
    animationMode?: 'flyTo' | 'easeTo' | 'moveTo';
    animationDuration?: number;
  }
): {
  bounds: { ne: [number, number]; sw: [number, number] };
  animationMode: string;
  animationDuration: number;
  padding?: number;
} | null => {
  const bounds = calculateRouteBounds(coordinates);
  if (!bounds) return null;

  const paddedBounds = options?.padding
    ? addPaddingToBounds(bounds, options.padding)
    : addPaddingToBounds(bounds);

  return {
    bounds: paddedBounds,
    animationMode: options?.animationMode || 'flyTo',
    animationDuration: options?.animationDuration || 2000,
    ...(options?.padding && { padding: options.padding }),
  };
};

/**
 * Generate camera config for centering on point
 */
export const getCameraConfigForPoint = (
  coordinate: GeoJSON.Position,
  options?: {
    zoomLevel?: number;
    animationMode?: 'flyTo' | 'easeTo' | 'moveTo';
    animationDuration?: number;
  }
): {
  centerCoordinate: [number, number];
  zoomLevel: number;
  animationMode: string;
  animationDuration: number;
} => {
  return {
    centerCoordinate: coordinate as [number, number],
    zoomLevel: options?.zoomLevel || 16,
    animationMode: options?.animationMode || 'flyTo',
    animationDuration: options?.animationDuration || 1500,
  };
};

/**
 * Calculate center point of coordinates
 */
export const getCenterOfCoordinates = (
  coordinates: GeoJSON.Position[]
): [number, number] | null => {
  if (!coordinates || coordinates.length === 0) {
    return null;
  }

  const sum = coordinates.reduce(
    (acc, [lng, lat]) => {
      acc.lng += lng;
      acc.lat += lat;
      return acc;
    },
    { lng: 0, lat: 0 }
  );

  return [sum.lng / coordinates.length, sum.lat / coordinates.length];
};

/**
 * Content inset configurations for different navigation states
 */
export const ContentInsets = {
  navigation: [150, 0, 120, 0] as [number, number, number, number],
  overview: [80, 20, 80, 20] as [number, number, number, number],
  default: [0, 0, 0, 0] as [number, number, number, number],
};

/**
 * Get optimal zoom level based on distance
 */
export const getOptimalZoomLevel = (distanceKm: number): number => {
  if (distanceKm < 1) return 16;
  if (distanceKm < 5) return 14;
  if (distanceKm < 10) return 13;
  if (distanceKm < 20) return 12;
  if (distanceKm < 50) return 11;
  if (distanceKm < 100) return 10;
  return 9;
};

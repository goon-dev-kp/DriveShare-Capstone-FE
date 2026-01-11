import React from 'react';
import { Platform } from 'react-native';

let ShapeSource: any, LineLayer: any;
if (Platform.OS !== 'web') {
  const VietMapGL = require('@vietmap/vietmap-gl-react-native');
  ShapeSource = VietMapGL.ShapeSource;
  LineLayer = VietMapGL.LineLayer;
}

interface GradientRouteLayerProps {
  route: GeoJSON.Feature<GeoJSON.LineString> | null;
  progressCoordinates?: GeoJSON.Position[];
  routeColor?: string;
  progressColor?: string;
  lineWidth?: number;
  useGradient?: boolean;
}

export const GradientRouteLayer: React.FC<GradientRouteLayerProps> = ({
  route,
  progressCoordinates,
  routeColor = 'white',
  progressColor = '#314ccd',
  lineWidth = 6,
  useGradient = true,
}) => {
  if (!route) {
    return null;
  }

  const routeLayerStyle = {
    lineColor: routeColor,
    lineCap: 'round' as const,
    lineJoin: 'round' as const,
    lineWidth: lineWidth,
    lineOpacity: 0.84,
  };

  const progressLayerStyle = useGradient
    ? {
        lineColor: progressColor,
        lineCap: 'round' as const,
        lineJoin: 'round' as const,
        lineWidth: lineWidth,
        lineGradient: [
          'interpolate',
          ['linear'],
          ['line-progress'],
          0,
          '#4264fb',
          0.3,
          '#314ccd',
          0.6,
          '#2563eb',
          1,
          '#1e40af',
        ],
      }
    : {
        lineColor: progressColor,
        lineCap: 'round' as const,
        lineJoin: 'round' as const,
        lineWidth: lineWidth,
      };

  const renderProgressLine = () => {
    if (!progressCoordinates || progressCoordinates.length < 2) {
      return null;
    }

    const lineString: GeoJSON.LineString = {
      type: 'LineString',
      coordinates: progressCoordinates,
    };

    return (
      <ShapeSource
        id="progressSource"
        shape={lineString}
        lineMetrics={useGradient}
      >
<LineLayer
          id="progress-line"
          style={progressLayerStyle}
        />
</ShapeSource>
    );
  };

  return (
    <>
<ShapeSource id="route-source" shape={route}>
<LineLayer id="route-line" style={routeLayerStyle} />
</ShapeSource>

      {renderProgressLine()}
    </>
  );
};

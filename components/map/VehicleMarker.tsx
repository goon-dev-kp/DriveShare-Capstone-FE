import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

// Platform-specific PointAnnotation wrapper
const PointAnnotation: React.FC<{ id: string; coordinate: [number, number]; children: React.ReactNode }> = ({ id, coordinate, children }) => {
  if (Platform.OS === 'web') {
    // On web, just render the children directly since markers are handled by WebRouteMap
    return <>{children}</>;
  }
  
  // On native platforms, use VietMap PointAnnotation
  try {
    const { PointAnnotation: NativePointAnnotation } = require('@vietmap/vietmap-gl-react-native');
    return <NativePointAnnotation id={id} coordinate={coordinate}>{children}</NativePointAnnotation>;
  } catch {
    // Fallback if VietMap native SDK not available
    return <>{children}</>;
  }
};

interface VehicleMarkerProps {
  id: string;
  coordinate: [number, number];
  vehicleType?: 'car' | 'truck' | 'motorcycle' | 'van';
  heading?: number;
  driverName?: string;
  showLabel?: boolean;
  size?: number;
}

const VEHICLE_ICONS = {
  car: '🚗',
  truck: '🚚',
  motorcycle: '🏍️',
  van: '🚐',
};

export const VehicleMarker: React.FC<VehicleMarkerProps> = ({
  id,
  coordinate,
  vehicleType = 'car',
  heading = 0,
  driverName,
  showLabel = true,
  size = 40,
}) => {
  return (
    <PointAnnotation id={id} coordinate={coordinate}>
<View style={styles.container}>
        {showLabel && driverName && (
          <View style={styles.labelContainer}>
<Text style={styles.labelText}>{driverName}</Text>
</View>
        )}
        <View
          style={[
            styles.iconContainer,
            { width: size, height: size, transform: [{ rotate: `${heading}deg` }] },
          ]}
        >
<Text style={[styles.icon, { fontSize: size * 0.7 }]}>
            {VEHICLE_ICONS[vehicleType]}
          </Text>
</View>
</View>
</PointAnnotation>
  );
};

interface LocationMarkerProps {
  id: string;
  coordinate: [number, number];
  type: 'pickup' | 'dropoff' | 'waypoint';
  label?: string;
  color?: string;
}

export const LocationMarker: React.FC<LocationMarkerProps> = ({
  id,
  coordinate,
  type,
  label,
  color,
}) => {
  const getMarkerColor = () => {
    if (color) return color;
    switch (type) {
      case 'pickup':
        return '#10b981';
      case 'dropoff':
        return '#ef4444';
      case 'waypoint':
        return '#f59e0b';
      default:
        return '#3b82f6';
    }
  };

  const getMarkerIcon = () => {
    switch (type) {
      case 'pickup':
        return '📍';
      case 'dropoff':
        return '🏁';
      case 'waypoint':
        return '📌';
      default:
        return '📍';
    }
  };

  return (
    <PointAnnotation id={id} coordinate={coordinate}>
<View style={styles.locationContainer}>
        {label && (
          <View style={[styles.locationLabel, { backgroundColor: getMarkerColor() }]}>
<Text style={styles.locationLabelText}>{label}</Text>
</View>
        )}
        <View style={[styles.locationPin, { backgroundColor: getMarkerColor() }]}>
<Text style={styles.locationIcon}>{getMarkerIcon()}</Text>
</View>
<View style={[styles.locationPinTip, { borderTopColor: getMarkerColor() }]} />
</View>
</PointAnnotation>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  labelContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  labelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  iconContainer: {
    backgroundColor: 'white',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icon: {
    textAlign: 'center',
  },
  locationContainer: {
    alignItems: 'center',
  },
  locationLabel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  locationLabelText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'white',
  },
  locationPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationIcon: {
    fontSize: 18,
  },
  locationPinTip: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});

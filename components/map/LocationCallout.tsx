import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Simple callout component - use as overlay or inside custom marker views
interface LocationCalloutProps {
  title: string;
  subtitle?: string;
  description?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

export const LocationCallout: React.FC<LocationCalloutProps> = ({
  title,
  subtitle,
  description,
  type = 'info',
}) => {
  const getTypeColor = () => {
    switch (type) {
      case 'success':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      default:
        return '#3b82f6';
    }
  };

  return (
    <View style={styles.calloutContainer}>
<View style={[styles.calloutHeader, { backgroundColor: getTypeColor() }]}>
<Text style={styles.calloutTitle}>{title}</Text>
</View>
      {subtitle && (
        <View style={styles.calloutBody}>
<Text style={styles.calloutSubtitle}>{subtitle}</Text>
</View>
      )}
      {description && (
        <View style={styles.calloutBody}>
<Text style={styles.calloutDescription}>{description}</Text>
</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  calloutContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    minWidth: 150,
    maxWidth: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  calloutTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: 'white',
  },
  calloutBody: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  calloutSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  calloutDescription: {
    fontSize: 11,
    color: '#6b7280',
  },
});

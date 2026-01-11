import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface WaypointCalloutProps {
  waypoint: {
    coordinate: [number, number];
    label: string;
    description?: string;
    address?: string;
    estimatedTime?: string;
  };
  index: number;
  onClose: () => void;
  onNavigate?: () => void;
}

export const WaypointCallout: React.FC<WaypointCalloutProps> = ({
  waypoint,
  index,
  onClose,
  onNavigate
}) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
<View style={styles.numberBadge}>
<Text style={styles.numberText}>{index + 1}</Text>
</View>
<Text style={styles.title}>{waypoint.label}</Text>
<TouchableOpacity onPress={onClose} style={styles.closeButton}>
<Text style={styles.closeText}>×</Text>
</TouchableOpacity>
</View>

      {/* Content */}
      <View style={styles.content}>
        {waypoint.address && (
          <View style={styles.row}>
<Text style={styles.icon}>📍</Text>
<Text style={styles.text}>{waypoint.address}</Text>
</View>
        )}
{waypoint.description && (
          <View style={styles.row}>
<Text style={styles.icon}>📝</Text>
<Text style={styles.text}>{waypoint.description}</Text>
</View>
        )}
{waypoint.estimatedTime && (
          <View style={styles.row}>
<Text style={styles.icon}>⏰</Text>
<Text style={styles.text}>{waypoint.estimatedTime}</Text>
</View>
        )}
{/* Coordinates (for debug) */}
        <View style={styles.coordRow}>
<Text style={styles.coordText}>
            {waypoint.coordinate[1].toFixed(5)}, {waypoint.coordinate[0].toFixed(5)}
          </Text>
</View>
</View>

      {/* Actions */}
      {onNavigate && (
        <TouchableOpacity style={styles.navButton} onPress={onNavigate}>
<Text style={styles.navButtonText}>🧭 Dẫn đường đến đây</Text>
</TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 180,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F59E0B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#FCD34D'
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  numberText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E'
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeText: {
    fontSize: 28,
    color: '#92400E',
    lineHeight: 28
  },
  content: {
    padding: 14
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2
  },
  text: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20
  },
  coordRow: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  coordText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'monospace'
  },
  navButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    margin: 12,
    marginTop: 0,
    borderRadius: 12,
    alignItems: 'center'
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  }
});

export default WaypointCallout;

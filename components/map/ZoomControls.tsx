import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter?: () => void;
  style?: any;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onRecenter,
  style
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Zoom In Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={onZoomIn}
        activeOpacity={0.7}
      >
<Text style={styles.buttonText}>+</Text>
</TouchableOpacity>

      {/* Zoom Out Button */}
      <TouchableOpacity
        style={[styles.button, styles.buttonMiddle]}
        onPress={onZoomOut}
        activeOpacity={0.7}
      >
<Text style={styles.buttonText}>−</Text>
</TouchableOpacity>

      {/* Recenter Button (Optional) */}
      {onRecenter && (
        <TouchableOpacity
          style={styles.button}
          onPress={onRecenter}
          activeOpacity={0.7}
        >
<Text style={styles.recenterIcon}>⊙</Text>
</TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    top: 180,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  button: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF'
  },
  buttonMiddle: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB'
  },
  buttonText: {
    fontSize: 28,
    fontWeight: '300',
    color: '#111827',
    lineHeight: 28
  },
  recenterIcon: {
    fontSize: 22,
    fontWeight: '400',
    color: '#2563EB',
    lineHeight: 22
  }
});

export default ZoomControls;

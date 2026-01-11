import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import Slider from '@react-native-community/slider'

interface SpeedControlProps {
  speed: number
  isPlaying: boolean
  onSpeedChange: (speed: number) => void
  onPlayPause: () => void
  style?: any
}

export default function SpeedControl({
  speed,
  isPlaying,
  onSpeedChange,
  onPlayPause,
  style
}: SpeedControlProps) {
  // Speed presets
  const speedPresets = [0.5, 1, 2, 3, 5]
  
  const getSpeedLabel = (spd: number): string => {
    if (spd === 1) return '1x'
    return `${spd}x`
  }

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
<Text style={styles.title}>⚡ Tốc độ mô phỏng</Text>
<Text style={styles.speedDisplay}>{getSpeedLabel(speed)}</Text>
</View>

      {/* Play/Pause Button */}
      <TouchableOpacity
        style={[styles.playButton, isPlaying ? styles.pauseButton : styles.resumeButton]}
        onPress={onPlayPause}
        activeOpacity={0.7}
      >
<Text style={styles.playButtonText}>
          {isPlaying ? '⏸️ Tạm dừng' : '▶️ Tiếp tục'}
        </Text>
</TouchableOpacity>

      {/* Speed Slider */}
      <View style={styles.sliderContainer}>
<Text style={styles.sliderLabel}>0.5x</Text>
<Slider
          style={styles.slider}
          minimumValue={0.5}
          maximumValue={5}
          step={0.5}
          value={speed}
          onValueChange={onSpeedChange}
          minimumTrackTintColor="#3B82F6"
          maximumTrackTintColor="#D1D5DB"
          thumbTintColor="#3B82F6"
        />
<Text style={styles.sliderLabel}>5x</Text>
</View>

      {/* Speed Presets */}
      <View style={styles.presetsContainer}>
        {speedPresets.map((preset) => (
          <TouchableOpacity
            key={preset}
            style={[
              styles.presetButton,
              speed === preset && styles.presetButtonActive
            ]}
            onPress={() => onSpeedChange(preset)}
            activeOpacity={0.7}
          >
<Text
              style={[
                styles.presetButtonText,
                speed === preset && styles.presetButtonTextActive
              ]}
            >
              {getSpeedLabel(preset)}
            </Text>
</TouchableOpacity>
        ))}
      </View>

      {/* Info Text */}
      <Text style={styles.infoText}>
        {isPlaying
          ? '🏃 Đang chạy mô phỏng...'
          : '⏸️ Mô phỏng đã tạm dừng'}
      </Text>
</View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937'
  },
  speedDisplay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6'
  },
  playButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16
  },
  pauseButton: {
    backgroundColor: '#F59E0B'
  },
  resumeButton: {
    backgroundColor: '#10B981'
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white'
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 8
  },
  sliderLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500'
  },
  presetsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  presetButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
    alignItems: 'center'
  },
  presetButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6'
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280'
  },
  presetButtonTextActive: {
    color: 'white'
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center'
  }
})

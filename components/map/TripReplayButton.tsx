import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface TripReplayButtonProps {
  onPress: () => void
  disabled?: boolean
  style?: any
}

export default function TripReplayButton({
  onPress,
  disabled = false,
  style
}: TripReplayButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        disabled && styles.containerDisabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
<View style={styles.iconContainer}>
<Text style={styles.icon}>🔄</Text>
</View>
<View style={styles.textContainer}>
<Text style={[styles.title, disabled && styles.titleDisabled]}>
          Xem lại chuyến đi
        </Text>
<Text style={[styles.subtitle, disabled && styles.subtitleDisabled]}>
          Phát lại GPS tracking từ dữ liệu lịch sử
        </Text>
</View>
<Text style={styles.arrow}>›</Text>
</TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  containerDisabled: {
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB'
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  icon: {
    fontSize: 24
  },
  textContainer: {
    flex: 1
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4
  },
  titleDisabled: {
    color: '#9CA3AF'
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280'
  },
  subtitleDisabled: {
    color: '#D1D5DB'
  },
  arrow: {
    fontSize: 24,
    color: '#3B82F6',
    marginLeft: 8
  }
})

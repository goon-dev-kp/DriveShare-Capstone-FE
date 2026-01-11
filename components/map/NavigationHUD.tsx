import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export interface NavigationHUDProps {
  eta?: string // Estimated Time of Arrival
  remainingDistance?: string // Distance remaining to destination
  currentSpeed?: string // Current speed
  nextInstruction?: string // Next turn instruction
  distanceToNextInstruction?: string // Distance to next turn
  visible?: boolean
}

const NavigationHUD: React.FC<NavigationHUDProps> = ({
  eta,
  remainingDistance,
  currentSpeed,
  nextInstruction,
  distanceToNextInstruction,
  visible = true
}) => {
  if (!visible) return null

  return (
    <View style={styles.container}>
      {/* Top Panel - Main Navigation Info */}
      <View style={styles.topPanel}>
<View style={styles.instructionContainer}>
          {nextInstruction && (
            <>
<Text style={styles.distanceToTurn}>{distanceToNextInstruction || '...'}</Text>
<Text style={styles.instruction} numberOfLines={2}>
                {nextInstruction}
              </Text>
</>
          )}
        </View>
</View>

      {/* Bottom Panel - ETA and Distance */}
      <View style={styles.bottomPanel}>
<View style={styles.infoBox}>
<Text style={styles.infoLabel}>Thời gian đến</Text>
<Text style={styles.infoValue}>{eta || '--:--'}</Text>
</View>
<View style={styles.divider} />
<View style={styles.infoBox}>
<Text style={styles.infoLabel}>Quãng đường</Text>
<Text style={styles.infoValue}>{remainingDistance || '-- km'}</Text>
</View>
        {currentSpeed && (
          <>
<View style={styles.divider} />
<View style={styles.infoBox}>
<Text style={styles.infoLabel}>Tốc độ</Text>
<Text style={styles.infoValue}>{currentSpeed}</Text>
</View>
</>
        )}
      </View>
</View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 10
  },
  topPanel: {
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8
  },
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  distanceToTurn: {
    fontSize: 22,
    fontWeight: '800',
    color: '#10B981',
    minWidth: 70,
    marginRight: 10
  },
  instruction: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1
  },
  bottomPanel: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    marginBottom: 8
  },
  infoBox: {
    alignItems: 'center',
    flex: 1
  },
  infoLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 2,
    fontWeight: '500'
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  divider: {
    width: 1,
    backgroundColor: '#374151',
    marginHorizontal: 8
  }
})

export default NavigationHUD

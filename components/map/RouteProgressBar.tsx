// import React from 'react'
// import { View, Text, StyleSheet } from 'react-native'
// import Slider from '@react-native-community/slider'

// interface RouteProgressBarProps {
//   currentDistance: number
//   totalDistance: number
//   onSeek: (distance: number) => void
//   style?: any
// }

// export default function RouteProgressBar({
//   currentDistance,
//   totalDistance,
//   onSeek,
//   style
// }: RouteProgressBarProps) {
//   const progressPercent = totalDistance > 0 
//     ? (currentDistance / totalDistance) * 100 
//     : 0

//   const formatDistance = (km: number): string => {
//     if (km < 1) {
//       return `${Math.round(km * 1000)}m`
//     }
//     return `${km.toFixed(1)}km`
//   }

//   const formatTime = (km: number): string => {
//     // Estimate time at ~40km/h average speed
//     const hours = km / 40
//     const minutes = Math.round(hours * 60)
    
//     if (minutes < 60) {
//       return `${minutes} phút`
//     }
    
//     const h = Math.floor(minutes / 60)
//     const m = minutes % 60
//     return m > 0 ? `${h}h ${m}m` : `${h}h`
//   }

//   return (
//     <View style={[styles.container, style]}>
//       {/* Progress Stats */}
//       <View style={styles.statsRow}>
// <View style={styles.statItem}>
// <Text style={styles.statLabel}>📍 Hiện tại</Text>
// <Text style={styles.statValue}>
//             {formatDistance(currentDistance)}
//           </Text>
// </View>
// <View style={styles.statItem}>
// <Text style={styles.statLabel}>⏱️ Dự kiến</Text>
// <Text style={styles.statValue}>
//             {formatTime(totalDistance - currentDistance)}
//           </Text>
// </View>
// <View style={styles.statItem}>
// <Text style={styles.statLabel}>🎯 Tổng</Text>
// <Text style={styles.statValue}>
//             {formatDistance(totalDistance)}
//           </Text>
// </View>
// </View>

//       {/* Progress Bar */}
//       <View style={styles.progressContainer}>
// <View style={styles.progressTrack}>
// <View 
//             style={[
//               styles.progressFill, 
//               { width: `${Math.min(progressPercent, 100)}%` }
//             ]} 
//           />
// </View>
// <Text style={styles.progressText}>
//           {progressPercent.toFixed(0)}%
//         </Text>
// </View>

//       {/* Compact info - no slider to keep map visible */}
//       <Text style={styles.compactInfo}>
//         🚗 {formatDistance(currentDistance)} / {formatDistance(totalDistance)} ({progressPercent.toFixed(0)}%)
//       </Text>
// </View>
//   )
// }

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: 'rgba(255,255,255,0.95)',
//     borderRadius: 8,
//     padding: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2
//   },
//   compactInfo: {
//     fontSize: 12,
//     color: '#374151',
//     textAlign: 'center',
//     fontWeight: '600'
//   },
//   statsRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 16
//   },
//   statItem: {
//     flex: 1,
//     alignItems: 'center'
//   },
//   statLabel: {
//     fontSize: 11,
//     color: '#6B7280',
//     marginBottom: 4
//   },
//   statValue: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#1F2937'
//   },
//   progressContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 16
//   },
//   progressTrack: {
//     flex: 1,
//     height: 8,
//     backgroundColor: '#E5E7EB',
//     borderRadius: 4,
//     overflow: 'hidden',
//     marginRight: 12
//   },
//   progressFill: {
//     height: '100%',
//     backgroundColor: '#10B981',
//     borderRadius: 4
//   },
//   progressText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#10B981',
//     minWidth: 40,
//     textAlign: 'right'
//   },
//   sliderContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 16
//   },
//   slider: {
//     flex: 1,
//     height: 40,
//     marginHorizontal: 8
//   },
//   sliderLabel: {
//     fontSize: 11,
//     color: '#6B7280',
//     fontWeight: '500'
//   },
//   markersContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 12,
//     paddingHorizontal: 4
//   },
//   marker: {
//     alignItems: 'center'
//   },
//   markerDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: '#D1D5DB',
//     marginBottom: 4
//   },
//   markerDotActive: {
//     backgroundColor: '#10B981'
//   },
//   markerLabel: {
//     fontSize: 10,
//     color: '#6B7280'
//   },
//   infoText: {
//     fontSize: 11,
//     color: '#6B7280',
//     textAlign: 'center'
//   }
// })


import React, { useMemo } from 'react'
import { View, Text, StyleSheet, ViewStyle } from 'react-native'

// 1. Export interface để bên ngoài có thể dùng nếu cần
export interface RouteProgressBarProps {
    currentDistance: number
    totalDistance: number
    durationMinutes: number
    style?: ViewStyle // Đổi thành ViewStyle cho chuẩn TypeScript
}

// 2. Gán kiểu React.FC<RouteProgressBarProps> cho component
const RouteProgressBar: React.FC<RouteProgressBarProps> = ({
    currentDistance,
    totalDistance,
    durationMinutes,
    style
}) => {
    // Tính phần trăm hoàn thành
    const progressPercent = useMemo(() => {
        if (totalDistance <= 0) return 0
        const p = (currentDistance / totalDistance) * 100
        return Math.min(Math.max(p, 0), 100)
    }, [currentDistance, totalDistance])

    // Tính thời gian còn lại
    const remainingMinutes = useMemo(() => {
        return durationMinutes * (1 - progressPercent / 100)
    }, [durationMinutes, progressPercent])

    return (
        <View style={[styles.container, style]}>
            {/* Header Info */}
            <View style={styles.headerRow}>
                <Text style={styles.tripInfoText}>
                    🏁 {currentDistance.toFixed(1)} km / {totalDistance.toFixed(1)} km
                </Text>
                <Text style={styles.timeText}>
                    🕒 ~{remainingMinutes.toFixed(0)} phút còn lại
                </Text>
            </View>

            {/* Visual Timeline */}
            <View style={styles.trackContainer}>
                {/* Line background */}
                <View style={styles.trackLineBase} />
                {/* Line active */}
                <View style={[styles.trackLineActive, { width: `${progressPercent}%` }]} />

                {/* Start Dot */}
                <View style={[styles.dot, styles.dotStart]}>
                    <Text style={styles.dotLabel}>A</Text>
                </View>

                {/* Moving Truck Icon */}
                <View style={[styles.truckContainer, { left: `${progressPercent}%` }]}>
                    <View style={styles.truckIcon}>
                        <Text style={{ fontSize: 10 }}>🚚</Text>
                    </View>
                    <View style={styles.tooltip}>
                        <Text style={styles.tooltipText}>{progressPercent.toFixed(0)}%</Text>
                    </View>
                </View>

                {/* End Dot */}
                <View style={[styles.dot, styles.dotEnd]}>
                    <Text style={styles.dotLabel}>B</Text>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    tripInfoText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#111827',
    },
    timeText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    trackContainer: {
        height: 24,
        justifyContent: 'center',
        position: 'relative',
        marginHorizontal: 8,
    },
    trackLineBase: {
        position: 'absolute',
        left: 0, right: 0,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
    },
    trackLineActive: {
        position: 'absolute',
        left: 0,
        height: 4,
        backgroundColor: '#3B82F6', 
        borderRadius: 2,
    },
    dot: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        top: 2,
    },
    dotStart: {
        left: -10,
        backgroundColor: '#3B82F6',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        zIndex: 1,
    },
    dotEnd: {
        right: -10,
        backgroundColor: '#EF4444',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        zIndex: 1,
    },
    dotLabel: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
    },
    truckContainer: {
        position: 'absolute',
        top: -14,
        marginLeft: -12,
        alignItems: 'center',
        zIndex: 10,
    },
    truckIcon: {
        width: 24,
        height: 24,
        backgroundColor: '#FFF',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#3B82F6',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tooltip: {
        position: 'absolute',
        top: -20,
        backgroundColor: '#111827',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    tooltipText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '700',
    }
})

export default RouteProgressBar
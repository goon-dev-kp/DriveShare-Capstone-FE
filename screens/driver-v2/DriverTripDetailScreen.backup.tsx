// import React, { useEffect, useMemo, useRef, useState } from 'react'
// import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Linking, Platform } from 'react-native'
// import { useLocalSearchParams, useRouter } from 'expo-router'
// import { RouteMap } from '@/components/map'
// import NavigationHUD from '@/components/map/NavigationHUD'
// import tripService from '@/services/tripService'
// import { ContractSummary, TripDetailFullDTOExtended } from '@/models/types'
// import * as Location from 'expo-location'
// import type { Position, Feature, LineString } from 'geojson'
// import { extractRouteWithSteps, nearestCoordIndex, remainingDistanceFrom, formatMeters, buildGoogleMapsLink, buildAppleMapsLink, lastCoord, deriveNextStep, RouteStepEntry, stepsFromCoords, haversine } from '@/utils/navigation'
// import { decodePolyline, toGeoJSONLineFeature } from '@/utils/polyline'
// import { createProgressFeature } from '@/utils/route-progress'
// import * as Speech from 'expo-speech'
// import { getNavSession, saveNavSession, clearNavSession } from '@/utils/navSession'
// import vietmapService, { RouteInstruction } from '@/services/vietmapService'
// import { calculateArrivalTime, formatSpeed, smoothSpeed } from '@/utils/navigation-metrics'

// type JourneyPhase = 'TO_PICKUP' | 'TO_DELIVERY' | 'COMPLETED'

// // Map Vietmap turn sign codes to icons/text
// const getTurnIcon = (sign: number): string => {
//   const map: Record<number, string> = {
//     0: '↑',      // Continue straight
//     '-3': '←',   // Turn sharp left
//     '-2': '↙',   // Turn left
//     '-1': '↙',   // Slight left
//     1: '↗',      // Slight right
//     2: '↘',      // Turn right
//     3: '→',      // Turn sharp right
//     '-7': '↶',   // U-turn left
//     7: '↷',      // U-turn right
//     4: '🏁',     // Finish/Destination
//     5: '🚩',     // Via/Waypoint
//     6: '🔃',     // Roundabout
//   }
//   return map[sign] || '↑'
// }

// const getTurnText = (sign: number): string => {
//   const map: Record<number, string> = {
//     0: 'Đi thẳng',
//     '-3': 'Rẽ trái gấp',
//     '-2': 'Rẽ trái',
//     '-1': 'Nghiêng trái',
//     1: 'Nghiêng phải',
//     2: 'Rẽ phải',
//     3: 'Rẽ phải gấp',
//     '-7': 'Quay đầu trái',
//     7: 'Quay đầu phải',
//     4: 'Đích đến',
//     5: 'Điểm dừng',
//     6: 'Vòng xuyến',
//   }
//   return map[sign] || 'Tiếp tục'
// }

// const StatusPill = ({ value }: { value: string }) => {
//   const color = useMemo(() => {
//     const map: Record<string, string> = {
//       CREATED: '#2563EB',
//       PENDING: '#D97706',
//       SIGNED: '#059669',
//       COMPLETED: '#10B981',
//       CANCELLED: '#DC2626',
//       READY_FOR_VEHICLE_HANDOVER: '#0EA5E9'
//     }
//     return map[value] || '#6B7280'
//   }, [value])
//   return (
//     <View style={[styles.pill, { backgroundColor: color + '22', borderColor: color }]}>
//       <Text style={[styles.pillText, { color }]}>{value}</Text>
//     </View>
//   )
// }

// const DriverTripDetailScreen: React.FC = () => {
//   const router = useRouter()
//   const params = useLocalSearchParams() as { tripId?: string }
//   const tripId = params.tripId
//   const [loading, setLoading] = useState(true)
//   const [trip, setTrip] = useState<TripDetailFullDTOExtended | null>(null)
//   const [error, setError] = useState<string | null>(null)
//   const [mapInfoOpen, setMapInfoOpen] = useState(false)
//   const [navActive, setNavActive] = useState(false)
//   const [navOverview, setNavOverview] = useState(false)
//   const [navSessionExists, setNavSessionExists] = useState(false)
//   const [startModalOpen, setStartModalOpen] = useState(false)
//   const [startingNav, setStartingNav] = useState(false)
//   const [routeCoords, setRouteCoords] = useState<[number, number][]>([])
//   const [routeFeature, setRouteFeature] = useState<Feature<LineString> | undefined>()
//   const [progressFeature, setProgressFeature] = useState<Feature<LineString> | undefined>()
//   const [startPoint, setStartPoint] = useState<[number, number] | undefined>()
//   const [endPoint, setEndPoint] = useState<[number, number] | undefined>()
//   const [routeSteps, setRouteSteps] = useState<RouteStepEntry[]>([])
//   const [routeInstructions, setRouteInstructions] = useState<RouteInstruction[]>([])
//   const [pickupWaypointIndex, setPickupWaypointIndex] = useState<number>(0)
//   const [deliveryWaypointIndex, setDeliveryWaypointIndex] = useState<number>(0)
//   const [journeyPhase, setJourneyPhase] = useState<JourneyPhase>('TO_PICKUP')
//   const [canConfirmPickup, setCanConfirmPickup] = useState(false)
//   const [canConfirmDelivery, setCanConfirmDelivery] = useState(false)
//   const [currentPos, setCurrentPos] = useState<Position | null>(null)
//   const [overviewCoords, setOverviewCoords] = useState<[number, number][] | null>(null)
//   const [navRouteCoords, setNavRouteCoords] = useState<Position[] | null>(null)
//   const [nearestIdx, setNearestIdx] = useState<number>(0)
//   const [userBearing, setUserBearing] = useState<number>(0)
//   const [remaining, setRemaining] = useState<number>(0)
//   const [nextInstruction, setNextInstruction] = useState<string | null>(null)
//   const [currentInstruction, setCurrentInstruction] = useState<RouteInstruction | null>(null)
//   const [distanceToNextTurn, setDistanceToNextTurn] = useState<number>(0)
//   const [currentSpeed, setCurrentSpeed] = useState<number>(0)
//   const [eta, setEta] = useState<string>('--:--')
//   const spokenStepsRef = useRef<Set<number>>(new Set())
//   const watchSubRef = useRef<Location.LocationSubscription | null>(null)
//   const previousSpeedRef = useRef<number>(0)
//   const driverContract: ContractSummary | null = (trip?.driverContracts && trip.driverContracts[0]) || null

//   useEffect(() => {
//     if (!tripId) { setError('Trip không hợp lệ'); setLoading(false); return }
//     ;(async () => {
//       try {
//         const res = await tripService.getById(tripId)
//         const ok = res?.isSuccess ?? (res?.statusCode === 200)
//         if (!ok) throw new Error(res?.message || 'Không thể tải chi tiết chuyến')
//         const t = res?.result ?? res?.data
//         const normalized: TripDetailFullDTOExtended = {
//           ...t,
//           deliveryRecords: t.deliveryRecords || [],
//           compensations: t.compensations || [],
//           issues: t.issues || []
//         }
//         setTrip(normalized)
//         const { coords, steps } = extractRouteWithSteps(normalized?.tripRoute?.routeData)
//         setRouteCoords(coords as [number, number][])
//         setRouteFeature(toGeoJSONLineFeature(coords as [number, number][]))
//         if (coords.length > 0) {
//           setStartPoint(coords[0] as [number, number])
//           setEndPoint(coords[coords.length - 1] as [number, number])
//         }
//         setRouteSteps(steps)
//       } catch (e: any) {
//         setError(e?.message || 'Lỗi không xác định')
//       } finally {
//         setLoading(false)
//       }
//     })()
//   }, [tripId])

//   // Load existing navigation session (tiếp tục hành trình) state
//   useEffect(() => {
//     let mounted = true
//     const loadSession = async () => {
//       if (!tripId) return
//       const existing = await getNavSession(`trip:${tripId}`)
//       if (mounted) setNavSessionExists(!!existing)
//     }
//     loadSession()
//     return () => { mounted = false }
//   }, [tripId])

//   useEffect(() => {
//     if (!navActive) return
//     let cancelled = false
//     ;(async () => {
//       try {
//         const { status } = await Location.requestForegroundPermissionsAsync()
//         if (status !== 'granted') {
//           Alert.alert('Vị trí', 'Cần quyền truy cập vị trí để dẫn đường.')
//           setNavActive(false)
//           return
//         }

//         const sub = await Location.watchPositionAsync(
//           { accuracy: Location.Accuracy.Balanced, distanceInterval: 5, timeInterval: 2000 },
//           (loc: Location.LocationObject) => {
//             if (cancelled) return

//             const pos: Position = [loc.coords.longitude, loc.coords.latitude]
//             setCurrentPos(pos)
            
//             // Update speed with smoothing
//             const rawSpeed = loc.coords.speed || 0
//             const smoothedSpeed = smoothSpeed(rawSpeed, previousSpeedRef.current, 0.3)
//             previousSpeedRef.current = smoothedSpeed
//             setCurrentSpeed(smoothedSpeed)

//             if (!routeCoords.length) return

//             const near = nearestCoordIndex(pos, routeCoords)
//             if (!near) return

//             setNearestIdx(near.index)
//             const remainingDist = remainingDistanceFrom(near.index, routeCoords, pos)
//             setRemaining(remainingDist)
            
//             // Update progress line (traveled portion in green)
//             const progress = createProgressFeature(routeCoords, near.index, pos)
//             setProgressFeature(progress || undefined)
            
//             // Calculate ETA with current speed (fallback to 40 km/h average)
//             const avgSpeedKmh = smoothedSpeed > 0 ? smoothedSpeed * 3.6 : 40
//             setEta(calculateArrivalTime(remainingDist, avgSpeedKmh))

//             // Detect journey phase based on proximity to waypoints
//             const distanceToPickup = pickupWaypointIndex > 0 ? haversine(pos, routeCoords[pickupWaypointIndex]) : Infinity
//             const distanceToDelivery = deliveryWaypointIndex > 0 ? haversine(pos, routeCoords[deliveryWaypointIndex]) : Infinity

//             // Debug log distances
//             if (journeyPhase === 'TO_PICKUP') {
//               console.log('Distance to pickup:', Math.round(distanceToPickup), 'm')
//             } else if (journeyPhase === 'TO_DELIVERY') {
//               console.log('Distance to delivery:', Math.round(distanceToDelivery), 'm')
//             }

//             // Enable confirmation buttons when close enough (300m for easier testing)
//             if (journeyPhase === 'TO_PICKUP' && distanceToPickup < 300) {
//               setCanConfirmPickup(true)
//             } else if (journeyPhase === 'TO_PICKUP') {
//               setCanConfirmPickup(false)
//             }
            
//             if (journeyPhase === 'TO_DELIVERY' && distanceToDelivery < 300) {
//               setCanConfirmDelivery(true)
//             } else if (journeyPhase === 'TO_DELIVERY') {
//               setCanConfirmDelivery(false)
//             }

//             // Find current instruction from route instructions
//             if (routeInstructions.length > 0) {
//               const currentInstr = routeInstructions.find((instr, idx) => {
//                 const [start, end] = instr.interval
//                 return near.index >= start && near.index <= end
//               })
              
//               if (currentInstr) {
//                 setCurrentInstruction(currentInstr)
//                 setNextInstruction(currentInstr.text)
                
//                 // Calculate distance to the END of this instruction (next turn point)
//                 const turnPoint = routeCoords[currentInstr.interval[1]]
//                 if (turnPoint) {
//                   const distToTurn = haversine(pos, turnPoint)
//                   setDistanceToNextTurn(distToTurn)
                  
//                   // Speak when within 100m of turn, only once
//                   if (distToTurn <= 100 && !spokenStepsRef.current.has(currentInstr.interval[0])) {
//                     const distance = distToTurn < 1000 ? `${Math.round(distToTurn)} mét` : `${(distToTurn / 1000).toFixed(1)} kilômét`
//                     const phrase = `Sau ${distance}, ${currentInstr.text}`
//                     try {
//                       Speech.speak(phrase, { language: 'vi-VN' })
//                     } catch (e) {
//                       console.log('Text-to-speech error:', e)
//                     }
//                     spokenStepsRef.current.add(currentInstr.interval[0])
//                   }
//                 }
//               } else {
//                 setCurrentInstruction(null)
//               }
//             } else {
//               // Fallback to old step-based logic
//               const upcoming = deriveNextStep(near.index, routeSteps)
//               if (upcoming) {
//                 setNextInstruction(upcoming.text)
                
//                 // Speak instruction when approaching (within 70m), only once per step
//                 const stepStart = routeCoords[upcoming.startIndex]
//                 if (stepStart && pos) {
//                   const distanceToStep = Math.round(haversine(pos, stepStart))
//                   if (distanceToStep <= 70 && !spokenStepsRef.current.has(upcoming.startIndex)) {
//                     const phrase = upcoming.text ? `Chuẩn bị: ${upcoming.text}` : 'Chuẩn bị chuyển hướng'
//                     try {
//                       Speech.speak(phrase, { language: 'vi-VN' })
//                     } catch (e) {
//                       console.log('Text-to-speech error:', e)
//                     }
//                     spokenStepsRef.current.add(upcoming.startIndex)
//                   }
//                 }
//               } else {
//                 setNextInstruction(null)
//               }
//             }

//             // Update user bearing: prefer device heading, fallback to calculated bearing
//             const deviceHeading = loc?.coords?.heading
//             if (typeof deviceHeading === 'number' && isFinite(deviceHeading) && deviceHeading >= 0) {
//               setUserBearing(deviceHeading)
//             } else {
//               const nextIdx = Math.min(near.index + 1, routeCoords.length - 1)
//               const to = routeCoords[nextIdx] || pos
//               const bearing = computeBearing(pos, to)
//               setUserBearing(bearing)
//             }
//           }
//         )
//         watchSubRef.current = sub
//       } catch (e) {
//         console.error('Location watch error:', e)
//         Alert.alert('Lỗi vị trí', 'Không thể theo dõi vị trí. Vui lòng kiểm tra cài đặt và thử lại.')
//         setNavActive(false)
//       }
//     })()
//     return () => {
//       cancelled = true
//       if (watchSubRef.current) {
//         try {
//           watchSubRef.current.remove()
//         } catch (e) {
//           console.error('Error removing location watcher:', e)
//         }
//         watchSubRef.current = null
//       }
//     }
//   }, [navActive, routeCoords, routeSteps])

//   const computeBearing = (a: Position, b: Position): number => {
//     const toRad = (d: number) => (d * Math.PI) / 180
//     const toDeg = (r: number) => (r * 180) / Math.PI
//     const y = Math.sin(toRad(b[0] - a[0])) * Math.cos(toRad(b[1]))
//     const x = Math.cos(toRad(a[1])) * Math.sin(toRad(b[1])) - Math.sin(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.cos(toRad(b[0] - a[0]))
//     const brng = toDeg(Math.atan2(y, x))
//     return (brng + 360) % 360
//   }

//   const openDriverContractPdf = async () => {
//     if (!driverContract?.contractId) { Alert.alert('Hợp đồng', 'Chưa có hợp đồng tài xế.'); return }
//     try {
//       const urlWithTerms = driverContract.fileURL ? `${driverContract.fileURL}${driverContract.fileURL.includes('?') ? '&' : '?'}includeTerms=true` : null
//       if (urlWithTerms) { await Linking.openURL(urlWithTerms); return }
//       const anyService: any = tripService as any
//       if (typeof anyService.getDriverContractPdfLink === 'function') {
//         const res = await anyService.getDriverContractPdfLink(driverContract.contractId, true)
//         const pdfUrl = typeof res === 'string' ? res : res?.url
//         if (pdfUrl) { await Linking.openURL(pdfUrl); return }
//       }
//       Alert.alert('Tải PDF', 'Không tìm thấy PDF hợp đồng tài xế.')
//     } catch (e) {
//       Alert.alert('Lỗi', 'Không thể mở PDF hợp đồng tài xế.')
//     }
//   }

//   const startNavigation = async () => {
//     if (startingNav) return // Prevent double-tap
//     setStartingNav(true)

//     try {
//       // 1. Ensure we have base route coordinates
//       let baseCoords = routeCoords
//       if (!baseCoords.length) {
//         const raw = trip?.tripRoute?.routeData
//         if (typeof raw === 'string' && raw.length > 0) {
//           try {
//             const decoded = decodePolyline(raw, 5).coordinates
//             if (decoded.length) {
//               baseCoords = decoded
//               setRouteCoords(baseCoords)
//             }
//           } catch (e) {
//             console.error('Failed to decode polyline:', e)
//           }
//         }
//       }

//       if (!baseCoords.length) {
//         Alert.alert('Không thể dẫn đường', 'Chưa có dữ liệu tuyến đường. Vui lòng thử lại sau.')
//         return
//       }

//       // 2. Request location permission
//       const { status } = await Location.requestForegroundPermissionsAsync()
//       if (status !== 'granted') {
//         Alert.alert('Cần quyền truy cập vị trí', 'Vui lòng cấp quyền vị trí để bắt đầu dẫn đường.')
//         return
//       }

//       // 3. Get current position
//       const now = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
//       const currentPosition: Position = [now.coords.longitude, now.coords.latitude]
//       setCurrentPos(currentPosition)

//       // 4. Determine pickup and delivery points
//       const pickupPoint = baseCoords[0] as [number, number] // Điểm lấy hàng
//       const deliveryPoint = baseCoords[baseCoords.length - 1] as [number, number] // Điểm giao hàng

//       if (!pickupPoint || !deliveryPoint) {
//         Alert.alert('Lỗi', 'Không xác định được điểm lấy hàng và điểm giao hàng.')
//         return
//       }

//       // 5. Plan optimized route: current position -> pickup -> delivery
//       const planned = await vietmapService.planCurrentToTrip(currentPosition as [number, number], pickupPoint, deliveryPoint)
      
//       let finalCoords: [number, number][]
//       let finalSteps: RouteStepEntry[]

//       if (planned.coordinates?.length > 2) {
//         // Successfully planned route: current -> pickup -> delivery
//         finalCoords = planned.coordinates as [number, number][]
//         finalSteps = stepsFromCoords(finalCoords as Position[])
//         setNavRouteCoords(finalCoords as any)
//         setOverviewCoords(finalCoords as any)
//         setRouteInstructions(planned.instructions || [])
//         setPickupWaypointIndex(planned.pickupIndex || 0)
//         setDeliveryWaypointIndex(planned.deliveryIndex || finalCoords.length - 1)
//       } else {
//         // VRP failed, use fallback: current -> pickup, then original route to delivery
//         finalCoords = [currentPosition as [number, number], ...baseCoords]
//         finalSteps = stepsFromCoords(finalCoords as Position[])
//         setNavRouteCoords(finalCoords as any)
//         setOverviewCoords([currentPosition as [number, number], pickupPoint, deliveryPoint])
//       }

//       // 6. Update route for navigation
//       setRouteCoords(finalCoords)
//       setRouteSteps(finalSteps)

//       // 7. Close modals and activate navigation
//       setMapInfoOpen(false)
//       setStartModalOpen(false)
//       setNavActive(true)
//       setJourneyPhase('TO_PICKUP') // Start with going to pickup

//       // 8. Save navigation session
//       if (tripId) {
//         await saveNavSession(`trip:${tripId}`, {
//           startedAt: Date.now(),
//           routeSummary: { 
//             points: finalCoords.length
//           }
//         })
//         setNavSessionExists(true)
//       }

//       // 9. Speak start announcement with pickup destination
//       try {
//         Speech.speak('Bắt đầu dẫn đường đến điểm lấy hàng', { language: 'vi-VN' })
//       } catch (e) {
//         console.log('Text-to-speech not available:', e)
//       }

//     } catch (error) {
//       console.error('Error starting navigation:', error)
//       Alert.alert('Lỗi', 'Không thể bắt đầu dẫn đường. Vui lòng kiểm tra kết nối và thử lại.')
//     } finally {
//       setStartingNav(false)
//     }
//   }

//   const stopNavigation = async () => {
//     // Stop location watching
//     if (watchSubRef.current) {
//       try {
//         watchSubRef.current.remove()
//       } catch (e) {
//         console.error('Error removing location watcher:', e)
//       }
//       watchSubRef.current = null
//     }

//     // Clear session
//     if (tripId) {
//       await clearNavSession(`trip:${tripId}`)
//     }

//     // Reset navigation states
//     setNavActive(false)
//     setNavSessionExists(false)
//     setNavOverview(false)
//     setNavRouteCoords(null)
//     setOverviewCoords(null)
//     setCurrentPos(null)
//     setNearestIdx(0)
//     setRemaining(0)
//     setNextInstruction(null)
//     setCurrentInstruction(null)
//     setDistanceToNextTurn(0)
//     setJourneyPhase('TO_PICKUP')
//     setRouteInstructions([])
//     setCanConfirmPickup(false)
//     setCanConfirmDelivery(false)
//     spokenStepsRef.current.clear()

//     // Announce stop
//     try {
//       Speech.speak('Kết thúc dẫn đường', { language: 'vi-VN' })
//     } catch (e) {
//       console.log('Text-to-speech not available:', e)
//     }
//   }

//   const confirmPickup = () => {
//     if (!canConfirmPickup) {
//       Alert.alert('Chưa đến điểm lấy hàng', 'Vui lòng di chuyển đến gần điểm lấy hàng (trong vòng 300m) để xác nhận.')
//       return
//     }
    
//     Alert.alert(
//       'Xác nhận đã lấy hàng',
//       'Bạn đã nhận hàng từ người gửi?',
//       [
//         { text: 'Chưa', style: 'cancel' },
//         {
//           text: 'Đã lấy hàng',
//           onPress: () => {
//             setJourneyPhase('TO_DELIVERY')
//             setCanConfirmPickup(false)
//             try {
//               Speech.speak('Đã xác nhận lấy hàng. Tiếp tục đến điểm giao hàng', { language: 'vi-VN' })
//             } catch (e) {
//               console.log('Text-to-speech error:', e)
//             }
//           }
//         }
//       ]
//     )
//   }

//   const confirmDelivery = () => {
//     if (!canConfirmDelivery) {
//       Alert.alert('Chưa đến điểm giao hàng', 'Vui lòng di chuyển đến gần điểm giao hàng (trong vòng 300m) để xác nhận.')
//       return
//     }
    
//     Alert.alert(
//       'Xác nhận đã giao hàng',
//       'Bạn đã giao hàng thành công cho người nhận?',
//       [
//         { text: 'Chưa', style: 'cancel' },
//         {
//           text: 'Đã giao hàng',
//           onPress: () => {
//             setJourneyPhase('COMPLETED')
//             setCanConfirmDelivery(false)
//             try {
//               Speech.speak('Đã hoàn thành giao hàng', { language: 'vi-VN' })
//             } catch (e) {
//               console.log('Text-to-speech error:', e)
//             }
//             // Auto stop navigation after delivery
//             setTimeout(() => {
//               stopNavigation()
//             }, 2000)
//           }
//         }
//       ]
//     )
//   }

//   const openExternalMaps = async () => {
//     const dest = lastCoord(routeCoords)
//     const url = Platform.select({
//       ios: buildAppleMapsLink(currentPos, dest),
//       android: buildGoogleMapsLink(currentPos, dest),
//       default: buildGoogleMapsLink(currentPos, dest)
//     })
//     if (!url) { Alert.alert('Dẫn đường', 'Thiếu điểm đến để mở bản đồ.'); return }
//     try { await Linking.openURL(url) } catch { Alert.alert('Dẫn đường', 'Không thể mở ứng dụng bản đồ.') }
//   }

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.centered}>
//         <ActivityIndicator size="large" color="#4F46E5" />
//         <Text style={{ marginTop: 8 }}>Đang tải chi tiết chuyến...</Text>
//       </SafeAreaView>
//     )
//   }

//   if (error || !trip) {
//     return (
//       <SafeAreaView style={styles.centered}>
//         <Text style={styles.errorText}>{error || 'Không tìm thấy dữ liệu chuyến.'}</Text>
//         <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
//           <Text style={{ color: '#4F46E5', fontWeight: '600' }}>Quay lại</Text>
//         </TouchableOpacity>
//       </SafeAreaView>
//     )
//   }

//   const KeyValue = ({ label, value }: { label: string; value: React.ReactNode }) => (
//     <View style={styles.kvRow}>
//       <Text style={styles.kvLabel}>{label}</Text>
//       <Text style={styles.kvValue}>{value}</Text>
//     </View>
//   )

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backText}>‹</Text></TouchableOpacity>
//         <Text style={styles.title}>{trip.tripCode}</Text>
//         <StatusPill value={trip.status} />
//       </View>

//       <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
//           <View style={styles.card}>
//             <Text style={styles.sectionTitle}>Bản đồ & Lộ trình</Text>
//             <View style={styles.mapBox}>
//               <RouteMap
//                 coordinates={routeCoords}
//                 style={{ height: 280, borderRadius: 12 }}
//                 showUserLocation={navActive}
//                 followUserLocation={navActive}
//                 followZoomLevel={navActive ? 15 : undefined}
//                 userMarkerPosition={navActive && currentPos ? (currentPos as [number, number]) : undefined}
//                 userMarkerBearing={navActive ? userBearing : undefined}
//                 showOverviewMarkers={!navActive}
//                 startMarker={startPoint}
//                 endMarker={endPoint}
//               />
//               {mapInfoOpen && !navActive ? (
//                 <View style={styles.mapOverlayPanel}>
//                   <View style={styles.mapOverlayHeader}>
//                     <Text style={styles.mapOverlayTitle}>Tuyến đường</Text>
//                     <TouchableOpacity onPress={() => setMapInfoOpen(false)}><Text style={styles.mapClose}>×</Text></TouchableOpacity>
//                   </View>
//                   <View style={styles.grid2}>
//                     <KeyValue label="Quãng đường" value={`${(trip.tripRoute?.distanceKm ?? 0).toFixed(1)} km`} />
//                     <KeyValue label="Dự kiến" value={`${Math.round(trip.tripRoute?.durationMinutes ?? 0)} phút`} />
//                   </View>
//                   <KeyValue label="Điểm đi" value={trip.shippingRoute?.startAddress || '—'} />
//                   <KeyValue label="Điểm đến" value={trip.shippingRoute?.endAddress || '—'} />
//                 </View>
//               ) : !navActive ? (
//                 <TouchableOpacity style={styles.mapFab} onPress={() => setMapInfoOpen(true)}>
//                   <Text style={styles.mapFabText}>Thông tin tuyến</Text>
//                 </TouchableOpacity>
//               ) : null}
//               {!navActive ? (
//                 <View style={styles.mapStartRow}>
//                   <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]} onPress={() => setStartModalOpen(true)}>
//                     <Text style={styles.primaryText}>{navSessionExists ? 'Tiếp tục dẫn đường' : 'Bắt đầu dẫn đường'}</Text>
//                   </TouchableOpacity>
//                   <TouchableOpacity style={[styles.actionBtn, styles.secondaryBtn]} onPress={openExternalMaps}>
//                     <Text style={styles.secondaryText}>Chỉ đường ngoài</Text>
//                   </TouchableOpacity>
//                 </View>
//               ) : null}
//             </View>
//           </View>

//         <View style={styles.card}>
//           <Text style={styles.sectionTitle}>Biên bản giao nhận</Text>
//           {(trip.deliveryRecords || []).length === 0 ? (
//             <Text style={styles.emptyText}>Chưa có biên bản.</Text>
//           ) : (
//             (trip.deliveryRecords || []).map(r => (
//               <View key={r.tripDeliveryRecordId} style={styles.recordRow}>
//                 <View style={{ flex: 1 }}>
//                   <Text style={styles.recordTitle}>{r.recordType}</Text>
//                   <Text style={styles.recordNote} numberOfLines={2}>{r.note || '—'}</Text>
//                 </View>
//                 <Text style={styles.recordTime}>{new Date(r.createAt).toLocaleString('vi-VN')}</Text>
//               </View>
//             ))
//           )}
//           {/* Placeholder for future actions: thêm biên bản, ký nhận, v.v. */}
//         </View>

//         <View style={styles.cardSecondary}>
//           <Text style={styles.sectionTitleSmall}>Khác</Text>
//           <View style={styles.actionsRow}>
//             <TouchableOpacity style={[styles.actionBtn, styles.secondaryBtn]} onPress={openDriverContractPdf}>
//               <Text style={styles.secondaryText}>PDF HĐ tài xế</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </ScrollView>
//       {/* Start / Continue Navigation Modal (screen-level) */}
//       {startModalOpen && !navActive ? (
//         <View style={styles.startModalBackdrop}>
//           <View style={styles.startModalCard}>
//             <Text style={styles.startModalTitle}>{navSessionExists ? 'Tiếp tục hành trình' : 'Bắt đầu hành trình'}</Text>
//             <Text style={styles.startModalText}>
//               {navSessionExists ? 'Bạn đang có một hành trình đang dở. Tiếp tục hay kết thúc?' : 'Xác nhận bắt đầu dẫn đường theo tuyến hiện tại.'}
//             </Text>
//             <View style={styles.startActionsRow}>
//               {navSessionExists ? (
//                 <>
//                   <TouchableOpacity 
//                     style={[styles.startBtn, styles.primaryBtn, startingNav && styles.disabledBtn]} 
//                     onPress={startNavigation}
//                     disabled={startingNav}
//                   >
//                     {startingNav ? (
//                       <ActivityIndicator size="small" color="#FFFFFF" />
//                     ) : (
//                       <Text style={styles.primaryText}>Tiếp tục</Text>
//                     )}
//                   </TouchableOpacity>
//                   <TouchableOpacity 
//                     style={[styles.startBtn, styles.dangerBtn]} 
//                     onPress={async () => { 
//                       if (tripId) await clearNavSession(`trip:${tripId}`)
//                       setNavSessionExists(false)
//                       setStartModalOpen(false)
//                     }}
//                     disabled={startingNav}
//                   >
//                     <Text style={styles.dangerText}>Kết thúc</Text>
//                   </TouchableOpacity>
//                   <TouchableOpacity 
//                     style={[styles.startBtn, styles.tertiaryBtn]} 
//                     onPress={() => setStartModalOpen(false)}
//                     disabled={startingNav}
//                   >
//                     <Text style={styles.tertiaryText}>Đóng</Text>
//                   </TouchableOpacity>
//                 </>
//               ) : (
//                 <>
//                   <TouchableOpacity 
//                     style={[styles.startBtn, styles.primaryBtn, startingNav && styles.disabledBtn]} 
//                     onPress={startNavigation}
//                     disabled={startingNav}
//                   >
//                     {startingNav ? (
//                       <ActivityIndicator size="small" color="#FFFFFF" />
//                     ) : (
//                       <Text style={styles.primaryText}>Bắt đầu</Text>
//                     )}
//                   </TouchableOpacity>
//                   <TouchableOpacity 
//                     style={[styles.startBtn, styles.tertiaryBtn]} 
//                     onPress={() => setStartModalOpen(false)}
//                     disabled={startingNav}
//                   >
//                     <Text style={styles.tertiaryText}>Hủy</Text>
//                   </TouchableOpacity>
//                 </>
//               )}
//             </View>
//           </View>
//         </View>
//       ) : null}

//       {/* Full-screen immersive navigation overlay */}
//       {navActive ? (
//         <View style={styles.navFullscreen}>
//           <RouteMap
//             coordinates={navRouteCoords ? (navRouteCoords as [number, number][]) : routeCoords}
//             progressFeature={progressFeature}
//             style={styles.navMap}
//             showUserLocation={true}
//             followUserLocation={true}
//             followZoomLevel={17}
//             followPitch={55}
//             followBearing={userBearing}
//             userMarkerPosition={currentPos ? (currentPos as [number, number]) : undefined}
//             userMarkerBearing={userBearing}
//             pulseMarker={currentPos ? (currentPos as [number, number]) : undefined}
//           />
          
//           {/* Enhanced NavigationHUD - ALWAYS show when navigating */}
//           <NavigationHUD
//             nextInstruction={currentInstruction?.text || nextInstruction || 'Tiếp tục theo tuyến đường'}
//             distanceToNextInstruction={
//               distanceToNextTurn > 0 && distanceToNextTurn < 1000 
//                 ? `${Math.round(distanceToNextTurn)} m` 
//                 : distanceToNextTurn >= 1000
//                 ? `${(distanceToNextTurn / 1000).toFixed(1)} km`
//                 : '...'
//             }
//             remainingDistance={formatMeters(remaining)}
//             eta={eta}
//             currentSpeed={formatSpeed(currentSpeed)}
//             visible={true}
//           />
          
//           {/* Journey Phase Banner - Beautiful gradient */}
//           <View style={styles.phaseBannerContainer}>
//             <View style={[
//               styles.phaseBanner,
//               journeyPhase === 'TO_PICKUP' && styles.phaseBannerPickup,
//               journeyPhase === 'TO_DELIVERY' && styles.phaseBannerDelivery,
//               journeyPhase === 'COMPLETED' && styles.phaseBannerCompleted
//             ]}>
//               <View style={styles.phaseLeft}>
//                 <Text style={styles.phaseIcon}>
//                   {journeyPhase === 'TO_PICKUP' ? '🚗' : journeyPhase === 'TO_DELIVERY' ? '📦' : '✅'}
//                 </Text>
//                 <View>
//                   <Text style={styles.phaseText}>
//                     {journeyPhase === 'TO_PICKUP' ? 'Đang đi lấy hàng' : journeyPhase === 'TO_DELIVERY' ? 'Đang giao hàng' : 'Hoàn thành'}
//                   </Text>
//                   {canConfirmPickup || canConfirmDelivery ? (
//                     <Text style={styles.phaseHint}>Đã đến gần! Nhấn nút bên dưới</Text>
//                   ) : null}
//                 </View>
//               </View>
//               <View style={styles.phaseRight}>
//                 <Text style={styles.phaseDistance}>{formatMeters(remaining)}</Text>
//                 <Text style={styles.phaseDistanceLabel}>còn lại</Text>
//               </View>
//             </View>
//           </View>
          
//           {/* Next steps preview - Compact list */}
//           {routeInstructions.length > 1 && (
//             <View style={styles.nextStepsPreview}>
//               <Text style={styles.nextStepsTitle}>Tiếp theo</Text>
//               {routeInstructions
//                 .filter((_, idx) => {
//                   const currentIdx = routeInstructions.findIndex(i => i === currentInstruction)
//                   return idx > currentIdx && idx <= currentIdx + 2
//                 })
//                 .slice(0, 2)
//                 .map((instr, idx) => (
//                   <View key={idx} style={styles.nextStepRow}>
//                     <Text style={styles.nextStepIcon}>{getTurnIcon(instr.sign)}</Text>
//                     <Text style={styles.nextStepText} numberOfLines={1}>
//                       {instr.text}
//                     </Text>
//                     <Text style={styles.nextStepDist}>
//                       {instr.distance < 1000 ? `${Math.round(instr.distance)}m` : `${(instr.distance/1000).toFixed(1)}km`}
//                     </Text>
//                   </View>
//                 ))}
//             </View>
//           )}
          
//           {/* Bottom Action Bar */}
//           <View style={styles.navBottomBar}>
//             <View style={styles.navBottomInfo}>
//               {currentPos ? (
//                 <Text style={styles.navCoords}>{currentPos[1].toFixed(5)}, {currentPos[0].toFixed(5)}</Text>
//               ) : (
//                 <Text style={styles.navCoords}>Đang lấy vị trí…</Text>
//               )}
//             </View>
//             <View style={styles.navBottomActions}>
//               {/* Confirm Pickup/Delivery Button */}
//               {journeyPhase === 'TO_PICKUP' && canConfirmPickup ? (
//                 <TouchableOpacity style={[styles.navActionBtn, styles.successBtn]} onPress={confirmPickup}>
//                   <Text style={styles.successText}>✓ Đã lấy hàng</Text>
//                 </TouchableOpacity>
//               ) : journeyPhase === 'TO_DELIVERY' && canConfirmDelivery ? (
//                 <TouchableOpacity style={[styles.navActionBtn, styles.successBtn]} onPress={confirmDelivery}>
//                   <Text style={styles.successText}>✓ Đã giao hàng</Text>
//                 </TouchableOpacity>
//               ) : null}
              
//               <TouchableOpacity style={[styles.navActionBtn, styles.secondaryBtn]} onPress={openExternalMaps}>
//                 <Text style={styles.secondaryText}>Ngoài ứng dụng</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={[styles.navActionBtn, styles.dangerBtn]} onPress={stopNavigation}>
//                 <Text style={styles.dangerText}>Kết thúc</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       ) : null}
//     </SafeAreaView>
//   )
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#F9FAFB' },
//   centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
//   errorText: { color: '#EF4444', textAlign: 'center', paddingHorizontal: 20 },
//   header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
//   backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
//   backText: { fontSize: 26, color: '#111827', marginTop: -2 },
//   title: { fontSize: 18, fontWeight: '800', color: '#111827' },
//   pill: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
//   pillText: { fontSize: 12, fontWeight: '700' },

//   card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 },
//   cardSecondary: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 },
//   sectionTitle: { fontWeight: '800', fontSize: 16, color: '#111827', marginBottom: 8 },
//   sectionTitleSmall: { fontWeight: '800', fontSize: 14, color: '#111827', marginBottom: 8 },

//   mapBox: { position: 'relative', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' },
//   mapOverlayPanel: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.96)', padding: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
//   mapOverlayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
//   mapOverlayTitle: { fontWeight: '700', fontSize: 14, color: '#111827' },
//   mapClose: { fontSize: 22, lineHeight: 22, color: '#6B7280' },
//   mapFab: { position: 'absolute', right: 12, bottom: 12, backgroundColor: '#111827', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
//   mapFabText: { color: '#FFFFFF', fontWeight: '700' },
//   mapStartRow: { position: 'absolute', left: 12, bottom: 12, right: 12, flexDirection: 'row', gap: 12, justifyContent: 'flex-start' },

//   kvRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
//   kvLabel: { color: '#6B7280', fontSize: 13 },
//   kvValue: { color: '#111827', fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 8 },

//   emptyText: { color: '#6B7280', fontStyle: 'italic' },
//   recordRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
//   recordTitle: { fontWeight: '700', color: '#111827' },
//   recordNote: { color: '#374151', marginTop: 2 },
//   recordTime: { color: '#6B7280', marginLeft: 12 },

//   actionsRow: { flexDirection: 'row', gap: 10 },
//   actionBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
//   secondaryBtn: { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' },
//   secondaryText: { color: '#4338CA', fontWeight: '700' },
//   primaryBtn: { backgroundColor: '#111827', borderColor: '#111827' },
//   primaryText: { color: '#FFFFFF', fontWeight: '800' },
//   tertiaryBtn: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
//   tertiaryText: { color: '#111827', fontWeight: '700' },
//   disabledBtn: { backgroundColor: '#E5E7EB', borderColor: '#E5E7EB' },
//   disabledText: { color: '#9CA3AF', fontWeight: '700' },
//   grid2: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 8 },

//   navPanel: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.96)', padding: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
//   navPrimary: { fontWeight: '800', color: '#111827', fontSize: 16 },
//   navSecondary: { color: '#374151', marginTop: 2 }
//   ,
//   // Start Modal Styles
//   startModalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
//   startModalCard: { backgroundColor: '#FFFFFF', width: '100%', maxWidth: 520, borderRadius: 22, padding: 24, borderWidth: 1, borderColor: '#E5E7EB' },
//   startModalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
//   startModalText: { color: '#374151', marginTop: 8, fontSize: 14 },
//   startActionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20 },
//   startBtn: { paddingHorizontal: 18, paddingVertical: 14, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
//   dangerBtn: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
//   dangerText: { color: '#DC2626', fontWeight: '800' },
//   successBtn: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
//   successText: { color: '#059669', fontWeight: '800' },
//   // Fullscreen Navigation
//   navFullscreen: { 
//     position: 'absolute', 
//     top: 0, 
//     left: 0, 
//     right: 0, 
//     bottom: 0, 
//     backgroundColor: '#000' 
//   },
  
//   // Compact Phase Badge - Top right corner
//   phaseBadge: {
//     position: 'absolute',
//     top: 200,
//     right: 16,
//     backgroundColor: 'rgba(17, 24, 39, 0.9)',
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 20,
//     borderWidth: 2,
//     borderColor: '#10B981',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 5
//   },
//   phaseBadgeText: {
//     color: '#FFFFFF',
//     fontSize: 13,
//     fontWeight: '700'
//   },
  
//   // Bottom Drawer for Steps
//   stepsDrawer: {
//     position: 'absolute',
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(255, 255, 255, 0.98)',
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     paddingTop: 8,
//     paddingBottom: 24,
//     maxHeight: SCREEN_HEIGHT * 0.5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -4 },
//     shadowOpacity: 0.2,
//     shadowRadius: 12,
//     elevation: 10
//   },
//   drawerHandle: {
//     width: 40,
//     height: 4,
//     backgroundColor: '#D1D5DB',
//     borderRadius: 2,
//     alignSelf: 'center',
//     marginBottom: 12
//   },
//   drawerTitle: {
//     fontSize: 16,
//     fontWeight: '800',
//     color: '#111827',
//     paddingHorizontal: 20,
//     marginBottom: 12
//   },
//   stepsScrollView: {
//     maxHeight: SCREEN_HEIGHT * 0.25
//   },
//   stepsScrollContent: {
//     paddingHorizontal: 20,
//     paddingBottom: 8
//   },
//   stepRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//     paddingHorizontal: 12,
//     marginBottom: 8,
//     backgroundColor: '#F9FAFB',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#E5E7EB'
//   },
//   stepRowNext: {
//     backgroundColor: '#EEF2FF',
//     borderColor: '#818CF8',
//     borderWidth: 2
//   },
//   stepIconContainer: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: '#FFFFFF',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 12,
//     borderWidth: 1,
//     borderColor: '#E5E7EB'
//   },
//   stepIcon: {
//     fontSize: 20
//   },
//   stepIconNext: {
//     fontSize: 24
//   },
//   stepTextContainer: {
//     flex: 1
//   },
//   stepText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#374151',
//     marginBottom: 2
//   },
//   stepTextNext: {
//     fontSize: 15,
//     fontWeight: '800',
//     color: '#4338CA'
//   },
//   stepDistance: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#10B981'
//   },
  
//   // Drawer Actions
//   drawerActions: {
//     flexDirection: 'row',
//     gap: 12,
//     paddingHorizontal: 20,
//     paddingTop: 16,
//     borderTopWidth: 1,
//     borderTopColor: '#E5E7EB'
//   },
//   actionButton: {
//     flex: 1,
//     paddingVertical: 14,
//     borderRadius: 16,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 2
//   },
//   pickupButton: {
//     backgroundColor: '#3B82F6',
//     borderColor: '#60A5FA'
//   },
//   deliveryButton: {
//     backgroundColor: '#10B981',
//     borderColor: '#34D399'
//   },
//   stopButton: {
//     backgroundColor: '#EF4444',
//     borderColor: '#F87171'
//   },
//   actionButtonDisabled: {
//     backgroundColor: '#E5E7EB',
//     borderColor: '#D1D5DB'
//   },
//   actionButtonText: {
//     color: '#FFFFFF',
//     fontSize: 14,
//     fontWeight: '800'
//   },
//   actionButtonTextDisabled: {
//     color: '#9CA3AF'
//   }
// })

// export default DriverTripDetailScreen

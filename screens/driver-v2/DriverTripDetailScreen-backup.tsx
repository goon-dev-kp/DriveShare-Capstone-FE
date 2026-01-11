// // COMMENTED OUT - REPLACED WITH DriverTripDetailScreen-v2.tsx
// // This file is kept for reference but no longer used
// // The new version DriverTripDetailScreen-v2.tsx handles the full API response structure
// // and provides enhanced VietMap integration with better navigation features

// /*
// [Original file content would be here - file has been replaced with v2]
// This file contained the original DriverTripDetailScreen implementation
// but has been superseded by DriverTripDetailScreen-v2.tsx which provides:

// 1. Full API response handling with all fields from the new structure
// 2. Enhanced VietMap React Native SDK integration
// 3. Better navigation and route management
// 4. Improved UI with package details, driver info, contacts, etc.
// 5. Delivery records and contract information display
// 6. Full web and mobile compatibility

// Please use DriverTripDetailScreen-v2.tsx instead of this file.
// */

// export default function DriverTripDetailScreenLegacy() {
//   return null // This component is no longer used
// }
// // Import all navigation components
// import NavigationHUD from '@/components/map/NavigationHUD'
// import ZoomControls from '@/components/map/ZoomControls'
// import SpeedControl from '@/components/map/SpeedControl'
// import RouteProgressBar from '@/components/map/RouteProgressBar'
// import GPSNavigation from '@/components/map/GPSNavigation'
// import WebNavigation from '@/components/map/WebNavigation'
// // import VehicleMarker from '@/components/map/VehicleMarker'
// // import LocationCallout from '@/components/map/LocationCallout'
// import PulseCircleLayer from '@/components/map/PulseCircleLayer'
// import TrafficLayer from '@/components/map/TrafficLayer'
// import type { RouteStepEntry } from '@/utils/navigation'
// import type { Feature, LineString, Position } from 'geojson'
// import { extractRouteWithSteps, nearestCoordIndex, remainingDistanceFrom, haversine, stepsFromCoords, formatMeters, buildAppleMapsLink, buildGoogleMapsLink, lastCoord } from '@/utils/navigation'
// import { toGeoJSONLineFeature } from '@/utils/polyline'
// import type { RouteInstruction } from '@/services/vietmapService'
// import { getNavSession, saveNavSession, clearNavSession } from '@/utils/navSession'
// import vietmapService from '@/services/vietmapService'
// import { smoothSpeed, formatSpeed, calculateArrivalTime } from '@/utils/navigation-metrics'
// import { createProgressFeature } from '@/utils/route-progress'
// import { vietmapStyleUrl, vietmapAPIKey } from '@/config/vietmap'
// import { GradientRouteLayer } from '@/components/map/GradientRouteLayer'
// // VietMap integration now handled by RouteMap component
// import { LocationMarker, VehicleMarker } from '@/components/map/VehicleMarker'
// import { AnimatedRouteProgress } from '@/components/map/AnimatedRouteProgress'
// import { calculateRouteBounds, getCameraConfigForRoute, addPaddingToBounds } from '@/utils/mapHelpers'

// const { height: SCREEN_HEIGHT } = Dimensions.get('window')

// type TripDetailFullDTOExtended = TripDetailFullDTO & {
//   deliveryRecords?: any[]
//   compensations?: any[]
//   issues?: any[]
//   startTime?: string
//   endTime?: string
// }

// type JourneyPhase = 'TO_PICKUP' | 'TO_DELIVERY' | 'COMPLETED'

// // Map Vietmap turn sign codes to icons/text
// const getTurnIcon = (sign: number): string => {
//   const map: Record<number, string> = {
//     0: 'â†‘',      // Continue straight
//     '-3': 'â†',   // Turn sharp left
//     '-2': 'â†™',   // Turn left
//     '-1': 'â†™',   // Slight left
//     1: 'â†—',      // Slight right
//     2: 'â†˜',      // Turn right
//     3: 'â†’',      // Turn sharp right
//     '-7': 'â†¶',   // U-turn left
//     7: 'â†·',      // U-turn right
//     4: 'ðŸ',     // Finish/Destination
//     5: 'ðŸš©',     // Via/Waypoint
//     6: 'ðŸ”ƒ',     // Roundabout
//   }
//   return map[sign] || 'â†‘'
// }

// const getTurnText = (sign: number): string => {
//   const map: Record<number, string> = {
//     0: 'Äi tháº³ng',
//     '-3': 'Rẽ trái gáº¥p',
//     '-2': 'Rẽ trái',
//     '-1': 'Nghiêng trái',
//     1: 'Nghiêng phải',
//     2: 'Rẽ phải',
//     3: 'Rẽ phải gáº¥p',
//     '-7': 'Quay Ä‘áº§u trÃ¡i',
//     7: 'Quay Ä‘áº§u pháº£i',
//     4: 'ÄÃ­ch Ä‘áº¿n',
//     5: 'Äiá»ƒm dá»«ng',
//     6: 'Vòng xuyến',
//   }
//   return map[sign] || 'Tiáº¿p tá»¥c'
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
//   const [simulationActive, setSimulationActive] = useState(false)
//   const [zoomLevel, setZoomLevel] = useState(19.5)
//   const [simulationSpeed, setSimulationSpeed] = useState<number>(1)
//   const [simulationPlaying, setSimulationPlaying] = useState(true)
//   const [simulationDistance, setSimulationDistance] = useState<number>(0)
//   const simulatorRef = useRef<any>(null)
  
//   // Camera tracking states
//   const [cameraMode, setCameraMode] = useState<'follow' | 'overview' | 'free'>('follow')
//   const [pitch, setPitch] = useState(60) // 3D tilt angle
//   const [bearing, setBearing] = useState(0) // Direction facing
//   const [showTraffic, setShowTraffic] = useState(false)
  
//   // Single pickup route - simplified
//   const [pickupRoute, setPickupRoute] = useState<[number, number][]>([])
//   // Route selection for multiple routes
//   const [routes, setRoutes] = useState<Array<{
//     id: string
//     coordinates: [number, number][]
//     color: string
//     label: string
//     visible: boolean
//     distance?: number
//     estimatedTime?: string
//   }>>([])
//   const [selectedRouteId, setSelectedRouteId] = useState<string | undefined>()
//   const [showRoutePanel, setShowRoutePanel] = useState(false)
//   const spokenStepsRef = useRef<Set<number>>(new Set())
//   const watchSubRef = useRef<Location.LocationSubscription | null>(null)
//   const previousSpeedRef = useRef<number>(0)
//   const cameraRef = useRef<any>(null)
//   const mapRef = useRef<any>(null)
//   const driverContract: ContractSummary | null = (trip?.driverContracts && trip.driverContracts[0]) || null

//   useEffect(() => {
//     if (!tripId) { setError('Trip khÃ´ng há»£p lá»‡'); setLoading(false); return }
//     ;(async () => {
//       try {
//         const res = await tripService.getById(tripId)
//         const ok = res?.isSuccess ?? (res?.statusCode === 200)
//         if (!ok) throw new Error(res?.message || 'KhÃ´ng thá»ƒ táº£i chi tiáº¿t chuyáº¿n')
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
//         setError(e?.message || 'Lá»—i khÃ´ng xÃ¡c Ä‘á»‹nh')
//       } finally {
//         setLoading(false)
//       }
//     })()
//   }, [tripId])

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
//           Alert.alert('Vá»‹ trÃ­', 'Cáº§n quyá»n truy cáº­p vá»‹ trÃ­ Ä‘á»ƒ dáº«n Ä‘Æ°á»ng.')
//           setNavActive(false)
//           return
//         }

//         const sub = await Location.watchPositionAsync(
//           { accuracy: Location.Accuracy.Balanced, distanceInterval: 5, timeInterval: 2000 },
//           (loc: Location.LocationObject) => {
//             if (cancelled) return

//             const pos: Position = [loc.coords.longitude, loc.coords.latitude]
//             setCurrentPos(pos)
            
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
            
//             const progress = createProgressFeature(routeCoords, near.index, pos)
//             setProgressFeature(progress || undefined)
            
//             const avgSpeedKmh = smoothedSpeed > 0 ? smoothedSpeed * 3.6 : 40
//             setEta(calculateArrivalTime(remainingDist, avgSpeedKmh))

//             const distanceToPickup = (pickupWaypointIndex > 0 && routeCoords[pickupWaypointIndex]) ? haversine(pos, routeCoords[pickupWaypointIndex] as Position) : Infinity
//             const distanceToDelivery = (deliveryWaypointIndex > 0 && routeCoords[deliveryWaypointIndex]) ? haversine(pos, routeCoords[deliveryWaypointIndex] as Position) : Infinity

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

//             if (routeInstructions.length > 0) {
//               let foundInstr: RouteInstruction | null = null
//               let minDist = Infinity
//               for (const instr of routeInstructions) {
//                 if (!instr.coordinate || !Array.isArray(instr.coordinate) || instr.coordinate.length < 2) continue
//                 const d = haversine(pos, instr.coordinate as Position)
//                 if (d < minDist && d < 500) {
//                   minDist = d
//                   foundInstr = instr
//                 }
//               }
//               if (foundInstr) {
//                 setCurrentInstruction(foundInstr)
//                 setNextInstruction(foundInstr.text || 'Tiáº¿p tá»¥c')
//                 setDistanceToNextTurn(minDist)
//                 const stepIdx = routeInstructions.indexOf(foundInstr)
//                 if (!spokenStepsRef.current.has(stepIdx) && minDist < 100) {
//                   try {
//                     Speech.speak(foundInstr.text || 'Tiáº¿p tá»¥c', { language: 'vi-VN' })
//                     spokenStepsRef.current.add(stepIdx)
//                   } catch {}
//                 }
//               }
//             } else {
//               const ahead = routeCoords[near.index + 10]
//               if (ahead && Array.isArray(ahead) && ahead.length >= 2) {
//                 const d = haversine(pos, ahead as Position)
//                 setDistanceToNextTurn(d)
//               }
//               if (routeSteps.length > 0) {
//                 const stepIndex = Math.min(Math.floor(near.index / 20), routeSteps.length - 1)
//                 const step = routeSteps[stepIndex]
//                 if (step) {
//                   setNextInstruction(step.text || 'Tiáº¿p tá»¥c theo tuyáº¿n Ä‘Æ°á»ng')
//                   if (!spokenStepsRef.current.has(stepIndex) && near.index % 30 === 0) {
//                     try {
//                       Speech.speak(step.text || 'Tiáº¿p tá»¥c', { language: 'vi-VN' })
//                       spokenStepsRef.current.add(stepIndex)
//                     } catch {}
//                   }
//                 }
//               }
//             }

//             const deviceHeading = loc?.coords?.heading
//             if (typeof deviceHeading === 'number' && isFinite(deviceHeading) && deviceHeading >= 0) {
//               setUserBearing(deviceHeading)
//             } else {
//               const ahead = routeCoords[near.index + 1]
//               if (ahead) {
//                 setUserBearing(computeBearing(pos, ahead))
//               }
//             }
//           }
//         )
//         watchSubRef.current = sub
//       } catch (e) {
//         console.error('Location watch error:', e)
//         Alert.alert('Lá»—i vá»‹ trÃ­', 'KhÃ´ng thá»ƒ theo dÃµi vá»‹ trÃ­. Vui lÃ²ng kiá»ƒm tra cÃ i Ä‘áº·t vÃ  thá»­ láº¡i.')
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

//   const handleSimulationPosition = (feature: any) => {
//     const position = feature?.geometry?.coordinates as [number, number] | undefined
//     if (!position) return
    
//     setCurrentPos(position as Position)
//     if (!routeCoords.length) return

//     const near = nearestCoordIndex(position as Position, routeCoords)
//     if (!near) return

//     setNearestIdx(near.index)
//     const remainingDist = remainingDistanceFrom(near.index, routeCoords, position as Position)
//     setRemaining(remainingDist)
    
//     // Update camera bearing for first-person view
//     if (cameraMode === 'follow' && routeCoords[near.index + 1]) {
//       const nextPoint = routeCoords[near.index + 1]
//       const newBearing = computeBearing(position as Position, nextPoint as Position)
//       setBearing(newBearing)
      
//       // Update camera via ref if available
//       if (cameraRef.current && cameraMode === 'follow') {
//         try {
//           cameraRef.current.setCamera({
//             centerCoordinate: position,
//             zoomLevel: zoomLevel,
//             pitch: pitch,
//             heading: newBearing,
//             animationDuration: 1000
//           })
//         } catch (e) {
//           console.log('Camera update failed:', e)
//         }
//       }
//     }
    
//     // Update simulation distance
//     const totalDist = routeCoords.reduce((sum, coord, i) => {
//       if (i === 0) return 0
//       return sum + haversine(routeCoords[i - 1] as Position, coord as Position)
//     }, 0)
//     const traveledDist = totalDist - remainingDist
//     setSimulationDistance(traveledDist)
    
//     const progress = createProgressFeature(routeCoords, near.index, position as Position)
//     setProgressFeature(progress || undefined)
    
//     const avgSpeedKmh = 40
//     setEta(calculateArrivalTime(remainingDist, avgSpeedKmh))

//     const ahead = routeCoords[near.index + 1]
//     if (ahead) {
//       setUserBearing(computeBearing(position as Position, ahead))
//     }
//   }

//   const toggleSimulation = () => {
//     const willActivate = !simulationActive
//     setSimulationActive(willActivate)
    
//     if (willActivate) {
//       Alert.alert(
//         '🧪 Chế độ mô phỏng',
//         'Đang bật simulation mode:\n\n' +
//         '✅ GPS thật → TẮT\n' +
//         '🎬 Animation → BẬT\n' +
//         '🔵 Pulse marker di chuyển tự động\n\n' +
//         'Hữu ích để test navigation UI mà không cần di chuyển thật.',
//         [{ text: 'OK', style: 'default' }]
//       )
//     } else {
//       Alert.alert(
//         '📍 GPS thực',
//         'Simulation tắt. Đang dùng GPS thực.',
//         [{ text: 'OK', style: 'default' }]
//       )
//     }
//   }

//   const handleZoomIn = () => {
//     setZoomLevel(prev => Math.min(prev + 1, 22))
//   }

//   const handleZoomOut = () => {
//     setZoomLevel(prev => Math.max(prev - 1, 10))
//   }

//   const handleRecenter = () => {
//     setZoomLevel(19.5)
//     if (mapRef.current && currentPos) {
//       // Recenter camera on current position
//       try {
//         mapRef.current.setCamera?.({
//           centerCoordinate: currentPos,
//           zoomLevel: 19.5,
//           pitch: 65,
//           heading: userBearing,
//           animationDuration: 500
//         })
//       } catch (e) {
//         console.warn('Recenter failed:', e)
//       }
//     }
//   }

//   const handleSpeedChange = (speed: number) => {
//     setSimulationSpeed(speed)
//     if (simulatorRef.current) {
//       simulatorRef.current.setSpeedMultiplier?.(speed)
//     }
//   }

//   const handlePlayPause = () => {
//     const newPlaying = !simulationPlaying
//     setSimulationPlaying(newPlaying)
    
//     if (simulatorRef.current) {
//       if (newPlaying) {
//         simulatorRef.current.resume?.()
//       } else {
//         simulatorRef.current.pause?.()
//       }
//     }
//   }

//   const handleProgressSeek = (distance: number) => {
//     if (simulatorRef.current) {
//       simulatorRef.current.jumpToDistance?.(distance)
//     }
//     setSimulationDistance(distance)
//   }
  

  
//   // Camera mode functions
//   const switchCameraMode = () => {
//     const modes: Array<'follow' | 'overview' | 'free'> = ['follow', 'overview', 'free']
//     const currentIndex = modes.indexOf(cameraMode)
//     const nextMode = modes[(currentIndex + 1) % modes.length]
//     setCameraMode(nextMode)
    
//     const modeNames = {
//       follow: 'ðŸŽ¯ Theo dÃµi (3D)',
//       overview: 'ðŸ—ºï¸ Tá»•ng quan',
//       free: 'ðŸ–±ï¸ Tá»± do'
//     }
//     Alert.alert('ðŸ“· Cháº¿ Ä‘á»™ camera', `ÄÃ£ chuyá»ƒn sang: ${modeNames[nextMode]}`)
//   }
  
//   const toggleTraffic = () => {
//     setShowTraffic(!showTraffic)
//     Alert.alert(showTraffic ? 'ðŸš¦ ÄÃ£ táº¯t traffic' : 'ðŸš¦ ÄÃ£ báº­t traffic', 
//       showTraffic ? 'KhÃ´ng hiá»ƒn thá»‹ lÆ°u lÆ°á»£ng giao thÃ´ng' : 'Hiá»ƒn thá»‹ lÆ°u lÆ°á»£ng giao thÃ´ng thá»i gian thá»±c')
//   }

//   // Route management functions
//   const handleRouteToggle = (routeId: string) => {
//     setRoutes(prev => prev.map(route => 
//       route.id === routeId 
//         ? { ...route, visible: !route.visible }
//         : route
//     ))
//   }

//   const handleRouteSelect = (routeId: string) => {
//     setSelectedRouteId(routeId)
//     const selectedRoute = routes.find(r => r.id === routeId)
//     if (selectedRoute && selectedRoute.coordinates.length > 0) {
//       setRouteCoords(selectedRoute.coordinates)
//       setRouteFeature(toGeoJSONLineFeature(selectedRoute.coordinates))
//       Alert.alert(
//         'âœ… Tuyáº¿n Ä‘Æ°á»ng Ä‘Ã£ chá»n',
//         `ÄÃ£ chuyá»ƒn sang tuyáº¿n: ${selectedRoute.label}\nSá»‘ Ä‘iá»ƒm: ${selectedRoute.coordinates.length}`,
//         [{ text: 'OK' }]
//       )
//     }
//   }

//   const addSampleRoutes = () => {
//     // Add sample routes for testing
//     const sampleRoutes = [
//       {
//         id: 'route-1',
//         coordinates: routeCoords.length > 0 ? routeCoords : [
//           [106.6297, 10.8231] as [number, number],
//           [106.7009, 10.7797] as [number, number]
//         ],
//         color: '#3B82F6',
//         label: 'Tuyáº¿n chÃ­nh',
//         visible: true,
//         distance: 15000,
//         estimatedTime: '25 phÃºt'
//       },
//       {
//         id: 'route-2', 
//         coordinates: [
//           [106.6297, 10.8231] as [number, number],
//           [106.6500, 10.8100] as [number, number],
//           [106.7009, 10.7797] as [number, number]
//         ],
//         color: '#10B981',
//         label: 'Tuyáº¿n trÃ¡nh káº¹t xe',
//         visible: true,
//         distance: 18000,
//         estimatedTime: '22 phÃºt'
//       },
//       {
//         id: 'route-3',
//         coordinates: [
//           [106.6297, 10.8231] as [number, number],
//           [106.6800, 10.8000] as [number, number],
//           [106.7009, 10.7797] as [number, number]
//         ],
//         color: '#F59E0B',
//         label: 'Tuyáº¿n cao tá»‘c',
//         visible: false,
//         distance: 12000,
//         estimatedTime: '18 phÃºt'
//       }
//     ]
//     setRoutes(sampleRoutes)
//     setSelectedRouteId('route-1')
//   }

//   // VietMap API testing now handled by RouteMap component internally

//   const startNavigation = async () => {
//     if (startingNav) return
//     setStartingNav(true)

//     console.log('ðŸš€ Starting navigation...')
//     console.log('- routeCoords length:', routeCoords.length)
//     console.log('- navActive current:', navActive)
//     console.log('- trip data:', !!trip)

//     try {
//       // Step 1: Validate and extract route data with fallback
//       let baseCoords = routeCoords
//       if (!baseCoords.length) {
//         const raw = trip?.tripRoute?.routeData
//         if (typeof raw === 'string' && raw.length > 0) {
//           try {
//             const { coords } = extractRouteWithSteps(raw)
//             baseCoords = coords as [number, number][]
//             setRouteCoords(baseCoords)
//           } catch (e) {
//             console.warn('Failed to extract route', e)
//             // Continue to fallback instead of throwing
//           }
//         }
//       }

//       // Fallback: Create basic route from trip locations if no route data
//       if (!baseCoords.length) {
//         console.log('No route data found, creating fallback route from trip locations')
//         // Use basic coordinates if available, or create demo route
//         const fallbackCoords: [number, number][] = [
//           [106.6297, 10.8231], // Demo pickup point (Saigon)
//           [106.7009, 10.7797]  // Demo delivery point  
//         ]
//         baseCoords = fallbackCoords
//         setRouteCoords(baseCoords)
//         console.log('Created fallback route for testing')
//       }

//       // Step 2: Request location permission
//       const { status } = await Location.requestForegroundPermissionsAsync()
//       if (status !== 'granted') {
//         throw new Error('Cáº§n quyá»n truy cáº­p vá»‹ trÃ­ Ä‘á»ƒ báº¯t Ä‘áº§u dáº«n Ä‘Æ°á»ng. Vui lÃ²ng vÃ o CÃ i Ä‘áº·t > Quyá»n riÃªng tÆ° Ä‘á»ƒ cáº¥p quyá»n.')
//       }

//       // Step 3: Get current location
//       let now
//       try {
//         now = await Location.getCurrentPositionAsync({ 
//           accuracy: Location.Accuracy.Balanced
//         })
//       } catch (locationError) {
//         throw new Error('KhÃ´ng thá»ƒ láº¥y vá»‹ trÃ­ hiá»‡n táº¡i. Vui lÃ²ng kiá»ƒm tra GPS vÃ  thá»­ láº¡i.')
//       }

//       const currentPosition: Position = [now.coords.longitude, now.coords.latitude]
//       setCurrentPos(currentPosition)

//       const pickupPoint = baseCoords[0] as [number, number]
//       const deliveryPoint = baseCoords[baseCoords.length - 1] as [number, number]

//       if (!pickupPoint || !deliveryPoint) {
//         throw new Error('KhÃ´ng xÃ¡c Ä‘á»‹nh Ä‘Æ°á»£c Ä‘iá»ƒm láº¥y hÃ ng vÃ  Ä‘iá»ƒm giao hÃ ng tá»« dá»¯ liá»‡u chuyáº¿n.')
//       }

//       // Step 4: Plan route with VietMap service
//       let planned
//       try {
//         planned = await vietmapService.planCurrentToTrip(currentPosition as [number, number], pickupPoint, deliveryPoint)
//       } catch (routeError) {
//         console.warn('VietMap planning failed, using fallback:', routeError)
//         // Fallback: use basic route without planning
//         planned = {
//           coordinates: [currentPosition as [number, number], ...baseCoords],
//           instructions: [],
//           pickupIndex: 1,
//           deliveryIndex: baseCoords.length
//         }
//       }
      
//       let finalCoords: [number, number][]
//       let finalSteps: RouteStepEntry[]

//       if (planned.coordinates?.length > 2) {
//         finalCoords = planned.coordinates as [number, number][]
//         finalSteps = stepsFromCoords(finalCoords as Position[])
//         setNavRouteCoords(finalCoords as any)
//         setOverviewCoords(finalCoords as any)
//         setRouteInstructions(planned.instructions || [])
//         setPickupWaypointIndex(planned.pickupIndex || 0)
//         setDeliveryWaypointIndex(planned.deliveryIndex || finalCoords.length - 1)
//       } else {
//         finalCoords = [currentPosition as [number, number], ...baseCoords]
//         finalSteps = stepsFromCoords(finalCoords as Position[])
//         setNavRouteCoords(finalCoords as any)
//         setOverviewCoords([currentPosition as [number, number], pickupPoint, deliveryPoint])
//         setPickupWaypointIndex(1)
//         setDeliveryWaypointIndex(finalCoords.length - 1)
//       }

//       setRouteCoords(finalCoords)
//       setRouteSteps(finalSteps)

//       // Step 5: Create pickup route only
//       console.log('ðŸ—ºï¸ Creating pickup route...')
      
//       // Route to pickup (from current to pickup point only)
//       const pickupCoords = finalCoords.slice(0, pickupWaypointIndex + 1)
//       setPickupRoute(pickupCoords)
//       setRouteCoords(pickupCoords)
//       setRouteFeature(toGeoJSONLineFeature(pickupCoords))
      
//       // Step 6: Activate 3D navigation with camera tracking
//       console.log('ðŸŽ† Activating 3D navigation mode...')
//       setMapInfoOpen(false)
//       setStartModalOpen(false)
//       setCameraMode('follow')
//       setPitch(70) // Increased 3D tilt for better first-person view
//       setZoomLevel(20) // Higher zoom for 3D effect
      
//       // Activate navigation with delay to ensure state update
//       setTimeout(() => {
//         setNavActive(true)
//         console.log('âœ… 3D Navigation activated!')
//         console.log('- navActive set to:', true)
//         console.log('- pickupRoute:', pickupCoords.length, 'points')
//         console.log('- 3D camera: pitch=70, zoom=20')
//       }, 100)
      
//       setJourneyPhase('TO_PICKUP')
      
//       // Force re-render with navigation active
//       console.log('- Navigation active will be:', true)
//       console.log('- Journey phase:', 'TO_PICKUP')
//       console.log('- Route coords:', finalCoords.length, 'points')

//       // Step 6: Save navigation session
//       if (tripId) {
//         try {
//           await saveNavSession(`trip:${tripId}`, {
//             startedAt: Date.now(),
//             routeSummary: { 
//               points: finalCoords.length
//             }
//           })
//           setNavSessionExists(true)
//         } catch (sessionError) {
//           console.warn('Failed to save nav session:', sessionError)
//           // Continue anyway, navigation can work without session
//         }
//       }

//       // Step 7: Voice announcement
//       try {
//         Speech.speak('Báº¯t Ä‘áº§u dáº«n Ä‘Æ°á»ng Ä‘áº¿n Ä‘iá»ƒm láº¥y hÃ ng', { language: 'vi-VN' })
//       } catch (e) {
//         console.log('Text-to-speech not available:', e)
//       }

//       // Debug logging
//       console.log('ðŸš— Navigation started successfully!')
//       console.log('- Route points:', finalCoords.length)
//       console.log('- Pickup index:', pickupWaypointIndex)
//       console.log('- Delivery index:', deliveryWaypointIndex)
//       console.log('- Journey phase:', 'TO_PICKUP')

//       // Success feedback
//       Alert.alert(
//         'âœ… Dáº«n Ä‘Æ°á»ng Ä‘Ã£ báº¯t Ä‘áº§u',
//         `Tuyáº¿n Ä‘Æ°á»ng Ä‘Ã£ Ä‘Æ°á»£c tÃ­nh toÃ¡n vá»›i ${finalCoords.length} Ä‘iá»ƒm. HÃ£y lÃ m theo hÆ°á»›ng dáº«n Ä‘á»ƒ Ä‘áº¿n Ä‘iá»ƒm láº¥y hÃ ng.`,
//         [{ text: 'OK', style: 'default' }]
//       )

//     } catch (error) {
//       console.error('Error starting navigation:', error)
//       const message = error instanceof Error ? error.message : 'KhÃ´ng thá»ƒ báº¯t Ä‘áº§u dáº«n Ä‘Æ°á»ng. Vui lÃ²ng kiá»ƒm tra káº¿t ná»‘i vÃ  thá»­ láº¡i.'
//       Alert.alert('âŒ Lá»—i báº¯t Ä‘áº§u dáº«n Ä‘Æ°á»ng', message)
//     } finally {
//       setStartingNav(false)
//     }
//   }

//   const stopNavigation = async () => {
//     if (watchSubRef.current) {
//       try {
//         watchSubRef.current.remove()
//       } catch (e) {
//         console.error('Error removing location watcher:', e)
//       }
//       watchSubRef.current = null
//     }

//     if (tripId) {
//       await clearNavSession(`trip:${tripId}`)
//     }

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

//     try {
//       Speech.speak('Kết thúc dáº«n Ä‘Æ°á»ng', { language: 'vi-VN' })
//     } catch (e) {
//       console.log('Text-to-speech not available:', e)
//     }
//   }

//   const confirmPickup = () => {
//     if (!canConfirmPickup) {
//       Alert.alert('ChÆ°a Ä‘áº¿n Ä‘iá»ƒm láº¥y hÃ ng', 'Vui lÃ²ng di chuyá»ƒn Ä‘áº¿n gáº§n Ä‘iá»ƒm láº¥y hÃ ng (trong vÃ²ng 300m) Ä‘á»ƒ xÃ¡c nháº­n.')
//       return
//     }
    
//     Alert.alert(
//       'XÃ¡c nháº­n Ä‘Ã£ láº¥y hÃ ng',
//       'Báº¡n Ä‘Ã£ nháº­n hÃ ng tá»« ngÆ°á»i gá»­i?',
//       [
//         { text: 'ChÆ°a', style: 'cancel' },
//         {
//           text: 'ÄÃ£ láº¥y hÃ ng',
//           onPress: () => {
//             setJourneyPhase('TO_DELIVERY')
//             setCanConfirmPickup(false)
//             try {
//               Speech.speak('ÄÃ£ xÃ¡c nháº­n láº¥y hÃ ng. Tiáº¿p tá»¥c Ä‘áº¿n Ä‘iá»ƒm giao hÃ ng', { language: 'vi-VN' })
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
//       Alert.alert('ChÆ°a Ä‘áº¿n Ä‘iá»ƒm giao hÃ ng', 'Vui lÃ²ng di chuyá»ƒn Ä‘áº¿n gáº§n Ä‘iá»ƒm giao hÃ ng (trong vÃ²ng 300m) Ä‘á»ƒ xÃ¡c nháº­n.')
//       return
//     }
    
//     Alert.alert(
//       'XÃ¡c nháº­n Ä‘Ã£ giao hÃ ng',
//       'Báº¡n Ä‘Ã£ giao hÃ ng thÃ nh cÃ´ng cho ngÆ°á»i nháº­n?',
//       [
//         { text: 'ChÆ°a', style: 'cancel' },
//         {
//           text: 'ÄÃ£ giao hÃ ng',
//           onPress: () => {
//             setJourneyPhase('COMPLETED')
//             setCanConfirmDelivery(false)
//             try {
//               Speech.speak('ÄÃ£ hoÃ n thÃ nh giao hÃ ng', { language: 'vi-VN' })
//             } catch (e) {
//               console.log('Text-to-speech error:', e)
//             }
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
//     if (!url) { Alert.alert('Dáº«n Ä‘Æ°á»ng', 'Thiáº¿u Ä‘iá»ƒm Ä‘áº¿n Ä‘á»ƒ má»Ÿ báº£n Ä‘á»“.'); return }
//     try { await Linking.openURL(url) } catch { Alert.alert('Dáº«n Ä‘Æ°á»ng', 'KhÃ´ng thá»ƒ má»Ÿ á»©ng dá»¥ng báº£n Ä‘á»“.') }
//   }

//   // Enhanced helper functions for NavigationHUD
//   const getTurnInstruction = (): string => {
//     if (routeInstructions.length > 0) {
//       const nextInstruction = routeInstructions.find((_, index) => index === nearestIdx + 1)
//       return nextInstruction?.text || routeInstructions[0]?.text || 'Tiáº¿p tá»¥c theo tuyáº¿n Ä‘Æ°á»ng'
//     }
    
//     switch (journeyPhase) {
//       case 'TO_PICKUP':
//         return 'ðŸ“¦ Tiáº¿p tá»¥c Ä‘áº¿n Ä‘iá»ƒm láº¥y hÃ ng'
//       case 'TO_DELIVERY':
//         return 'ðŸŽ¯ Tiáº¿p tá»¥c Ä‘áº¿n Ä‘iá»ƒm giao hÃ ng'
//       default:
//         return 'âœ… ÄÃ£ hoÃ n thÃ nh chuyáº¿n Ä‘i'
//     }
//   }

//   const getDistanceToNextTurn = (): string => {
//     if (distanceToNextTurn > 0 && distanceToNextTurn < 1000) {
//       return `${Math.round(distanceToNextTurn)} m`
//     } else if (distanceToNextTurn >= 1000) {
//       return `${(distanceToNextTurn / 1000).toFixed(1)} km`
//     }
    
//     // Fallback: distance to next waypoint
//     const targetIndex = journeyPhase === 'TO_PICKUP' ? pickupWaypointIndex : deliveryWaypointIndex
//     if (targetIndex >= 0 && routeCoords.length > targetIndex && currentPos) {
//       const targetCoord = routeCoords[targetIndex]
//       const distance = haversine(currentPos as Position, targetCoord as Position)
//       return distance > 1000 ? `${(distance / 1000).toFixed(1)} km` : `${Math.round(distance)} m`
//     }
    
//     return '...'
//   }

//   const getEstimatedArrival = (): string => {
//     if (eta) return eta
    
//     // Calculate ETA based on remaining distance and average speed
//     const avgSpeed = simulationActive ? (simulationSpeed * 40) : 40 // km/h
//     const remainingKm = remaining / 1000
//     const hoursRemaining = remainingKm / avgSpeed
//     const now = new Date()
//     const etaTime = new Date(now.getTime() + hoursRemaining * 3600000)
    
//     return etaTime.toLocaleTimeString('vi-VN', { 
//       hour: '2-digit', 
//       minute: '2-digit' 
//     })
//   }

//   const getSimulationSpeed = (): string => {
//     if (simulationActive) {
//       const speedKmh = simulationSpeed * 40 // Base speed 40 km/h * multiplier
//       return `${Math.round(speedKmh)} km/h`
//     }
//     return currentSpeed ? formatSpeed(currentSpeed) : '--'
//   }



//   // Enhanced journey start logic - Made flexible for testing
//   const canStartJourney = (): boolean => {
//     if (navActive) return false
//     if (startingNav) return false
//     if (!trip) return false
    
//     // For testing: Allow most statuses except completed/cancelled
//     const blockedStatuses = ['COMPLETED', 'CANCELLED']
//     if (blockedStatuses.includes(trip.status)) return false
    
//     // More flexible route check - if we have trip data, we can try to start
//     return true // Allow starting even without perfect route data
//   }

//   const getStartButtonText = (): string => {
//     if (navActive) return 'âœ… Äang dáº«n Ä‘Æ°á»ng'
//     if (startingNav) return 'â³ Äang chuáº©n bá»‹...'
//     if (!trip) return 'âŒ KhÃ´ng cÃ³ dá»¯ liá»‡u'
    
//     switch (trip.status) {
//       case 'COMPLETED':
//         return 'âœ… ÄÃ£ hoÃ n thÃ nh'
//       case 'CANCELLED':
//         return 'âŒ ÄÃ£ há»§y'
//       default:
//         return 'ðŸš— Báº¯t Ä‘áº§u' // Allow starting for all other statuses
//     }
//   }

//   const handleStartJourney = () => {
//     if (!canStartJourney()) {
//       if (!trip) {
//         Alert.alert('Lá»—i', 'KhÃ´ng cÃ³ dá»¯ liá»‡u chuyáº¿n Ä‘i')
//         return
//       }
      
//       // Only block completed/cancelled trips
//       if (trip.status === 'COMPLETED') {
//         Alert.alert('Chuyáº¿n Ä‘Ã£ hoÃ n thÃ nh', 'Chuyáº¿n Ä‘i nÃ y Ä‘Ã£ Ä‘Æ°á»£c hoÃ n thÃ nh.')
//         return
//       }
//       if (trip.status === 'CANCELLED') {
//         Alert.alert('Chuyáº¿n Ä‘Ã£ bá»‹ há»§y', 'Chuyáº¿n Ä‘i nÃ y Ä‘Ã£ bá»‹ há»§y bá».')
//         return
//       }
//     }
    
//     // For testing: Always allow opening modal if we have trip data
//     setStartModalOpen(true)
//   }

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.centered}>
//         <ActivityIndicator size="large" color="#4F46E5" />
//         <Text style={{ marginTop: 8 }}>Äang táº£i chi tiáº¿t chuyáº¿n...</Text>
//       </SafeAreaView>
//     )
//   }

//   if (error || !trip) {
//     return (
//       <SafeAreaView style={styles.centered}>
//         <Text style={styles.errorText}>{error || 'KhÃ´ng tÃ¬m tháº¥y dá»¯ liá»‡u chuyáº¿n.'}</Text>
//         <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
//           <Text style={{ color: '#4F46E5', fontWeight: '600' }}>â† Quay láº¡i</Text>
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

//   // Debug render state
//   console.log('ðŸ”„ Rendering DriverTripDetailScreen:')
//   console.log('- navActive:', navActive)
//   console.log('- startModalOpen:', startModalOpen)
//   console.log('- routeCoords.length:', routeCoords.length)
//   console.log('- trip status:', trip?.status)

//   return (
//     <>
//       <SafeAreaView style={styles.container}>
//         <View style={styles.header}>
//           <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
//             <Text style={styles.backText}>â†</Text>
//           </TouchableOpacity>
//           <Text style={styles.title}>Chi tiáº¿t chuyáº¿n</Text>
//           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
//             <StatusPill value={trip.status} />
//           </View>
//         </View>

//       {/* VietMap integration now handled by RouteMap component */}

//         <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
//           <View style={styles.card}>
//             <Text style={styles.sectionTitle}>Thông tin chuyến</Text>
//             <KeyValue label="MÃ£ chuyáº¿n" value={trip.tripId} />
//             <KeyValue label="Tráº¡ng thÃ¡i" value={trip.status} />
//             <KeyValue label="Báº¯t Ä‘áº§u" value={trip.startTime ? new Date(trip.startTime).toLocaleString('vi-VN') : 'ChÆ°a xÃ¡c Ä‘á»‹nh'} />
//             <KeyValue label="Kết thúc" value={trip.endTime ? new Date(trip.endTime).toLocaleString('vi-VN') : 'ChÆ°a xÃ¡c Ä‘á»‹nh'} />
//           </View>
//           <View style={styles.card}>
//             <Text style={styles.sectionTitle}>Báº£n Ä‘á»“ & Dáº«n Ä‘Æ°á»ng</Text>
//             <View style={styles.mapBox}>
//               {/* Safe VietMap component - no Metro prototype errors */}
//             <VietMapUniversal
//               coordinates={routeCoords}
//               style={{ height: 250 }}
//               showUserLocation={false}
//               navigationActive={false}
//               onLocationUpdate={(pos) => console.log('Location:', pos)}
//               useWebNavigation={false} // Simple map view for trip overview
//             />
            
//             {/* Native SDK - No CORS issues */}
//             <View style={styles.mapOverlay}>
//               <TouchableOpacity
//                 style={[
//                   styles.mapFab,
//                   (!canStartJourney()) && styles.mapFabDisabled
//                 ]}
//                 onPress={handleStartJourney}
//                 disabled={!canStartJourney()}
//               >
//                 <Text style={[
//                   styles.mapFabText,
//                   (!canStartJourney()) && styles.mapFabTextDisabled
//                 ]}>
//                   ðŸš— {getStartButtonText()}
//                 </Text>
//               </TouchableOpacity>
              
//               {/* Route Panel Toggle */}
//               <TouchableOpacity
//                 style={[styles.mapFab, { right: 80, backgroundColor: '#10B981' }]}
//                 onPress={() => {
//                   if (routes.length === 0) {
//                     addSampleRoutes()
//                   }
//                   setShowRoutePanel(!showRoutePanel)
//                 }}
//               >
//                 <Text style={styles.mapFabText}>
//                   ðŸ›£ï¸ Tuyáº¿n Ä‘Æ°á»ng
//                 </Text>
//               </TouchableOpacity>
              
//               {/* Map Mode Indicator */}
//               <View style={styles.mapModeIndicator}>
//                 <Text style={styles.mapModeText}>ðŸ—ºï¸ VietMap Native SDK</Text>
//               </View>
              
//               {/* Route Selection Panel */}
// {showRoutePanel && (
//                 <View style={styles.routePanelContainer}>
// <RouteSelectionPanel
//                     routes={routes}
//                     selectedRouteId={selectedRouteId}
//                     onRouteToggle={handleRouteToggle}
//                     onRouteSelect={handleRouteSelect}
//                   />
// </View>
//               )}
// {/* Quick Route Info */}
// {routeCoords.length > 0 && (
//                 <View style={styles.routeInfoBadge}>
// <Text style={styles.routeInfoText}>
//                     ðŸ“ {routeCoords.length} Ä‘iá»ƒm
//                     {selectedRouteId && (
//                       <Text style={{ color: '#FFD700' }}>
//                         {' â€¢ '}{routes.find(r => r.id === selectedRouteId)?.label || 'ÄÃ£ chá»n'}
//                       </Text>
//                     )}
//                   </Text>
// </View>
//               )}
//             </View>
// </View>
// </View>
// </ScrollView>

//       {/* Enhanced Start Modal */}
// {startModalOpen && !navActive ? (
//         <View style={styles.startModalBackdrop}>
//           <View style={styles.startModalCard}>
//             <View style={styles.startModalHeader}>
//               <Text style={styles.startModalTitle}>ðŸš— Báº¯t Ä‘áº§u hÃ nh trÃ¬nh</Text>
//               <Text style={styles.startModalSubtitle}>Chuyáº¿n #{trip.tripId}</Text>
//             </View>
//             <View style={styles.startModalContent}>
//               <View style={styles.routeInfo}>
//                 <View style={styles.routeStep}>
//                   <View style={styles.routeStepIcon}>
//                     <Text style={styles.routeStepEmoji}>ðŸ“</Text>
//                   </View>
//                   <Text style={styles.routeStepText}>Vá»‹ trÃ­ hiá»‡n táº¡i</Text>
//                 </View>
//                 <View style={styles.routeArrow}>
//                   <Text style={styles.routeArrowText}>â†“</Text>
//                 </View>
//                 <View style={styles.routeStep}>
//                   <View style={styles.routeStepIcon}>
//                     <Text style={styles.routeStepEmoji}>ðŸ“¦</Text>
//                   </View>
//                   <Text style={styles.routeStepText}>Äiá»ƒm láº¥y hÃ ng</Text>
//                 </View>
//                 <View style={styles.routeArrow}>
//                   <Text style={styles.routeArrowText}>â†“</Text>
//                 </View>
//                 <View style={styles.routeStep}>
//                   <View style={styles.routeStepIcon}>
//                     <Text style={styles.routeStepEmoji}>ðŸŽ¯</Text>
//                   </View>
//                   <Text style={styles.routeStepText}>Äiá»ƒm giao hÃ ng</Text>
//                 </View>
//               </View>
              
//               {startingNav && (
//                 <View style={styles.startingIndicator}>
//                   <ActivityIndicator size="small" color="#059669" />
//                   <Text style={styles.startingText}>Äang tÃ­nh toÃ¡n tuyáº¿n Ä‘Æ°á»ng...</Text>
//                 </View>
//               )}
//             </View>
//             <View style={styles.startActionsRow}>
//               <TouchableOpacity
//                 style={[styles.startBtn, styles.dangerBtn]}
//                 onPress={() => setStartModalOpen(false)}
//                 disabled={startingNav}
//               >
//                 <Text style={styles.dangerText}>âŒ Há»§y</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.startBtn, styles.successBtn]}
//                 onPress={startNavigation}
//                 disabled={startingNav}
//               >
//                 <Text style={styles.successText}>
//                   {startingNav ? 'â³ Äang chuáº©n bá»‹...' : 'ðŸš€ Báº¯t Ä‘áº§u dáº«n Ä‘Æ°á»ng'}
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       ) : null}
// {/* Full-screen 3D Navigation */}
// {navActive ? (
//         <View style={styles.navFullscreen}>

//           {/* 3D Map with navigation active - Using VietMapNativeRouteMap for 3D navigation */}
// {/* Safe VietMap navigation component */}
//           <VietMapUniversal
//             coordinates={navRouteCoords ? (navRouteCoords as [number, number][]) : routeCoords}
//             style={{ flex: 1, backgroundColor: '#000000' }}
//             showUserLocation={!simulationActive}
//             navigationActive={true}
//             onLocationUpdate={(pos) => setCurrentPos(pos)}
//             useWebNavigation={true} // Enable full web navigation features
//           />
//           {/* AnimatedRouteProgress for simulation - renders pulse via RouteSimulator */}
// {simulationActive && routeFeature && (
//             <View style={{ position: 'absolute', width: 0, height: 0 }}>
// <AnimatedRouteProgress
//                 route={routeFeature}
//                 isSimulating={simulationActive}
//                 speed={60}
//                 onPositionUpdate={handleSimulationPosition}
//                 usePulse={true}
//                 simulatorRef={simulatorRef}
//               />
// </View>
//           )}
// {/* 3D Navigation Mode Indicator */}
//           <View style={[styles.mapModeIndicator, { top: 80, backgroundColor: 'rgba(17,24,39,0.9)', borderColor: '#EF4444' }]}>
// <Text style={[styles.mapModeText, { color: '#F87171' }]}>ðŸ§­ 3D Navigation Active</Text>
// </View>
          
//           {/* Enhanced NavigationHUD - Top HUD with full details */}
// {/* <NavigationHUD
//             nextInstruction={currentInstruction?.text || nextInstruction || getTurnInstruction()}
//             distanceToNextInstruction={getDistanceToNextTurn()}
//             remainingDistance={formatMeters(remaining)}
//             eta={eta || getEstimatedArrival()}
//             currentSpeed={formatSpeed(currentSpeed) || getSimulationSpeed()}
//             visible={true}
//           /> */}
// {/* ZoomControls temporarily disabled */}
// {/* Speed Control - Only in simulation mode */}
// {/* {simulationActive && (
//             <SpeedControl
//               speed={simulationSpeed}
//               isPlaying={simulationPlaying}
//               onSpeedChange={handleSpeedChange}
//               onPlayPause={handlePlayPause}
//               style={styles.speedControl}
//             />
//           )} */}
// {/* Route Progress Bar - Only in simulation mode */}
// {/* {simulationActive && routeCoords.length > 0 && (
//             <RouteProgressBar
//               currentDistance={simulationDistance}
//               totalDistance={routeCoords.reduce((sum, coord, i) => {
//                 if (i === 0) return 0
//                 return sum + haversine(routeCoords[i - 1] as Position, coord as Position)
//               }, 0)}
//               onSeek={handleProgressSeek}
//               style={styles.progressBar}
//             />
//           )} */}
// {/* Journey Phase Badge with Location Markers */}
//           <View style={styles.phaseBadge}>
// <Text style={styles.phaseBadgeText}>
//               {journeyPhase === 'TO_PICKUP' ? 'ðŸš— Äang Ä‘áº¿n láº¥y hÃ ng' : 
//                journeyPhase === 'TO_DELIVERY' ? 'ðŸ“¦ Äang giao hÃ ng' : 
//                'âœ… HoÃ n thÃ nh'}
//             </Text>
// </View>
          
//           {/* Location Markers Overlay for pickup/delivery points */}
// {journeyPhase === 'TO_PICKUP' && pickupWaypointIndex >= 0 && routeCoords[pickupWaypointIndex] && (
//             <View style={styles.locationMarkerOverlay}>
// <LocationMarker
//                 id="pickup-marker"
//                 coordinate={routeCoords[pickupWaypointIndex] as [number, number]}
//                 type="pickup"
//                 label="Láº¥y hÃ ng"
//               />
// </View>
//           )}
// {journeyPhase === 'TO_DELIVERY' && deliveryWaypointIndex >= 0 && routeCoords[deliveryWaypointIndex] && (
//             <View style={styles.locationMarkerOverlay}>
// <LocationMarker
//                 id="delivery-marker"
//                 coordinate={routeCoords[deliveryWaypointIndex] as [number, number]}
//                 type="dropoff"
//                 label="Giao hÃ ng"
//               />
// </View>
//           )}
// {/* Scrollable Next Steps Preview - Bottom drawer */}
//           <View style={styles.stepsDrawer}>
// <View style={styles.drawerHandle} />
// <Text style={styles.drawerTitle}>CÃ¡c bÆ°á»›c tiáº¿p theo</Text>
// <ScrollView 
//               style={styles.stepsScrollView}
//               contentContainerStyle={styles.stepsScrollContent}
//               showsVerticalScrollIndicator={false}
//             >
//               {routeInstructions.length > 0 ? (
//                 routeInstructions.map((instr, idx) => {
//                   const isNext = idx === 0
//                   return (
//                     <View key={idx} 
//                       style={[
//                         styles.stepRow,
//                         isNext && styles.stepRowNext
//                       ]}
//                     >
// <View style={styles.stepIconContainer}>
// <Text style={[
//                           styles.stepIcon,
//                           isNext && styles.stepIconNext
//                         ]}>
//                           {getTurnIcon(instr.sign || 0)}
//                         </Text>
// </View>
// <View style={styles.stepTextContainer}>
// <Text style={[
//                           styles.stepText,
//                           isNext && styles.stepTextNext
//                         ]} numberOfLines={2}>
//                           {instr.text || 'Tiáº¿p tá»¥c'}
//                         </Text>
//                         {instr.distance && (
//                           <Text style={styles.stepDistance}>
//                             {instr.distance > 1000 
//                               ? `${(instr.distance / 1000).toFixed(1)} km`
//                               : `${Math.round(instr.distance)} m`}
//                           </Text>
//                         )}
//                       </View>
// </View>
//                   )
//                 })
//               ) : (
//                 <View style={styles.stepRow}>
// <Text style={styles.stepText}>Tiáº¿p tá»¥c theo tuyáº¿n Ä‘Æ°á»ng</Text>
// </View>
//               )}
//             </ScrollView>
            
//             {/* Action buttons in drawer */}
//             <View style={styles.drawerActions}>
//               {journeyPhase === 'TO_PICKUP' && (
//                 <TouchableOpacity
//                   onPress={confirmPickup}
//                   disabled={!canConfirmPickup}
//                   style={[
//                     styles.actionButton,
//                     styles.pickupButton,
//                     !canConfirmPickup && styles.actionButtonDisabled
//                   ]}
//                 >
// <Text style={[
//                     styles.actionButtonText,
//                     !canConfirmPickup && styles.actionButtonTextDisabled
//                   ]}>
//                     ðŸ“¦ ÄÃ£ láº¥y hÃ ng
//                   </Text>
// </TouchableOpacity>
//               )}
// {journeyPhase === 'TO_DELIVERY' && (
//                 <TouchableOpacity
//                   onPress={confirmDelivery}
//                   disabled={!canConfirmDelivery}
//                   style={[
//                     styles.actionButton,
//                     styles.deliveryButton,
//                     !canConfirmDelivery && styles.actionButtonDisabled
//                   ]}
//                 >
// <Text style={[
//                     styles.actionButtonText,
//                     !canConfirmDelivery && styles.actionButtonTextDisabled
//                   ]}>
//                     âœ… ÄÃ£ giao hÃ ng
//                   </Text>
// </TouchableOpacity>
//               )}
//               <TouchableOpacity
//                 onPress={stopNavigation}
//                 style={[styles.actionButton, styles.stopButton]}
//               >
// <Text style={styles.actionButtonText}>â¹ï¸ Dá»«ng dáº«n Ä‘Æ°á»ng</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
// </View>
//       ) : null}
//     </SafeAreaView>
    
//     {/* Full-screen 3D Navigation - Outside SafeAreaView for proper fullscreen rendering */}
// {navActive && (
//       <View style={styles.navFullscreen}>
//         {/* Debug: Navigation UI is rendering */}
// {(() => {
//           console.log('ðŸš€ 3D Navigation UI:', {
//             navActive,
//             routeCoords: routeCoords.length,
//             currentPos,
//             userBearing,
//             zoomLevel
//           })
//           return null
//         })()}
//         {/* Enhanced VietMap 3D Navigation Component */}
//         <VietMapUniversal
//           coordinates={routeCoords}
//           style={{ flex: 1 }}
//           showUserLocation={true}
//           navigationActive={simulationActive}
//           onLocationUpdate={(pos) => {
//             setCurrentPos(pos)
//             // Enhanced 3D camera tracking
//             if (cameraMode === 'follow' && routeCoords.length > 0) {
//               const nearestPoint = nearestCoordIndex(pos, routeCoords)
//               if (nearestPoint && routeCoords[nearestPoint.index + 1]) {
//                 const nextPoint = routeCoords[nearestPoint.index + 1]
//                 const newBearing = computeBearing(pos, nextPoint as Position)
//                 setBearing(newBearing)
//               }
//             }
//           }}
//           useWebNavigation={true}
//         />
//         {/* AnimatedRouteProgress for simulation - renders pulse via RouteSimulator */}
// {simulationActive && routeFeature && (
//           <View style={{ position: 'absolute', width: 0, height: 0 }}>
// <AnimatedRouteProgress
//               route={routeFeature}
//               isSimulating={simulationActive}
//               speed={60}
//               onPositionUpdate={handleSimulationPosition}
//               usePulse={true}
//               simulatorRef={simulatorRef}
//             />
// </View>
//         )}
// {/* 3D Navigation Mode Indicator */}
// {/* <View style={[styles.mapModeIndicator, { top: 80, backgroundColor: 'rgba(17,24,39,0.9)', borderColor: '#EF4444' }]}>
// <Text style={[styles.mapModeText, { color: '#F87171' }]}>ðŸ§­ 3D Navigation Active</Text>
// </View> */}
// {/* NavigationHUD temporarily disabled */}
// {/* Navigation UI components temporarily disabled */}
//         {/* 3D Navigation Indicator - Top left */}
//         <View style={styles.navigationIndicator}>
//           <Text style={styles.navigationIndicatorText}>ðŸŽ¯ 3D Navigation</Text>
//           <Text style={styles.navigationIndicatorSubtext}>Äáº¿n Ä‘iá»ƒm láº¥y hÃ ng</Text>
//           <Text style={styles.navigationIndicatorSubtext}>{pickupRoute.length} Ä‘iá»ƒm</Text>
//         </View>        {/* Enhanced 3D Camera Controls - Top right */}
//         <View style={styles.cameraControlPanel}>
//           <TouchableOpacity
//             onPress={switchCameraMode}
//             style={[
//               styles.cameraButton,
//               { backgroundColor: cameraMode === 'follow' ? '#3B82F6' : 'rgba(107, 114, 128, 0.8)' }
//             ]}
//           >
//             <Text style={styles.cameraButtonText}>
//               {cameraMode === 'follow' ? 'ðŸŽ¯' : cameraMode === 'overview' ? 'ðŸ—ºï¸' : 'ðŸ–±ï¸'}
//             </Text>
//             <Text style={styles.cameraButtonSubtext}>
//               {cameraMode === 'follow' ? '3D Follow' : cameraMode === 'overview' ? 'Overview' : 'Free'}
//             </Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             onPress={() => {
//               const newPitch = pitch === 70 ? 45 : pitch === 45 ? 0 : 70
//               setPitch(newPitch)
//               Alert.alert('ðŸ“ Camera Tilt', `Pitch: ${newPitch}Â° ${newPitch === 70 ? '(3D Max)' : newPitch === 45 ? '(Medium)' : '(2D)'}`)
//             }}
//             style={styles.cameraButton}
//           >
//             <Text style={styles.cameraButtonText}>ðŸ“</Text>
//             <Text style={styles.cameraButtonSubtext}>{pitch}Â°</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             onPress={toggleTraffic}
//             style={[
//               styles.cameraButton,
//               { backgroundColor: showTraffic ? '#EF4444' : 'rgba(107, 114, 128, 0.8)' }
//             ]}
//           >
//             <Text style={styles.cameraButtonText}>ðŸš¦</Text>
//             <Text style={styles.cameraButtonSubtext}>
//               {showTraffic ? 'ON' : 'OFF'}
//             </Text>
//           </TouchableOpacity>
//         </View>        {/* Compact Journey Phase Badge */}
//         <View style={styles.phaseBadge}>
// <Text style={styles.phaseBadgeText}>
//             {journeyPhase === 'TO_PICKUP' ? 'Äáº¿n láº¥y hÃ ng' :
//              journeyPhase === 'TO_DELIVERY' ? 'Äang giao hÃ ng' : 'HoÃ n thÃ nh'}
//           </Text>
// <Text style={styles.phaseBadgeSubtext}>
//             Chuyáº¿n #{trip.tripId}
//           </Text>
// </View>        {/* Bottom Action Drawer - Slides up from bottom */}
//         <View style={styles.stepsDrawer}>
// <View style={styles.drawerHandle} />
// <Text style={styles.drawerTitle}>CÃ¡c bÆ°á»›c tiáº¿p theo</Text>
// <ScrollView 
//             style={styles.stepsScrollView}
//             contentContainerStyle={styles.stepsScrollContent}
//             showsVerticalScrollIndicator={false}
//           >
//             {routeInstructions.length > 0 ? (
//               routeInstructions.map((instr, idx) => {
//                 const isNext = idx === 0
//                 return (
//                   <View key={idx} 
//                     style={[
//                       styles.stepRow,
//                       isNext && styles.stepRowNext
//                     ]}
//                   >
// <View style={styles.stepIconContainer}>
// <Text style={[
//                         styles.stepIcon,
//                         isNext && styles.stepIconNext
//                       ]}>
//                         {getTurnIcon(instr.sign || 0)}
//                       </Text>
// </View>
// <View style={styles.stepTextContainer}>
// <Text style={[
//                         styles.stepText,
//                         isNext && styles.stepTextNext
//                       ]} numberOfLines={2}>
//                         {instr.text || 'Tiáº¿p tá»¥c'}
//                       </Text>
//                       {instr.distance && (
//                         <Text style={styles.stepDistance}>
//                           {instr.distance > 1000 
//                             ? `${(instr.distance / 1000).toFixed(1)} km`
//                             : `${Math.round(instr.distance)} m`}
//                         </Text>
//                       )}
//                     </View>
// </View>
//                 )
//               })
//             ) : (
//               <View style={styles.stepRow}>
// <Text style={styles.stepText}>Tiáº¿p tá»¥c theo tuyáº¿n Ä‘Æ°á»ng</Text>
// </View>
//             )}
//           </ScrollView>
          
//           {/* Action buttons in drawer */}
//           <View style={styles.drawerActions}>
//             {journeyPhase === 'TO_PICKUP' && (
//               <TouchableOpacity
//                 onPress={confirmPickup}
//                 disabled={!canConfirmPickup}
//                 style={[
//                   styles.actionButton,
//                   styles.pickupButton,
//                   !canConfirmPickup && styles.actionButtonDisabled
//                 ]}
//               >
// <Text style={[
//                   styles.actionButtonText,
//                   !canConfirmPickup && styles.actionButtonTextDisabled
//                 ]}>
//                   ðŸ“¦ ÄÃ£ láº¥y hÃ ng
//                 </Text>
// </TouchableOpacity>
//             )}
// {journeyPhase === 'TO_DELIVERY' && (
//               <TouchableOpacity
//                 onPress={confirmDelivery}
//                 disabled={!canConfirmDelivery}
//                 style={[
//                   styles.actionButton,
//                   styles.deliveryButton,
//                   !canConfirmDelivery && styles.actionButtonDisabled
//                 ]}
//               >
// <Text style={[
//                   styles.actionButtonText,
//                   !canConfirmDelivery && styles.actionButtonTextDisabled
//                 ]}>
//                   ðŸŽ¯ ÄÃ£ giao hÃ ng
//                 </Text>
// </TouchableOpacity>
//             )}
//             <TouchableOpacity
//               onPress={stopNavigation}
//               style={[styles.actionButton, styles.stopButton]}
//               </TouchableOpacity>
//             </View>
//           </View>
// <Text style={styles.actionButtonText}>â¹ï¸ Dá»«ng dáº«n Ä‘Æ°á»ng</Text>
//               </TouchableOpacity>`n            </View>`n          </View>
// </View>
//     )}
//     </>
//   )
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#F9FAFB' },
//   centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
//   errorText: { color: '#EF4444', textAlign: 'center', paddingHorizontal: 20, fontFamily: 'System', fontSize: 16 },
//   header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
//   backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
//   backText: { fontSize: 26, color: '#111827', marginTop: -2, fontFamily: 'System' },
//   title: { fontSize: 18, fontWeight: '800', color: '#111827', fontFamily: 'System' },
//   pill: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
//   pillText: { fontSize: 12, fontWeight: '700', fontFamily: 'System' },

//   card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 },
//   sectionTitle: { fontWeight: '800', fontSize: 16, color: '#111827', marginBottom: 8, fontFamily: 'System' },

//   mapBox: { position: 'relative', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' },
//   mapOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'box-none' },
//   mapFab: { position: 'absolute', right: 12, bottom: 12, backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
//   mapFabDisabled: { backgroundColor: '#9CA3AF', opacity: 0.6 },
//   mapFabText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14, fontFamily: 'System' },
//   mapFabTextDisabled: { color: '#D1D5DB', fontFamily: 'System' },
//   routeInfoBadge: { position: 'absolute', left: 12, top: 12, backgroundColor: 'rgba(59, 130, 246, 0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#3B82F6' },
//   routeInfoText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600', fontFamily: 'System' },
  
//   // Vehicle and Location Marker Overlays
//   vehicleMarkerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' },
//   locationMarkerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' },

//   kvRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
//   kvLabel: { color: '#6B7280', fontSize: 13, fontFamily: 'System' },
//   kvValue: { color: '#111827', fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 8, fontFamily: 'System' },

//   // Enhanced Start Modal
//   startModalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 },
//   startModalCard: { backgroundColor: '#FFFFFF', width: '100%', maxWidth: 420, borderRadius: 24, padding: 0, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 25, elevation: 10 },
//   startModalHeader: { padding: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
//   startModalTitle: { fontSize: 22, fontWeight: '800', color: '#111827', textAlign: 'center', fontFamily: 'System' },
//   startModalSubtitle: { fontSize: 14, fontWeight: '600', color: '#6B7280', textAlign: 'center', marginTop: 4, fontFamily: 'System' },
//   startModalContent: { padding: 24, paddingTop: 16, paddingBottom: 16 },
//   routeInfo: { alignItems: 'center' },
//   routeStep: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
//   routeStepIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
//   routeStepEmoji: { fontSize: 16 },
//   routeStepText: { fontSize: 14, fontWeight: '600', color: '#374151', flex: 1, fontFamily: 'System' },
//   routeArrow: { marginVertical: 4 },
//   routeArrowText: { fontSize: 18, color: '#9CA3AF', textAlign: 'center' },
//   startingIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, padding: 12, backgroundColor: '#F0FDF4', borderRadius: 12, borderWidth: 1, borderColor: '#BBF7D0' },
//   startingText: { marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#059669', fontFamily: 'System' },
//   startActionsRow: { flexDirection: 'row', gap: 12, padding: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
//   startBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
//   dangerBtn: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
//   dangerText: { color: '#DC2626', fontWeight: '800', fontSize: 15, fontFamily: 'System' },
//   successBtn: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
//   successText: { color: '#059669', fontWeight: '800', fontSize: 15, fontFamily: 'System' },

//   // Fullscreen Navigation
//   navFullscreen: { 
//     position: 'absolute', 
//     top: 0, 
//     left: 0, 
//     right: 0, 
//     bottom: 0, 
//     backgroundColor: '#000',
//     zIndex: 1000,
//     elevation: 1000
//   },
  
//   // Compact Phase Badge - Top right corner
//   phaseBadge: {
//     position: 'absolute',
//     top: 140,
//     right: 16,
//     backgroundColor: 'rgba(17, 24, 39, 0.95)',
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     borderRadius: 22,
//     borderWidth: 2,
//     borderColor: '#10B981',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.4,
//     shadowRadius: 6,
//     elevation: 8,
//     alignItems: 'center'
//   },
//   phaseBadgeText: {
//     color: '#FFFFFF',
//     fontSize: 13,
//     fontWeight: '700',
//     textAlign: 'center',
//     fontFamily: 'System'
//   },
//   phaseBadgeSubtext: {
//     color: '#10B981',
//     fontSize: 11,
//     fontWeight: '600',
//     marginTop: 2,
//     textAlign: 'center',
//     fontFamily: 'System'
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
//     marginBottom: 12,
//     fontFamily: 'System'
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
//     marginBottom: 2,
//     fontFamily: 'System'
//   },
//   stepTextNext: {
//     fontSize: 15,
//     fontWeight: '800',
//     color: '#4338CA',
//     fontFamily: 'System'
//   },
//   stepDistance: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#10B981',
//     fontFamily: 'System'
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
//   simulationButton: {
//     backgroundColor: '#8B5CF6',
//     borderColor: '#A78BFA'
//   },
//   simulationActiveButton: {
//     backgroundColor: '#F59E0B',
//     borderColor: '#FBBf24'
//   },
//   actionButtonText: {
//     color: '#FFFFFF',
//     fontSize: 14,
//     fontWeight: '800',
//     fontFamily: 'System'
//   },
//   actionButtonTextDisabled: {
//     color: '#9CA3AF',
//     fontFamily: 'System'
//   },
//   speedControl: {
//     position: 'absolute',
//     left: 16,
//     bottom: 200,
//     right: 16,
//     zIndex: 10
//   },
//   progressBar: {
//     position: 'absolute',
//     left: 16,
//     bottom: 140,
//     right: 16,
//     zIndex: 10,
//     height: 40
//   },
//   mapModeIndicator: {
//     position: 'absolute',
//     top: 16,
//     right: 16,
//     backgroundColor: 'rgba(17,24,39,0.8)',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: '#059669'
//   },
//   mapModeText: {
//     color: '#10B981',
//     fontSize: 12,
//     fontWeight: '600',
//     fontFamily: 'System'
//   },
//   routePanelContainer: {
//     position: 'absolute',
//     top: 50,
//     left: 16,
//     right: 16,
//     zIndex: 1000,
//     elevation: 1000
//   },
  
//   // 3D Navigation Indicator
//   navigationIndicator: {
//     position: 'absolute',
//     top: 50,
//     left: 16,
//     zIndex: 1000,
//     elevation: 1000,
//     backgroundColor: 'rgba(59, 130, 246, 0.95)',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 16,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     borderWidth: 2,
//     borderColor: '#FFFFFF'
//   },
//   navigationIndicatorText: {
//     color: '#FFFFFF',
//     fontSize: 14,
//     fontWeight: '800',
//     textAlign: 'center',
//     fontFamily: 'System'
//   },
//   navigationIndicatorSubtext: {
//     color: '#FFFFFF',
//     fontSize: 11,
//     fontWeight: '600',
//     opacity: 0.9,
//     fontFamily: 'System',
//     marginTop: 2,
//     textAlign: 'center'
//   },
  
//   // Camera Control Panel
//   cameraControlPanel: {
//     position: 'absolute',
//     top: 50,
//     right: 16,
//     zIndex: 1000,
//     elevation: 1000,
//     flexDirection: 'column',
//     gap: 8
//   },
//   cameraButton: {
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 12,
//     backgroundColor: 'rgba(107, 114, 128, 0.8)',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 5,
//     minWidth: 65
//   },
//   cameraButtonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     textAlign: 'center',
//     fontFamily: 'System'
//   },
//   cameraButtonSubtext: {
//     color: '#FFFFFF',
//     fontSize: 9,
//     fontWeight: '600',
//     opacity: 0.9,
//     marginTop: 2,
//     fontFamily: 'System'
//   }
// })

// export default DriverTripDetailScreen




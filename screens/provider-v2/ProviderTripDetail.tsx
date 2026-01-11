


import React, { useEffect, useMemo, useState } from 'react'
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Alert, Linking, Modal, Image, Dimensions
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import tripService from '@/services/tripService'
import { TripDetailFullDTOExtended, Role } from '@/models/types'
import { useAuth } from '@/hooks/useAuth'
import { useSignalRLocation } from '@/hooks/useSignalRLocation'
import { useRouter } from 'expo-router'
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons'
import VietMapUniversal from '@/components/map/VietMapUniversal'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { decodePolyline } from '@/utils/polyline'
import Svg, { Polyline as SvgPolyline, Circle as SvgCircle } from 'react-native-svg'

interface ProviderTripDetailProps {
  tripId?: string
  showHeader?: boolean
  onBack?: () => void
}

// --- LIQUIDATION REPORT (Trip Completed Report) ---
interface LiquidationItem {
  Description: string
  Amount: number
  IsDeduction?: boolean
  // Backward compat
  IsNegative?: boolean
}

interface PersonReport {
  UserId: string
  Role: string
  FullName: string
  Email: string
  Items: LiquidationItem[]
  FinalAmount?: number
  // Backward compat
  FinalWalletChange?: number
}

interface LiquidationReport {
  TripId: string
  TripCode: string
  CompletedDate?: string
  OwnerReport: PersonReport
  ProviderReport: PersonReport
  DriverReports: PersonReport[]
}

const { width } = Dimensions.get('window')

// Lightweight SVG preview for encoded route polyline (works in Expo Go)
const MapPreview: React.FC<{ routeData: string; style?: any; precision?: number }> = ({ routeData, style = {}, precision = 5 }) => {
  try {
    const decoded = decodePolyline(routeData, precision)
    const coords = (decoded && decoded.coordinates) || []
    if (!coords || coords.length === 0) return (
      <View style={[{ height: 220, alignItems: 'center', justifyContent: 'center' }, style]}>
        <MaterialCommunityIcons name="map" size={48} color="#9CA3AF" />
        <Text style={{ color: '#6B7280', marginTop: 8 }}>No route preview</Text>
      </View>
    )

    const padding = 12
    const vw = typeof style.width === 'number' ? style.width : width - 32
    const vh = typeof style.height === 'number' ? style.height : 220

    const lons = coords.map(c => c[0])
    const lats = coords.map(c => c[1])
    const minLon = Math.min(...lons)
    const maxLon = Math.max(...lons)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)

    const w = Math.max(1, vw - padding * 2)
    const h = Math.max(1, vh - padding * 2)

    const normalize = (lon: number, lat: number) => {
      const x = (maxLon === minLon) ? w / 2 : ((lon - minLon) / (maxLon - minLon)) * w
      const yFrac = (maxLat === minLat) ? 0.5 : ((lat - minLat) / (maxLat - minLat))
      const y = (1 - yFrac) * h
      return { x: padding + x, y: padding + y }
    }

    const points = coords.map(c => {
      const p = normalize(c[0], c[1])
      return `${p.x},${p.y}`
    }).join(' ')

    const start = normalize(coords[0][0], coords[0][1])
    const end = normalize(coords[coords.length - 1][0], coords[coords.length - 1][1])

    return (
      <View style={[{ height: vh, width: vw, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' }, style]}>
        <Svg width={vw} height={vh}>
          <SvgPolyline points={points} fill="none" stroke="#2563EB" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          <SvgCircle cx={start.x} cy={start.y} r={6} fill="#10B981" />
          <SvgCircle cx={end.x} cy={end.y} r={6} fill="#EF4444" />
        </Svg>
      </View>
    )
  } catch (e) {
    return (
      <View style={[{ height: 220, alignItems: 'center', justifyContent: 'center' }, style]}>
        <MaterialCommunityIcons name="map" size={48} color="#9CA3AF" />
        <Text style={{ color: '#6B7280', marginTop: 8 }}>Preview error</Text>
      </View>
    )
  }
}

// --- PALETTE MÀU SẮC ---
const COLORS = {
  primary: '#0284C7', // Xanh dương đậm
  bg: '#F3F4F6',      // Nền xám nhạt
  white: '#FFFFFF',
  text: '#1F2937',    // Đen xám
  textLight: '#6B7280', // Xám nhạt
  border: '#E5E7EB',
  success: '#10B981', // Xanh lá
  warning: '#F59E0B', // Cam
  danger: '#EF4444',  // Đỏ
  blue: '#3B82F6',    // Xanh dương
  orangeBadge: '#F97316', // Màu cam badge
  
  // Màu nền contact
  senderBg: '#DBEAFE',   // Xanh nhạt
  receiverBg: '#FFEDD5', // Cam nhạt
}

const ProviderTripDetail: React.FC<ProviderTripDetailProps> = ({ tripId, showHeader = true, onBack }) => {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trip, setTrip] = useState<TripDetailFullDTOExtended | null>(null)
  const [signing, setSigning] = useState(false)
  const [showContractModal, setShowContractModal] = useState(false)

  const [liquidationReport, setLiquidationReport] = useState<LiquidationReport | null>(null)
  const [liquidationExpanded, setLiquidationExpanded] = useState(false)

  // ========== REAL-TIME TRACKING ==========
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number; bearing: number } | null>(null)
  const { location, connected, error: signalRError } = useSignalRLocation({
    tripId: tripId,
    enabled: trip?.status === 'IN_PROGRESS' || trip?.status === 'VEHICLE_HANDOVERED',
  })

  // Update driver location when received from SignalR
  useEffect(() => {
    if (location) {
      console.log('[Provider] Driver location received:', location)
      setDriverLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        bearing: location.bearing,
      })
    }
  }, [location])

  useEffect(() => { if (tripId) fetchTrip(tripId) }, [tripId])

  const fetchTrip = async (id: string) => {
    setLoading(true); setError(null)
    try {
      const res = await tripService.getById(id)
      if (res.isSuccess && res.result) {
        const data: any = res.result

        // Parse liquidation report if trip is COMPLETED
        if (data?.status === 'COMPLETED' && data?.liquidationReportJson) {
          try {
            const parsedReport = JSON.parse(data.liquidationReportJson)
            setLiquidationReport(parsedReport)
          } catch (err) {
            console.warn('[Provider] Failed to parse liquidationReportJson:', err)
            setLiquidationReport(null)
          }
        } else {
          setLiquidationReport(null)
        }

        setTrip({
          ...data,
          deliveryRecords: data.deliveryRecords || [],
          compensations: data.compensations || [],
          issues: data.issues || []
        })
      } else throw new Error(res.message || 'Không tải được chuyến')
    } catch (e: any) { setError(e?.message || 'Lỗi không xác định') } finally { setLoading(false) }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const isDeduction = (item: LiquidationItem) => {
    if (typeof item?.IsDeduction === 'boolean') return item.IsDeduction
    if (typeof item?.IsNegative === 'boolean') return item.IsNegative
    return (item?.Amount ?? 0) < 0
  }

  const getFinalAmount = (person: PersonReport) => {
    if (typeof person?.FinalAmount === 'number') return person.FinalAmount
    if (typeof person?.FinalWalletChange === 'number') return person.FinalWalletChange
    return 0
  }

  const renderLiquidationReport = () => {
    if (trip?.status !== 'COMPLETED' || !liquidationReport) return null

    const report = liquidationReport
    const completedAtText = report.CompletedDate
      ? new Date(report.CompletedDate).toLocaleString('vi-VN')
      : undefined

    // Financial summary (based on OwnerReport items)
    const totalRevenue = (report.OwnerReport?.Items || [])
      .filter(i => !isDeduction(i))
      .reduce((sum, i) => sum + Math.abs(i.Amount ?? 0), 0)

    const totalExpense = (report.OwnerReport?.Items || [])
      .filter(i => isDeduction(i))
      .reduce((sum, i) => sum + Math.abs(i.Amount ?? 0), 0)

    const allParticipants: PersonReport[] = [
      report.OwnerReport,
      report.ProviderReport,
      ...(report.DriverReports || [])
    ].filter(Boolean) as PersonReport[]

    const renderPerson = (person: PersonReport) => {
      return (
        <View key={person.UserId} style={styles.liquidationCard}>
          <View style={styles.liquidationCardHeader}>
            <View style={styles.liquidationAvatar}>
              <Text style={styles.liquidationAvatarText}>{(person.Role || '?').slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.liquidationName}>{person.FullName}</Text>
              <Text style={styles.liquidationRole}>{person.Role}</Text>
              <Text style={styles.liquidationEmail}>{person.Email}</Text>
            </View>
            <View style={styles.liquidationFinalBox}>
              <Text style={styles.liquidationFinalLabel}>Final</Text>
              <Text style={[
                styles.liquidationFinalValue,
                getFinalAmount(person) >= 0 ? styles.positiveAmount : styles.negativeAmount
              ]}>
                {getFinalAmount(person) >= 0 ? '+' : ''}{formatCurrency(getFinalAmount(person))}
              </Text>
            </View>
          </View>

          <View style={styles.liquidationDivider} />

          {(person.Items || []).map((item, idx) => (
            <View key={`${person.UserId}:${idx}`} style={styles.liquidationItemRow}>
              <View style={styles.liquidationItemLeft}>
                <View style={[
                  styles.liquidationDot,
                  { backgroundColor: isDeduction(item) ? COLORS.danger : COLORS.success }
                ]} />
                <Text style={styles.liquidationItemText}>{item.Description}</Text>
              </View>
              <Text style={[
                styles.liquidationItemAmount,
                isDeduction(item) ? styles.negativeAmount : styles.positiveAmount
              ]}>
                {isDeduction(item) ? '-' : '+'}{formatCurrency(Math.abs(item.Amount ?? 0))}
              </Text>
            </View>
          ))}
        </View>
      )
    }

    return (
      <View style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setLiquidationExpanded(v => !v)}
          style={styles.liquidationHeader}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>📊 Báo cáo chuyến (Hoàn tất)</Text>
            <Text style={styles.liquidationSub}>Trip: {report.TripCode}{completedAtText ? ` • ${completedAtText}` : ''}</Text>
          </View>
          <Ionicons
            name={liquidationExpanded ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={COLORS.text}
          />
        </TouchableOpacity>

        {liquidationExpanded && (
          <>
            <View style={styles.liquidationSummaryRow}>
              <View style={styles.liquidationSummaryBox}>
                <Text style={styles.liquidationSummaryLabel}>Tổng Thu</Text>
                <Text style={[styles.liquidationSummaryValue, { color: COLORS.success }]}>{formatCurrency(totalRevenue)}</Text>
              </View>
              <View style={styles.liquidationSummaryBox}>
                <Text style={styles.liquidationSummaryLabel}>Tổng Chi</Text>
                <Text style={[styles.liquidationSummaryValue, { color: COLORS.danger }]}>{formatCurrency(totalExpense)}</Text>
              </View>
            </View>

            <View style={{ height: 12 }} />

            {allParticipants.map(renderPerson)}
          </>
        )}
      </View>
    )
  }

  // --- LOGIC ---
  const providerContract = trip?.providerContracts
  const isProviderUser = user?.role === Role.PROVIDER
  const ownerSigned = !!providerContract?.ownerSigned
  const providerSigned = !!providerContract?.counterpartySigned
  const bothSigned = ownerSigned && providerSigned
  const waitingForOther = providerSigned && !ownerSigned
  const canSign = isProviderUser && !providerSigned
  const signBtnLabel = bothSigned ? 'Đã hoàn tất' : (!providerSigned ? 'Ký ngay' : 'Đợi đối tác')

  const routeCoordinates = useMemo<[number, number][]>(() => {
    const routeData: unknown = trip?.tripRoute?.routeData
    if (!routeData) return []

    // Legacy/alternate format support: GeoJSON-like object or JSON string
    try {
      if (typeof routeData === 'string') {
        const trimmed = routeData.trim()
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          const parsed = JSON.parse(trimmed)
          const coords = (parsed as any)?.geometry?.coordinates
          if (Array.isArray(coords) && coords.length > 1) return coords as [number, number][]
        }

        // Default: encoded polyline
        const decoded = decodePolyline(trimmed)
        return decoded.coordinates || []
      }

      const coords = (routeData as any)?.geometry?.coordinates
      if (Array.isArray(coords) && coords.length > 1) return coords as [number, number][]
    } catch (e) {
      console.warn('[Provider] Failed to decode routeData:', e)
    }

    return []
  }, [trip?.tripRoute?.routeData])

  const paymentEligibleStatuses = ['AWAITING_PROVIDER_PAYMENT','AWAITING_FINAL_PROVIDER_PAYMENT']
  const showPayment = paymentEligibleStatuses.includes(trip?.status || '')
  const paymentLabel = trip?.status === 'AWAITING_FINAL_PROVIDER_PAYMENT' ? 'Quyết toán cuối' : 'Thanh toán'

  const handleSign = async () => {
    if (!providerContract?.contractId || !canSign) return
    setSigning(true)
    try {
      const response: any = await tripService.signProviderContract(providerContract.contractId)
      if (response?.isSuccess || response?.statusCode === 200) {
        Alert.alert('Thành công', 'Đã ký hợp đồng!')
        if (tripId) fetchTrip(tripId)
      } else throw new Error(response?.message || 'Ký thất bại')
    } catch (e: any) { Alert.alert('Lỗi', e?.message || 'Có lỗi xảy ra') } finally { setSigning(false) }
  }

  const navigateToPaymentFlow = () => {
    if (!trip || !providerContract) return
    const redirect = encodeURIComponent(`/(provider)/trip-detail?tripId=${tripId}`)
    router.push({
      pathname: '/(wallet)/pay-trip',
      params: { tripId: tripId as string, amount: String(providerContract.contractValue || 0), contractCode: providerContract.contractCode || '', redirect }
    } as any)
  }

  const openContractPdf = async () => {
    if (!providerContract?.contractId) return
    try {
      // Logic mở PDF (giả lập)
      Alert.alert('PDF', 'Đang mở file hợp đồng...')
    } catch { Alert.alert('Lỗi', 'Không mở được file.') }
  }

  // --- COMPONENTS ---

  // 1. Modal Hợp đồng Chi tiết (giữ modal gọn, hiển thị điều khoản và nút ký)
  const renderContractModal = () => {
    if (!showContractModal) return null
    if (!providerContract?.contractId) return null

    const terms = (providerContract.terms || []).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))

    return (
      <Modal visible transparent animationType="fade" onRequestClose={() => setShowContractModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hợp đồng vận tải</Text>
              <TouchableOpacity onPress={() => setShowContractModal(false)}>
                <Text style={styles.closeX}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 12 }}>
              <Text style={styles.contractHeaderTitle}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</Text>
              <Text style={styles.contractHeaderSubtitle}>Độc lập - Tự do - Hạnh phúc</Text>
              <Text style={styles.contractHeaderLine}>---o0o---</Text>
              <Text style={styles.contractTitle}>HỢP ĐỒNG VẬN TẢI</Text>
              <Text style={styles.contractCode}>Số: {providerContract.contractCode}</Text>

              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Trạng thái</Text>
                  <Text style={[styles.value, { color: providerContract.status === 'COMPLETED' ? COLORS.success : COLORS.warning }]}>{providerContract.status}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Giá trị</Text>
                  <Text style={styles.value}>{providerContract.contractValue?.toLocaleString('vi-VN')} {providerContract.currency}</Text>
                </View>
              </View>

              <Text style={styles.modalSectionTitle}>Các bên tham gia</Text>
              <View style={styles.signatureRow}>
                <View style={styles.signatureCol}>
                  <Text style={styles.signatureTitle}>BÊN A (Owner)</Text>
                  <View style={styles.signatureBox} />
                  <Text style={styles.signatureHint}>{ownerSigned ? `Đã ký ${providerContract.ownerSignAt ? new Date(providerContract.ownerSignAt).toLocaleDateString('vi-VN') : ''}` : 'Chưa ký'}</Text>
                </View>
                <View style={styles.signatureCol}>
                  <Text style={styles.signatureTitle}>BÊN B (Provider)</Text>
                  <View style={styles.signatureBox} />
                  <Text style={styles.signatureHint}>{providerSigned ? `Đã ký ${providerContract.counterpartySignAt ? new Date(providerContract.counterpartySignAt).toLocaleDateString('vi-VN') : ''}` : 'Chưa ký'}</Text>
                </View>
              </View>

              <Text style={styles.modalSectionTitle}>Điều khoản</Text>
              <View style={styles.termsContainer}>
                {terms.length === 0 ? <Text style={styles.empty}>Không có điều khoản.</Text> : terms.map((t: any, idx: number) => (
                  <View key={t.contractTermId || idx} style={styles.termRow}>
                    <Text style={styles.termOrder}>{(t.order ?? idx + 1)}</Text>
                    <Text style={styles.termContent}>{t.content || t.termContent || ''}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.modalActionsRow}>
                <TouchableOpacity style={[styles.modalActionBtn, (!canSign ? styles.btnDisabled : styles.btnPrimary)]} disabled={!canSign || signing} onPress={handleSign}>
                  {signing ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalActionText}>{signBtnLabel}</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalActionBtn, styles.btnSecondary]} onPress={openContractPdf}>
                  <Text style={[styles.modalActionText, { color: '#111827' }]}>Xem PDF</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.waitingNote}>{waitingForOther && !bothSigned ? 'Bạn đã ký, đang đợi đối phương.' : (!canSign && !bothSigned ? 'Đang chờ bên ký còn lại.' : '')}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    )
  }

  // 2. Card Tóm tắt Hợp đồng (Hiển thị trên trang)
  const renderContractSummary = () => {
    if (!providerContract?.contractId) return null
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="document-text-outline" size={20} color={COLORS.text} />
          <Text style={styles.cardTitle}>Hợp Đồng Vận Chuyển</Text>
        </View>
        
        <TouchableOpacity activeOpacity={0.9} onPress={() => setShowContractModal(true)} style={styles.contractContainer}>
          <Text style={styles.contractValue}>{providerContract.contractValue?.toLocaleString()} VND</Text>
          <Text style={styles.contractCodeSub}>Mã HĐ: {providerContract.contractCode}</Text>
          
          <View style={[styles.statusTag, bothSigned ? styles.bgSuccess : styles.bgWarning]}>
            <Text style={[styles.statusTagText, bothSigned ? {color: '#fff'} : {color: '#78350F'}]}>
              {bothSigned ? '✔ HOÀN TẤT (Đã ký)' : '⚠ ĐANG CHỜ KÝ'}
            </Text>
          </View>

          {/* Timeline visual */}
          <View style={styles.signTimeline}>
            <View style={styles.signNode}>
              <Text style={styles.signLabel}>Chủ xe</Text>
              <Ionicons name={ownerSigned ? "checkmark-circle" : "ellipse-outline"} size={24} color={ownerSigned ? COLORS.success : COLORS.border} />
            </View>
            <View style={styles.signLine} />
            <View style={styles.signNode}>
              <Text style={styles.signLabel}>Đối tác</Text>
              <Ionicons name={providerSigned ? "checkmark-circle" : "ellipse-outline"} size={24} color={providerSigned ? COLORS.success : COLORS.border} />
            </View>
          </View>
          
          <Text style={styles.tapToViewText}>Chạm để xem chi tiết hợp đồng</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const renderContent = () => {
    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
    if (error) return <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>
    if (!trip) return null

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* --- 1. MAP & ROUTE HEADER --- */}
        <View style={styles.mapSection}>
          <View style={styles.statusBanner}>
            <Text style={styles.statusBannerText}>{trip.status}</Text>
          </View>
            {routeCoordinates.length > 1 ? (
              <VietMapUniversal
                coordinates={routeCoordinates}
                style={{ height: 220, width: '100%' }}
                showUserLocation={false}
              />
            ) : (
              <View style={styles.mapPlaceholder}>
                <MaterialCommunityIcons name="map" size={80} color="#CBD5E1" />
              </View>
            )}
        </View>

        {/* Route Card - placed after map so it does not overlap */}
        <View style={styles.routeCard}>
            <View style={{alignItems: 'center', marginBottom: 8}}>
               <Text style={styles.tripCode}>Trip Code: {trip.tripCode}</Text>
            </View>
            <View style={styles.routeRow}>
              <View style={styles.routeNode}>
                <View style={[styles.dot, {backgroundColor: COLORS.blue}]}><Text style={styles.dotText}>A</Text></View>
              </View>
              <View style={styles.routeLine}>
                <View style={styles.dashedLine} />
                <View style={styles.truckIconBox}><MaterialCommunityIcons name="truck-fast" size={14} color={COLORS.orangeBadge} /></View>
              </View>
              <View style={styles.routeNode}>
                <View style={[styles.dot, {backgroundColor: COLORS.danger}]}><Text style={styles.dotText}>B</Text></View>
              </View>
            </View>
            <View style={styles.addressRow}>
               <Text style={[styles.addressText, {textAlign: 'left'}]} numberOfLines={2}>{trip.shippingRoute?.startAddress}</Text>
               <Text style={[styles.addressText, {textAlign: 'right'}]} numberOfLines={2}>{trip.shippingRoute?.endAddress}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.routeStats}>
              <Text style={styles.routeStatText}>🏁 {trip.tripRoute?.distanceKm?.toFixed(0) ?? '-'} km</Text>
              <Text style={styles.routeStatText}>🕒 ~{Math.round((trip.tripRoute?.durationMinutes ?? 0)/60)}h</Text>
              <Text style={styles.routeStatText}>📅 {new Date(trip.createAt || new Date()).toLocaleDateString('vi-VN')}</Text>
            </View>
          </View>

        {/* --- 2. HÀNG HÓA --- */}
        <View style={styles.card}>
                <Text style={styles.cardTitleSmall}>📦 Hàng Hóa</Text>
                <View style={styles.specRow}>
                    <View style={styles.specBox}>
                        <MaterialCommunityIcons name="weight-kilogram" size={14} color={COLORS.text} />
                        <Text style={styles.specValue}>{(trip.packages || []).reduce((a,b)=>a+(b.weight||0),0)} kg</Text>
                    </View>
                    <View style={styles.specBox}>
                        <MaterialCommunityIcons name="cube-outline" size={14} color={COLORS.text} />
                        <Text style={styles.specValue}>{(trip.packages || []).reduce((a,b)=>a+(b.volume||0),0)} m³</Text>
                    </View>
                </View>
                {(trip.packages || []).slice(0, 3).map((p, i) => (
                  <View key={p.packageId || i} style={{marginTop: 8, flexDirection: 'row', alignItems: 'center'}}>
                    <View style={styles.packageThumbWrap}>
                      {p.imageUrls && p.imageUrls.length > 0 ? (
                        <Image source={{ uri: p.imageUrls[0] }} style={styles.packageThumb} />
                      ) : (
                        <View style={styles.packageThumbPlaceholder}><MaterialCommunityIcons name="package-variant" size={22} color="#9CA3AF" /></View>
                      )}
                    </View>
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={styles.pkgSpec}>{p.packageCode}</Text>
                      <View style={styles.itemRow}>
                        {p.items && p.items.length > 0 && p.items[0].images && p.items[0].images.length > 0 ? (
                          <Image source={{ uri: p.items[0].images[0] }} style={styles.itemImage} />
                        ) : (
                          <View style={styles.itemImagePlaceholder}><MaterialCommunityIcons name="image-off-outline" size={18} color="#9CA3AF" /></View>
                        )}
                        <View style={{ marginLeft: 8, flex: 1 }}>
                          <Text style={styles.pkgItem}>{p.items && p.items.length > 0 ? p.items[0].itemName || p.items[0].itemName || 'Item' : 'No items'}</Text>
                          {p.items && p.items.length > 0 && typeof p.items[0].declaredValue !== 'undefined' && (
                            <Text style={styles.smallMuted}>{Number(p.items[0].declaredValue).toLocaleString('vi-VN')} VND</Text>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
        </View>

        {/* --- 3. PHƯƠNG TIỆN --- */}
        <View style={styles.card}>
                <Text style={styles.cardTitleSmall}>🚛 Phương Tiện</Text>
                <View style={styles.vehicleThumb}>
                  {trip.vehicle?.imageUrls && trip.vehicle.imageUrls.length > 0 ? (
                    <Image source={{ uri: trip.vehicle.imageUrls[0] }} style={styles.vehicleImage} />
                  ) : (
                    <MaterialCommunityIcons name="truck" size={32} color="#9CA3AF" />
                  )}
                </View>
                <View style={styles.plateBadge}><Text style={styles.plateText}>{trip.vehicle?.plateNumber || '---'}</Text></View>
                <Text style={styles.vehicleModel}>{trip.vehicle?.vehicleTypeName}</Text>
                {/* Driver Compact */}
                <View style={styles.driverRowCompact}>
                    <Ionicons name="person-circle" size={18} color={COLORS.textLight} />
                    <Text style={styles.driverNameCompact} numberOfLines={1}>{(trip.drivers && trip.drivers.length > 0) ? trip.drivers[0].fullName : 'Chưa có TX'}</Text>
                </View>
            </View>

            {/* --- 4. LIÊN HỆ --- */}
        <View style={styles.card}>
            <Text style={[styles.cardTitle, {marginBottom: 12}]}>📞 Điểm Giao & Nhận</Text>
            <View style={[styles.contactRow, {backgroundColor: COLORS.senderBg}]}>
                <View style={styles.contactIconBox}><MaterialCommunityIcons name="arrow-up-bold" size={20} color={COLORS.primary} /></View>
                <View style={{flex: 1}}>
                    <Text style={styles.contactLabel}>Người Gửi:</Text>
                    <Text style={styles.contactName}>{trip.contacts?.find(c => c.type === 'SENDER')?.fullName || 'N/A'}</Text>
                    <Text style={styles.contactPhone}>{trip.contacts?.find(c => c.type === 'SENDER')?.phoneNumber || '---'}</Text>
                </View>
                <TouchableOpacity style={styles.phoneBtn}><Ionicons name="call" size={20} color={COLORS.primary} /></TouchableOpacity>
            </View>
            <View style={[styles.contactRow, {backgroundColor: COLORS.receiverBg, marginTop: 8}]}>
                <View style={styles.contactIconBox}><MaterialCommunityIcons name="arrow-down-bold" size={20} color={COLORS.danger} /></View>
                <View style={{flex: 1}}>
                    <Text style={styles.contactLabel}>Người Nhận:</Text>
                    <Text style={styles.contactName}>{trip.contacts?.find(c => c.type === 'RECEIVER')?.fullName || 'N/A'}</Text>
                    <Text style={styles.contactPhone}>{trip.contacts?.find(c => c.type === 'RECEIVER')?.phoneNumber || '---'}</Text>
                </View>
                <TouchableOpacity style={styles.phoneBtn}><Ionicons name="call" size={20} color={COLORS.danger} /></TouchableOpacity>
            </View>
        </View>

        {/* --- 5. HỢP ĐỒNG --- */}
        {renderContractSummary()}

        {/* --- 6. BÁO CÁO HOÀN TẤT --- */}
        {renderLiquidationReport()}

        <View style={{ height: showPayment ? 100 : 40 }} />
      </ScrollView>
    )
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      {/* HEADER */}
      {showHeader && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => (onBack ? onBack() : router.push('/(provider)/posts'))} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi Tiết Chuyến Đi</Text>
          <TouchableOpacity><Ionicons name="notifications-outline" size={24} color={COLORS.text} /></TouchableOpacity>
        </View>
      )}

      {renderContent()}

      {/* PAYMENT BAR */}
      {showPayment && providerContract && (
        <View style={styles.payBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.payTitle}>Thanh toán hợp đồng</Text>
            <Text style={styles.paySub}>{providerContract.contractValue?.toLocaleString('vi-VN')} {providerContract.currency}</Text>
          </View>
          <TouchableOpacity style={styles.payBtn} onPress={navigateToPaymentFlow}>
            <Text style={styles.payBtnText}>{paymentLabel}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* MODAL HỢP ĐỒNG CHI TIẾT */}
      {renderContractModal()}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#E5E7EB' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  backBtn: { padding: 4 },
  signalRBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  signalRDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  signalRText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: COLORS.danger },
  scrollContent: { paddingBottom: 120 },

  // MAP
  mapSection: { marginBottom: 12 },
  mapPlaceholder: { height: 220, backgroundColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  statusBanner: { position: 'absolute', top: 16, alignSelf: 'center', zIndex: 10, backgroundColor: COLORS.orangeBadge, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8 },
  statusBannerText: { color: '#fff', fontWeight: '800', fontSize: 12, textTransform: 'uppercase' },
  routeCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 12, shadowColor: '#000', shadowOpacity: 0.06, elevation: 4 },
  tripCode: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  routeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 12 },
  routeNode: { width: 30, alignItems: 'center' },
  dot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dotText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  routeLine: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 20 },
  dashedLine: { width: '100%', height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.textLight, position: 'absolute' },
  truckIconBox: { backgroundColor: '#fff', paddingHorizontal: 6 },
  addressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  addressText: { width: '48%', fontSize: 12, fontWeight: '500', color: COLORS.text },
  routeStats: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: '#F3F4F6' },
  routeStatText: { fontSize: 11, color: COLORS.textLight, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 8 },

  // GRID
  gridContainer: { flexDirection: 'row', marginHorizontal: 16, gap: 12, marginBottom: 16 },
  gridItem: { flex: 1, marginBottom: 0, minHeight: 160 },
  
  // CARD
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 16, elevation: 2, shadowOpacity: 0.05 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  cardTitleSmall: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8, borderBottomWidth: 1, borderColor: '#F3F4F6', paddingBottom: 6 },

  // GOODS
  specRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  specBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 4, borderRadius: 4, flex: 1, gap: 4, justifyContent: 'center' },
  specValue: { fontSize: 11, fontWeight: '600' },
  pkgName: { fontSize: 12, fontWeight: '500', color: COLORS.text },
  pkgCode: { fontSize: 10, color: COLORS.textLight },

  // VEHICLE
  vehicleThumb: { height: 60, backgroundColor: '#E5E7EB', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  plateBadge: { backgroundColor: '#1E40AF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'center', marginBottom: 4 },
  plateText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  vehicleModel: { textAlign: 'center', fontSize: 11, color: COLORS.textLight },
  driverRowCompact: { flexDirection: 'row', alignItems: 'center', marginTop: 6, backgroundColor: '#F0FDF4', padding: 4, borderRadius: 4 },
  driverNameCompact: { fontSize: 11, fontWeight: '600', color: '#166534', marginLeft: 4 },

  // CONTACT
  contactRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12 },
  contactIconBox: { marginRight: 12 },
  contactInfo: { flex: 1 },
  contactLabel: { fontSize: 11, color: COLORS.textLight, marginBottom: 2 },
  contactName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  contactPhone: { fontSize: 12, color: '#4B5563' },
  phoneBtn: { backgroundColor: '#fff', padding: 8, borderRadius: 20, elevation: 1 },

  // CONTRACT SUMMARY
  contractContainer: { alignItems: 'center' },
  contractValue: { fontSize: 24, fontWeight: '800', color: COLORS.success, marginBottom: 4 },
  contractCodeSub: { fontSize: 13, color: COLORS.textLight, marginBottom: 12 },
  statusTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
  bgSuccess: { backgroundColor: '#DCFCE7' },
  bgWarning: { backgroundColor: '#FEF9C3' },
  statusTagText: { fontSize: 12, fontWeight: '700' },
  signTimeline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 12 },
  signNode: { alignItems: 'center', gap: 4 },
  signLabel: { fontSize: 12, color: COLORS.textLight },
  signLine: { flex: 1, height: 1, backgroundColor: COLORS.border, marginHorizontal: 8 },
  tapToViewText: { color: COLORS.blue, fontSize: 12, marginTop: 8 },
  emptyText: { fontStyle: 'italic', color: COLORS.textLight, textAlign: 'center' },

  // MODAL CONTRACT FULL
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 600, backgroundColor: '#fff', borderRadius: 16, padding: 16, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  contractHeaderTitle: { fontSize: 14, fontWeight: '700', textAlign: 'center', color: '#111827' },
  contractHeaderSubtitle: { fontSize: 13, fontWeight: '600', textAlign: 'center', color: '#111827', textDecorationLine: 'underline' },
  contractHeaderLine: { fontSize: 12, textAlign: 'center', marginVertical: 8 },
  contractTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginVertical: 12 },
  contractCode: { fontSize: 12, fontStyle: 'italic', textAlign: 'center', marginBottom: 16 },
  modalSectionTitle: { fontWeight: '700', marginTop: 16, marginBottom: 8 },
  signatureRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  signatureCol: { flex: 1, alignItems: 'center', padding: 8, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, backgroundColor: '#F9FAFB' },
  signatureTitle: { fontWeight: '700', marginBottom: 4 },
  signatureBox: { height: 60, width: '100%', borderWidth: 1, borderColor: '#CBD5E1', borderStyle: 'dashed', borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  termRow: { flexDirection: 'row', marginBottom: 6 },
  termOrder: { width: 24, fontWeight: '700' },
  termContent: { flex: 1 },
  modalActionsRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnOutline: { borderWidth: 1, borderColor: COLORS.border },
  btnDisabled: { backgroundColor: '#9CA3AF' },
  btnTextWhite: { color: '#fff', fontWeight: '700' },
  btnTextDark: { color: COLORS.text, fontWeight: '600' },

  // PAY BAR
  payBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#FFFFFF', borderTopColor: '#E5E7EB', borderTopWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  payTitle: { fontSize: 12, color: '#6B7280' },
  paySub: { fontSize: 14, fontWeight: '800', color: '#111827' },
  payBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, minWidth: 120, alignItems: 'center' },
  payBtnText: { color: '#FFFFFF', fontWeight: '800' }
  ,
  // LIQUIDATION REPORT
  liquidationHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  liquidationSub: { marginTop: 4, fontSize: 12, color: COLORS.textLight, fontWeight: '500' },
  liquidationSummaryRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  liquidationSummaryBox: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 12 },
  liquidationSummaryLabel: { fontSize: 12, color: COLORS.textLight, fontWeight: '600' },
  liquidationSummaryValue: { marginTop: 6, fontSize: 14, fontWeight: '800', color: COLORS.text },
  liquidationCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, padding: 12, marginBottom: 12 },
  liquidationCardHeader: { flexDirection: 'row', alignItems: 'center' },
  liquidationAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  liquidationAvatarText: { fontSize: 14, fontWeight: '900', color: '#1E40AF' },
  liquidationName: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  liquidationRole: { marginTop: 2, fontSize: 12, fontWeight: '700', color: COLORS.textLight },
  liquidationEmail: { marginTop: 2, fontSize: 12, color: COLORS.textLight },
  liquidationFinalBox: { alignItems: 'flex-end' },
  liquidationFinalLabel: { fontSize: 11, color: COLORS.textLight, fontWeight: '700' },
  liquidationFinalValue: { marginTop: 2, fontSize: 13, fontWeight: '900' },
  liquidationDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },
  liquidationItemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  liquidationItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 },
  liquidationDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  liquidationItemText: { fontSize: 12, color: COLORS.text, fontWeight: '600', flex: 1 },
  liquidationItemAmount: { fontSize: 12, fontWeight: '800' },
  positiveAmount: { color: '#059669' },
  negativeAmount: { color: '#DC2626' },

  /* New styles for horizontal cards and small components */
  hScrollContainer: { paddingHorizontal: 12, paddingVertical: 18 },
  ribbon: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, zIndex: 5 },
  ribbonText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  mapWrap: { height: 140, borderRadius: 12, backgroundColor: '#E6EEF8', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  mapPlaceholderText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  cardBody: { paddingTop: 6 },
  routeTextSmall: { fontSize: 12, color: COLORS.textLight, marginTop: 6 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  metaBox: { alignItems: 'center', flex: 1 },
  metaLabel: { fontSize: 12, color: COLORS.textLight },
  metaValue: { fontSize: 14, fontWeight: '700', color: COLORS.text },

  /* Packages */
  packageRow: { flexDirection: 'row', alignItems: 'center' },
  packageThumbWrap: { width: 84, height: 64, borderRadius: 8, overflow: 'hidden', backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  packageThumb: { width: 84, height: 64, resizeMode: 'cover' },
  packageThumbPlaceholder: { width: 84, height: 64, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', borderRadius: 8 },
  smallMuted: { fontSize: 11, color: COLORS.textLight },
  pkgSpec: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  pkgItem: { fontSize: 12, color: COLORS.textLight, marginTop: 6 },

  /* Item thumbnail inside package */
  itemRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  itemImage: { width: 48, height: 48, borderRadius: 6, backgroundColor: '#F3F4F6' },
  itemImagePlaceholder: { width: 48, height: 48, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },

  /* misc small styles used by modal and card pieces */
  loadingText: { marginTop: 8, color: COLORS.textLight },
  closeX: { fontSize: 28, lineHeight: 28, color: '#6B7280' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 13, color: '#6B7280' },
  value: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  signatureHint: { color: '#6B7280', marginTop: 6, fontSize: 12 },
  termsContainer: { marginTop: 8, backgroundColor: '#FFFFFF', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  empty: { fontStyle: 'italic', color: COLORS.textLight },
  modalActionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modalActionText: { fontWeight: '700', color: '#FFFFFF' },
  btnSecondary: { backgroundColor: '#E0E7FF' },
  waitingNote: { marginTop: 12, textAlign: 'center', color: COLORS.textLight, fontSize: 12 },

  /* Vehicle card */
  vehicleWrap: { flexDirection: 'row', alignItems: 'center' },
  vehicleImage: { width: 96, height: 64, borderRadius: 8, resizeMode: 'cover', backgroundColor: '#F3F4F6' },
  vehicleImagePlaceholder: { width: 96, height: 64, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  plate: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  driverRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  driverName: { fontSize: 13, color: COLORS.text },
  driverBadge: { fontSize: 11, color: '#065F46', backgroundColor: '#ECFCCB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },

  /* Contacts */
  contactBox: { width: '100%' },
  contactType: { fontSize: 12, color: '#374151', fontWeight: '700', marginBottom: 4 },
  callBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 1 },
  callTxt: { fontSize: 18 },

  /* Contract small */
  contractCard: { paddingVertical: 8, alignItems: 'flex-start' },
  contractAmount: { fontSize: 20, fontWeight: '900', color: COLORS.success },
  contractCodeSmall: { fontSize: 12, color: COLORS.textLight, marginTop: 6 },
  smallBadge: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10 },
  badgeSuccess: { backgroundColor: '#DCFCE7' },
  badgeNeutral: { backgroundColor: '#F3F4F6' },
  smallBadgeText: { fontSize: 12, fontWeight: '700', color: '#065F46' }
})

export default ProviderTripDetail
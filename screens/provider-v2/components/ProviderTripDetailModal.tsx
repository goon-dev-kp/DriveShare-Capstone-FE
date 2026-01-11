

import React, { useEffect, useState } from 'react'
import {
  Modal, View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, Dimensions, SafeAreaView
} from 'react-native'
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons'
import tripService from '@/services/tripService'
import { TripDetailFullDTOExtended, Role } from '@/models/types'
import { useAuth } from '@/hooks/useAuth'
import { ContractDocument } from '@/components/documents/ContractDocument'
import VietMapUniversal from '@/components/map/VietMapUniversal'

interface Props {
  visible: boolean;
  tripId?: string;
  onClose: () => void;
}

const { width } = Dimensions.get('window')

// Màu sắc chủ đạo theo thiết kế mới
const COLORS = {
  primary: '#0284C7',
  bg: '#F3F4F6',
  white: '#FFFFFF',
  text: '#1F2937',
  textLight: '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  blue: '#3B82F6',
  // Màu nền cho Contact
  senderBg: '#E0F2FE', // Xanh nhạt
  receiverBg: '#FFEDD5', // Cam nhạt
}

const ProviderTripDetailModal: React.FC<Props> = ({ visible, tripId, onClose }) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trip, setTrip] = useState<TripDetailFullDTOExtended | null>(null)
  const [signing, setSigning] = useState(false)

  useEffect(() => {
    if (visible && tripId) fetchTrip(tripId)
  }, [visible, tripId])

  const fetchTrip = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await tripService.getById(id)
      if (res.isSuccess && res.result) {
        setTrip({
          ...res.result,
          deliveryRecords: res.result.deliveryRecords || [],
          compensations: res.result.compensations || [],
          issues: res.result.issues || []
        })
      } else throw new Error(res.message || 'Không tải được chuyến')
    } catch (e: any) {
      setError(e?.message || 'Lỗi không xác định')
    } finally {
      setLoading(false)
    }
  }

  // --- LOGIC HỢP ĐỒNG (GIỮ NGUYÊN NHƯ CŨ) ---
  const providerContract = trip?.providerContracts
  const isProviderUser = user?.role === Role.PROVIDER
  const ownerSigned = !!providerContract?.ownerSigned
  const providerSigned = !!providerContract?.counterpartySigned
  const bothSigned = ownerSigned && providerSigned
  const waitingForOther = providerSigned && !ownerSigned
  const canSign = isProviderUser && !providerSigned
  const signBtnLabel = bothSigned ? 'Đã hoàn tất' : waitingForOther ? 'Đợi đối phương' : 'Ký hợp đồng'

  const handleSign = async () => {
    if (!providerContract?.contractId || !canSign) return
    setSigning(true)
    try {
      const response: any = await tripService.signProviderContract(providerContract.contractId)
      if (response?.isSuccess || response?.statusCode === 200) {
        Alert.alert('Thành công', 'Đã ký hợp đồng!')
        if (tripId) fetchTrip(tripId)
      } else throw new Error(response?.message || 'Ký thất bại')
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Có lỗi xảy ra')
    } finally {
      setSigning(false)
    }
  }

  const goToPayment = () => {
    Alert.alert('Thông báo', 'Chuyển hướng đến màn hình thanh toán QR...')
  }

  // --- RENDERERS (Removed renderContractCard - now using ContractDocument component) ---

  const renderContent = () => {
    if (loading) return <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
    if (error) return <Text style={styles.errorText}>{error}</Text>
    if (!trip) return null

    return (
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        
        {/* --- SECTION 1: MAP & ROUTE --- */}
        <View style={styles.mapSection}>
          {/* Real Map with VietMapUniversal */}
          <View style={styles.mapContainer}>
            <VietMapUniversal
              coordinates={(() => {
                try {
                  if (!trip.tripRoute?.routeData) {
                    return [[106.660172, 10.762622], [106.670172, 10.772622]];
                  }
                  const data = typeof trip.tripRoute.routeData === 'string' 
                    ? JSON.parse(trip.tripRoute.routeData) 
                    : trip.tripRoute.routeData;
                  return data?.geometry?.coordinates || [[106.660172, 10.762622], [106.670172, 10.772622]];
                } catch (e) {
                  console.warn('Failed to parse routeData:', e);
                  return [[106.660172, 10.762622], [106.670172, 10.772622]];
                }
              })()}
              style={{ height: 200, width: '100%' }}
              showUserLocation={false}
            />
          </View>
          
          {/* Floating Route Card */}
          <View style={styles.floatingRouteCard}>
            <View style={styles.routeHeader}>
              <Text style={styles.tripCode}>Code: {trip.tripCode}</Text>
              {/* Badge trạng thái chuyến */}
              <View style={styles.tripStatusBadge}>
                <Text style={styles.tripStatusText}>{trip.status}</Text>
              </View>
            </View>

            <View style={styles.routeRow}>
              <View style={styles.routeNode}>
                <View style={[styles.dot, { backgroundColor: COLORS.blue }]}>
                  <Text style={styles.dotText}>A</Text>
                </View>
                <Text style={styles.locationText} numberOfLines={2}>{trip.shippingRoute?.startAddress}</Text>
              </View>
              
              <View style={styles.routeLine}>
                <Text style={styles.distanceText}>{trip.tripRoute?.distanceKm?.toFixed(0) ?? '-'} km</Text>
                <View style={styles.dashedLine} />
                <MaterialCommunityIcons name="truck-fast" size={16} color={COLORS.warning} />
              </View>

              <View style={styles.routeNode}>
                <View style={[styles.dot, { backgroundColor: COLORS.danger }]}>
                  <Text style={styles.dotText}>B</Text>
                </View>
                <Text style={styles.locationText} numberOfLines={2}>{trip.shippingRoute?.endAddress}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* --- SECTION 2: PACKAGE INFO --- */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="cube-outline" size={20} color={COLORS.text} />
            <Text style={styles.cardTitle}>Thông Tin Hàng Hóa</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statBadge}>
              <MaterialCommunityIcons name="weight-kilogram" size={16} color={COLORS.textLight} />
              <Text style={styles.statValue}>{(trip.packages || []).reduce((acc, p) => acc + (p.weight || 0), 0)} kg</Text>
            </View>
            <View style={styles.statBadge}>
              <MaterialCommunityIcons name="cube-send" size={16} color={COLORS.textLight} />
              <Text style={styles.statValue}>{(trip.packages || []).reduce((acc, p) => acc + (p.volume || 0), 0)} m³</Text>
            </View>
          </View>
          {/* Single row card for each package */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {(trip.packages || []).map((p, i) => (
              <View key={i} style={styles.packageCard}>
                <MaterialCommunityIcons name="cube" size={24} color={COLORS.primary} />
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <Text style={styles.packageCode}>{p.packageCode}</Text>
                  <Text style={styles.packageDetail}>{p.weight}kg • {p.volume}m³</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* --- SECTION 3: TRANSPORT TEAM --- */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="truck-outline" size={20} color={COLORS.text} />
            <Text style={styles.cardTitle}>Đội Ngũ Vận Chuyển</Text>
          </View>
          
          {/* Vehicle Info - Single Row Card */}
          <View style={styles.vehicleCard}>
            <View style={styles.vehicleIconContainer}>
               <MaterialCommunityIcons name="truck" size={32} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.vehiclePlate}>{trip.vehicle?.plateNumber || 'Chưa gán xe'}</Text>
              <Text style={styles.vehicleType}>{trip.vehicle?.vehicleTypeName}</Text>
            </View>
          </View>

          {/* Drivers */}
          <View style={styles.driverList}>
            {(trip.drivers || []).map((d, i) => (
              <View key={i} style={styles.driverItem}>
                <Image source={require('../../assets/images/icon-driver.png')} style={styles.driverIcon} />
                <Text style={styles.driverName}>{d.fullName}</Text>
                <View style={styles.driverBadge}>
                  <Text style={styles.driverBadgeText}>Đã nhận</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Owner Contact */}
          <View style={styles.ownerContact}>
            <View>
              <Text style={styles.contactLabel}>Chủ xe:</Text>
              <Text style={styles.contactName}>{trip.owner?.companyName || trip.owner?.fullName}</Text>
            </View>
            <TouchableOpacity style={styles.callBtn}>
              <Ionicons name="call" size={18} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- SECTION 4: CONTACT POINTS (SENDER / RECEIVER) --- */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location-outline" size={20} color={COLORS.text} />
            <Text style={styles.cardTitle}>Liên Hệ Giao Nhận</Text>
          </View>

          {/* Sender */}
          <View style={[styles.contactBox, { backgroundColor: COLORS.senderBg }]}>
            <View style={styles.contactIconBox}>
              <MaterialCommunityIcons name="arrow-up-bold" size={20} color="#0369A1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactRoleLabel}>Người Gửi:</Text>
              <Text style={styles.contactPersonName}>
                {trip.contacts?.find(c => c.type === 'SENDER')?.fullName || 'N/A'}
              </Text>
              <Text style={styles.contactPhone}>
                {trip.contacts?.find(c => c.type === 'SENDER')?.phoneNumber || '---'}
              </Text>
            </View>
            <TouchableOpacity style={styles.phoneBtn}>
              <Ionicons name="call" size={20} color="#0369A1" />
            </TouchableOpacity>
          </View>

          {/* Receiver */}
          <View style={[styles.contactBox, { backgroundColor: COLORS.receiverBg, marginTop: 8 }]}>
            <View style={styles.contactIconBox}>
              <MaterialCommunityIcons name="arrow-down-bold" size={20} color="#C2410C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactRoleLabel}>Người Nhận:</Text>
              <Text style={styles.contactPersonName}>
                {trip.contacts?.find(c => c.type === 'RECEIVER')?.fullName || 'N/A'}
              </Text>
              <Text style={styles.contactPhone}>
                {trip.contacts?.find(c => c.type === 'RECEIVER')?.phoneNumber || '---'}
              </Text>
            </View>
            <TouchableOpacity style={styles.phoneBtn}>
              <Ionicons name="call" size={20} color="#C2410C" />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- SECTION 5: CONTRACT --- */}
        {providerContract?.contractId ? (
          <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <ContractDocument
              contractCode={providerContract.contractCode || 'N/A'}
              contractType="PROVIDER_CONTRACT"
              contractValue={providerContract.contractValue || 0}
              currency="VND"
              effectiveDate={providerContract.effectiveDate || new Date().toISOString()}
              terms={providerContract.terms || []}
              ownerName={trip.owner?.fullName || 'Chủ xe'}
              ownerCompany={trip.owner?.companyName}
              counterpartyName={'Đối tác vận chuyển'}
              ownerSigned={providerContract.ownerSigned || false}
              ownerSignAt={providerContract.ownerSignAt || null}
              counterpartySigned={providerContract.counterpartySigned || false}
              counterpartySignAt={providerContract.counterpartySignAt || null}
              tripCode={trip.tripCode}
              vehiclePlate={trip.vehicle?.plateNumber}
              startAddress={trip.shippingRoute?.startAddress}
              endAddress={trip.shippingRoute?.endAddress}
            />
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.emptyText}>Chưa có hợp đồng.</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    )
  }

  if (!visible) return null

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi Tiết Chuyến Đi</Text>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {renderContent()}
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderColor: '#E5E7EB'
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  backBtn: { padding: 4 },
  errorText: { color: COLORS.danger, textAlign: 'center', marginTop: 20 },
  emptyText: { color: COLORS.textLight, fontStyle: 'italic', textAlign: 'center', padding: 20 },
  
  body: { paddingBottom: 100 },

  // --- MAP SECTION ---
  mapSection: { position: 'relative', marginBottom: 80 }, // Margin bottom để chừa chỗ cho card nổi
  mapContainer: {
    height: 200, 
    backgroundColor: '#E2E8F0', 
    overflow: 'hidden'
  },
  floatingRouteCard: {
    position: 'absolute', top: 120, left: 16, right: 16,
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5
  },
  routeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  tripCode: { fontWeight: '700', fontSize: 14, color: COLORS.text },
  tripStatusBadge: { backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  tripStatusText: { fontSize: 10, color: '#C2410C', fontWeight: '700' },
  routeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  routeNode: { alignItems: 'center', width: '30%' },
  dot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  dotText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  locationText: { fontSize: 12, textAlign: 'center', color: COLORS.text, fontWeight: '500' },
  routeLine: { flex: 1, alignItems: 'center', height: 40, justifyContent: 'center' },
  dashedLine: { width: '100%', height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.textLight, position: 'absolute', top: 20, zIndex: -1 },
  distanceText: { fontSize: 10, color: COLORS.textLight, marginBottom: 4, backgroundColor: '#fff', paddingHorizontal: 4 },

  // --- COMMON CARD ---
  card: {
    backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16, marginBottom: 16,
    padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },

  // --- PACKAGE INFO ---
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 8, borderRadius: 8, gap: 6 },
  statValue: { fontWeight: '600', fontSize: 14, color: COLORS.text },
  packageCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#EFF6FF', 
    padding: 12, 
    borderRadius: 12, 
    marginRight: 8,
    minWidth: 180,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  packageCode: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  packageDetail: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },

  // --- TEAM INFO ---
  vehicleCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F0F9FF', 
    padding: 12, 
    borderRadius: 12, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  vehicleIconContainer: { 
    width: 56, 
    height: 56, 
    backgroundColor: '#DBEAFE', 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  vehiclePlate: { fontSize: 16, fontWeight: '700', color: COLORS.blue, backgroundColor: '#EFF6FF', alignSelf: 'flex-start', paddingHorizontal: 6, borderRadius: 4, marginBottom: 4 },
  vehicleType: { fontSize: 13, color: COLORS.textLight },
  driverList: { gap: 12 },
  driverItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  driverIcon: { width: 24, height: 24, marginRight: 8 },
  driverName: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text },
  driverBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  driverBadgeText: { fontSize: 11, color: '#059669', fontWeight: '600' },
  ownerContact: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderColor: '#F3F4F6' },
  contactLabel: { fontSize: 12, color: COLORS.textLight },
  contactName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  
  // --- CONTACT BOXES ---
  contactBox: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12 },
  contactIconBox: { marginRight: 12 },
  contactRoleLabel: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  contactPersonName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  contactPhone: { fontSize: 13, color: '#4B5563' },
  phoneBtn: { padding: 8, backgroundColor: '#fff', borderRadius: 20 },

  // --- CONTRACT ---
  contractContainer: { alignItems: 'center' },
  contractValue: { fontSize: 24, fontWeight: '800', color: '#059669', marginBottom: 4 },
  contractCode: { fontSize: 13, color: COLORS.textLight, marginBottom: 12 },
  statusTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
  bgSuccess: { backgroundColor: '#10B981' },
  bgWarning: { backgroundColor: '#FDE047' },
  statusTagText: { fontSize: 12, fontWeight: '700' },
  signTimeline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  signNode: { alignItems: 'center', gap: 4 },
  signLabel: { fontSize: 12, color: COLORS.textLight },
  signLine: { flex: 1, height: 1, backgroundColor: COLORS.border, marginHorizontal: 8 },
  contractActions: { width: '100%', gap: 12 },
  actionBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnOutline: { borderWidth: 1, borderColor: COLORS.border },
  btnTextWhite: { color: '#fff', fontWeight: '700' },
  btnTextDark: { color: COLORS.text, fontWeight: '600' },
  
  callBtn: { padding: 8, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8 }
})

export default ProviderTripDetailModal
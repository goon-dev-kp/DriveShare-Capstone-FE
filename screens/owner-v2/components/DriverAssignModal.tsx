


import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  TextInput,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native'
import ownerDriverLinkService, { LinkedDriverDTO } from '@/services/ownerDriverLinkService'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import assignmentService from '@/services/assignmentService'
import { DriverAssignment, TripDetailFullDTOExtended } from '@/models/types'
// Sử dụng icon từ thư viện vector-icons cho đẹp và nhẹ
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons'

interface DriverAssignModalProps {
  visible: boolean
  onClose: () => void
  trip: TripDetailFullDTOExtended
  tripId: string
  mainDriverExists: boolean
  onAssigned: (updated: TripDetailFullDTOExtended) => void
  driverAnalysis?: any
}

const formatMoney = (raw: string) => {
  if (!raw) return '0'
  return raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const DriverAssignModal: React.FC<DriverAssignModalProps> = ({ visible, onClose, trip, tripId, mainDriverExists, onAssigned, driverAnalysis }) => {
  const [drivers, setDrivers] = useState<LinkedDriverDTO[]>([])
  const [driverLoading, setDriverLoading] = useState(false)
  const [driverPage, setDriverPage] = useState(1)
  const [driverTotal, setDriverTotal] = useState(0)
  
  const [selectedDriver, setSelectedDriver] = useState<LinkedDriverDTO | null>(null)
  const [isPrimary, setIsPrimary] = useState(!mainDriverExists)
  
  const [baseAmountStr, setBaseAmountStr] = useState('0')
  const [bonusAmountStr, setBonusAmountStr] = useState('')
  const [startAddress, setStartAddress] = useState('')
  const [endAddress, setEndAddress] = useState('')
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    if (visible) {
      setSelectedDriver(null)
      setIsPrimary(!mainDriverExists)
      setBaseAmountStr('0')
      setBonusAmountStr('')
      loadDrivers(1)
    }
  }, [visible, mainDriverExists])

  const sanitizeNumber = (val: string) => val.replace(/[^0-9]/g, '')

  const loadDrivers = async (page = 1) => {
    setDriverLoading(true)
    try {
      const res: any = await ownerDriverLinkService.getMyDrivers(page, 10)
      console.log('🚗 [DriverAssignModal] API Response:', JSON.stringify(res, null, 2))
      
      // Support multiple response formats: { isSuccess, result } OR { success, data } OR direct data
      if (res?.isSuccess || res?.statusCode === 200 || res?.success) {
        // Try multiple paths: res.result, res.data, or res itself
        const payload = res?.result ?? res?.data ?? res
        const list: LinkedDriverDTO[] = payload?.data || []
        const total = payload?.totalCount ?? list.length
        
        console.log('📋 [DriverAssignModal] Parsed drivers:', list.length, 'Total:', total)
        console.log('👥 [DriverAssignModal] Drivers data:', JSON.stringify(list, null, 2))
        
        setDrivers(prev => (page === 1 ? list : [...prev, ...list]))
        setDriverTotal(total)
        setDriverPage(page)
      } else {
        console.warn('⚠️ [DriverAssignModal] Unexpected response format:', res)
      }
    } catch (e: any) {
      console.error('❌ [DriverAssignModal] Error loading drivers:', e)
      Alert.alert('Lỗi', 'Không thể tải danh sách tài xế')
    } finally {
      setDriverLoading(false)
    }
  }

  const handleAssignDriver = async () => {
    if (!selectedDriver) return Alert.alert('Chưa chọn tài xế', 'Vui lòng chọn một tài xế từ danh sách.')
    
    const base = parseInt(baseAmountStr.replace(/,/g, '') || '0', 10)
    const bonus = bonusAmountStr ? parseInt(bonusAmountStr.replace(/,/g, ''), 10) : undefined

    setAssigning(true)
    try {
      const payload = {
        tripId: tripId,
        driverId: selectedDriver.driverId,
        type: isPrimary ? 0 : 1,
        baseAmount: base,
        bonusAmount: bonus,
        startLocation: { address: startAddress, latitude: 0, longitude: 0 },
        endLocation: { address: endAddress, latitude: 0, longitude: 0 }
      }
      const res: any = await assignmentService.assignDriverByOwner(payload)
      const ok = res?.isSuccess ?? (res?.statusCode === 201 || res?.statusCode === 200)
      
      if (!ok) throw new Error(res?.message || 'Gán thất bại')
      
      const result = res?.result ?? res?.data ?? {}
      const newTripStatus = result?.newTripStatus || trip.status
      
      onAssigned({ ...trip, status: newTripStatus, drivers: [...(trip.drivers)] })
      Alert.alert('Thành công', 'Đã gán tài xế thành công.')
      onClose()
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Có lỗi xảy ra khi gán tài xế')
    } finally {
      setAssigning(false)
    }
  }

  // Render Item Tài xế
  const renderDriverItem = ({ item }: { item: LinkedDriverDTO }) => {
    const selected = selectedDriver?.driverId === item.driverId
    const hoursWeek = (item as any).hoursDrivenThisWeek ?? 0
    const canDrive = ((item as any).canDrive ?? true)

    return (
      <TouchableOpacity 
        onPress={() => canDrive && setSelectedDriver(item)} 
        activeOpacity={0.7}
        disabled={!canDrive}
        style={[
          styles.driverCard, 
          selected && styles.driverCardSelected,
          !canDrive && styles.driverCardDisabled
        ]}
      >
        <View style={styles.driverCardInner}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {item.avatarUrl ? (
              <Image source={{ uri: item.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, !canDrive && {backgroundColor: '#9CA3AF'}]}>
                <Text style={styles.avatarText}>{(item.fullName || '?').charAt(0).toUpperCase()}</Text>
              </View>
            )}
            {selected && (
              <View style={styles.checkBadge}>
                <Ionicons name="checkmark" size={12} color="#FFF" />
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.driverInfo}>
            <Text style={[styles.driverName, !canDrive && {color: '#9CA3AF'}]} numberOfLines={1}>{item.fullName}</Text>
            <Text style={styles.driverPhone}>{item.phoneNumber}</Text>
            
            {/* Micro Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statBadge}>
                    <Ionicons name="time-outline" size={10} color="#6B7280" />
                    <Text style={styles.statText}>Tuần: {hoursWeek}h</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.statusDot, { backgroundColor: canDrive ? '#10B981' : '#EF4444' }]} />
                  <Text style={[styles.statusText, { color: canDrive ? '#10B981' : '#EF4444' }]}>
                      {canDrive ? 'Sẵn sàng' : 'Không đủ giờ lái'}
                  </Text>
                </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLine} />
            <View style={styles.headerRow}>
                <Text style={styles.headerTitle}>Điều phối Tài xế</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <Ionicons name="close" size={24} color="#4B5563" />
                </TouchableOpacity>
            </View>
          </View>

          <ScrollView 
            style={styles.scrollContent} 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={{ paddingBottom: 20 }}
            nestedScrollEnabled={true}
            bounces={true}
            keyboardShouldPersistTaps="handled"
          >
            
            {/* AI Recommendation */}
            {driverAnalysis?.suggestion && (
              <View style={styles.aiSection}>
                <View style={styles.aiHeader}>
                  <MaterialIcons name="auto-awesome" size={18} color="#4F46E5" />
                  <Text style={styles.aiTitle}>Phân tích hành trình</Text>
                </View>
                
                {/* Distance & Duration Info */}
                <View style={styles.tripInfoRow}>
                  <View style={styles.tripInfoItem}>
                    <MaterialCommunityIcons name="map-marker-distance" size={14} color="#0284C7" />
                    <Text style={styles.tripInfoText}>{driverAnalysis.suggestion.distanceKm?.toFixed(1) || 0} km</Text>
                  </View>
                  <View style={styles.tripInfoItem}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color="#0284C7" />
                    <Text style={styles.tripInfoText}>{driverAnalysis.suggestion.estimatedDurationHours?.toFixed(1) || 0}h</Text>
                  </View>
                  <View style={styles.tripInfoItem}>
                    <MaterialCommunityIcons name="steering" size={14} color="#0284C7" />
                    <Text style={styles.tripInfoText}>{driverAnalysis.suggestion.requiredHoursFromQuota?.toFixed(1) || 0}h lái</Text>
                  </View>
                </View>

                {driverAnalysis.suggestion.systemRecommendation && (
                  <View style={styles.aiRecommendation}>
                    <Text style={styles.aiRecommendLabel}>💡 Đề xuất: </Text>
                    <Text style={styles.aiRecommendText}>
                      {driverAnalysis.suggestion.systemRecommendation === 'SOLO' ? '1 Tài xế (Solo)' : 
                       driverAnalysis.suggestion.systemRecommendation === 'TEAM' ? '2 Tài xế (Team)' : 
                       '3 Tài xế (Express)'}
                    </Text>
                  </View>
                )}
                <View style={styles.scenarioRow}>
                  {driverAnalysis.suggestion.soloScenario?.isPossible && (
                    <View style={styles.miniScenario}>
                      <FontAwesome5 name="user" size={14} color="#059669" />
                      <Text style={styles.miniScenarioLabel}>1 Tài</Text>
                      <Text style={styles.miniScenarioValue}>{driverAnalysis.suggestion.soloScenario.totalElapsedHours?.toFixed(0)}h</Text>
                    </View>
                  )}
                  {driverAnalysis.suggestion.teamScenario?.isPossible && (
                    <View style={styles.miniScenario}>
                      <FontAwesome5 name="user-friends" size={14} color="#2563EB" />
                      <Text style={styles.miniScenarioLabel}>2 Tài</Text>
                      <Text style={styles.miniScenarioValue}>{driverAnalysis.suggestion.teamScenario.totalElapsedHours?.toFixed(0)}h</Text>
                    </View>
                  )}
                  {driverAnalysis.suggestion.expressScenario?.isPossible && (
                    <View style={styles.miniScenario}>
                      <MaterialCommunityIcons name="lightning-bolt" size={16} color="#DC2626" />
                      <Text style={styles.miniScenarioLabel}>3 Tài</Text>
                      <Text style={styles.miniScenarioValue}>{driverAnalysis.suggestion.expressScenario.totalElapsedHours?.toFixed(0)}h</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* 1. Section: Chọn Tài xế */}
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>1. Chọn tài xế ({driverTotal})</Text>
                <View style={styles.driverListContainer}>
                    {driverLoading && drivers.length === 0 ? (
                        <ActivityIndicator color="#4F46E5" style={{margin: 20}} />
                    ) : (
                        <FlatList
                            data={drivers}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item) => String(item.driverId)}
                            renderItem={renderDriverItem}
                            contentContainerStyle={{ paddingHorizontal: 4, paddingVertical: 8 }}
                            ListEmptyComponent={<Text style={styles.emptyText}>Không tìm thấy tài xế nào.</Text>}
                            onEndReached={() => { if (drivers.length < driverTotal) loadDrivers(driverPage + 1) }}
                            onEndReachedThreshold={0.5}
                        />
                    )}
                </View>
            </View>

            {/* 2. Section: Cấu hình (Chỉ hiện khi đã chọn tài xế) */}
            {selectedDriver && (
                <View style={styles.configSection}>
                    <Text style={styles.sectionLabel}>2. Thiết lập công việc</Text>
                    
                    {/* Tab Segment Control */}
                    <View style={styles.segmentControl}>
                        <TouchableOpacity 
                            style={[styles.segmentBtn, isPrimary && styles.segmentBtnActive]} 
                            onPress={() => setIsPrimary(true)}
                        >
                            <Text style={[styles.segmentText, isPrimary && styles.segmentTextActive]}>Tài xế Chính</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.segmentBtn, !isPrimary && styles.segmentBtnActive]} 
                            onPress={() => setIsPrimary(false)}
                        >
                            <Text style={[styles.segmentText, !isPrimary && styles.segmentTextActive]}>Tài xế Phụ</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.formGroup}>
                        
                        {/* Tiền lương & Thưởng */}
                        <View style={styles.rowInputs}>
                            <View style={{flex: 1, marginRight: 8}}>
                                <Text style={styles.inputLabel}>Lương cứng</Text>
                                <View style={styles.inputWrapper}>
                                    <MaterialIcons name="attach-money" size={18} color="#6B7280" style={styles.inputIcon} />
                                    <TextInput 
                                        style={styles.textInput}
                                        value={formatMoney(baseAmountStr)}
                                        onChangeText={t => setBaseAmountStr(sanitizeNumber(t))}
                                        keyboardType="numeric"
                                        placeholder="0"
                                    />
                                </View>
                            </View>
                            <View style={{flex: 1, marginLeft: 8}}>
                                <Text style={styles.inputLabel}>Thưởng thêm</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="gift-outline" size={18} color="#6B7280" style={styles.inputIcon} />
                                    <TextInput 
                                        style={styles.textInput}
                                        value={formatMoney(bonusAmountStr)}
                                        onChangeText={t => setBonusAmountStr(sanitizeNumber(t))}
                                        keyboardType="numeric"
                                        placeholder="0"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Địa chỉ */}
                        <View style={styles.addressBlock}>
                            <View style={styles.timelineRow}>
                                <View style={styles.timelineDecor}>
                                    <View style={[styles.dot, {backgroundColor: '#3B82F6'}]} />
                                    <View style={styles.line} />
                                    <View style={[styles.dot, {backgroundColor: '#EF4444'}]} />
                                </View>
                                <View style={{flex: 1, gap: 12}}>
                                    <View style={{ zIndex: 100, elevation: 100 }}>
                                        <Text style={styles.inputLabel}>{isPrimary ? 'Điểm nhận xe' : 'Điểm đón'}</Text>
                                        <View style={[styles.addressInputWrapper, { zIndex: 100, elevation: 100 }]}>
                                            <AddressAutocomplete
                                                value={startAddress}
                                                onSelect={(s: any) => setStartAddress(s.display || s.name)}
                                                placeholder={isPrimary ? "VD: Bãi xe A, 123 Nguyễn Huệ..." : "VD: Kho hàng B..."}
                                            />
                                        </View>
                                    </View>
                                    <View style={{ zIndex: 50, elevation: 50, marginTop: 160 }}>
                                        <Text style={styles.inputLabel}>{isPrimary ? 'Điểm trả xe (Kết thúc)' : 'Điểm trả khách'}</Text>
                                        <View style={[styles.addressInputWrapper, { zIndex: 50, elevation: 50 }]}>
                                            <AddressAutocomplete
                                                value={endAddress}
                                                onSelect={(s: any) => setEndAddress(s.display || s.name)}
                                                placeholder={isPrimary ? "VD: Bãi xe trả (Bắt buộc)..." : "VD: Điểm giao hàng..."}
                                            />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Note Box */}
                        <View style={[styles.noteBox, isPrimary ? styles.notePrimary : styles.noteSecondary]}>
                            <Ionicons name="information-circle" size={20} color={isPrimary ? "#4338CA" : "#4B5563"} />
                            <Text style={[styles.noteText, {color: isPrimary ? "#3730A3" : "#374151"}]}>
                                {isPrimary 
                                    ? "Tài xế chính chịu trách nhiệm vận hành xe từ điểm nhận đến điểm trả."
                                    : "Tài xế phụ hỗ trợ bốc xếp hoặc thay lái, đón/trả tại điểm chỉ định."}
                            </Text>
                        </View>

                    </View>
                </View>
            )}

          </ScrollView>

          {/* Footer Action */}
          <View style={styles.footer}>
            <TouchableOpacity 
                style={[styles.btnPrimary, (!selectedDriver || assigning) && styles.btnDisabled]}
                onPress={handleAssignDriver}
                disabled={!selectedDriver || assigning}
            >
                {assigning ? <ActivityIndicator color="#FFF" /> : (
                    <>
                        <Text style={styles.btnPrimaryText}>Xác nhận Gán</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFF" />
                    </>
                )}
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  // Layout Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#F9FAFB', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '85%', shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 },
  
  // Header
  header: { alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  headerLine: { width: 40, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2, marginBottom: 12 },
  headerRow: { flexDirection: 'row', width: '100%', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  closeBtn: { position: 'absolute', right: 16, padding: 4, backgroundColor: '#F3F4F6', borderRadius: 12 },

  scrollContent: { flex: 1 },

  // AI Section
  aiSection: { margin: 16, marginBottom: 8, backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#BFDBFE' },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  aiTitle: { fontSize: 13, fontWeight: '700', color: '#1E40AF' },
  
  // Trip Info Row
  tripInfoRow: { flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  tripInfoItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
  tripInfoText: { fontSize: 11, color: '#0C4A6E', fontWeight: '700' },
  
  aiRecommendation: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', borderRadius: 8, padding: 8, marginBottom: 10 },
  aiRecommendLabel: { fontSize: 12, color: '#92400E', fontWeight: '600' },
  aiRecommendText: { fontSize: 12, color: '#B45309', fontWeight: '700' },
  scenarioRow: { flexDirection: 'row', gap: 8, justifyContent: 'flex-start' },
  miniScenario: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, gap: 4 },
  miniScenarioLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  miniScenarioValue: { fontSize: 11, color: '#111827', fontWeight: '700' },

  // Sections
  section: { padding: 16 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  configSection: { padding: 16, paddingTop: 0 },

  // Driver List Horizontal
  driverListContainer: { flexDirection: 'row', minHeight: 160 },
  emptyText: { color: '#9CA3AF', fontStyle: 'italic', marginLeft: 8, paddingVertical: 20 },

  // Driver Card
  driverCard: { width: 140, marginRight: 12, backgroundColor: '#FFF', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 4, elevation: 2 },
  driverCardSelected: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  driverCardDisabled: { opacity: 0.6, backgroundColor: '#F3F4F6' },
  driverCardInner: { alignItems: 'center' },
  
  avatarContainer: { position: 'relative', marginBottom: 8 },
  avatarImage: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: '#FFF' },
  avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  checkBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#4F46E5', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
  
  driverInfo: { alignItems: 'center', width: '100%' },
  driverName: { fontSize: 14, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 2 },
  driverPhone: { fontSize: 11, color: '#6B7280', marginBottom: 6 },
  
  statsContainer: { flexDirection: 'column', alignItems: 'center', gap: 4, width: '100%' },
  statBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statText: { fontSize: 10, color: '#4B5563', marginLeft: 4, fontWeight: '500' },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  statusText: { fontSize: 10, fontWeight: '700' },

  // Segment Control
  segmentControl: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 12, padding: 4, marginBottom: 20 },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  segmentBtnActive: { backgroundColor: '#FFF', shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  segmentText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  segmentTextActive: { color: '#4F46E5' },

  // Form Inputs
  formGroup: { gap: 16 },
  rowInputs: { flexDirection: 'row' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 10, height: 48 },
  inputIcon: { marginRight: 8 },
  textInput: { flex: 1, fontSize: 15, color: '#111827', fontWeight: '500' },
  
  addressBlock: { backgroundColor: '#FFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'visible' },
  timelineRow: { flexDirection: 'row' },
  timelineDecor: { alignItems: 'center', width: 24, paddingTop: 24, paddingRight: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  line: { flex: 1, width: 2, backgroundColor: '#E5E7EB', marginVertical: 4 },
  addressInputWrapper: { minHeight: 44, justifyContent: 'center', overflow: 'visible' }, // Wrapper for Autocomplete to align

  noteBox: { flexDirection: 'row', padding: 12, borderRadius: 10, gap: 10, alignItems: 'flex-start' },
  notePrimary: { backgroundColor: '#EEF2FF' },
  noteSecondary: { backgroundColor: '#F3F4F6' },
  noteText: { flex: 1, fontSize: 13, lineHeight: 18 },

  // Footer
  footer: { padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  btnPrimary: { flexDirection: 'row', backgroundColor: '#4F46E5', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: "#4F46E5", shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 8 },
  btnDisabled: { backgroundColor: '#A5B4FC', shadowOpacity: 0 },
  btnPrimaryText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
})

export default DriverAssignModal
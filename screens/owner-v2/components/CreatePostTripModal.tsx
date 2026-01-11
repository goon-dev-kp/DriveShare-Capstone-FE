

import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native'
import postTripService, { PostTripCreateDTO, PostTripViewDTO, PostTripDetailCreateDTO, DriverType } from '@/services/postTripService'
import contractTemplateService from '@/services/contractTemplateService'
import walletService from '@/services/walletService'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import { useRouter } from 'expo-router'

// --- COMPONENT: STEP INDICATOR ---
const StepIndicator: React.FC<{ step: number }> = ({ step }) => {
  const steps = ['Thông tin', 'Hợp đồng', 'Thanh toán', 'Hoàn tất']
  return (
    <View style={stepStyles.container}>
      <View style={stepStyles.wrapper}>
        <View style={stepStyles.lineBase} />
        <View style={[stepStyles.lineActive, { width: `${((step - 1) / 3) * 100}%` }]} />
        
        {steps.map((label, idx) => {
          const s = idx + 1
          const isActive = s <= step
          return (
            <View key={s} style={stepStyles.item}>
              <View style={[stepStyles.circle, isActive && stepStyles.circleActive]}>
                {s < step ? (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                ) : (
                  <Text style={[stepStyles.num, isActive && { color: '#fff' }]}>{s}</Text>
                )}
              </View>
              <Text style={[stepStyles.text, isActive && stepStyles.textActive]}>{label}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const stepStyles = StyleSheet.create({
  container: { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: '#fff' },
  wrapper: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, position: 'relative' },
  lineBase: { position: 'absolute', top: 10, left: 40, right: 40, height: 2, backgroundColor: '#E5E7EB', zIndex: -1 },
  lineActive: { position: 'absolute', top: 10, left: 40, height: 2, backgroundColor: '#4F46E5', zIndex: -1 },
  item: { alignItems: 'center', backgroundColor: '#fff', width: 60 },
  circle: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  circleActive: { backgroundColor: '#4F46E5' },
  num: { fontSize: 10, fontWeight: '700', color: '#6B7280' },
  text: { fontSize: 10, color: '#6B7280' },
  textActive: { color: '#4F46E5', fontWeight: '700' },
})

interface CreatePostTripModalProps {
  visible: boolean
  onClose: () => void
  tripId: string
  onCreated: (post: PostTripViewDTO) => void
  driverAnalysis?: any
}

interface DetailFormState {
  detailType: DriverType
  requiredCount: string
  pricePerPerson: string
  pickupLocation: string
  dropoffLocation: string
  // Giữ lại field trong state để không lỗi logic, mặc định false
  mustPickAtGarage: boolean
  mustDropAtGarage: boolean
  bonusAmount?: string
  depositAmount?: string
}

const CreatePostTripModal: React.FC<CreatePostTripModalProps> = ({ visible, onClose, tripId, onCreated, driverAnalysis }) => {
  const router = useRouter()
  const [title, setTitle] = useState('Tìm thêm tài xế cho chuyến')
  const [description, setDescription] = useState('Cần bổ sung tài xế, ưu tiên kinh nghiệm và đúng giờ.')
    const [payloadKg, setPayloadKg] = useState('')
  
  const [details, setDetails] = useState<DetailFormState[]>([{
    detailType: 'PRIMARY',
    requiredCount: '1',
    pricePerPerson: '0',
    pickupLocation: '',
    dropoffLocation: '',
    mustPickAtGarage: false,
    mustDropAtGarage: false,
    bonusAmount: '',
    depositAmount: ''
  }])
  
    const [submitting, setSubmitting] = useState(false)
    // multi-step flow state
    const [step, setStep] = useState<number>(1)
    const [loading, setLoading] = useState(false)
    const [contractTemplate, setContractTemplate] = useState<any | null>(null)
    const [acceptedTerms, setAcceptedTerms] = useState(false)
    const [createdPostId, setCreatedPostId] = useState<string | null>(null)
    const [wallet, setWallet] = useState<any | null>(null)
    const [sufficientBalance, setSufficientBalance] = useState<boolean | null>(null)
    const [paymentLoading, setPaymentLoading] = useState(false)

  const formatMoney = (val: string) => val.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    const sanitizeNumber = (val: string) => val.replace(/[^0-9]/g, '')

    // Step 1 -> Step 2: create post on server and fetch contract template
    const handleNext = async () => {
        if (!title.trim()) return Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề bài đăng.')
        if (!details.length) return Alert.alert('Thiếu thông tin', 'Cần ít nhất 1 dòng yêu cầu chi tiết.')

        const builtDetails: PostTripDetailCreateDTO[] = []
        for (let i = 0; i < details.length; i++) {
            const d = details[i]
            const reqCount = parseInt(d.requiredCount || '0', 10)
            if (isNaN(reqCount) || reqCount <= 0) return Alert.alert('Lỗi nhập liệu', `Dòng ${i + 1}: Số lượng tài xế phải lớn hơn 0.`)

            const price = parseFloat(d.pricePerPerson.replace(/,/g, '') || '0')
            if (price < 0) return Alert.alert('Lỗi nhập liệu', `Dòng ${i + 1}: Giá không hợp lệ.`)
            const bonus = d.bonusAmount ? parseFloat(d.bonusAmount.replace(/,/g, '')) : undefined
            if (typeof bonus === 'number' && (isNaN(bonus) || bonus < 0)) return Alert.alert('Lỗi nhập liệu', `Dòng ${i + 1}: Phụ phí không hợp lệ.`)
            if (typeof bonus === 'number' && bonus > 1000000000) return Alert.alert('Lỗi nhập liệu', `Dòng ${i + 1}: Phụ phí quá lớn.`)
            const deposit = d.depositAmount ? parseFloat(d.depositAmount.replace(/,/g, '')) : undefined
            if (typeof deposit === 'number' && (isNaN(deposit) || deposit < 0)) return Alert.alert('Lỗi nhập liệu', `Dòng ${i + 1}: Tiền đặt cọc không hợp lệ.`)
            if (typeof deposit === 'number' && deposit > 1000000000) return Alert.alert('Lỗi nhập liệu', `Dòng ${i + 1}: Tiền đặt cọc quá lớn.`)

            const detail: PostTripDetailCreateDTO = {
                Type: d.detailType,
                RequiredCount: reqCount,
                PricePerPerson: price,
                PickupLocation: d.pickupLocation.trim(),
                DropoffLocation: d.dropoffLocation.trim(),
                MustPickAtGarage: false,
                MustDropAtGarage: false,
                BonusAmount: bonus,
                DepositAmount: deposit
            }
            builtDetails.push(detail)
        }

        const payloadValue = payloadKg ? parseFloat(payloadKg.replace(/,/g, '')) : null
        if (payloadValue !== null && (isNaN(payloadValue) || payloadValue < 0)) {
            return Alert.alert('Lỗi nhập liệu', 'Tải trọng không hợp lệ.')
        }

        setLoading(true)
        try {
            const dto: PostTripCreateDTO = {
                Title: title.trim(),
                Description: description.trim(),
                TripId: tripId,
                RequiredPayloadInKg: payloadValue,
                PostTripDetails: builtDetails,
                Status: 'AWAITING_SIGNATURE'
            }

            // create post trip on server with awaiting signature status (backend will return id)
            const res: any = await postTripService.create(dto)
            const ok = res?.isSuccess ?? (res?.statusCode === 200 || res?.statusCode === 201)
            if (!ok) throw new Error(res?.message || 'Tạo bài đăng thất bại')

            const createdId = res.result?.postTripId || res.result?.PostTripId || res.result?.id || res.postTripId || res.data?.postTripId
            setCreatedPostId(String(createdId || ''))

            // fetch latest provider contract template (includes terms)
            try {
                const tplResp: any = await contractTemplateService.getLatestDriverContract()
                const tpl = tplResp?.result ?? tplResp
                setContractTemplate(tpl ?? null)
            } catch (e) {
                console.warn('contract fetch failed', e)
                setContractTemplate(null)
            }

            setAcceptedTerms(false)
            setStep(2)
        } catch (e: any) {
            Alert.alert('Lỗi', e?.message || 'Không thể tạo bài đăng')
        } finally {
            setLoading(false)
        }
    }

  const updateDetail = (index: number, field: keyof DetailFormState, value: any) => {
    setDetails(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

    // Called from Step 2 when user accepts contract terms
    const handleAcceptAndProceedToPayment = async () => {
        if (!createdPostId) return Alert.alert('Lỗi', 'Không tìm thấy ID bài đăng để thanh toán.')
        if (!acceptedTerms) return Alert.alert('Vui lòng chấp nhận hợp đồng để tiếp tục')

        setLoading(true)
            try {
                // Best-effort: update post trip status to AWAITING_PAYMENT if endpoint exists
                try {
                    await postTripService.updateStatus(createdPostId, 'AWAITING_PAYMENT')
                } catch (e) {
                    console.warn('postTrip.updateStatus not available or failed', e)
                }

            // fetch wallet info to check balance and compute sufficiency
            let myWallet: any = null
            try {
                const wresp: any = await walletService.getMyWallet()
                myWallet = wresp?.result ?? wresp
                setWallet(myWallet)
            } catch (e) {
                console.warn('wallet fetch failed', e)
                setWallet(null)
            }

            // compute simple total and set sufficiency flag (KHÔNG tính tiền đặt cọc - do tài xế trả)
            const total = details.reduce((sum, d) => {
                const price = parseFloat((d.pricePerPerson || '0').toString().replace(/,/g, '')) || 0
                const bonus = parseFloat((d.bonusAmount || '0').toString().replace(/,/g, '')) || 0
                // deposit KHÔNG tính vào thanh toán owner
                const count = parseInt(d.requiredCount || '0', 10) || 0
                return sum + (price + bonus) * count
            }, 0)
            const bal = Number(myWallet?.balance ?? myWallet?.Balance ?? null)
            if (!isNaN(bal)) setSufficientBalance(bal >= total)

            setStep(3)
        } catch (e: any) {
            Alert.alert('Lỗi', e?.message || 'Không thể chuẩn bị thanh toán')
        } finally {
            setLoading(false)
        }
    }

    const handlePayment = async () => {
        if (!createdPostId) return Alert.alert('Lỗi', 'Không tìm thấy ID bài đăng để thanh toán.')
        setPaymentLoading(true)
        try {
            // Owner chỉ trả lương + bonus, KHÔNG trả tiền cọc (do tài xế trả)
            const amount = details.reduce((sum, d) => {
                const price = parseFloat((d.pricePerPerson || '0').toString().replace(/,/g, '')) || 0
                const bonus = parseFloat((d.bonusAmount || '0').toString().replace(/,/g, '')) || 0
                // deposit KHÔNG tính
                const count = parseInt(d.requiredCount || '0', 10) || 0
                return sum + (price + bonus) * count
            }, 0)

            const payload = {
                amount,
                type: 'POST_TRIP_PAYMENT',
                // send the created postTrip id in the PostId field so backend recognizes the post resource
                postId: createdPostId,
                tripId: tripId, // gửi kèm tripId
                description: `Thanh toán cho bài đăng tìm tài xế (${createdPostId})`
            }

            const presp: any = await walletService.createPayment(payload)
            const ok = presp?.isSuccess ?? (presp?.statusCode === 200 || presp?.statusCode === 201)
            if (!ok) throw new Error(presp?.message || 'Thanh toán thất bại')

            // Update status to OPEN after successful payment
            try {
                await postTripService.updateStatus(createdPostId, 'OPEN')
            } catch (e) {
                console.warn('postTrip.updateStatus to OPEN failed', e)
            }

            setStep(4)
            // notify parent with a lightweight PostTripViewDTO stub
            const postStub: PostTripViewDTO = {
                postTripId: createdPostId,
                tripId,
                title,
                description,
                status: 'OPEN'
            } as any
            onCreated(postStub)
        } catch (e: any) {
            const msg = e?.message || 'Thanh toán thất bại'
            Alert.alert('Lỗi thanh toán', msg, [
                { text: 'Thử lại', onPress: () => handlePayment() },
                { text: 'Hủy', style: 'cancel' }
            ])
        } finally {
            setPaymentLoading(false)
        }
    }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
            
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                onPress={step > 1 ? () => setStep(step - 1) : onClose} 
                style={styles.closeBtn}
              >
                <Ionicons name={step > 1 ? "arrow-back" : "close"} size={24} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>
                {step === 1 ? 'Tạo Bài Đăng' : step === 2 ? 'Ký Hợp Đồng' : step === 3 ? 'Thanh Toán' : 'Hoàn Tất'}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Step Indicator */}
            <StepIndicator step={step} />

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {step === 1 && (
              <>
                {/* AI Recommendation */}
                {driverAnalysis?.suggestion && (
                  <View style={styles.aiSection}>
                    <View style={styles.aiHeader}>
                      <MaterialCommunityIcons name="robot-outline" size={18} color="#4F46E5" />
                      <Text style={styles.aiTitle}>Khuyến nghị từ hệ thống</Text>
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
                          <Ionicons name="person" size={14} color="#059669" />
                          <Text style={styles.miniScenarioLabel}>1 Tài</Text>
                          <Text style={styles.miniScenarioValue}>{driverAnalysis.suggestion.soloScenario.totalElapsedHours?.toFixed(0)}h</Text>
                        </View>
                      )}
                      {driverAnalysis.suggestion.teamScenario?.isPossible && (
                        <View style={styles.miniScenario}>
                          <Ionicons name="people" size={14} color="#2563EB" />
                          <Text style={styles.miniScenarioLabel}>2 Tài</Text>
                          <Text style={styles.miniScenarioValue}>{driverAnalysis.suggestion.teamScenario.totalElapsedHours?.toFixed(0)}h</Text>
                        </View>
                      )}
                      {driverAnalysis.suggestion.expressScenario?.isPossible && (
                        <View style={styles.miniScenario}>
                          <Ionicons name="flash" size={14} color="#DC2626" />
                          <Text style={styles.miniScenarioLabel}>3 Tài</Text>
                          <Text style={styles.miniScenarioValue}>{driverAnalysis.suggestion.expressScenario.totalElapsedHours?.toFixed(0)}h</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Section 1: Thông tin chung */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. THÔNG TIN BÀI ĐĂNG</Text>
                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Tiêu đề bài viết</Text>
                            <TextInput 
                                value={title} 
                                onChangeText={setTitle} 
                                style={styles.input} 
                                placeholder="VD: Cần tìm 2 tài xế xe tải 5 tấn..." 
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                        
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Mô tả công việc</Text>
                            <TextInput 
                                value={description} 
                                onChangeText={setDescription} 
                                style={[styles.input, styles.textArea]} 
                                multiline 
                                placeholder="Mô tả chi tiết yêu cầu..." 
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Tải trọng yêu cầu (Kg)</Text>
                            <View style={styles.inputWrapper}>
                                <MaterialCommunityIcons name="weight-kilogram" size={20} color="#6B7280" style={styles.inputIcon} />
                                <TextInput 
                                    value={formatMoney(payloadKg)} 
                                    onChangeText={(t) => setPayloadKg(sanitizeNumber(t))} 
                                    keyboardType="numeric" 
                                    style={styles.inputNoBorder} 
                                    placeholder="0"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                        </View>

                    </View>
                </View>

                {/* Section 2: Chi tiết yêu cầu */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>2. CHI TIẾT YÊU CẦU ({details.length})</Text>
                        <TouchableOpacity style={styles.addBtn} onPress={() => setDetails(prev => [...prev, { detailType:'PRIMARY', requiredCount:'1', pricePerPerson:'0', pickupLocation:'', dropoffLocation:'', mustPickAtGarage:false, mustDropAtGarage:false, bonusAmount:'', depositAmount:'' }])}>
                            <Ionicons name="add" size={16} color="#FFF" />
                            <Text style={styles.addBtnText}>Thêm dòng</Text>
                        </TouchableOpacity>
                    </View>

                    {details.map((d, idx) => {
                        const isPrimary = d.detailType === 'PRIMARY'
                        return (
                            <View key={idx} style={styles.detailCard}>
                                {/* Header của từng Card */}
                                <View style={styles.detailCardHeader}>
                                    <View style={styles.tagContainer}>
                                        <Text style={styles.tagText}>Yêu cầu #{idx + 1}</Text>
                                    </View>
                                    {details.length > 1 && (
                                        <TouchableOpacity onPress={() => setDetails(prev => prev.filter((_, i) => i !== idx))} style={styles.deleteBtn}>
                                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* Content Card */}
                                <View style={styles.detailCardBody}>
                                    
                                    {/* [FIXED] Sử dụng width cố định cho ô Số lượng để tránh tràn */}
                                    <View style={styles.rowInputs}>
                                        <View style={{ flex: 1, marginRight: 12 }}>
                                            <Text style={styles.label}>Loại tài xế</Text>
                                            <View style={styles.segmentControl}>
                                                <TouchableOpacity 
                                                    style={[styles.segmentBtn, isPrimary && styles.segmentBtnActive]} 
                                                    onPress={() => updateDetail(idx, 'detailType', 'PRIMARY')}
                                                >
                                                    <Text style={[styles.segmentText, isPrimary && styles.segmentTextActive]}>Chính</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity 
                                                    style={[styles.segmentBtn, !isPrimary && styles.segmentBtnActive]} 
                                                    onPress={() => updateDetail(idx, 'detailType', 'SECONDARY')}
                                                >
                                                    <Text style={[styles.segmentText, !isPrimary && styles.segmentTextActive]}>Phụ</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        {/* Width cố định 100 cho ô số lượng */}
                                        <View style={{ width: 100 }}>
                                            <Text style={styles.label}>Số lượng</Text>
                                                <View style={styles.smallInputWrapper}>
                                                    <TextInput
                                                        value={d.requiredCount}
                                                        onChangeText={v => updateDetail(idx, 'requiredCount', sanitizeNumber(v))}
                                                        keyboardType="number-pad"
                                                        style={styles.smallInput}
                                                        placeholder="1"
                                                        maxLength={3}
                                                    />
                                                </View>
                                        </View>
                                    </View>

                                    {/* Giá tiền */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Ngân sách / người (VND)</Text>
                                        <View style={styles.inputWrapper}>
                                            <Text style={styles.currencySymbol}>₫</Text>
                                            <TextInput 
                                                value={formatMoney(d.pricePerPerson)} 
                                                onChangeText={v => updateDetail(idx, 'pricePerPerson', sanitizeNumber(v))} 
                                                keyboardType="numeric" 
                                                style={styles.inputNoBorder} 
                                                placeholder="0"
                                            />
                                        </View>
                                    </View>

                                    {/* Phụ phí / Tiền thưởng cho từng dòng */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Phụ phí / Tiền thưởng (VND)</Text>
                                        <View style={styles.inputWrapper}>
                                            <Text style={styles.currencySymbol}>₫</Text>
                                            <TextInput
                                                value={formatMoney(d.bonusAmount || '')}
                                                onChangeText={v => updateDetail(idx, 'bonusAmount', sanitizeNumber(v))}
                                                keyboardType="numeric"
                                                style={styles.inputNoBorder}
                                                placeholder="0"
                                            />
                                        </View>
                                        {d.bonusAmount && parseFloat(d.bonusAmount.replace(/,/g, '')) > 1000000000 && (
                                            <Text style={styles.errorText}>Phụ phí quá lớn (tối đa 1,000,000,000)</Text>
                                        )}
                                    </View>

                                    {/* Tiền đặt cọc */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Tiền đặt cọc (VND)</Text>
                                        <View style={styles.inputWrapper}>
                                            <Text style={styles.currencySymbol}>₫</Text>
                                            <TextInput
                                                value={formatMoney(d.depositAmount || '')}
                                                onChangeText={v => updateDetail(idx, 'depositAmount', sanitizeNumber(v))}
                                                keyboardType="numeric"
                                                style={styles.inputNoBorder}
                                                placeholder="0"
                                            />
                                        </View>
                                        {d.depositAmount && parseFloat(d.depositAmount.replace(/,/g, '')) > 1000000000 && (
                                            <Text style={styles.errorText}>Tiền đặt cọc quá lớn (tối đa 1,000,000,000)</Text>
                                        )}
                                    </View>

                                    {/* Địa điểm (Timeline style) - [REMOVED CHECKBOXES] */}
                                    <View style={styles.timelineContainer}>
                                        <View style={styles.timelineDecor}>
                                            <View style={[styles.dot, {backgroundColor: '#3B82F6'}]} />
                                            <View style={styles.line} />
                                            <View style={[styles.dot, {backgroundColor: '#EF4444'}]} />
                                        </View>
                                        <View style={{flex: 1, gap: 12}}>
                                            
                                            {/* Điểm Đi [FIXED zIndex] */}
                                            <View style={{zIndex: 20}}>
                                                <Text style={styles.label}>{isPrimary ? 'Điểm nhận xe (Garage)' : 'Điểm đón tài xế'}</Text>
                                                <View style={styles.addressInputWrapper}>
                                                    <AddressAutocomplete
                                                        value={d.pickupLocation}
                                                        onSelect={(s: any) => updateDetail(idx, 'pickupLocation', s.display || s.name)}
                                                        placeholder={isPrimary ? "VD: Bãi xe miền Đông..." : "VD: Ngã tư Thủ Đức..."}
                                                    />
                                                </View>
                                            </View>

                                            {/* Điểm Đến [FIXED zIndex] */}
                                            <View style={{zIndex: 10}}>
                                                <Text style={styles.label}>{isPrimary ? 'Điểm trả xe (Bắt buộc)' : 'Điểm trả tài xế'}</Text>
                                                <View style={styles.addressInputWrapper}>
                                                    <AddressAutocomplete
                                                        value={d.dropoffLocation}
                                                        onSelect={(s: any) => updateDetail(idx, 'dropoffLocation', s.display || s.name)}
                                                        placeholder={isPrimary ? "VD: Trả xe tại bãi..." : "VD: Bến xe..."}
                                                    />
                                                </View>
                                            </View>

                                        </View>
                                    </View>

                                    {/* Note Box */}
                                    <View style={[styles.noteBox, isPrimary ? styles.notePrimary : styles.noteSecondary]}>
                                        <Ionicons name="information-circle" size={20} color={isPrimary ? "#4338CA" : "#4B5563"} />
                                        <Text style={[styles.noteText, {color: isPrimary ? "#3730A3" : "#374151"}]}> 
                                            {isPrimary 
                                                ? "Lưu ý: Tài xế chính bắt buộc phải đến điểm nhận xe và hoàn trả xe tại điểm kết thúc."
                                                : "Lưu ý: Tài xế phụ chỉ cần có mặt tại điểm đón và kết thúc tại điểm trả khách."}
                                        </Text>
                                    </View>

                                </View>
                            </View>
                        )
                    })}
                </View>
              </>
            )}

            {step === 2 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>2. XEM HỢP ĐỒNG</Text>
                <View style={styles.card}>
                                    {contractTemplate ? (
                                        <>
                                            <Text style={styles.contractTitle}>{contractTemplate?.ContractTemplateName || contractTemplate?.contractTemplateName || 'Hợp đồng nhà cung cấp'}</Text>
                                            {((contractTemplate?.ContractTerms ?? contractTemplate?.contractTerms) || []).map((t: any, i: number) => (
                                                <View key={t?.contractTermId ?? i} style={styles.termItem}>
                                                    <Text style={styles.termIndex}>{t?.order ?? (i + 1)}.</Text>
                                                    <Text style={styles.termText}>{t?.Content ?? t?.content ?? t?.contentHtml ?? ''}</Text>
                                                </View>
                                            ))}
                                        </>
                                    ) : (
                                        <Text>Không có mẫu hợp đồng. Vui lòng kiểm tra kết nối.</Text>
                                    )}

                  <View style={styles.acceptRow}>
                    <TouchableOpacity onPress={() => setAcceptedTerms(prev => !prev)} style={styles.checkboxArea}>
                      {acceptedTerms ? <Ionicons name="checkbox" size={20} color="#4F46E5" /> : <Ionicons name="square-outline" size={20} color="#6B7280" />}
                    </TouchableOpacity>
                    <Text style={styles.acceptText}>Tôi đã đọc và đồng ý với các điều khoản</Text>
                  </View>
                </View>
              </View>
            )}

            {step === 3 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>3. THANH TOÁN</Text>
                                <View style={styles.card}>
                                    {(() => {
                                        // Owner chỉ thanh toán: Lương + Bonus (KHÔNG bao gồm tiền cọc)
                                        const total = details.reduce((sum, d) => {
                                            const price = parseFloat((d.pricePerPerson || '0').toString().replace(/,/g, '')) || 0
                                            const bonus = parseFloat((d.bonusAmount || '0').toString().replace(/,/g, '')) || 0
                                            // deposit KHÔNG tính - do tài xế trả
                                            const count = parseInt(d.requiredCount || '0', 10) || 0
                                            return sum + (price + bonus) * count
                                        }, 0)
                                        return (
                                            <>
                                                <Text style={{ fontSize: 14, fontWeight: '700' }}>Tổng cần thanh toán (Lương + Bonus)</Text>
                                                <Text style={{ fontSize: 22, fontWeight: '800', marginTop: 8 }}>₫ {formatMoney(String(total))}</Text>
                                                <Text style={{ color: '#6B7280', marginTop: 8, fontSize: 12 }}>Phương thức: Ví nội bộ</Text>
                                                <Text style={{ color: '#DC2626', marginTop: 4, fontSize: 11 }}>* Tiền cọc sẽ do tài xế thanh toán khi nhận việc</Text>
                                            </>
                                        )
                                    })()}

                                    <View style={{ height: 12 }} />
                                    <Text style={styles.label}>Số dư ví của bạn</Text>
                                    <Text style={styles.walletBalance}>₫ {formatMoney(String(wallet?.balance ?? wallet?.Balance ?? 0))}</Text>
                                    {sufficientBalance === true && <Text style={{ color: '#059669', marginTop: 6 }}>✓ Số dư đủ để thanh toán.</Text>}
                                    {sufficientBalance === false && (
                                      <View>
                                        <View style={styles.balanceWarning}>
                                          <Ionicons name="alert-circle" size={16} color="#F59E0B" />
                                          <Text style={{ color: '#F59E0B', marginLeft: 4, fontSize: 13 }}>Số dư không đủ. Vui lòng nạp thêm.</Text>
                                        </View>
                                        <TouchableOpacity
                                          style={styles.topupButton}
                                          onPress={() => {
                                            const total = details.reduce((sum, d) => {
                                              const count = parseInt(d.requiredCount || '0', 10)
                                              const price = parseFloat(d.pricePerPerson || '0')
                                              const bonus = parseFloat(d.bonusAmount || '0')
                                              return sum + (count * (price + bonus))
                                            }, 0)
                                            const currentBalance = Number(wallet?.balance ?? wallet?.Balance ?? 0) || 0
                                            const deficit = Math.max(0, total - currentBalance)
                                            router.push(`/(wallet)/wallet-operations?amount=${deficit}`)
                                          }}
                                        >
                                          <MaterialCommunityIcons name="wallet-plus" size={20} color="#fff" />
                                          <Text style={styles.topupButtonText}>Nạp tiền ngay</Text>
                                        </TouchableOpacity>
                                      </View>
                                    )}
                                </View>
                            </View>
            )}

            {step === 4 && (
              <View style={styles.section}>
                <View style={styles.card}>
                  <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Hoàn tất</Text>
                  <Text>Thanh toán thành công. Bài đăng của bạn đã được gửi và đang chờ tài xế nhận.</Text>
                </View>
              </View>
            )}

          </ScrollView>

                    {/* Footer (step aware) */}
                    <View style={styles.footer}>
                        {step === 1 && (
                            <>
                                <View style={styles.summaryBox}>
                                        <Text style={styles.summaryLabel}>Tổng cần tuyển:</Text>
                                        <Text style={styles.summaryValue}>{details.reduce((sum,d)=> sum + (parseInt(d.requiredCount||'0',10)||0),0)} Tài xế</Text>
                                </View>
                                <TouchableOpacity 
                                        style={[styles.btnPrimary, (submitting || loading) && styles.btnDisabled]} 
                                        onPress={handleNext} 
                                        disabled={submitting || loading}
                                >
                                        {submitting ? <ActivityIndicator color="#FFF" /> : (
                                                <>
                                                        <Text style={styles.btnPrimaryText}>Đăng Tin Ngay</Text>
                                                        <Ionicons name="paper-plane-outline" size={18} color="#FFF" />
                                                </>
                                        )}
                                </TouchableOpacity>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <TouchableOpacity style={[styles.btnSmall, styles.secondaryOutline]} onPress={() => setStep(1)} disabled={loading}>
                                    <Text style={styles.secondaryOutlineText}>Quay lại</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.btnPrimary, (loading || !acceptedTerms) && styles.btnDisabled]} onPress={handleAcceptAndProceedToPayment} disabled={loading || !acceptedTerms}>
                                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnPrimaryText}>Chấp nhận & Thanh toán</Text>}
                                </TouchableOpacity>
                            </>
                        )}

                        {step === 3 && (
                            <>
                                <TouchableOpacity style={[styles.btnSmall, styles.secondaryOutline]} onPress={() => setStep(2)} disabled={paymentLoading}>
                                    <Text style={styles.secondaryOutlineText}>Quay lại</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.btnPrimary, paymentLoading && styles.btnDisabled]} onPress={handlePayment} disabled={paymentLoading}>
                                    {paymentLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnPrimaryText}>Thanh toán</Text>}
                                </TouchableOpacity>
                            </>
                        )}

                        {step === 4 && (
                            <>
                                <View style={styles.summaryBox}>
                                    <Text style={styles.summaryLabel}>Trạng thái</Text>
                                    <Text style={styles.summaryValue}>Hoàn tất</Text>
                                </View>
                                <TouchableOpacity style={styles.btnPrimary} onPress={() => { 
                                    setStep(1); 
                                    setAcceptedTerms(false);
                                    setCreatedPostId(null);
                                    onClose(); 
                                }}>
                                    <Text style={styles.btnPrimaryText}>Đóng</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>

          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  // Modal Layout
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#F3F4F6', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '90%', shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 10 },
  
  // Header
  header: { alignItems: 'center', paddingVertical: 12, backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerHandle: { width: 40, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2, marginBottom: 12 },
  headerRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  closeBtn: { padding: 6, backgroundColor: '#F3F4F6', borderRadius: 12 },

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

  // Generic
  section: { marginTop: 16, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  
  // Inputs
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 12, height: 44 },
  inputNoBorder: { flex: 1, fontSize: 14, color: '#111827', fontWeight: '500' },
    smallInputWrapper: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 8, height: 44 },
    smallInput: { width: '100%', textAlign: 'center', fontSize: 14, color: '#111827', paddingVertical: 10 },
  inputIcon: { marginRight: 8 },
  textArea: { height: 80, textAlignVertical: 'top' },
  currencySymbol: { fontSize: 16, fontWeight: '600', color: '#6B7280', marginRight: 4 },

  // Detail Cards
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4F46E5', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, gap: 4 },
  addBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  
  detailCard: { backgroundColor: '#FFF', borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden', shadowColor: "#000", shadowOffset: {width:0, height:1}, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  detailCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  tagContainer: { backgroundColor: '#E0E7FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 12, fontWeight: '700', color: '#4338CA' },
  deleteBtn: { padding: 4 },
  
  detailCardBody: { padding: 16 },
  rowInputs: { flexDirection: 'row', marginBottom: 14 },
  
  // Segment
  segmentControl: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 10, padding: 4, height: 44 },
  segmentBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  segmentBtnActive: { backgroundColor: '#FFF', shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  segmentText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  segmentTextActive: { color: '#4F46E5' },

  // Timeline Address
  timelineContainer: { flexDirection: 'row', marginTop: 4 },
  timelineDecor: { alignItems: 'center', width: 20, paddingTop: 24, paddingRight: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  line: { flex: 1, width: 2, backgroundColor: '#E5E7EB', marginVertical: 4 },
  addressInputWrapper: { marginBottom: 4 },
  
  // Note Box
  noteBox: { flexDirection: 'row', padding: 12, borderRadius: 10, gap: 10, alignItems: 'flex-start', marginTop: 16 },
  notePrimary: { backgroundColor: '#EEF2FF' },
  noteSecondary: { backgroundColor: '#F3F4F6' },
  noteText: { flex: 1, fontSize: 13, lineHeight: 18 },

  // Footer
  footer: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5E7EB', gap: 12 },
  summaryBox: { flex: 1 },
  summaryLabel: { fontSize: 12, color: '#6B7280' },
  summaryValue: { fontSize: 16, fontWeight: '800', color: '#111827' },
  btnPrimary: { flexDirection: 'row', backgroundColor: '#4F46E5', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center', gap: 8, shadowColor: "#4F46E5", shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 8 },
  btnDisabled: { backgroundColor: '#A5B4FC', shadowOpacity: 0 },
  btnPrimaryText: { color: '#FFF', fontSize: 15, fontWeight: '700' }
        ,
    contractTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 8 },
    btnSmall: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
    secondaryOutline: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1' },
    secondaryOutlineText: { color: '#475569', fontWeight: '600', fontSize: 13 },
    termItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    termIndex: { fontSize: 13, fontWeight: '700', color: '#6B7280', width: 20 },
    termText: { flex: 1, fontSize: 13, color: '#374151' },
    acceptRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
    checkboxArea: { marginRight: 8 },
    acceptText: { fontSize: 13, color: '#374151' },
    totalAmount: { fontSize: 20, fontWeight: '800', color: '#111827', marginTop: 6 },
    walletBalance: { fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 6 },
        errorText: { color: '#DC2626', fontSize: 12, marginTop: 6 },
    
    // Balance Warning & Topup Button
    balanceWarning: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FEF3C7',
      padding: 12,
      borderRadius: 8,
      marginTop: 8,
      borderWidth: 1,
      borderColor: '#FCD34D'
    },
    topupButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#10B981',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      marginTop: 12,
      gap: 8,
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4
    },
    topupButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700'
    }
})

export default CreatePostTripModal
import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Pressable,
  Alert,
  Dimensions,
  StatusBar,
  Modal,
  Platform
} from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import DateTimePicker from '@react-native-community/datetimepicker'

// Services
import packageService from '@/services/packageService'
import contractTemplateService from '@/services/contractTemplateService'
import postPackageService, { type RouteCalculationResultDTO, type Location } from '@/services/postPackageService'
import walletService from '@/services/walletService'

// Utils & Components
import AddressAutocomplete from '@/components/AddressAutocomplete'
import DateInput from '@/components/DateInput'
import { formatVND, digitsOnly } from '@/utils/currency'

// WebView (Optional)
let WebView: any = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  WebView = require('react-native-webview').WebView
} catch (e) { WebView = null }

interface PostFormModalProps {
  visible: boolean
  onClose: () => void
  onCreated: (res: any) => void
  initialData?: any | null
  isEdit?: boolean
}

const COLORS = {
  primary: '#0284C7',
  background: '#F3F4F6',
  white: '#FFFFFF',
  textMain: '#111827',
  textSec: '#6B7280',
  border: '#E5E7EB',
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  infoBg: '#E0F2FE',
  infoText: '#0369A1'
}

// Helper: Convert datetime string to ISO format with .000Z (keep local time, don't convert timezone)
const toISOStringWithZ = (dateTimeString: string): string => {
  if (!dateTimeString) return new Date().toISOString()
  
  // If already has time (format: YYYY-MM-DDTHH:mm:ss or YYYY-MM-DDTHH:mm:00)
  if (dateTimeString.includes('T')) {
    // Keep the exact time user selected, just append .000Z
    return dateTimeString.endsWith(':00') ? `${dateTimeString}.000Z` : `${dateTimeString}:00.000Z`
  }
  
  // If only date (format: YYYY-MM-DD), add default time 00:00:00
  return `${dateTimeString}T00:00:00.000Z`
}

// --- COMPONENT: STEP INDICATOR ---
const StepIndicator: React.FC<{ step: number }> = ({ step }) => {
  const steps = ['Thông tin', 'Hợp đồng', 'Thanh toán', 'Hoàn tất']
  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepWrapper}>
        <View style={styles.stepLineBase} />
        <View style={[styles.stepLineActive, { width: `${((step - 1) / 3) * 100}%` }]} />
        
        {steps.map((label, idx) => {
          const s = idx + 1
          const isActive = s <= step
          return (
            <View key={s} style={styles.stepItem}>
              <View style={[styles.stepCircle, isActive && styles.stepCircleActive]}>
                {s < step ? <Ionicons name="checkmark" size={12} color="#fff" /> : <Text style={[styles.stepNum, isActive && {color:'#fff'}]}>{s}</Text>}
              </View>
              <Text style={[styles.stepText, isActive && styles.stepTextActive]}>{label}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

// --- COMPONENT: INPUT FIELD ---
const InputField = ({ label, value, onChange, placeholder, width = '100%', multiline = false, required = false, keyboardType = 'default', error = null, onBlur = undefined }: any) => (
  <View style={{ width, marginBottom: 12 }}>
    <Text style={styles.label}>{label} {required && <Text style={{color: COLORS.danger}}>*</Text>}</Text>
    <TextInput
      style={[styles.input, multiline && { height: 70, textAlignVertical: 'top', paddingTop: 10 }, error && styles.inputError]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      multiline={multiline}
      keyboardType={keyboardType}
      onBlur={onBlur}
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
)

// --- COMPONENT: TIME PICKER INPUT ---
const TimePickerInput = ({ label, value, onChange, placeholder = "08:00" }: any) => {
  const [showPicker, setShowPicker] = useState(false)
  const [hour, setHour] = useState('08')
  const [minute, setMinute] = useState('00')
  
  useEffect(() => {
    if (value) {
      const parts = value.split(':')
      if (parts.length === 2) {
        setHour(parts[0])
        setMinute(parts[1])
      }
    }
  }, [value])
  
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
  const minutes = ['00', '15', '30', '45']
  
  const handleHourSelect = (h: string) => {
    setHour(h)
    onChange(`${h}:${minute}`)
  }
  
  const handleMinuteSelect = (m: string) => {
    setMinute(m)
    onChange(`${hour}:${m}`)
  }
  
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity 
        style={styles.timePickerButton}
        onPress={() => setShowPicker(true)}
      >
        <Ionicons name="time-outline" size={18} color={COLORS.primary} />
        <Text style={styles.timePickerText}>{value || placeholder}</Text>
        <Ionicons name="chevron-down" size={18} color={COLORS.textSec} />
      </TouchableOpacity>
      
      <Modal visible={showPicker} transparent animationType="fade">
        <Pressable style={styles.timePickerBackdrop} onPress={() => setShowPicker(false)}>
          <Pressable style={styles.timePickerModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.timePickerModalHeader}>
              <Text style={styles.timePickerModalTitle}>Chọn giờ</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMain} />
              </TouchableOpacity>
            </View>
            
            <View style={{ flexDirection: 'row', padding: 16, gap: 12 }}>
              {/* Hour Column */}
              <View style={{ flex: 1 }}>
                <Text style={styles.timePickerHeader}>Giờ</Text>
                <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                  {hours.map(h => (
                    <TouchableOpacity
                      key={h}
                      style={[
                        styles.timeOption,
                        hour === h && styles.timeOptionSelected
                      ]}
                      onPress={() => handleHourSelect(h)}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        hour === h && styles.timeOptionTextSelected
                      ]}>
                        {h}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Minute Column */}
              <View style={{ flex: 1 }}>
                <Text style={styles.timePickerHeader}>Phút</Text>
                <View>
                  {minutes.map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.timeOption,
                        minute === m && styles.timeOptionSelected
                      ]}
                      onPress={() => handleMinuteSelect(m)}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        minute === m && styles.timeOptionTextSelected
                      ]}>
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            
            <TouchableOpacity style={styles.timePickerDoneBtn} onPress={() => setShowPicker(false)}>
              <Text style={styles.timePickerDoneBtnText}>Xong</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

// --- COMPONENT: DATETIME INPUT (Hybrid: Native for Mobile, HTML5 for Web) ---
const DateTimeInput = ({ label, value, onChange, required = false }: any) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [hasValue, setHasValue] = useState(false)
  
  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value))
      setHasValue(true)
    } else {
      setHasValue(false)
    }
  }, [value])
  
  // Web: Handle HTML5 datetime-local input
  const handleWebDateTimeChange = (e: any) => {
    const val = e.target.value // Format: "YYYY-MM-DDTHH:mm"
    if (val) {
      setHasValue(true)
      onChange(`${val}:00`) // Add seconds
    } else {
      setHasValue(false)
      onChange('')
    }
  }
  
  // Mobile: Handle native DateTimePicker
  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false)
    }
    
    if (date) {
      setSelectedDate(date)
      if (Platform.OS === 'ios') {
        setShowDatePicker(false)
      }
      setShowTimePicker(true)
    }
  }
  
  const handleTimeChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false)
    }
    
    if (date) {
      setSelectedDate(date)
      setHasValue(true)
      
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      
      const formatted = `${year}-${month}-${day}T${hours}:${minutes}:00`
      onChange(formatted)
      
      if (Platform.OS === 'ios') {
        setShowTimePicker(false)
      }
    } else if (event.type === 'dismissed') {
      setShowTimePicker(false)
    }
  }
  
  const formatDisplayDateTime = () => {
    if (!hasValue) return 'Chọn ngày giờ'
    const d = selectedDate
    const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    return `${date} - ${time}`
  }
  
  const getWebValue = () => {
    if (!value) return ''
    // Convert "YYYY-MM-DDTHH:mm:ss" to "YYYY-MM-DDTHH:mm" for input
    return value.slice(0, 16)
  }
  
  // WEB VERSION
  if (Platform.OS === 'web') {
    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={styles.label}>{label} {required && <Text style={{color: COLORS.danger}}>*</Text>}</Text>
        <View style={styles.dateTimeButton}>
          <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
          <input
            type="datetime-local"
            value={getWebValue()}
            onChange={handleWebDateTimeChange}
            style={{
              flex: 1,
              marginLeft: 8,
              border: 'none',
              outline: 'none',
              fontSize: 14,
              fontFamily: 'inherit',
              color: hasValue ? COLORS.textMain : '#9CA3AF',
              backgroundColor: 'transparent'
            }}
          />
        </View>
      </View>
    )
  }
  
  // MOBILE VERSION
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label} {required && <Text style={{color: COLORS.danger}}>*</Text>}</Text>
      <TouchableOpacity 
        style={styles.dateTimeButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
        <Text style={[styles.dateTimeButtonText, !hasValue && { color: '#9CA3AF' }]}>
          {formatDisplayDateTime()}
        </Text>
        <Ionicons name="chevron-down" size={18} color={COLORS.textSec} />
      </TouchableOpacity>
      
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
      
      {showTimePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
          is24Hour={true}
        />
      )}
    </View>
  )
}

const PostFormModal: React.FC<PostFormModalProps> = ({ visible, onClose, onCreated, initialData = null, isEdit = false }) => {
  const router = useRouter()
  
  // State
  const [loading, setLoading] = useState(false)
  const [packages, setPackages] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [step, setStep] = useState<number>(1)
  
  // Contract & Payment State
  const [contractTemplate, setContractTemplate] = useState<any | null>(null)
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false)
  const [createdPostId, setCreatedPostId] = useState<string | null>(null)
  const [wallet, setWallet] = useState<any | null>(null)
  const [sufficientBalance, setSufficientBalance] = useState<boolean | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)

  // Route Validation State
  const [routeValidation, setRouteValidation] = useState<RouteCalculationResultDTO | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Phone Validation State
  const [phoneErrors, setPhoneErrors] = useState<{ sender: string | null; receiver: string | null }>({ sender: null, receiver: null })

  // Form Data
  const [form, setForm] = useState({
    title: '', description: '', offeredPrice: '',
    startLocation: '', endLocation: '',
    pickupDate: '', deliveryDate: '',
    startTimeToPickup: '', endTimeToPickup: '',
    startTimeToDelivery: '', endTimeToDelivery: '',
    senderName: '', senderPhone: '', senderEmail: '', senderNote: '',
    receiverName: '', receiverPhone: '', receiverEmail: '', receiverNote: ''
  })
  
  const [showTimeRanges, setShowTimeRanges] = useState(false)

  // --- EFFECT: INIT ---
  useEffect(() => {
    if (visible) {
      fetchPendingPackages()
      if (initialData) prefillData(initialData)
    } else {
      reset()
    }
  }, [visible, initialData])

  const prefillData = (d: any) => {
    setForm({
      title: d.title ?? d.Title ?? '',
      description: d.description ?? d.Description ?? '',
      offeredPrice: (d.offeredPrice ?? d.OfferedPrice ?? 0).toString(),
      startLocation: d.shippingRoute?.startLocation?.address ?? d.shippingRoute?.StartLocation ?? d.startLocation ?? '',
      endLocation: d.shippingRoute?.endLocation?.address ?? d.shippingRoute?.EndLocation ?? d.endLocation ?? '',
      pickupDate: d.shippingRoute?.expectedPickupDate ?? d.shippingRoute?.ExpectedPickupDate ?? d.expectedPickupDate ?? '',
      deliveryDate: d.shippingRoute?.expectedDeliveryDate ?? d.shippingRoute?.ExpectedDeliveryDate ?? d.expectedDeliveryDate ?? '',
      startTimeToPickup: d.shippingRoute?.startTimeToPickup ?? '',
      endTimeToPickup: d.shippingRoute?.endTimeToPickup ?? '',
      startTimeToDelivery: d.shippingRoute?.startTimeToDelivery ?? '',
      endTimeToDelivery: d.shippingRoute?.endTimeToDelivery ?? '',
      
      senderName: d.senderContact?.fullName ?? d.SenderContact?.FullName ?? '',
      senderPhone: d.senderContact?.phoneNumber ?? d.SenderContact?.PhoneNumber ?? '',
      senderEmail: d.senderContact?.email ?? d.SenderContact?.Email ?? '',
      senderNote: d.senderContact?.note ?? d.SenderContact?.Note ?? '',
      
      receiverName: d.receiverContact?.fullName ?? d.ReceiverContact?.FullName ?? '',
      receiverPhone: d.receiverContact?.phoneNumber ?? d.ReceiverContact?.PhoneNumber ?? '',
      receiverEmail: d.receiverContact?.email ?? d.ReceiverContact?.Email ?? '',
      receiverNote: d.receiverContact?.note ?? d.ReceiverContact?.Note ?? '',
    })
    const pkgIds = (d.packages || d.PackageIds || []).map((p: any) => p.packageId ?? p.id ?? p)
    setSelectedIds(pkgIds)
  }

  const reset = () => {
    setForm({ title: '', description: '', offeredPrice: '', startLocation: '', endLocation: '', pickupDate: '', deliveryDate: '', startTimeToPickup: '', endTimeToPickup: '', startTimeToDelivery: '', endTimeToDelivery: '', senderName: '', senderPhone: '', senderEmail: '', senderNote: '', receiverName: '', receiverPhone: '', receiverEmail: '', receiverNote: '' })
    setSelectedIds([])
    setStep(1)
    setContractTemplate(null)
    setAcceptedTerms(false)
    setLoading(false)
    setValidationError(null)
    setRouteValidation(null)
    setShowTimeRanges(false)
    setPhoneErrors({ sender: null, receiver: null })
  }

  const validateVietnamesePhone = (phone: string): boolean => {
    if (!phone) return false
    // Remove spaces and dashes
    const cleaned = phone.replace(/[\s-]/g, '')
    // Vietnamese phone patterns:
    // - Starts with 0 and has 10 digits: 0[3|5|7|8|9]xxxxxxxx
    // - Starts with +84 and has 11 digits: +84[3|5|7|8|9]xxxxxxxx
    const regex = /^(0[3|5|7|8|9][0-9]{8}|(\+84)[3|5|7|8|9][0-9]{8})$/
    return regex.test(cleaned)
  }

  const handleChange = (key: string, val: string | null) => {
    setForm(p => ({ ...p, [key]: val ?? '' }))
    // Clear phone errors when user types
    if (key === 'senderPhone') {
      setPhoneErrors(p => ({ ...p, sender: null }))
    } else if (key === 'receiverPhone') {
      setPhoneErrors(p => ({ ...p, receiver: null }))
    }
  }

  const validatePhoneField = (type: 'sender' | 'receiver') => {
    const phone = type === 'sender' ? form.senderPhone : form.receiverPhone
    if (!phone) {
      setPhoneErrors(p => ({ ...p, [type]: 'Vui lòng nhập số điện thoại' }))
      return false
    }
    if (!validateVietnamesePhone(phone)) {
      setPhoneErrors(p => ({ ...p, [type]: 'Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678)' }))
      return false
    }
    setPhoneErrors(p => ({ ...p, [type]: null }))
    return true
  }

  // --- EFFECT: ROUTE CALCULATION ---
  useEffect(() => {
    const calculateRoute = async () => {
      // Check if all required fields are filled (including time)
      if (!form.startLocation || !form.endLocation || !form.pickupDate || !form.deliveryDate) {
        setRouteValidation(null); setValidationError(null); return
      }
      
      // Validate that both pickup and delivery dates have time component
      const hasPickupTime = form.pickupDate.includes('T') && form.pickupDate.split('T')[1] !== '00:00:00'
      const hasDeliveryTime = form.deliveryDate.includes('T') && form.deliveryDate.split('T')[1] !== '00:00:00'
      
      if (!hasPickupTime || !hasDeliveryTime) {
        setRouteValidation(null)
        setValidationError('Vui lòng chọn cả ngày và giờ cho cả điểm lấy và điểm giao')
        return
      }

      setIsCalculating(true); setValidationError(null)
      try {
        const startLoc = await postPackageService.ensureLocationCoordinates({ address: form.startLocation, latitude: null, longitude: null })
        const endLoc = await postPackageService.ensureLocationCoordinates({ address: form.endLocation, latitude: null, longitude: null })

        const response = await postPackageService.calculateRoute({
          startLocation: startLoc,
          endLocation: endLoc,
          expectedPickupDate: toISOStringWithZ(form.pickupDate),
          expectedDeliveryDate: toISOStringWithZ(form.deliveryDate)
        })

        const result = response?.result
        if (!result) throw new Error('Không nhận được kết quả từ server')
        
        setRouteValidation(result)
        if (!result.isValid) setValidationError(result.message || 'Lộ trình không hợp lệ')

      } catch (error: any) {
        console.error(error)
        setValidationError(error?.message || 'Không thể tính toán lộ trình')
      } finally {
        setIsCalculating(false)
      }
    }
    const timer = setTimeout(calculateRoute, 800)
    return () => clearTimeout(timer)
  }, [form.startLocation, form.endLocation, form.pickupDate, form.deliveryDate])

  // --- ACTIONS ---
  const fetchPendingPackages = async () => {
    try {
      const res: any = await packageService.getMyPendingPackages(1, 100)
      const items = res?.result?.data || res?.data || []
      setPackages(items.map((p: any) => ({ id: p.packageId ?? p.id, title: p.title })))
    } catch (e) { console.warn(e) }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  // --- HANDLERS FLOW ---
  const handleGoToContract = async () => {
    if (!form.title || selectedIds.length === 0 || !form.startLocation || !form.endLocation) {
      return Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ thông tin bắt buộc (*)')
    }
    if (!form.senderName || !form.senderPhone || !form.receiverName || !form.receiverPhone) {
        return Alert.alert('Thiếu thông tin', 'Vui lòng điền tên và số điện thoại người liên hệ.')
    }
    
    // Validate date and time
    if (!form.pickupDate || !form.deliveryDate) {
      return Alert.alert('Thiếu thông tin', 'Vui lòng chọn ngày giờ lấy và giao hàng.')
    }
    
    const hasPickupTime = form.pickupDate.includes('T') && form.pickupDate.split('T')[1] !== '00:00:00'
    const hasDeliveryTime = form.deliveryDate.includes('T') && form.deliveryDate.split('T')[1] !== '00:00:00'
    
    if (!hasPickupTime || !hasDeliveryTime) {
      return Alert.alert('Thiếu thông tin', 'Vui lòng chọn cả ngày và giờ cho điểm lấy và điểm giao.')
    }
    
    if (validationError || (routeValidation && !routeValidation.isValid)) {
      return Alert.alert('Lỗi lộ trình', 'Vui lòng kiểm tra lại địa chỉ hoặc thời gian vận chuyển.')
    }

    setLoading(true)
    try {
      const startLoc = await postPackageService.ensureLocationCoordinates({ address: form.startLocation, latitude: null, longitude: null })
      const endLoc = await postPackageService.ensureLocationCoordinates({ address: form.endLocation, latitude: null, longitude: null })

      // Helper: Format time to HH:mm:ss for .NET TimeOnly
      const formatTimeOnly = (time: string | null): string | null => {
        if (!time) return null
        // If already has seconds, return as-is
        if (time.split(':').length === 3) return time
        // Add :00 seconds
        return `${time}:00`
      }

      const createDto: any = {
        title: form.title,
        description: form.description,
        offeredPrice: Number(form.offeredPrice) || 0,
        shippingRoute: {
          startLocation: startLoc,
          endLocation: endLoc,
          expectedPickupDate: toISOStringWithZ(form.pickupDate),
          expectedDeliveryDate: toISOStringWithZ(form.deliveryDate),
          startTimeToPickup: formatTimeOnly(form.startTimeToPickup),
          endTimeToPickup: formatTimeOnly(form.endTimeToPickup),
          startTimeToDelivery: formatTimeOnly(form.startTimeToDelivery),
          endTimeToDelivery: formatTimeOnly(form.endTimeToDelivery)
        },
        senderContact: { 
            fullName: form.senderName, 
            phoneNumber: form.senderPhone, 
            email: form.senderEmail, 
            note: form.senderNote, 
            address: form.startLocation // Auto fill address
        },
        receiverContact: { 
            fullName: form.receiverName, 
            phoneNumber: form.receiverPhone, 
            email: form.receiverEmail, 
            note: form.receiverNote, 
            address: form.endLocation // Auto fill address
        },
        packageIds: selectedIds,
        status: 'AWAITING_SIGNATURE'
      }

      const createResp: any = await postPackageService.createProviderPostPackage(createDto)
      const ok = createResp?.isSuccess ?? (createResp?.statusCode === 201 || createResp?.statusCode === 200)
      if (!ok) throw new Error(createResp?.message || 'Không thể tạo bài đăng')
      
      const pid = createResp?.result?.PostPackageId || createResp?.result?.postPackageId || createResp?.result?.id
      setCreatedPostId(pid)

      try {
        const resp: any = await contractTemplateService.getLatestProviderContract()
        setContractTemplate(resp?.result ?? resp)
      } catch (e) { setContractTemplate(null) }

      setStep(2)
    } catch (e: any) {
      Alert.alert('Lỗi', e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignContract = async () => {
    if (!createdPostId) return
    setLoading(true)
    try {
      await postPackageService.updatePostStatus(createdPostId, 'AWAITING_PAYMENT')
      
      const w: any = await walletService.getMyWallet()
      const myw = w?.result ?? w
      setWallet(myw)
      
      const balance = Number(myw?.balance ?? myw?.Balance ?? 0)
      const amount = Number(form.offeredPrice) || 0
      setSufficientBalance(balance >= amount)

      setStep(3)
    } catch (e: any) {
      Alert.alert('Lỗi', e.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!createdPostId) return
    setPaymentLoading(true)
    try {
      const amount = Number(form.offeredPrice) || 0
      const dto = { 
        amount, 
        type: 'POST_PAYMENT', 
        tripId: null, 
        postId: createdPostId, 
        description: `Thanh toán phí đăng bài` 
      }
      
      const payResp: any = await walletService.createPayment(dto)
      const ok = payResp?.isSuccess ?? (payResp?.statusCode === 200)
      if (!ok) throw new Error(payResp?.message || 'Thanh toán thất bại')

      await postPackageService.updatePostStatus(createdPostId, 'OPEN')
      
      setStep(4)
    } catch (e: any) {
      Alert.alert('Lỗi thanh toán', e.message)
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleClose = () => {
    if (step === 4 && createdPostId) onCreated({ postId: createdPostId })
    onClose()
  }

  const canProceedStep1 = !loading && !isCalculating && form.title && selectedIds.length > 0 && form.startLocation && form.endLocation && form.pickupDate && form.deliveryDate && (!routeValidation || routeValidation.isValid) && form.senderPhone && form.receiverPhone && !phoneErrors.sender && !phoneErrors.receiver && validateVietnamesePhone(form.senderPhone) && validateVietnamesePhone(form.receiverPhone)

  if (!visible) return null

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={step > 1 ? () => setStep(step - 1) : onClose} style={styles.iconBtn}>
            <Ionicons name={step > 1 ? "arrow-back" : "close"} size={24} color={COLORS.textMain} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {step === 1 ? 'Tạo Bài Đăng' : step === 2 ? 'Ký Hợp Đồng' : step === 3 ? 'Thanh Toán' : 'Hoàn Tất'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* STEP INDICATOR */}
        <StepIndicator step={step} />

        {/* CONTENT */}
        <View style={{ flex: 1 }}>
          
          {/* STEP 1: FORM */}
          {step === 1 && (
            <ScrollView
              contentContainerStyle={[styles.scrollContent, { paddingBottom: 220 }]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              nestedScrollEnabled
              bounces={true}
            >
              {/* Thông tin chung */}
              <View style={styles.sectionBox}>
                <Text style={styles.sectionTitle}>📦 Thông tin chung</Text>
                <InputField label="Tiêu đề bài đăng" value={form.title} onChange={(v: string) => handleChange('title', v)} placeholder="VD: Cần chuyển 5 thùng hàng..." required />
                <InputField label="Mô tả chi tiết" value={form.description} onChange={(v: string) => handleChange('description', v)} placeholder="Ghi chú thêm..." multiline />
                <InputField label="Giá đề xuất (VNĐ)" value={formatVND(form.offeredPrice)} onChange={(v: string) => handleChange('offeredPrice', digitsOnly(v))} placeholder="0" keyboardType="numeric" />
              </View>

              {/* Lộ trình */}
              <View style={styles.sectionBox}>
                <Text style={styles.sectionTitle}>📍 Lộ trình vận chuyển</Text>
                <View style={{marginBottom: 12}}>
                  <Text style={styles.label}>Điểm lấy hàng <Text style={{color: COLORS.danger}}>*</Text></Text>
                  <AddressAutocomplete value={form.startLocation} onSelect={(s: any) => handleChange('startLocation', s.display || s.name)} placeholder="Nhập địa chỉ lấy..." />
                </View>
                <View style={{marginBottom: 12}}>
                  <Text style={styles.label}>Điểm giao hàng <Text style={{color: COLORS.danger}}>*</Text></Text>
                  <AddressAutocomplete value={form.endLocation} onSelect={(s: any) => handleChange('endLocation', s.display || s.name)} placeholder="Nhập địa chỉ giao..." />
                </View>
                
                <View style={styles.row}>
                  <View style={{width: '48%'}}><DateTimeInput label="Ngày giờ lấy" value={form.pickupDate} onChange={(d: string) => handleChange('pickupDate', d)} required /></View>
                  <View style={{width: '48%'}}><DateTimeInput label="Ngày giờ giao" value={form.deliveryDate} onChange={(d: string) => handleChange('deliveryDate', d)} required /></View>
                </View>

                {/* Time Ranges (Optional) */}
                <TouchableOpacity 
                  style={styles.optionalToggle}
                  onPress={() => setShowTimeRanges(!showTimeRanges)}
                >
                  <MaterialCommunityIcons 
                    name={showTimeRanges ? "chevron-down" : "chevron-right"} 
                    size={20} 
                    color={COLORS.primary} 
                  />
                  <Text style={styles.optionalToggleText}>
                    Khung giờ cụ thể (Tùy chọn)
                  </Text>
                </TouchableOpacity>

                {showTimeRanges && (
                  <View style={styles.timeRangeContainer}>
                    <View style={styles.timeRangeBox}>
                      <Text style={styles.timeRangeTitle}>⏰ Khung giờ lấy hàng</Text>
                      <View style={styles.row}>
                        <View style={{width: '48%'}}>
                          <TimePickerInput 
                            label="Từ giờ" 
                            value={form.startTimeToPickup} 
                            onChange={(v: string) => handleChange('startTimeToPickup', v)}
                            placeholder="08:00"
                          />
                        </View>
                        <View style={{width: '48%'}}>
                          <TimePickerInput 
                            label="Đến giờ" 
                            value={form.endTimeToPickup} 
                            onChange={(v: string) => handleChange('endTimeToPickup', v)}
                            placeholder="18:00"
                          />
                        </View>
                      </View>
                    </View>

                    <View style={styles.timeRangeBox}>
                      <Text style={styles.timeRangeTitle}>⏰ Khung giờ giao hàng</Text>
                      <View style={styles.row}>
                        <View style={{width: '48%'}}>
                          <TimePickerInput 
                            label="Từ giờ" 
                            value={form.startTimeToDelivery} 
                            onChange={(v: string) => handleChange('startTimeToDelivery', v)}
                            placeholder="08:00"
                          />
                        </View>
                        <View style={{width: '48%'}}>
                          <TimePickerInput 
                            label="Đến giờ" 
                            value={form.endTimeToDelivery} 
                            onChange={(v: string) => handleChange('endTimeToDelivery', v)}
                            placeholder="18:00"
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* Validation Box */}
                {isCalculating && (
                  <View style={styles.validatingBox}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={{marginLeft: 8, color: COLORS.textSec}}>Đang tính toán lộ trình...</Text>
                  </View>
                )}
                
                {routeValidation && !isCalculating && (
                  <View style={[styles.validationBox, routeValidation.isValid ? styles.valSuccess : styles.valError]}>
                    <Ionicons name={routeValidation.isValid ? "checkmark-circle" : "alert-circle"} size={20} color={routeValidation.isValid ? COLORS.success : COLORS.warning} />
                    <View style={{marginLeft: 8, flex: 1}}>
                      <Text style={{fontWeight: '600', color: COLORS.textMain}}>
                        {routeValidation.isValid ? 'Lộ trình hợp lệ ✓' : 'Lộ trình không hợp lệ'}
                      </Text>
                      {routeValidation.message && (
                        <Text style={{fontSize: 12, color: COLORS.textSec, marginTop: 4, lineHeight: 18}}>{routeValidation.message}</Text>
                      )}
                      <View style={{marginTop: 6, gap: 3}}>
                        {routeValidation.estimatedDistanceKm > 0 && (
                          <Text style={{fontSize: 12, color: COLORS.textSec}}>📍 Quãng đường: {routeValidation.estimatedDistanceKm} km</Text>
                        )}
                        {routeValidation.estimatedDurationHours > 0 && (
                          <Text style={{fontSize: 12, color: COLORS.textSec}}>⏱️ Thời gian dự kiến: {routeValidation.estimatedDurationHours}h</Text>
                        )}
                        {routeValidation.travelTimeHours > 0 && (
                          <Text style={{fontSize: 12, color: COLORS.textSec}}>🚚 Thời gian chạy: {routeValidation.travelTimeHours}h</Text>
                        )}
                        {routeValidation.waitTimeHours > 0 && (
                          <Text style={{fontSize: 12, color: COLORS.textSec}}>⏸️ Thời gian chờ: {routeValidation.waitTimeHours}h</Text>
                        )}
                        {routeValidation.suggestedMinDeliveryDate && !routeValidation.isValid && (
                          <Text style={{fontSize: 12, color: COLORS.primary, fontWeight: '600', marginTop: 4}}>
                            💡 Gợi ý: {new Date(routeValidation.suggestedMinDeliveryDate).toLocaleString('vi-VN')}
                          </Text>
                        )}
                        {routeValidation.restrictionNote && (
                          <Text style={{fontSize: 12, color: COLORS.warning, marginTop: 2}}>{routeValidation.restrictionNote}</Text>
                        )}
                      </View>
                    </View>
                  </View>
                )}
                
                {validationError && !isCalculating && (
                  <View style={[styles.validationBox, styles.valError]}>
                    <Ionicons name="warning" size={20} color={COLORS.danger} />
                    <Text style={{marginLeft: 8, color: COLORS.danger, flex: 1}}>{validationError}</Text>
                  </View>
                )}
              </View>

              {/* Thông tin liên hệ */}
              <View style={styles.sectionBox}>
                <Text style={styles.sectionTitle}>📞 Người gửi (Sender)</Text>
                <View style={styles.row}>
                  <InputField width="48%" label="Tên người gửi" value={form.senderName} onChange={(v:string)=>handleChange('senderName',v)} placeholder="Tên..." required/>
                  <InputField 
                    width="48%" 
                    label="SĐT người gửi" 
                    value={form.senderPhone} 
                    onChange={(v:string)=>handleChange('senderPhone',v)} 
                    keyboardType="phone-pad" 
                    placeholder="0912345678" 
                    required
                    error={phoneErrors.sender}
                    onBlur={() => validatePhoneField('sender')}
                  />
                </View>
                <View style={styles.row}>
                  <InputField width="48%" label="Email" value={form.senderEmail} onChange={(v:string)=>handleChange('senderEmail',v)} placeholder="abc@gmail.com" keyboardType="email-address"/>
                  <InputField width="48%" label="Ghi chú" value={form.senderNote} onChange={(v:string)=>handleChange('senderNote',v)} placeholder="Note..." />
                </View>

                <View style={{height: 1, backgroundColor: '#E5E7EB', marginVertical: 12}}/>

                <Text style={styles.sectionTitle}>📞 Người nhận (Receiver)</Text>
                <View style={styles.row}>
                  <InputField width="48%" label="Tên người nhận" value={form.receiverName} onChange={(v:string)=>handleChange('receiverName',v)} placeholder="Tên..." required/>
                  <InputField 
                    width="48%" 
                    label="SĐT người nhận" 
                    value={form.receiverPhone} 
                    onChange={(v:string)=>handleChange('receiverPhone',v)} 
                    keyboardType="phone-pad" 
                    placeholder="0987654321" 
                    required
                    error={phoneErrors.receiver}
                    onBlur={() => validatePhoneField('receiver')}
                  />
                </View>
                <View style={styles.row}>
                  <InputField width="48%" label="Email" value={form.receiverEmail} onChange={(v:string)=>handleChange('receiverEmail',v)} placeholder="abc@gmail.com" keyboardType="email-address"/>
                  <InputField width="48%" label="Ghi chú" value={form.receiverNote} onChange={(v:string)=>handleChange('receiverNote',v)} placeholder="Note..." />
                </View>
              </View>

              {/* Chọn gói hàng */}
              <View style={styles.sectionBox}>
                <Text style={styles.sectionTitle}>📦 Chọn gói hàng ({selectedIds.length}) <Text style={{color: COLORS.danger}}>*</Text></Text>
                {packages.length === 0 ? (
                  <Text style={styles.emptyText}>Bạn chưa có gói hàng nào ở trạng thái chờ.</Text>
                ) : (
                  packages.map(p => {
                    const selected = selectedIds.includes(p.id)
                    return (
                      <TouchableOpacity key={p.id} style={[styles.pkgItem, selected && styles.pkgItemSelected]} onPress={() => toggleSelect(p.id)}>
                        <MaterialCommunityIcons name={selected ? "checkbox-marked" : "checkbox-blank-outline"} size={22} color={selected ? COLORS.primary : COLORS.textSec} />
                        <Text style={[styles.pkgText, selected && {color: COLORS.primary, fontWeight: '600'}]}>{p.title}</Text>
                      </TouchableOpacity>
                    )
                  })
                )}
              </View>
              <View style={{height: 80}} />
            </ScrollView>
          )}

          {/* STEP 2: CONTRACT */}
          {step === 2 && (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.infoBanner}>
                <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.infoText} />
                <View style={{flex: 1, marginLeft: 10}}>
                  <Text style={styles.infoTitle}>Ủy quyền ký tự động</Text>
                  <Text style={styles.infoDesc}>Bạn đồng ý các điều khoản và ủy quyền cho nền tảng tự động tạo hợp đồng với Chủ hàng khi chuyến đi được nhận.</Text>
                </View>
              </View>

              <View style={styles.contractPaper}>
                <Text style={styles.contractHeader}>{contractTemplate?.contractTemplateName || 'HỢP ĐỒNG VẬN TẢI'}</Text>
                <View style={styles.divider} />
                {contractTemplate?.htmlContent && WebView ? (
                  <View style={{height: 300}}>
                    <WebView source={{ html: contractTemplate.htmlContent }} style={{backgroundColor: 'transparent'}} />
                  </View>
                ) : (
                  (contractTemplate?.contractTerms || []).map((t: any, i: number) => (
                    <View key={i} style={{marginBottom: 12}}>
                      <Text style={{fontWeight: '700'}}>Điều {i + 1}:</Text>
                      <Text style={{color: '#374151', textAlign: 'justify'}}>{t.content}</Text>
                    </View>
                  ))
                )}
              </View>

              <Pressable onPress={() => setAcceptedTerms(!acceptedTerms)} style={styles.checkboxContainer}>
                <MaterialCommunityIcons name={acceptedTerms ? "checkbox-marked" : "checkbox-blank-outline"} size={24} color={acceptedTerms ? COLORS.primary : COLORS.textSec} />
                <Text style={{marginLeft: 8, flex: 1, color: COLORS.textMain}}>Tôi đã đọc và đồng ý với các điều khoản.</Text>
              </Pressable>
            </ScrollView>
          )}

          {/* STEP 3: PAYMENT */}
          {step === 3 && (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.invoiceCard}>
                <Text style={styles.invoiceTitle}>HÓA ĐƠN ĐĂNG BÀI</Text>
                <View style={styles.invoiceRow}>
                  <Text style={styles.invLabel}>Dịch vụ:</Text>
                  <Text style={styles.invValue}>Tìm xe vận chuyển</Text>
                </View>
                <View style={styles.invoiceRow}>
                  <Text style={styles.invLabel}>Phí đề xuất:</Text>
                  <Text style={styles.invValue}>{formatVND(form.offeredPrice)} đ</Text>
                </View>
                <View style={styles.dividerDashed} />
                <View style={styles.invoiceRow}>
                  <Text style={styles.invTotalLabel}>TỔNG CỘNG</Text>
                  <Text style={styles.invTotalValue}>{formatVND(form.offeredPrice)} đ</Text>
                </View>

                {/* Wallet Info */}
                <View style={styles.walletInfo}>
                  <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                    <Text style={{color: COLORS.textSec}}>Số dư ví:</Text>
                    <Text style={{fontWeight: '700'}}>{wallet ? formatVND(Number(wallet.balance ?? wallet.Balance ?? 0)) : '---'} đ</Text>
                  </View>
                  {sufficientBalance === false && (
                  <View>
                    <View style={styles.balanceWarning}>
                      <Ionicons name="alert-circle" size={16} color={COLORS.warning} />
                      <Text style={{color: COLORS.warning, marginLeft: 4, fontSize: 13}}>Số dư không đủ. Vui lòng nạp thêm.</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.topupButton}
                      onPress={() => {
                        const amountNeeded = Number(form.offeredPrice) || 0
                        const currentBalance = Number(wallet?.balance ?? wallet?.Balance ?? 0) || 0
                        const deficit = Math.max(0, amountNeeded - currentBalance)
                        // Đóng modal trước khi navigate
                        onClose()
                        // Delay để đảm bảo modal đã đóng hoàn toàn
                        setTimeout(() => {
                          router.push(`/(wallet)/wallet-operations?amount=${deficit}`)
                        }, 300)
                      }}
                    >
                      <MaterialCommunityIcons name="wallet-plus" size={20} color="#fff" />
                      <Text style={styles.topupButtonText}>Nạp tiền ngay</Text>
                    </TouchableOpacity>
                    </View>
                  )}
                  {sufficientBalance === true && (
                    <Text style={{color: COLORS.success, fontSize: 13, marginTop: 4}}>✓ Số dư hợp lệ</Text>
                  )}
                </View>
              </View>
            </ScrollView>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 4 && (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
              <Text style={styles.successTitle}>Đăng bài thành công!</Text>
              <Text style={styles.successDesc}>Bài đăng của bạn đã được kích hoạt. Các tài xế sẽ sớm liên hệ với bạn.</Text>
            </View>
          )}

        </View>

        {/* STICKY FOOTER */}
        <View style={styles.footer}>
          {step === 1 && (
            <View style={{flexDirection: 'row', gap: 10}}>
              <TouchableOpacity style={styles.btnSec} onPress={onClose}><Text style={styles.btnSecText}>Hủy</Text></TouchableOpacity>
              <TouchableOpacity 
                style={[styles.btnPri, (!canProceedStep1) && styles.btnDisabled]} 
                onPress={handleGoToContract} 
                disabled={!canProceedStep1}
              >
                {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.btnPriText}>Tiếp tục</Text>}
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View style={{flexDirection: 'row', gap: 10}}>
              <TouchableOpacity style={styles.btnSec} onPress={() => setStep(1)}><Text style={styles.btnSecText}>Quay lại</Text></TouchableOpacity>
              <TouchableOpacity 
                style={[styles.btnPri, (!acceptedTerms || loading) && styles.btnDisabled]} 
                onPress={handleSignContract}
                disabled={!acceptedTerms || loading}
              >
                {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.btnPriText}>Ký & Tiếp tục</Text>}
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View style={{flexDirection: 'row', gap: 10}}>
              <TouchableOpacity style={styles.btnSec} onPress={() => setStep(2)}><Text style={styles.btnSecText}>Quay lại</Text></TouchableOpacity>
              <TouchableOpacity 
                style={[styles.btnPri, (paymentLoading || sufficientBalance === false) && styles.btnDisabled]} 
                onPress={handlePayment}
                disabled={paymentLoading || sufficientBalance === false}
              >
                {paymentLoading ? <ActivityIndicator color="#fff"/> : <Text style={styles.btnPriText}>Thanh toán</Text>}
              </TouchableOpacity>
            </View>
          )}

          {step === 4 && (
            <TouchableOpacity style={styles.btnPri} onPress={handleClose}>
              <Text style={styles.btnPriText}>Hoàn tất</Text>
            </TouchableOpacity>
          )}
        </View>

      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  fullscreenContainer: { flex: 1, backgroundColor: COLORS.white },
  
  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textMain },
  iconBtn: { padding: 4 },

  // Step Indicator
  stepContainer: { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: '#fff' },
  stepWrapper: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, position: 'relative' },
  stepLineBase: { position: 'absolute', top: 10, left: 40, right: 40, height: 2, backgroundColor: '#E5E7EB', zIndex: -1 },
  stepLineActive: { position: 'absolute', top: 10, left: 40, height: 2, backgroundColor: COLORS.primary, zIndex: -1 },
  stepItem: { alignItems: 'center', backgroundColor: '#fff', width: 60 },
  stepCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  stepCircleActive: { backgroundColor: COLORS.primary },
  stepNum: { fontSize: 10, fontWeight: '700', color: COLORS.textSec },
  stepText: { fontSize: 10, color: COLORS.textSec },
  stepTextActive: { color: COLORS.primary, fontWeight: '700' },

  // Content Area
  scrollContent: { padding: 16, paddingBottom: 100 },
  sectionBox: { backgroundColor: '#fff', marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12, color: COLORS.textMain },
  label: { fontSize: 13, fontWeight: '500', color: COLORS.textMain, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 14, color: COLORS.textMain, backgroundColor: '#fff' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },

  // Package List
  pkgItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginBottom: 8 },
  pkgItemSelected: { borderColor: COLORS.primary, backgroundColor: '#F0F9FF' },
  pkgText: { marginLeft: 10, fontSize: 14, color: COLORS.textMain },
  emptyText: { color: COLORS.textSec, fontStyle: 'italic' },

  // Validation
  validatingBox: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#F9FAFB', borderRadius: 8, marginTop: 8 },
  validationBox: { flexDirection: 'row', padding: 12, borderRadius: 8, marginTop: 8, borderWidth: 1 },
  valSuccess: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  valError: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },

  // Contract
  infoBanner: { flexDirection: 'row', backgroundColor: COLORS.infoBg, padding: 12, borderRadius: 8, marginBottom: 16 },
  infoTitle: { fontWeight: '700', color: COLORS.infoText },
  infoDesc: { fontSize: 13, color: '#0C4A6E', marginTop: 2 },
  contractPaper: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', padding: 16, borderRadius: 4, minHeight: 300, marginBottom: 16, elevation: 2 },
  contractHeader: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 10 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#F9FAFB', borderRadius: 8 },

  // Invoice
  invoiceCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#eee', elevation: 2 },
  invoiceTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 20 },
  invoiceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  invLabel: { color: COLORS.textSec },
  invValue: { fontWeight: '600' },
  dividerDashed: { height: 1, borderWidth: 1, borderColor: '#ccc', borderStyle: 'dashed', marginVertical: 16 },
  invTotalLabel: { fontSize: 16, fontWeight: '700' },
  invTotalValue: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  walletInfo: { marginTop: 20, padding: 12, backgroundColor: '#F9FAFB', borderRadius: 8 },
  balanceWarning: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },

  // Success
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  successTitle: { fontSize: 22, fontWeight: '800', marginTop: 20, marginBottom: 10 },
  successDesc: { textAlign: 'center', color: COLORS.textSec, lineHeight: 22 },

  // Footer
  footer: { padding: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 16, borderTopWidth: 1, borderColor: '#eee', backgroundColor: '#fff' },
  btnPri: { flex: 1, backgroundColor: COLORS.primary, padding: 14, borderRadius: 8, alignItems: 'center' },
  btnPriText: { color: '#fff', fontWeight: '700' },
  btnSec: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', padding: 14, borderRadius: 8, alignItems: 'center' },
  btnSecText: { color: COLORS.textMain, fontWeight: '600' },
  btnDisabled: { backgroundColor: '#9CA3AF', borderColor: '#9CA3AF' },
  
  // Topup Button
  topupButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.warning, padding: 12, borderRadius: 8, marginTop: 12, gap: 6 },
  topupButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  
  // Time Range
  optionalToggle: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, marginTop: 8 },
  optionalToggleText: { fontSize: 14, fontWeight: '600', color: COLORS.primary, marginLeft: 4 },
  timeRangeContainer: { backgroundColor: '#F0F9FF', borderRadius: 8, padding: 12, marginTop: 8, borderWidth: 1, borderColor: '#BFDBFE' },
  timeRangeBox: { marginBottom: 16 },
  timeRangeTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textMain, marginBottom: 8 },
  timeRangeHint: { fontSize: 12, color: COLORS.textSec, fontStyle: 'italic', marginTop: 8, lineHeight: 18 },
  
  // DateTime Picker
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    gap: 8
  },
  dateTimeButtonText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textMain
  },
  
  // Input Error
  inputError: {
    borderColor: COLORS.danger,
    borderWidth: 1.5
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 4,
    marginLeft: 2
  },
  
  // Time Picker
  timePickerButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#D1D5DB', 
    borderRadius: 8, 
    padding: 12, 
    backgroundColor: '#fff'
  },
  timePickerText: { flex: 1, marginLeft: 8, fontSize: 14, color: COLORS.textMain },
  timePickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  timePickerModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10
  },
  timePickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  timePickerModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textMain
  },
  timePickerHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSec,
    textAlign: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  timeOption: { 
    padding: 12, 
    borderRadius: 8, 
    backgroundColor: '#F9FAFB',
    marginBottom: 6,
    alignItems: 'center'
  },
  timeOptionSelected: { backgroundColor: COLORS.primary },
  timeOptionText: { fontSize: 15, color: COLORS.textMain, fontWeight: '600' },
  timeOptionTextSelected: { color: '#fff', fontWeight: '700' },
  timeOptionSmall: {
    padding: 10,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
    marginBottom: 4,
    alignItems: 'center'
  },
  timeOptionTextSmall: { fontSize: 14, color: COLORS.textMain, fontWeight: '500' },
  timePickerDoneBtn: {
    backgroundColor: COLORS.primary,
    margin: 16,
    marginTop: 8,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  timePickerDoneBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  }
})

export default PostFormModal
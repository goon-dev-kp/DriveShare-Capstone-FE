import React, { useEffect, useState, useRef, useMemo } from 'react'
import { 
  View, Text, ScrollView, ActivityIndicator, TouchableOpacity, 
  StyleSheet, Alert, TextInput, Linking, Image, Modal, SafeAreaView, StatusBar 
} from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import tripService from '@/services/tripService'
import tripDeliveryIssueService, { DeliveryIssueType } from '@/services/tripDeliveryIssueService'
import tripSurchargeService, { SurchargeType } from '@/services/tripSurchargeService'
import IssueImagePicker from '@/components/shared/IssueImagePicker'
import { DeliveryRecordDocument } from '@/components/documents/DeliveryRecordDocument'

// Định dạng tiền tệ/số
const formatNumber = (num: number) => num?.toLocaleString('vi-VN') || '0'

// Component hiển thị trạng thái Loading/Error
const StatusView = ({ loading, error, retry }: { loading?: boolean, error?: string | null, retry?: () => void }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
    {loading ? (
      <>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ marginTop: 12, color: '#6B7280' }}>Đang tải văn bản...</Text>
      </>
    ) : (
      <>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={{ marginTop: 12, color: '#EF4444', textAlign: 'center', fontSize: 16 }}>{error}</Text>
        {retry && (
          <TouchableOpacity style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#2563EB', borderRadius: 8 }} onPress={retry}>
            <Text style={{ color: '#FFF', fontWeight: '600' }}>Thử lại</Text>
          </TouchableOpacity>
        )}
      </>
    )}
  </View>
)

const DeliveryRecordScreen = () => {
  const params = useLocalSearchParams() as { recordId?: string; accessToken?: string }
  const recordId = params.recordId
  
  // Lấy accessToken từ params hoặc URL (cho web)
  let accessToken = params.accessToken as string | undefined
  if (!accessToken && typeof window !== 'undefined') {
    const sp = new URLSearchParams(window.location.search)
    accessToken = sp.get('accessToken') || undefined
  }

  // --- State ---
  const [loading, setLoading] = useState(true)
  const [record, setRecord] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  // OTP State
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''))
  const otpRefs = useRef<Array<TextInput | null>>([])
  const [sendingOtp, setSendingOtp] = useState(false)
  const [submittingOtp, setSubmittingOtp] = useState(false)
  const [otpSentTo, setOtpSentTo] = useState<string | null>(null)

  // Issue Report State (for DROPOFF)
  const [showIssueReportModal, setShowIssueReportModal] = useState(false)
  const [issueType, setIssueType] = useState<DeliveryIssueType>(DeliveryIssueType.DAMAGED)
  const [issueDescription, setIssueDescription] = useState('')
  const [issueImages, setIssueImages] = useState<Array<{ uri: string; imageURL: string; fileName: string; type: string }>>([])
  const [submittingIssue, setSubmittingIssue] = useState(false)
  
  // Compensation/Surcharge State
  const [requestCompensation, setRequestCompensation] = useState(false)
  const [compensationAmount, setCompensationAmount] = useState('')
  const [compensationDescription, setCompensationDescription] = useState('')
  
  // Computed formatted display value
  const displayCompensationAmount = useMemo(() => {
    if (!compensationAmount) return ''
    const num = parseFloat(compensationAmount)
    return isNaN(num) ? '' : formatNumber(num)
  }, [compensationAmount])

  // --- Effects ---
  useEffect(() => {
    if (!recordId || !accessToken) {
      setError('Liên kết không hợp lệ. Vui lòng kiểm tra lại email.')
      setLoading(false)
      return
    }
    fetchRecord()
  }, [recordId, accessToken])

  const fetchRecord = async () => {
    setLoading(true)
    setError(null)
    try {
      const res: any = await tripService.getDeliveryRecordForContact(recordId!, accessToken!)
      if (res?.isSuccess) {
        setRecord(res.result)
      } else {
        throw new Error(res?.message || 'Không thể tải dữ liệu')
      }
    } catch (e: any) {
      setError(e.message || 'Lỗi kết nối')
    } finally {
      setLoading(false)
    }
  }

  // --- Handlers ---
  const handleStartSignProcess = async () => {
    if (!recordId || !accessToken) return
    setSendingOtp(true)
    try {
      // Gọi API gửi OTP
      const res: any = await tripService.sendOtpToContact(recordId, accessToken)
      if (res?.isSuccess) {
        setOtpSentTo(res.result?.sentTo || 'email/SĐT của bạn')
        setOtpDigits(Array(6).fill(''))
        setShowOtpModal(true)
        // Auto focus ô đầu tiên sau khi mở modal
        setTimeout(() => otpRefs.current[0]?.focus(), 500)
      } else {
        Alert.alert('Lỗi', res?.message || 'Không thể gửi mã xác thực')
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi gửi OTP')
    } finally {
      setSendingOtp(false)
    }
  }

  const handleOtpChange = (index: number, text: string) => {
    if (!/^\d*$/.test(text)) return // Chỉ nhận số
    const val = text.slice(-1)
    
    setOtpDigits(prev => {
      const newOtp = [...prev]
      newOtp[index] = val
      return newOtp
    })

    // Auto focus next input
    if (val && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpBackspace = (index: number, e: any) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (otpDigits[index] === '' && index > 0) {
        otpRefs.current[index - 1]?.focus()
        setOtpDigits(prev => {
          const newOtp = [...prev]
          newOtp[index - 1] = ''
          return newOtp
        })
      } else {
        setOtpDigits(prev => {
          const newOtp = [...prev]
          newOtp[index] = ''
          return newOtp
        })
      }
    }
  }

  const handleSubmitOtp = async () => {
    const otpCode = otpDigits.join('')
    if (otpCode.length < 6) {
      Alert.alert('Thông báo', 'Vui lòng nhập đủ 6 số OTP')
      return
    }

    setSubmittingOtp(true)
    try {
      const dto = { DeliveryRecordId: recordId!, Otp: otpCode, AccessToken: accessToken! }
      const res: any = await tripService.signDeliveryRecordForContact(dto)
      
      if (res?.isSuccess) {
        Alert.alert('Thành công', 'Bạn đã ký xác nhận thành công!')
        setShowOtpModal(false)
        fetchRecord() // Tải lại để hiện chữ ký
      } else {
        Alert.alert('Thất bại', res?.message || 'Mã OTP không đúng')
        // Clear OTP nếu sai
        setOtpDigits(Array(6).fill(''))
        otpRefs.current[0]?.focus()
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể xác thực OTP lúc này')
    } finally {
      setSubmittingOtp(false)
    }
  }

  // --- Issue Report Handlers (for DROPOFF) ---
  const handleOpenIssueReport = () => {
    if (!record) return
    setIssueType(DeliveryIssueType.DAMAGED)
    setIssueDescription('')
    setIssueImages([])
    setRequestCompensation(false)
    setCompensationAmount('')
    setCompensationDescription('')
    setShowIssueReportModal(true)
  }

  const handleSubmitIssueReport = async () => {
    console.log('🔘 Contact issue report button pressed!')
    
    if (!record || !recordId || !accessToken) {
      console.log('❌ Missing record, recordId or accessToken')
      return
    }
    
    if (!issueDescription.trim()) {
      console.log('❌ Description is empty')
      Alert.alert('Lỗi', 'Vui lòng nhập mô tả sự cố')
      return
    }

    // Validate compensation if requested
    if (requestCompensation) {
      const amount = parseFloat(compensationAmount)
      if (!compensationAmount || isNaN(amount) || amount <= 0) {
        Alert.alert('Lỗi', 'Vui lòng nhập số tiền bồi thường hợp lệ')
        return
      }
      if (!compensationDescription.trim()) {
        Alert.alert('Lỗi', 'Vui lòng nhập lý do yêu cầu bồi thường')
        return
      }
    }

    try {
      setSubmittingIssue(true)
      console.log('✅ Starting contact issue submission...')

      // Step 1: Create issue report
      const issueDto = {
        TripId: record.tripId,
        DeliveryRecordId: recordId,
        IssueType: issueType,
        Description: issueDescription.trim(),
      }

      console.log('📝 Submitting issue report with', issueImages.length, 'images')
      console.log('📦 Issue DTO:', issueDto)
      
      const issueResponse = await tripDeliveryIssueService.reportIssueByContact(issueDto, issueImages, accessToken)
      console.log('📥 Issue Response:', issueResponse)
      
      if (!issueResponse.isSuccess) {
        Alert.alert('Lỗi', issueResponse.message || 'Không thể báo cáo sự cố')
        return
      }

      const createdIssueId = issueResponse.result?.issueId || issueResponse.result?.tripDeliveryIssueId
      console.log('🆔 Created Issue ID:', createdIssueId)
      console.log('✅ Request compensation:', requestCompensation)

      // Step 2: Create compensation claim if requested
      if (requestCompensation && createdIssueId) {
        console.log('💰 Creating compensation claim...')
        console.log('💰 Compensation amount:', compensationAmount)
        console.log('💰 Created issue ID:', createdIssueId)
        console.log('💰 Access token:', accessToken?.substring(0, 30) + '...')
        
        // Map issue type to surcharge type
        const surchargeTypeMap: Record<DeliveryIssueType, SurchargeType> = {
          [DeliveryIssueType.DAMAGED]: SurchargeType.CARGO_DAMAGE,
          [DeliveryIssueType.LOST]: SurchargeType.CARGO_LOSS,
          [DeliveryIssueType.LATE]: SurchargeType.LATE_DELIVERY,
          [DeliveryIssueType.WRONG_ITEM]: SurchargeType.MISDELIVERY,
        }

        const surchargeDto = {
          TripId: record.tripId,
          Type: surchargeTypeMap[issueType],
          Amount: parseFloat(compensationAmount),
          Description: compensationDescription.trim(),
          TripDeliveryIssueId: createdIssueId,
        }

        console.log('📦 Surcharge DTO:', JSON.stringify(surchargeDto, null, 2))
        console.log('📤 Calling API: api/TripSurcharge/contact-create?accessToken=...')
        
        try {
          const surchargeResponse = await tripSurchargeService.createByContact(surchargeDto, accessToken)
          console.log('📥 Surcharge Response:', JSON.stringify(surchargeResponse, null, 2))

          if (surchargeResponse.isSuccess) {
            console.log('✅ Surcharge created successfully!')
            Alert.alert(
              'Thành công', 
              `Đã báo cáo sự cố và yêu cầu bồi thường ${formatNumber(parseFloat(compensationAmount))} VNĐ`
            )
          } else {
            console.log('⚠️ Surcharge creation failed:', surchargeResponse.message)
            Alert.alert(
              'Thành công một phần',
              `Sự cố đã được báo cáo nhưng yêu cầu bồi thường thất bại: ${surchargeResponse.message}`
            )
          }
        } catch (surchargeError: any) {
          console.error('❌ Surcharge API error:', surchargeError)
          console.error('❌ Error details:', JSON.stringify(surchargeError, null, 2))
          Alert.alert(
            'Thành công một phần',
            `Sự cố đã được báo cáo nhưng yêu cầu bồi thường thất bại: ${surchargeError?.message || 'Lỗi không xác định'}`
          )
        }
      } else {
        Alert.alert(
          'Thành công', 
          issueImages.length > 0 
            ? `Đã báo cáo sự cố với ${issueImages.length} ảnh minh chứng`
            : 'Đã báo cáo sự cố thành công'
        )
      }
      
      // Close modal and reset form
      setShowIssueReportModal(false)
      setIssueDescription('')
      setIssueImages([])
      setRequestCompensation(false)
      setCompensationAmount('')
      setCompensationDescription('')
      
      // Refresh delivery record to get updated issues
      console.log('🔄 Refreshing delivery record to get latest issues...')
      await fetchRecord()
      
    } catch (error: any) {
      console.error('❌ Error submitting issue:', error)
      Alert.alert('Lỗi', error?.message || 'Có lỗi khi báo cáo sự cố')
    } finally {
      setSubmittingIssue(false)
    }
  }

  // --- Render Helpers ---
  if (loading || error || !record) return <StatusView loading={loading} error={error} retry={fetchRecord} />

  // Data extraction safely
  const packages = record.tripDetail?.packages || []
  const terms = record.deliveryRecordTemplate?.deliveryRecordTerms || []
  const isSigned = record.contactSigned === true
  const isPickup = record.type === 'PICKUP' // API returns 'type' not 'recordType'

  const driverSigned = record.driverSigned === true 
  // PICKUP: driver ký trước → contact ký sau (phải chờ driver)
  // DROPOFF: contact ký trước → driver ký sau (không cần chờ ai)
  const canContactSign = isPickup ? driverSigned : true
  const showWaitingMessage = isPickup && driverSigned && !isSigned && record.status === 'AWAITING_DELIVERY_RECORD_SIGNATURE'
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#E5E7EB" />
      
      {/* Header Navigation with Refresh Button */}
      <View style={styles.navHeader}>
        <View style={{ width: 40 }} />
        <Text style={styles.navTitle}>Chi Tiết Biên Bản</Text>
        <TouchableOpacity onPress={fetchRecord} disabled={loading} style={{ padding: 4 }}>
          <MaterialCommunityIcons name="refresh" size={24} color={loading ? '#9CA3AF' : '#2563EB'} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Waiting Message Banner - PICKUP only */}
        {showWaitingMessage && (
          <View style={styles.waitingBanner}>
            <MaterialCommunityIcons name="clock-alert-outline" size={24} color="#F59E0B" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.waitingTitle}>Tài xế đã ký biên bản</Text>
              <Text style={styles.waitingText}>Vui lòng kiểm tra và ký xác nhận biên bản giao hàng bên dưới</Text>
            </View>
          </View>
        )}

        {/* --- DELIVERY RECORD DOCUMENT --- */}
        <DeliveryRecordDocument data={record} />
        
        {/* Spacer for footer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* --- FOOTER ACTION BAR --- */}
      <View style={styles.footer}>
        {isSigned ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity 
              style={[styles.btnDownload, { flex: 1 }]}
              onPress={() => {
                  tripService.getDeliveryRecordPdfLink(recordId!)
                  .then((r:any) => {
                      const url = r?.result || r?.url
                      if(url) Linking.openURL(url)
                      else Alert.alert("Thông báo", "Không tìm thấy link PDF")
                  })
                  .catch(() => Alert.alert("Lỗi", "Không thể tải PDF"))
              }}
            >
              <MaterialCommunityIcons name="file-download-outline" size={20} color="#FFF" />
              <Text style={styles.btnTextWhite}>Tải PDF</Text>
            </TouchableOpacity>
            
            {/* No report issue button after signed */}
          </View>
        ) : canContactSign ? (
          // PICKUP chưa ký: Chỉ có button ký (phải đợi driver ký trước)
          // DROPOFF chưa ký: Có button ký + báo cáo sự cố (contact ký trước, không cần đợi)
          isPickup ? (
            <TouchableOpacity 
              style={styles.btnSign}
              onPress={handleStartSignProcess}
              disabled={sendingOtp}
            >
              {sendingOtp ? <ActivityIndicator color="#FFF" /> : <MaterialCommunityIcons name="pencil-outline" size={20} color="#FFF" />}
              <Text style={styles.btnTextWhite}>{sendingOtp ? 'Đang gửi mã...' : 'Ký Xác Nhận (Gửi OTP)'}</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity 
                style={[styles.btnSign, { flex: 1 }]}
                onPress={handleStartSignProcess}
                disabled={sendingOtp}
              >
                {sendingOtp ? <ActivityIndicator color="#FFF" /> : <MaterialCommunityIcons name="pencil-outline" size={20} color="#FFF" />}
                <Text style={styles.btnTextWhite}>{sendingOtp ? 'Đang gửi...' : 'Ký xác nhận'}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.btnReportIssue, { flex: 1 }]}
                onPress={handleOpenIssueReport}
              >
                <MaterialIcons name="report-problem" size={20} color="#DC2626" />
                <Text style={styles.btnReportIssueText}>Báo cáo sự cố</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          <View style={styles.btnDisabled}>
            <MaterialCommunityIcons name="lock-outline" size={20} color="#9CA3AF" />
            <Text style={styles.btnTextDisabled}>Đợi tài xế ký trước</Text>
          </View>
        )}
      </View>

      {/* --- OTP MODAL --- */}
      <Modal 
        visible={showOtpModal} 
        transparent 
        animationType="fade" 
        onRequestClose={() => {
          if (!submittingOtp) setShowOtpModal(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Xác thực OTP</Text>
              <TouchableOpacity onPress={() => setShowOtpModal(false)} disabled={submittingOtp}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {/* Loading Overlay khi đang submit OTP */}
            {submittingOtp && (
              <View style={styles.loadingOverlay}>
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color="#2563EB" />
                  <Text style={styles.loadingText}>Đang xác thực...</Text>
                </View>
              </View>
            )}
            
            <View style={styles.modalBody}>
              <Text style={styles.otpInstruction}>
                Mã xác thực đã được gửi đến <Text style={{fontWeight: 'bold'}}>{otpSentTo}</Text>.
                Vui lòng kiểm tra và nhập mã 6 số bên dưới để ký tên.
              </Text>

              <View style={styles.otpInputContainer}>
                {otpDigits.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={ref => { otpRefs.current[index] = ref }}
                    style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    onChangeText={(text) => handleOtpChange(index, text)}
                    onKeyPress={(e) => handleOtpBackspace(index, e)}
                    selectTextOnFocus
                    editable={!submittingOtp}
                  />
                ))}
              </View>

              <TouchableOpacity 
                style={[
                  styles.btnSubmitOtp, 
                  (submittingOtp || otpDigits.join('').length !== 6) && { opacity: 0.6 }
                ]}
                onPress={handleSubmitOtp}
                disabled={submittingOtp || otpDigits.join('').length !== 6}
              >
                {submittingOtp ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnTextWhite}>Xác Nhận & Ký Tên</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.btnResend} onPress={handleStartSignProcess} disabled={sendingOtp || submittingOtp}>
                {sendingOtp ? (
                  <ActivityIndicator color="#2563EB" size="small" />
                ) : (
                  <Text style={styles.btnResendText}>Chưa nhận được mã? Gửi lại</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- ISSUE REPORT MODAL (FOR DROPOFF) --- */}
      <Modal visible={showIssueReportModal} transparent animationType="slide" onRequestClose={() => setShowIssueReportModal(false)}>
        <View style={styles.issueModalBackdrop}>
          <View style={styles.issueModalContainer}>
            <View style={styles.issueModalHeader}>
              <Text style={styles.issueModalTitle}>Báo Cáo Sự Cố</Text>
              <TouchableOpacity onPress={() => setShowIssueReportModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.issueModalBody} showsVerticalScrollIndicator={false}>
              {/* Issue Type Selection */}
              <Text style={styles.issueLabel}>Loại sự cố:</Text>
              <View style={styles.issueTypeGrid}>
                {Object.values(DeliveryIssueType).map((type) => {
                  const labels: Record<string, string> = {
                    DAMAGED: 'Hàng hư hỏng',
                    LOST: 'Mất hàng',
                    LATE: 'Giao muộn',
                    WRONG_ITEM: 'Nhầm hàng',
                  };
                  const icons: Record<string, string> = {
                    DAMAGED: 'broken-image',
                    LOST: 'report-off',
                    LATE: 'schedule',
                    WRONG_ITEM: 'swap-horiz',
                  };
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.issueTypeCard,
                        issueType === type && styles.issueTypeCardActive,
                      ]}
                      onPress={() => setIssueType(type)}
                    >
                      <MaterialIcons
                        name={icons[type] as any}
                        size={32}
                        color={issueType === type ? '#DC2626' : '#6B7280'}
                      />
                      <Text style={[
                        styles.issueTypeLabel,
                        issueType === type && styles.issueTypeLabelActive,
                      ]}>
                        {labels[type]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Description Input */}
              <Text style={styles.issueLabel}>Mô tả chi tiết:</Text>
              <TextInput
                style={styles.issueDescInput}
                placeholder="Nhập mô tả sự cố (bắt buộc)"
                value={issueDescription}
                onChangeText={setIssueDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* Image Upload */}
              <Text style={styles.issueLabel}>Ảnh minh chứng (tùy chọn):</Text>
              <IssueImagePicker
                images={issueImages}
                onImagesChange={setIssueImages}
                maxImages={5}
              />

              {/* Compensation Request Section */}
              <View style={styles.compensationSection}>
                <TouchableOpacity 
                  style={styles.checkboxRow}
                  onPress={() => setRequestCompensation(!requestCompensation)}
                >
                  <View style={[styles.checkbox, requestCompensation && styles.checkboxChecked]}>
                    {requestCompensation && <MaterialIcons name="check" size={18} color="#FFF" />}
                  </View>
                  <Text style={styles.checkboxLabel}>Yêu cầu bồi thường</Text>
                </TouchableOpacity>

                {requestCompensation && (
                  <View style={styles.compensationForm}>
                    <Text style={styles.issueLabel}>Số tiền yêu cầu (VNĐ):</Text>
                    <TextInput
                      style={styles.compensationInput}
                      placeholder="Nhập số tiền bồi thường"
                      value={displayCompensationAmount}
                      onChangeText={(text) => {
                        // Remove all non-numeric characters
                        const numericValue = text.replace(/[^0-9]/g, '')
                        setCompensationAmount(numericValue)
                      }}
                      keyboardType="numeric"
                    />

                    <Text style={styles.issueLabel}>Lý do yêu cầu bồi thường:</Text>
                    <TextInput
                      style={styles.issueDescInput}
                      placeholder="Nhập lý do chi tiết (bắt buộc)"
                      value={compensationDescription}
                      onChangeText={setCompensationDescription}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />

                    <View style={styles.compensationNote}>
                      <MaterialIcons name="info-outline" size={16} color="#F59E0B" />
                      <Text style={styles.compensationNoteText}>
                        Yêu cầu bồi thường sẽ được xem xét dựa trên sự cố đã báo cáo
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.issueModalFooter}>
              <TouchableOpacity
                style={[styles.btnSecondary, { flex: 1 }]}
                onPress={() => setShowIssueReportModal(false)}
                disabled={submittingIssue}
              >
                <Text style={styles.btnSecondaryText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.btnPrimary,
                  { flex: 1 },
                  (!issueDescription.trim() || submittingIssue) && styles.btnPrimaryDisabled,
                ]}
                onPress={handleSubmitIssueReport}
                disabled={!issueDescription.trim() || submittingIssue}
              >
                {submittingIssue ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.btnPrimaryText}>
                    {requestCompensation ? 'Gửi & Yêu cầu bồi thường' : 'Gửi báo cáo'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#E5E7EB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  navHeader: { padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navTitle: { fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center', flex: 1 },
  scrollContent: { padding: 16 },
  
  // Waiting Banner
  waitingBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  waitingTitle: { fontSize: 14, fontWeight: '800', color: '#92400E', marginBottom: 4 },
  waitingText: { fontSize: 12, color: '#78350F', lineHeight: 18 },
  
  // Footer
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', padding: 16, borderTopWidth: 1, borderColor: '#E5E7EB', elevation: 10 },
  btnSign: { flexDirection: 'row', backgroundColor: '#2563EB', padding: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnDownload: { flexDirection: 'row', backgroundColor: '#059669', padding: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnReportIssue: { flexDirection: 'row', backgroundColor: '#FFF', padding: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 2, borderColor: '#DC2626' },
  btnReportIssueText: { color: '#DC2626', fontWeight: '700', fontSize: 16 },
  btnDisabled: { flexDirection: 'row', backgroundColor: '#F3F4F6', padding: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  btnTextWhite: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  btnTextDisabled: { color: '#9CA3AF', fontWeight: '700', fontSize: 16 },

  // Modal OTP
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, width: '100%', maxWidth: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  modalBody: { alignItems: 'center' },
  otpInstruction: { textAlign: 'center', color: '#4B5563', marginBottom: 24, lineHeight: 20 },
  otpInputContainer: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  otpBox: { width: 48, height: 56, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', textAlign: 'center', fontSize: 24, fontWeight: '700', color: '#1F2937', backgroundColor: '#F9FAFB' },
  otpBoxFilled: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  btnSubmitOtp: { width: '100%', backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 16 },
  btnResend: { padding: 10 },
  btnResendText: { color: '#2563EB', fontWeight: '600' },

  // Loading Overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },

  // Issue Report Modal
  issueModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  issueModalContainer: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, width: '100%', maxWidth: 500, maxHeight: '90%' },
  issueModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  issueModalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  issueModalBody: { flex: 1 },
  issueLabel: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8, marginTop: 12 },
  issueTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  issueTypeCard: { width: '47%', padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', alignItems: 'center' },
  issueTypeCardActive: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  issueTypeLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginTop: 8, textAlign: 'center' },
  issueTypeLabelActive: { color: '#DC2626', fontWeight: '700' },
  issueDescInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 14, color: '#1F2937', backgroundColor: '#F9FAFB', minHeight: 100 },
  issueModalFooter: { flexDirection: 'row', gap: 12, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderColor: '#E5E7EB' },
  btnSecondary: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#D1D5DB' },
  btnSecondaryText: { color: '#374151', fontWeight: '700', fontSize: 16 },
  btnPrimary: { paddingVertical: 14, borderRadius: 10, alignItems: 'center', backgroundColor: '#DC2626' },
  btnPrimaryDisabled: { backgroundColor: '#9CA3AF', opacity: 0.6 },
  btnPrimaryText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  
  // Compensation Section
  compensationSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#D1D5DB', backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  checkboxChecked: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  checkboxLabel: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  compensationForm: { marginTop: 8, backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#FEE2E2' },
  compensationInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 16, color: '#1F2937', backgroundColor: '#FFF', fontWeight: '700' },
  compensationNote: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF3C7', padding: 10, borderRadius: 6, marginTop: 8 },
  compensationNoteText: { flex: 1, fontSize: 12, color: '#78350F', lineHeight: 16 },
})

export default DeliveryRecordScreen
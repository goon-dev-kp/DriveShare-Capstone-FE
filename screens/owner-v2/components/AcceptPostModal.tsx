import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native'
import Modal from '@/components/Modal'
import vehicleService from '@/services/vehicleService'
import tripService from '@/services/tripService'
import { FreightPost, Vehicle } from '@/models/types'

interface ContactInput {
  fullName: string
  phoneNumber: string
  email?: string
  note?: string
}

interface Props {
  isOpen: boolean
  post?: FreightPost | null
  onClose: () => void
  onSuccess?: () => void
}

const AcceptPostModal: React.FC<Props> = ({ isOpen, post, onClose, onSuccess }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [vehicleId, setVehicleId] = useState<string | null>(null)
  const [totalFare, setTotalFare] = useState<string>('')

  const [sender, setSender] = useState<ContactInput>({ fullName: '', phoneNumber: '', email: '', note: '' })
  const [receiver, setReceiver] = useState<ContactInput>({ fullName: '', phoneNumber: '', email: '', note: '' })

  useEffect(() => {
    if (isOpen) {
      loadVehicles()
      // reset form
      setVehicleId(null)
      setTotalFare('')
      setSender({ fullName: '', phoneNumber: '', email: '', note: '' })
      setReceiver({ fullName: '', phoneNumber: '', email: '', note: '' })
    }
  }, [isOpen])

  const loadVehicles = async () => {
    setLoadingVehicles(true)
    try {
      const res: any = await vehicleService.getMyVehicles({ pageNumber: 1, pageSize: 100 })
      const payload = res?.result ?? res
      const items = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []
      // map to Vehicle interface lightly
      const mapped: Vehicle[] = items.map((v: any) => ({
        id: v.vehicleId ?? v.id ?? v.vehicleId,
        plateNumber: v.plateNumber ?? v.PlateNumber ?? v.plate ?? '',
        model: v.model ?? v.Model ?? undefined,
        brand: v.brand ?? v.Brand ?? undefined,
      }))
      setVehicles(mapped)
      if (mapped.length > 0) setVehicleId(mapped[0].id)
    } catch (e) {
      console.warn('loadVehicles failed', e)
      Alert.alert('Lỗi', 'Không thể tải xe của bạn')
    } finally {
      setLoadingVehicles(false)
    }
  }

  const validate = () => {
    if (!vehicleId) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn xe')
      return false
    }
    const fare = parseFloat(totalFare)
    if (isNaN(fare) || fare <= 0) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tổng tiền hợp lệ')
      return false
    }
    if (!sender.fullName || !sender.phoneNumber) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền thông tin người gửi')
      return false
    }
    if (!receiver.fullName || !receiver.phoneNumber) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền thông tin người nhận')
      return false
    }
    if (!post) {
      Alert.alert('Lỗi', 'Không có bài đăng')
      return false
    }
    if (!post.shippingRouteId && !post.id) {
      Alert.alert('Lỗi', 'Bài đăng thiếu ShippingRouteId')
      return false
    }
    if (!post.providerId) {
      Alert.alert('Lỗi', 'Bài đăng thiếu ProviderId')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      const payload = {
        VehicleId: vehicleId,
        TotalFare: parseFloat(totalFare),
        ShippingRouteId: post?.shippingRouteId ?? post?.id,
        ProviderId: post?.providerId,
        SenderContact: {
          FullName: sender.fullName,
          PhoneNumber: sender.phoneNumber,
          Email: sender.email || undefined,
          Note: sender.note || undefined,
        },
        ReceiverContact: {
          FullName: receiver.fullName,
          PhoneNumber: receiver.phoneNumber,
          Email: receiver.email || undefined,
          Note: receiver.note || undefined,
        },
      }

      await tripService.createForOwner(payload)
      Alert.alert('Thành công', 'Yêu cầu nhận package đã được gửi')
      onSuccess?.()
      onClose()
    } catch (e: any) {
      console.error('createForOwner error', e)
      const msg = e?.response?.data?.message ?? e?.message ?? 'Gặp lỗi khi gửi yêu cầu'
      Alert.alert('Lỗi', msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Nhận gói hàng`}>
<ScrollView style={{ maxHeight: 520 }}>
<View style={styles.row}>
<Text style={styles.label}>Chọn xe</Text>
          {loadingVehicles ? (
            <ActivityIndicator />
          ) : (
            <View style={styles.pickerContainer}>
              {vehicles.length === 0 ? (
                <Text style={styles.helper}>Bạn chưa thêm xe nào</Text>
              ) : (
                vehicles.map((v) => (
                  <TouchableOpacity key={v.id} onPress={() => setVehicleId(v.id)} style={[styles.vehicleOption, vehicleId === v.id ? styles.vehicleOptionActive : null]}>
<Text style={styles.vehicleText}>{v.plateNumber || v.id}</Text>
<Text style={styles.vehicleSub}>{v.brand ?? ''} {v.model ?? ''}</Text>
</TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>
<View style={styles.row}>
<Text style={styles.label}>Tổng tiền (VND)</Text>
<TextInput value={totalFare} onChangeText={setTotalFare} keyboardType="numeric" style={styles.input} placeholder="0" />
</View>
<View style={styles.section}>
<Text style={styles.sectionTitle}>Thông tin người gửi</Text>
<TextInput style={styles.input} placeholder="Họ và tên" value={sender.fullName} onChangeText={(t) => setSender((s) => ({ ...s, fullName: t }))} />
<TextInput style={styles.input} placeholder="Số điện thoại" value={sender.phoneNumber} onChangeText={(t) => setSender((s) => ({ ...s, phoneNumber: t }))} keyboardType="phone-pad" />
<TextInput style={styles.input} placeholder="Email (không bắt buộc)" value={sender.email} onChangeText={(t) => setSender((s) => ({ ...s, email: t }))} keyboardType="email-address" />
<TextInput style={styles.input} placeholder="Ghi chú (không bắt buộc)" value={sender.note} onChangeText={(t) => setSender((s) => ({ ...s, note: t }))} />
</View>
<View style={styles.section}>
<Text style={styles.sectionTitle}>Thông tin người nhận</Text>
<TextInput style={styles.input} placeholder="Họ và tên" value={receiver.fullName} onChangeText={(t) => setReceiver((s) => ({ ...s, fullName: t }))} />
<TextInput style={styles.input} placeholder="Số điện thoại" value={receiver.phoneNumber} onChangeText={(t) => setReceiver((s) => ({ ...s, phoneNumber: t }))} keyboardType="phone-pad" />
<TextInput style={styles.input} placeholder="Email (không bắt buộc)" value={receiver.email} onChangeText={(t) => setReceiver((s) => ({ ...s, email: t }))} keyboardType="email-address" />
<TextInput style={styles.input} placeholder="Ghi chú (không bắt buộc)" value={receiver.note} onChangeText={(t) => setReceiver((s) => ({ ...s, note: t }))} />
</View>
<View style={styles.actions}>
<TouchableOpacity onPress={onClose} style={[styles.btn, styles.btnCancel]} disabled={submitting}>
<Text style={styles.btnText}>Hủy</Text>
</TouchableOpacity>
<TouchableOpacity onPress={handleSubmit} style={[styles.btn, styles.btnPrimary]} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={[styles.btnText, { color: '#fff' }]}>Xác nhận</Text>}
          </TouchableOpacity>
</View>
</ScrollView>
</Modal>
  )
}

const styles = StyleSheet.create({
  row: { marginBottom: 12 },
  label: { fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', padding: 10, borderRadius: 8, marginBottom: 8 },
  section: { marginTop: 8, marginBottom: 8 },
  sectionTitle: { fontWeight: '700', marginBottom: 8 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 },
  btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  btnCancel: { backgroundColor: '#F3F4F6', marginRight: 8 },
  btnPrimary: { backgroundColor: '#059669' },
  btnText: { fontWeight: '700' },
  pickerContainer: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 8 },
  vehicleOption: { padding: 8, borderRadius: 6, marginBottom: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F3F4F6' },
  vehicleOptionActive: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  vehicleText: { fontWeight: '600' },
  vehicleSub: { color: '#6B7280', fontSize: 12 },
  helper: { color: '#6B7280' },
})

export default AcceptPostModal

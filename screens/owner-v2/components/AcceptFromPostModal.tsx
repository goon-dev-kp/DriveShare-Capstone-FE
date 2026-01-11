import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native'
import Modal from '@/components/Modal'
import vehicleService from '@/services/vehicleService'
import tripService from '@/services/tripService'
import { Vehicle, FreightPost } from '@/models/types'

interface Props {
  isOpen: boolean
  post?: FreightPost | null
  onClose: () => void
  onSuccess?: () => void
}

const AcceptFromPostModal: React.FC<Props> = ({ isOpen, post, onClose, onSuccess }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) loadVehicles()
    else {
      setVehicles([])
      setSelectedVehicle(null)
    }
  }, [isOpen])

  const loadVehicles = async () => {
    setLoading(true)
    try {
      const res: any = await vehicleService.getMyActiveVehicles(1, 100)
      const payload = res?.result ?? res
      const items = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []
      const mapped: Vehicle[] = items.map((v: any) => ({
        id: v.vehicleId ?? v.VehicleId ?? v.id,
        plateNumber: v.plateNumber ?? v.PlateNumber ?? '',
        model: v.model ?? v.Model ?? undefined,
        brand: v.brand ?? v.Brand ?? undefined,
      }))
      setVehicles(mapped)
      if (mapped.length > 0) setSelectedVehicle(mapped[0].id)
    } catch (e) {
      console.warn('load active vehicles failed', e)
      Alert.alert('Lỗi', 'Không thể tải xe đang hoạt động')
    } finally { setLoading(false) }
  }

  const handleConfirm = async () => {
    if (!post) return Alert.alert('Lỗi', 'Không có bài đăng')
    if (!selectedVehicle) return Alert.alert('Chọn xe', 'Vui lòng chọn xe')
    setSubmitting(true)
    try {
      const resp: any = await tripService.createFromPost({ PostPackageId: post.id, VehicleId: selectedVehicle })
      // Backend may return a payload with isSuccess flag instead of throwing.
      if (resp && resp.isSuccess === false) {
        const msg = resp.message ?? 'Lỗi khi nhận bài đăng'
        Alert.alert('Lỗi khi nhận chuyến', msg)
      } else {
        Alert.alert('Thành công', 'Bài đăng đã được nhận và Trip được tạo')
        onSuccess?.()
        onClose()
      }
    } catch (e: any) {
      console.error('createFromPost error', e)
      const msg = e?.response?.data?.message ?? e?.message ?? 'Lỗi khi nhận bài đăng'
      Alert.alert('Lỗi', msg)
    } finally { setSubmitting(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Nhận bài đăng`}>
<ScrollView>
<View style={{ minHeight: 120 }}>
<Text style={styles.label}>Bài: {post?.title}</Text>
<Text style={styles.sub}>{post?.packageDetails?.title}</Text>
</View>
<View style={{ marginTop: 12 }}>
<Text style={styles.label}>Chọn xe (xe đang hoạt động)</Text>
          {loading ? (
            <ActivityIndicator />
          ) : (
            vehicles.map((v) => (
              <TouchableOpacity key={v.id} onPress={() => setSelectedVehicle(v.id)} style={[styles.vehicle, selectedVehicle === v.id ? styles.vehicleActive : null]}>
<Text style={styles.plate}>{v.plateNumber || v.id}</Text>
<Text style={styles.brand}>{v.brand ?? ''} {v.model ?? ''}</Text>
</TouchableOpacity>
            ))
          )}
        </View>
<View style={styles.actions}>
<TouchableOpacity onPress={onClose} style={[styles.btn, styles.btnCancel]} disabled={submitting}><Text>Hủy</Text></TouchableOpacity>
<TouchableOpacity onPress={handleConfirm} style={[styles.btn, styles.btnPrimary]} disabled={submitting}>{submitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff' }}>Nhận</Text>}</TouchableOpacity>
</View>
</ScrollView>
</Modal>
  )
}

const styles = StyleSheet.create({
  label: { fontWeight: '700' },
  sub: { color: '#6B7280' },
  vehicle: { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#F3F4F6', marginVertical: 6 },
  vehicleActive: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  plate: { fontWeight: '700' },
  brand: { color: '#6B7280' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
  btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  btnCancel: { backgroundColor: '#F3F4F6' },
  btnPrimary: { backgroundColor: '#059669' },
})

export default AcceptFromPostModal

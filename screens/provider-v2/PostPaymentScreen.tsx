import React, { useEffect, useState } from 'react'
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, ScrollView, SafeAreaView } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import postPackageService from '@/services/postPackageService'
import walletService from '@/services/walletService'

const PostPaymentScreen: React.FC = () => {
  const params: any = useLocalSearchParams()
  const router = useRouter()
  const postId = params.postId as string | undefined
  const [loading, setLoading] = useState(false)
  const [post, setPost] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [modalVisible, setModalVisible] = useState(true)

  useEffect(() => { if (postId) { fetchDetails(); fetchWallet() } }, [postId])

  const fetchDetails = async () => {
    try {
      const res: any = await postPackageService.getPostPackageDetails(postId!)
      setPost(res?.result ?? res)
    } catch (e) { console.warn(e) }
  }

  const fetchWallet = async () => {
    try {
      const w: any = await walletService.getMyWallet()
      setWallet(w?.result ?? w)
    } catch (e) { console.warn(e) }
  }

  const handlePay = async () => {
    if (!post) return
    const amount = Number(post.offeredPrice || post.OfferedPrice || 0)
    Alert.alert('Xác nhận', `Thanh toán ${amount.toLocaleString('vi-VN')} VND cho bài đăng?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Thanh toán', onPress: async () => {
        setLoading(true)
        try {
          const dto = { amount, type: 'POST_PAYMENT', tripId: null, postId, description: `Thanh toán bài đăng ${postId}` }
          const resp: any = await walletService.createPayment(dto)
          const ok = resp?.isSuccess ?? (resp?.statusCode === 200 || resp?.statusCode === 201)
          if (!ok) throw new Error(resp?.message || 'Thanh toán thất bại')
          Alert.alert('Thành công', 'Thanh toán thành công')
          setModalVisible(false)
          router.back()
        } catch (e: any) { Alert.alert('Lỗi', e?.message || 'Thất bại') } finally { setLoading(false) }
      }}
    ])
  }

  return (
    <Modal visible={modalVisible} animationType="slide" onRequestClose={() => { setModalVisible(false); router.back() }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Thanh toán bài đăng</Text>
          <TouchableOpacity onPress={() => { setModalVisible(false); router.back() }}>
            <Text style={{ color: '#0284C7', fontWeight: '700' }}>Đóng</Text>
          </TouchableOpacity>
        </View>

        {(!post || !wallet) ? <ActivityIndicator size="large" color="#0284C7" style={{ marginTop: 40 }} /> : (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
            <Text style={{ fontSize: 16, fontWeight: '700' }}>{post.title}</Text>
            <Text style={{ marginTop: 8, color: '#6B7280' }}>Số dư ví: {(wallet.balance ?? wallet.Balance ?? 0).toLocaleString('vi-VN')} VND</Text>
            <Text style={{ marginTop: 8 }}>Số tiền cần: {(post.offeredPrice ?? post.OfferedPrice ?? 0).toLocaleString('vi-VN')} VND</Text>

            <View style={{ marginTop: 16 }}>
              <TouchableOpacity style={styles.btnPrimary} onPress={handlePay} disabled={loading}>
                <Text style={styles.btnText}>{loading ? 'Đang xử lý...' : 'Thanh toán bằng ví'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#E5E7EB' },
  title: { fontSize: 20, fontWeight: '700' },
  btnPrimary: { marginTop: 24, backgroundColor: '#0284C7', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' }
})

export default PostPaymentScreen

import React, { useEffect, useState } from 'react'
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import walletService from '@/services/walletService'

export default function WalletSetupScreen() {
  const params = useLocalSearchParams() as Record<string, string | undefined>
  const redirect = params.redirect
  const amount = params.amount
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const needed = Number(amount || 0)

  const checkWalletAndRoute = async () => {
    setLoading(true)
    try {
      const res: any = await walletService.getMyWallet()
      const ok = res?.isSuccess ?? res?.statusCode === 200
      const wallet = res?.result || res?.data
      if (ok && wallet) {
        const balance = Number(wallet.balance ?? wallet.Balance ?? 0)
        if (needed > 0 && balance < needed) {
          router.replace({ pathname: '/(wallet)/topup', params: { amount: String(needed - balance), redirect } } as any)
        } else if (redirect) {
          router.replace(decodeURIComponent(redirect))
        } else {
          Alert.alert('Ví đã tồn tại', 'Ví của bạn đã sẵn sàng.')
        }
        return
      }
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { checkWalletAndRoute() }, [])

  const handleCreateWallet = async () => {
    setCreating(true)
    try {
      const res: any = await walletService.create()
      const ok = res?.isSuccess ?? res?.statusCode === 200
      if (!ok) throw new Error(res?.message || 'Tạo ví thất bại')
      Alert.alert('Tạo ví', 'Tạo ví thành công')
      // After creating, navigate to topup with needed amount if provided
      if (needed > 0) {
        router.replace({ pathname: '/(wallet)/topup', params: { amount: String(needed), redirect } } as any)
      } else if (redirect) {
        router.replace(decodeURIComponent(redirect))
      }
    } catch (e: any) {
      Alert.alert('Tạo ví', e?.message || 'Không thể tạo ví. Vui lòng liên hệ hỗ trợ.')
    } finally { setCreating(false) }
  }

  return (
    <SafeAreaView style={styles.container}>
<View style={styles.card}>
<Text style={styles.title}>Tạo ví điện tử</Text>
<Text style={styles.subtitle}>Bạn chưa có ví. Hãy tạo ví để nạp tiền và thanh toán.</Text>
        {loading ? (
          <View style={styles.center}><ActivityIndicator color="#4F46E5" /></View>
        ) : (
          <>
            {needed > 0 && (
              <View style={styles.infoBox}>
<Text style={styles.infoText}>Số tiền cần cho giao dịch: <Text style={styles.bold}>{needed.toLocaleString('vi-VN')} VND</Text></Text>
</View>
            )}
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleCreateWallet} disabled={creating}>
              {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Tạo ví</Text>}
            </TouchableOpacity>
<TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={checkWalletAndRoute}>
<Text style={[styles.btnText, { color: '#111827' }]}>Tôi đã có ví</Text>
</TouchableOpacity>
</>
        )}
      </View>
</SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 16 },
  title: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 6 },
  subtitle: { color: '#6B7280', marginBottom: 16 },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  infoBox: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 12 },
  infoText: { color: '#374151' },
  bold: { fontWeight: '800', color: '#111827' },
  btn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  btnPrimary: { backgroundColor: '#2563EB' },
  btnGhost: { backgroundColor: '#E5E7EB' },
  btnText: { fontWeight: '700', color: '#fff' },
})

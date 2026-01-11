import React, { useEffect, useState } from 'react'
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import walletService from '@/services/walletService'

export default function WalletTopupScreen() {
  const params = useLocalSearchParams() as Record<string, string | undefined>
  const amount = params.amount
  const redirect = params.redirect
  const router = useRouter()
  const [checking, setChecking] = useState(false)
  const [amountStr, setAmountStr] = useState(String(amount || '0'))
  const [topping, setTopping] = useState(false)

  const parseAmount = () => Math.max(0, Math.floor(Number(amountStr || '0')))

  const handleTopup = async () => {
    const amt = Math.floor(Number(amountStr || '0'))
    if (!amt || amt <= 0) {
      return Alert.alert('Nạp tiền', 'Số tiền không hợp lệ.')
    }
    setTopping(true)
    try {
      const res: any = await walletService.topup(amt, 'Top-up qua ứng dụng')
      const ok = res?.isSuccess ?? res?.statusCode === 200
      if (!ok) throw new Error(res?.message || 'Nạp tiền thất bại')
      Alert.alert('Nạp tiền', 'Nạp tiền thành công')
      // After success, verify target balance and go back if redirect
      await handleCheckAndReturn()
    } catch (e: any) {
      Alert.alert('Nạp tiền', e?.message || 'Không thể nạp tiền')
    } finally { setTopping(false) }
  }

  const handleCheckAndReturn = async () => {
    setChecking(true)
    try {
      const needed = parseAmount()
      const res: any = await walletService.getMyWallet()
      const ok = res?.isSuccess ?? res?.statusCode === 200
      const wallet = res?.result || res?.data
      if (!ok || !wallet) throw new Error('Không lấy được số dư ví')
      const balance = Number(wallet.balance ?? wallet.Balance ?? 0)
      if (needed > 0 && balance < needed) {
        Alert.alert('Chưa đủ số dư', `Số dư hiện tại ${balance.toLocaleString('vi-VN')} VND, cần thêm ${(needed - balance).toLocaleString('vi-VN')} VND.`)
        return
      }
      if (redirect) {
        router.replace(decodeURIComponent(redirect))
      } else {
        Alert.alert('Đã nạp tiền', 'Bạn có thể quay lại thao tác.')
      }
    } catch (e: any) {
      Alert.alert('Kiểm tra ví', e?.message || 'Không kiểm tra được ví')
    } finally { setChecking(false) }
  }

  return (
    <SafeAreaView style={styles.container}>
<View style={styles.card}>
<Text style={styles.title}>Nạp tiền vào ví</Text>
<Text style={styles.subtitle}>Nhập số tiền cần nạp, sau đó tiến hành nạp bằng phương thức ưa thích.</Text>
<View style={styles.amountRow}>
<TextInput value={amountStr} onChangeText={setAmountStr} keyboardType="numeric" style={styles.amountInput} />
<Text style={styles.currency}>VND</Text>
</View>
<TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleTopup} disabled={topping}>
          {topping ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Nạp tiền</Text>}
        </TouchableOpacity>
<TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={handleCheckAndReturn} disabled={checking}>
          {checking ? <ActivityIndicator color="#111827" /> : <Text style={[styles.btnText, { color: '#111827' }]}>Đã nạp xong, kiểm tra</Text>}
        </TouchableOpacity>
</View>
</SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 16 },
  title: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 6 },
  subtitle: { color: '#6B7280', marginBottom: 16 },
  amountRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  amountInput: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F9FAFB' },
  currency: { marginLeft: 8, color: '#374151', fontWeight: '700' },
  btn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  btnPrimary: { backgroundColor: '#2563EB' },
  btnSecondary: { backgroundColor: '#E5E7EB' },
  btnText: { fontWeight: '700', color: '#fff' },
})

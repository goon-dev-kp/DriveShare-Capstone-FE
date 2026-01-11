import React, { useEffect, useState } from 'react'
import { SafeAreaView, View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import walletService from '@/services/walletService'

export default function PayTripScreen() {
  const params = useLocalSearchParams() as Record<string, string | undefined>
  const router = useRouter()
  const tripId = params.tripId || ''
  const amountStr = params.amount || '0'
  const contractCode = params.contractCode || ''
  const redirect = params.redirect ? decodeURIComponent(params.redirect) : `/(provider)/trip-detail?tripId=${tripId}`

  const requiredAmount = Math.max(0, Math.floor(Number(amountStr)))
  const [wallet, setWallet] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [resultMsg, setResultMsg] = useState<string | null>(null)
  const [txInfo, setTxInfo] = useState<any | null>(null)

  const loadWallet = async () => {
    setLoading(true)
    try {
      const res: any = await walletService.getMyWallet()
      const ok = res?.isSuccess ?? res?.statusCode === 200
      const data = res?.result || res?.data
      if (ok && data) setWallet(data)
      else setWallet(null)
    } catch { setWallet(null) } finally { setLoading(false) }
  }

  useEffect(() => { loadWallet() }, [])

  const balance = Number(wallet?.balance ?? wallet?.Balance ?? 0)
  const deficit = Math.max(0, requiredAmount - balance)
  const canPay = requiredAmount > 0 && deficit === 0

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadWallet()
    setRefreshing(false)
  }

  const handleTopup = () => {
    router.push({ pathname: '/(wallet)/topup', params: { amount: String(deficit), redirect: encodeURIComponent(`/(wallet)/pay-trip?tripId=${tripId}&amount=${requiredAmount}&contractCode=${contractCode}&redirect=${encodeURIComponent(redirect)}`) } } as any)
  }

  const handlePay = async () => {
    if (!canPay) return
    setPaying(true)
    try {
      const res: any = await walletService.payForTrip(tripId, requiredAmount, `Thanh toán hợp đồng ${contractCode}`)
      const ok = res?.isSuccess ?? res?.statusCode === 200
      if (!ok) throw new Error(res?.message || 'Thanh toán thất bại')
      setTxInfo(res?.result || res?.data || null)
      setResultMsg('Thanh toán thành công')
      // Optionally refresh trip status by a silent call (not shown)
      setTimeout(() => {
        router.replace(redirect as any)
      }, 1200)
    } catch (e: any) {
      Alert.alert('Thanh toán', e?.message || 'Không thể thanh toán.')
    } finally { setPaying(false) }
  }

  return (
    <SafeAreaView style={styles.container}>
<View style={styles.header}>
<TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backTxt}>◀</Text></TouchableOpacity>
<Text style={styles.headerTitle}>Thanh toán chuyến</Text>
<View style={{ width: 32 }} />
</View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#4F46E5" /><Text style={styles.loadingText}>Đang tải ví...</Text></View>
      ) : (
        <View style={styles.content}>
<View style={styles.card}>
<Text style={styles.sectionTitle}>Thông tin hợp đồng</Text>
<View style={styles.row}><Text style={styles.label}>Trip ID:</Text><Text style={styles.value}>{tripId || '—'}</Text></View>
<View style={styles.row}><Text style={styles.label}>Mã hợp đồng:</Text><Text style={styles.value}>{contractCode || '—'}</Text></View>
<View style={styles.row}><Text style={styles.label}>Số tiền cần:</Text><Text style={[styles.value, styles.amount]}>{requiredAmount.toLocaleString('vi-VN')} VND</Text></View>
</View>
<View style={styles.card}>
<Text style={styles.sectionTitle}>Ví của bạn</Text>
            {wallet ? (
              <>
<View style={styles.row}><Text style={styles.label}>Số dư hiện tại:</Text><Text style={[styles.value, { fontWeight: '800' }]}>{balance.toLocaleString('vi-VN')} VND</Text></View>
                {deficit > 0 && <Text style={styles.deficit}>Thiếu {deficit.toLocaleString('vi-VN')} VND</Text>}
                <View style={styles.actionsRow}>
                  {deficit > 0 && (
                    <TouchableOpacity style={[styles.actionBtn, styles.secondaryBtn]} onPress={handleTopup}>
<Text style={[styles.actionBtnText, { color: '#111827' }]}>Nạp thêm</Text>
</TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.actionBtn, canPay ? styles.primaryBtn : styles.disabledBtn]} disabled={!canPay || paying} onPress={handlePay}>
                    {paying ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>{canPay ? 'Thanh toán' : 'Không đủ tiền'}</Text>}
                  </TouchableOpacity>
<TouchableOpacity style={[styles.actionBtn, styles.ghostBtn]} onPress={handleRefresh} disabled={refreshing}>
                    {refreshing ? <ActivityIndicator color="#111827" /> : <Text style={[styles.actionBtnText, { color: '#111827' }]}>Làm mới</Text>}
                  </TouchableOpacity>
</View>
                {resultMsg && (
                  <View style={{ marginTop: 12 }}>
<Text style={styles.successMsg}>{resultMsg}</Text>
                    {txInfo && (
                      <Text style={styles.txMeta}>
                        Mã giao dịch: {txInfo.transactionId || '—'} • Số dư sau: {(Number(txInfo.balanceAfter || 0)).toLocaleString('vi-VN')} VND
                      </Text>
                    )}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.center}><Text style={styles.errorText}>Không tìm thấy ví. Hãy tạo ví trước.</Text></View>
            )}
          </View>
<TouchableOpacity style={styles.backToTrip} onPress={() => router.replace(redirect as any)}>
<Text style={styles.backToTripText}>← Quay lại chuyến</Text>
</TouchableOpacity>
</View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { padding: 6 },
  backTxt: { fontSize: 18, fontWeight: '600', color: '#111827' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { marginTop: 8, color: '#6B7280' },
  content: { padding: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 13, color: '#6B7280' },
  value: { fontSize: 13, fontWeight: '600', color: '#111827' },
  amount: { fontSize: 15, fontWeight: '800', color: '#111827' },
  deficit: { marginTop: 4, color: '#DC2626', fontWeight: '700' },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  actionBtn: { flexGrow: 1, flexBasis: '30%', paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  primaryBtn: { backgroundColor: '#2563EB' },
  secondaryBtn: { backgroundColor: '#FDE68A' },
  ghostBtn: { backgroundColor: '#E5E7EB' },
  disabledBtn: { backgroundColor: '#9CA3AF' },
  actionBtnText: { fontWeight: '700', color: '#FFFFFF' },
  successMsg: { marginTop: 12, textAlign: 'center', color: '#059669', fontWeight: '700' },
  errorText: { color: '#EF4444' },
  txMeta: { marginTop: 6, textAlign: 'center', color: '#374151' },
  backToTrip: { alignSelf: 'flex-start', marginTop: 4 },
  backToTripText: { color: '#2563EB', fontWeight: '600' }
})

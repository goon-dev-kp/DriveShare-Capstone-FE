import React, { useEffect, useState, useCallback } from 'react'
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Alert, TextInput, RefreshControl } from 'react-native'
import walletService from '@/services/walletService'
import { useRouter } from 'expo-router'

interface TransactionItem {
  transactionId: string
  amount: number
  balanceBefore: number
  balanceAfter: number
  type: string
  status: string
  createdAt: string
  description?: string
}

export default function MyWalletScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState<any>(null)
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [fetchingMore, setFetchingMore] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawDesc, setWithdrawDesc] = useState('Rút tiền')
  const [withdrawing, setWithdrawing] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const loadWallet = async () => {
    try {
      const res: any = await walletService.getMyWallet()
      const ok = res?.isSuccess ?? res?.statusCode === 200
      const data = res?.result || res?.data
      if (ok && data) setWallet(data)
      else setWallet(null)
    } catch (e) {
      setWallet(null)
    }
  }

  const loadTransactions = async (pageNumber = 1, append = false) => {
    try {
      const res: any = await walletService.getMyHistory(pageNumber, 10)
      const ok = res?.isSuccess ?? res?.statusCode === 200
      const payload = res?.result || res?.data || res
      const list = payload?.data || payload?.items || payload?.transactions || []
      const mapped: TransactionItem[] = list.map((t: any) => ({
        transactionId: t.transactionId || t.TransactionId,
        amount: Number(t.amount ?? t.Amount ?? 0),
        balanceBefore: Number(t.balanceBefore ?? t.BalanceBefore ?? 0),
        balanceAfter: Number(t.balanceAfter ?? t.BalanceAfter ?? 0),
        type: t.type || t.Type || '',
        status: t.status || t.Status || '',
        createdAt: t.createdAt || t.CreatedAt || '',
        description: t.description || t.Description,
      }))
      setHasMore(list.length >= 10)
      setTransactions(prev => append ? [...prev, ...mapped] : mapped)
    } catch (e) {
      if (!append) setTransactions([])
    }
  }

  const initialLoad = async () => {
    setLoading(true)
    await Promise.all([loadWallet(), loadTransactions(1)])
    setLoading(false)
  }

  useEffect(() => { initialLoad() }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    setPage(1)
    await loadWallet()
    await loadTransactions(1)
    setRefreshing(false)
  }, [])

  const loadMore = async () => {
    if (fetchingMore || !hasMore) return
    setFetchingMore(true)
    const next = page + 1
    await loadTransactions(next, true)
    setPage(next)
    setFetchingMore(false)
  }

  const handleWithdraw = async () => {
    const amt = Math.floor(Number(withdrawAmount))
    if (!amt || amt <= 0) return Alert.alert('Rút tiền', 'Số tiền không hợp lệ.')
    setWithdrawing(true)
    try {
      const res: any = await walletService.requestWithdrawal(amt, withdrawDesc || 'Rút tiền')
      const ok = res?.isSuccess ?? res?.statusCode === 200
      if (!ok) throw new Error(res?.message || 'Rút tiền thất bại')
      Alert.alert('Rút tiền', 'Yêu cầu rút tiền đã xử lý.')
      await onRefresh()
      setWithdrawAmount('')
    } catch (e: any) {
      Alert.alert('Rút tiền', e?.message || 'Không thể rút tiền.')
    } finally { setWithdrawing(false) }
  }

  const balance = Number(wallet?.balance ?? wallet?.Balance ?? 0)

  const renderTransaction = ({ item }: { item: TransactionItem }) => {
    const isPositive = item.amount > 0
    return (
      <View style={styles.txRow}>
<View style={{ flex: 1 }}>
<Text style={styles.txType}>{item.type}</Text>
<Text style={styles.txDesc}>{item.description || '—'}</Text>
<Text style={styles.txDate}>{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}</Text>
</View>
<View style={styles.txAmountCol}>
<Text style={[styles.txAmount, { color: isPositive ? '#059669' : '#DC2626' }]}>{(isPositive ? '+' : '') + item.amount.toLocaleString('vi-VN')} VND</Text>
<Text style={styles.txBalanceAfter}>{item.balanceAfter.toLocaleString('vi-VN')} VND</Text>
</View>
</View>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator color="#4F46E5" /><Text style={styles.loadingText}>Đang tải ví...</Text></View></SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
<View style={styles.header}>
<TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backTxt}>◀</Text></TouchableOpacity>
<Text style={styles.headerTitle}>Ví của tôi</Text>
<View style={{ width: 32 }} />
</View>
<FlatList
        data={transactions}
        keyExtractor={i => i.transactionId}
        ListHeaderComponent={(
          <>
<View style={styles.balanceCard}>
<Text style={styles.balanceLabel}>Số dư hiện tại</Text>
<Text style={styles.balanceValue}>{balance.toLocaleString('vi-VN')} VND</Text>
<View style={styles.balanceActions}>
<TouchableOpacity style={[styles.actionBtn, styles.primary]} onPress={() => router.push('/(wallet)/topup' as any)}>
<Text style={styles.actionBtnText}>Nạp tiền</Text>
</TouchableOpacity>
<TouchableOpacity style={[styles.actionBtn, styles.secondary]} onPress={onRefresh}>
<Text style={[styles.actionBtnText, { color: '#111827' }]}>Làm mới</Text>
</TouchableOpacity>
</View>
</View>
<View style={styles.withdrawCard}>
<Text style={styles.sectionTitle}>Rút tiền</Text>
<View style={styles.inputRow}>
<TextInput value={withdrawAmount} onChangeText={setWithdrawAmount} placeholder="Số tiền" keyboardType="numeric" style={styles.input} />
</View>
<TextInput value={withdrawDesc} onChangeText={setWithdrawDesc} placeholder="Mô tả" style={[styles.input, { marginTop: 8 }]} />
<TouchableOpacity style={[styles.withdrawBtn, withdrawing ? styles.withdrawBtnDisabled : styles.withdrawBtnPrimary]} disabled={withdrawing} onPress={handleWithdraw}>
                {withdrawing ? <ActivityIndicator color="#fff" /> : <Text style={styles.withdrawBtnText}>Rút tiền</Text>}
              </TouchableOpacity>
</View>
<Text style={styles.sectionTitle}>Lịch sử giao dịch</Text>
</>
        )}
        renderItem={renderTransaction}
        contentContainerStyle={styles.listContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={fetchingMore ? <ActivityIndicator style={{ marginVertical: 12 }} /> : null}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
</SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { marginTop: 8, color: '#6B7280' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { padding: 6 },
  backTxt: { fontSize: 18, fontWeight: '600', color: '#111827' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  listContent: { padding: 16, paddingBottom: 24 },
  balanceCard: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginBottom: 16 },
  balanceLabel: { fontSize: 13, color: '#6B7280' },
  balanceValue: { fontSize: 24, fontWeight: '800', color: '#111827', marginTop: 4 },
  balanceActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  primary: { backgroundColor: '#2563EB' },
  secondary: { backgroundColor: '#E5E7EB' },
  actionBtnText: { fontWeight: '700', color: '#FFFFFF' },
  withdrawCard: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#F9FAFB', color: '#111827' },
  withdrawBtn: { marginTop: 12, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  withdrawBtnPrimary: { backgroundColor: '#059669' },
  withdrawBtnDisabled: { backgroundColor: '#6EE7B7' },
  withdrawBtnText: { fontWeight: '700', color: '#FFFFFF' },
  txRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 12, marginBottom: 10 },
  txType: { fontSize: 13, fontWeight: '700', color: '#111827' },
  txDesc: { fontSize: 12, color: '#374151', marginTop: 2 },
  txDate: { fontSize: 11, color: '#6B7280', marginTop: 4 },
  txAmountCol: { alignItems: 'flex-end', justifyContent: 'center', marginLeft: 12 },
  txAmount: { fontSize: 14, fontWeight: '700' },
  txBalanceAfter: { fontSize: 11, color: '#6B7280', marginTop: 4 },
})

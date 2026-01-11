import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import transactionService, { TransactionDTO } from '@/services/transactionService';

const TransactionListScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const roleTitle = params.roleTitle as string || 'Giao dịch';

  const [transactions, setTransactions] = useState<TransactionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const pageSize = 20;

  const fetchTransactions = async (page: number = 1, isRefresh: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await transactionService.getAllMyTransactions(page, pageSize);
      
      if (response?.isSuccess && response?.result) {
        // API returns 'data' not 'items', and 'currentPage' not 'pageNumber'
        const { data = [], totalCount: total = 0, totalPages = 0 } = response.result;
        
        if (isRefresh || page === 1) {
          setTransactions(data || []);
        } else {
          setTransactions(prev => [...prev, ...(data || [])]);
        }
        
        setTotalCount(total || 0);
        setHasMore(page < totalPages);
        setPageNumber(page);
      } else {
        // Handle failed response
        if (page === 1) {
          setTransactions([]);
          setTotalCount(0);
        }
        setHasMore(false);
      }
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      setError(error?.response?.data?.message || error?.message || 'Không thể tải giao dịch');
      if (page === 1) {
        setTransactions([]);
        setTotalCount(0);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setError(null);
    fetchTransactions(1, true);
  }, []);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchTransactions(pageNumber + 1);
    }
  };

  const getTransactionTypeConfig = (type: string) => {
    const configs: any = {
      // === CỘNG TIỀN (System -> User) ===
      TOPUP: { icon: 'wallet-plus', color: '#059669', label: 'Nạp tiền', bg: '#DCFCE7' },
      OWNER_PAYOUT: { icon: 'cash-check', color: '#059669', label: 'Thanh toán cho chủ xe', bg: '#DCFCE7' },
      DRIVER_PAYOUT: { icon: 'cash-check', color: '#059669', label: 'Thanh toán cho tài xế', bg: '#DCFCE7' },
      REFUND: { icon: 'cash-refund', color: '#3B82F6', label: 'Hoàn tiền', bg: '#DBEAFE' },
      COMPENSATION: { icon: 'shield-check', color: '#10B981', label: 'Bồi thường', bg: '#D1FAE5' },
      
      // === TRỪ TIỀN (User -> System) ===
      WITHDRAWAL: { icon: 'cash-minus', color: '#DC2626', label: 'Rút tiền', bg: '#FEE2E2' },
      POST_TRIP_PAYMENT: { icon: 'credit-card-outline', color: '#F59E0B', label: 'Thanh toán chuyến đi', bg: '#FEF3C7' },
      POST_PAYMENT: { icon: 'file-document', color: '#F59E0B', label: 'Phí đăng bài', bg: '#FEF3C7' },
      PLATFORM_FEE: { icon: 'receipt', color: '#DC2626', label: 'Phí nền tảng', bg: '#FEE2E2' },
      DRIVER_SERVICE_PAYMENT: { icon: 'account-cash', color: '#8B5CF6', label: 'Thuê tài xế', bg: '#EDE9FE' },
      PENALTY: { icon: 'alert-octagon', color: '#DC2626', label: 'Phạt vi phạm', bg: '#FEE2E2' },
      DEPOSIT: { icon: 'shield-lock', color: '#F59E0B', label: 'Tiền cọc', bg: '#FEF3C7' },
      OUTSTANDING_PAYMENT: { icon: 'clock-alert', color: '#EF4444', label: 'Công nợ', bg: '#FEE2E2' },
      PLATFORM_PAYMENT: { icon: 'bank', color: '#8B5CF6', label: 'Thanh toán nền tảng', bg: '#EDE9FE' },
      
      // Legacy/Other types
      PAYMENT: { icon: 'credit-card', color: '#F59E0B', label: 'Thanh toán', bg: '#FEF3C7' },
      TRANSFER: { icon: 'bank-transfer', color: '#8B5CF6', label: 'Chuyển khoản', bg: '#EDE9FE' },
      SURCHARGE: { icon: 'cash-multiple', color: '#DC2626', label: 'Phụ phí', bg: '#FEE2E2' },
      BONUS: { icon: 'gift', color: '#10B981', label: 'Thưởng', bg: '#D1FAE5' },
      FEE: { icon: 'receipt', color: '#EF4444', label: 'Phí dịch vụ', bg: '#FEE2E2' },
      
      // Alias for compatibility
      WITHDRAW: { icon: 'cash-minus', color: '#DC2626', label: 'Rút tiền', bg: '#FEE2E2' },
    };
    return configs[type] || { icon: 'cash', color: '#6B7280', label: type, bg: '#F3F4F6' };
  };

  const getStatusConfig = (status: string) => {
    const configs: any = {
      SUCCEEDED: { color: '#059669', bg: '#DCFCE7', label: 'Thành công' },
      COMPLETED: { color: '#059669', bg: '#DCFCE7', label: 'Thành công' },
      PENDING: { color: '#F59E0B', bg: '#FEF3C7', label: 'Đang xử lý' },
      FAILED: { color: '#DC2626', bg: '#FEE2E2', label: 'Thất bại' },
      CANCELLED: { color: '#6B7280', bg: '#F3F4F6', label: 'Đã hủy' },
    };
    return configs[status] || { color: '#6B7280', bg: '#F3F4F6', label: status };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTransaction = ({ item }: { item: TransactionDTO }) => {
    const typeConfig = getTransactionTypeConfig(item.type);
    const statusConfig = getStatusConfig(item.status);
    const isIncome = item.amount > 0; // Positive amount = income, negative = expense

    return (
      <TouchableOpacity
        style={styles.transactionCard}
        onPress={() => router.push(`/transaction-detail/${item.transactionId}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.leftSection}>
            <View style={[styles.iconBox, { backgroundColor: typeConfig.bg }]}>
              <MaterialCommunityIcons name={typeConfig.icon} size={24} color={typeConfig.color} />
            </View>
            <View style={styles.infoSection}>
              <Text style={styles.typeLabel}>{typeConfig.label}</Text>
              <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
            </View>
          </View>

          <View style={styles.rightSection}>
            <Text style={[styles.amountText, { color: isIncome ? '#059669' : '#DC2626' }]}>
              {isIncome ? '+' : '-'} {formatCurrency(Math.abs(item.amount))}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>
        </View>

        {item.description && (
          <Text style={styles.descriptionText} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {item.externalTransactionCode && (
          <View style={styles.referenceBox}>
            <MaterialCommunityIcons name="identifier" size={14} color="#6B7280" />
            <Text style={styles.referenceText}>Mã: {item.externalTransactionCode}</Text>
          </View>
        )}
        
        {item.tripId && (
          <View style={styles.referenceBox}>
            <MaterialCommunityIcons name="map-marker-outline" size={14} color="#6B7280" />
            <Text style={styles.referenceText} numberOfLines={1}>Chuyến: {item.tripId.substring(0, 8)}...</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="receipt-text-outline" size={80} color="#CBD5E1" />
      <Text style={styles.emptyTitle}>Chưa có giao dịch</Text>
      <Text style={styles.emptySubtitle}>Các giao dịch của bạn sẽ hiển thị tại đây</Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Đang tải giao dịch...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{roleTitle}</Text>
          {totalCount > 0 && (
            <Text style={styles.countBadge}>{totalCount}</Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="chart-line" size={24} color="#3B82F6" />
          <Text style={styles.statLabel}>Tổng giao dịch</Text>
          <Text style={styles.statValue}>{totalCount}</Text>
        </View>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={24} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => { setError(null); fetchTransactions(1); }}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Transaction List */}
      <FlatList
        data={transactions || []}
        renderItem={renderTransaction}
        keyExtractor={(item) => item?.transactionId || Math.random().toString()}
        contentContainerStyle={[
          styles.listContent,
          (transactions?.length === 0 || !transactions) && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={!error ? renderEmptyState : null}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  countBadge: {
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statsContainer: {
    padding: 16,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statLabel: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 8,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoSection: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 13,
    color: '#475569',
    marginTop: 12,
    lineHeight: 18,
  },
  referenceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  referenceText: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    fontSize: 14,
    color: '#991B1B',
    textAlign: 'center',
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default TransactionListScreen;

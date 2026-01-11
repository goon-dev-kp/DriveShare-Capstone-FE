import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import transactionService, { TransactionDTO } from '@/services/transactionService';
import { SafeAreaView } from 'react-native-safe-area-context';

const TransactionDetailScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const transactionId = params.id as string;

  const [transaction, setTransaction] = useState<TransactionDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transactionId) {
      fetchTransactionDetail();
    }
  }, [transactionId]);

  const fetchTransactionDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await transactionService.getTransactionById(transactionId);
      
      if (response?.isSuccess && response?.result) {
        setTransaction(response.result);
      } else {
        setError(response?.message || 'Không tìm thấy giao dịch');
      }
    } catch (error: any) {
      console.error('Error fetching transaction detail:', error);
      setError(error?.response?.data?.message || error?.message || 'Không thể tải chi tiết giao dịch');
    } finally {
      setLoading(false);
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
    };
    return configs[type] || { icon: 'cash', color: '#6B7280', label: type, bg: '#F3F4F6' };
  };

  const getStatusConfig = (status: string) => {
    const configs: any = {
      SUCCEEDED: { color: '#059669', bg: '#DCFCE7', label: 'Thành công', icon: 'check-circle' },
      COMPLETED: { color: '#059669', bg: '#DCFCE7', label: 'Thành công', icon: 'check-circle' },
      PENDING: { color: '#F59E0B', bg: '#FEF3C7', label: 'Đang xử lý', icon: 'clock-outline' },
      FAILED: { color: '#DC2626', bg: '#FEE2E2', label: 'Thất bại', icon: 'close-circle' },
      CANCELLED: { color: '#6B7280', bg: '#F3F4F6', label: 'Đã hủy', icon: 'cancel' },
    };
    return configs[status] || { color: '#6B7280', bg: '#F3F4F6', label: status, icon: 'help-circle' };
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
      second: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Đang tải chi tiết...</Text>
      </View>
    );
  }

  if (error || !transaction) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#DC2626" />
        <Text style={styles.errorText}>{error || 'Không tìm thấy giao dịch'}</Text>
        <View style={styles.errorActions}>
          <TouchableOpacity style={styles.retryButton} onPress={fetchTransactionDetail}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButtonError} onPress={() => router.back()}>
            <Text style={styles.backButtonTextError}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const typeConfig = getTransactionTypeConfig(transaction.type);
  const statusConfig = getStatusConfig(transaction.status);
  const isIncome = transaction.amount > 0; // Positive = income, negative = expense

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết giao dịch</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Status Hero Section */}
        <View style={[styles.heroSection, { backgroundColor: statusConfig.bg }]}>
          <MaterialCommunityIcons
            name={statusConfig.icon}
            size={64}
            color={statusConfig.color}
          />
          <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
          <Text style={[styles.amountHero, { color: isIncome ? '#059669' : '#DC2626' }]}>
            {isIncome ? '+' : '-'} {formatCurrency(Math.abs(transaction.amount))}
          </Text>
        </View>

        {/* Transaction Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="information-outline" size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Thông tin giao dịch</Text>
          </View>

          <InfoRow
            icon="tag-outline"
            label="Loại giao dịch"
            value={typeConfig.label}
            valueColor={typeConfig.color}
          />
          <InfoRow
            icon="cash"
            label="Số dư trước"
            value={formatCurrency(transaction.balanceBefore)}
          />
          <InfoRow
            icon="cash-check"
            label="Số dư sau"
            value={formatCurrency(transaction.balanceAfter)}
          />
        </View>

        {/* Description Card */}
        {transaction.description && (
          <View style={styles.infoCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="text-box-outline" size={20} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Mô tả</Text>
            </View>
            <Text style={styles.descriptionText}>{transaction.description}</Text>
          </View>
        )}

        {/* Timeline Card */}
        <View style={styles.infoCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="clock-outline" size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Thời gian</Text>
          </View>

          <InfoRow
            icon="calendar-plus"
            label="Ngày tạo"
            value={formatDate(transaction.createdAt)}
          />
          {transaction.completedAt && (
            <InfoRow
              icon="calendar-check"
              label="Ngày hoàn tất"
              value={formatDate(transaction.completedAt)}
            />
          )}
        </View>

        {/* Status Help Text */}
        <View style={styles.helpCard}>
          <MaterialCommunityIcons name="help-circle-outline" size={20} color="#64748B" />
          <Text style={styles.helpText}>
            {(transaction.status === 'SUCCEEDED' || transaction.status === 'COMPLETED') &&
              'Giao dịch đã được xử lý thành công và số dư đã được cập nhật.'}
            {transaction.status === 'PENDING' &&
              'Giao dịch đang được xử lý. Vui lòng đợi trong giây lát.'}
            {transaction.status === 'FAILED' &&
              'Giao dịch không thành công. Vui lòng liên hệ hỗ trợ nếu có thắc mắc.'}
            {transaction.status === 'CANCELLED' &&
              'Giao dịch đã bị hủy bởi hệ thống hoặc người dùng.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper Component for Info Rows
const InfoRow = ({
  icon,
  label,
  value,
  valueColor,
  isMonospace = false,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
  isMonospace?: boolean;
}) => (
  <View style={styles.infoRow}>
    <View style={styles.infoRowLeft}>
      <MaterialCommunityIcons name={icon as any} size={18} color="#64748B" />
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text
      style={[
        styles.infoValue,
        valueColor && { color: valueColor },
        isMonospace && styles.monospaceText,
      ]}
      numberOfLines={1}
    >
      {value}
    </Text>
  </View>
);

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
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 16,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  backButtonError: {
    backgroundColor: '#64748B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonTextError: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  headerBackButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  amountHero: {
    fontSize: 36,
    fontWeight: '900',
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  monospaceText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  helpCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
  },
});

export default TransactionDetailScreen;

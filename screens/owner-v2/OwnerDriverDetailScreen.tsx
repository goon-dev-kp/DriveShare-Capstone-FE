import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter, useLocalSearchParams } from 'expo-router'
import ownerDriverLinkService, { LinkedDriverDTO, FleetJoinStatus } from '@/services/ownerDriverLinkService'
import { format } from 'date-fns'
import {vi} from 'date-fns/locale/vi'

const OwnerDriverDetailScreen: React.FC = () => {
  const router = useRouter()
  const params = useLocalSearchParams()
  const id = typeof params.id === 'string' ? params.id : undefined
  const [driver, setDriver] = useState<LinkedDriverDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDriverDetail()
  }, [id])

  const loadDriverDetail = async () => {
    try {
      setLoading(true)
      // Gọi API để lấy chi tiết 1 driver (cần implement trong service nếu chưa có)
      // Tạm thời dùng getMyDrivers rồi filter
      const response = await ownerDriverLinkService.getMyDrivers(1, 100)

      if (response.success && response.data) {
        const found = response.data.data.find((d) => d.ownerDriverLinkId === id)
        if (found) {
          setDriver(found)
          setError(null)
        } else {
          setError('Không tìm thấy tài xế')
        }
      } else {
        setError(response.error || 'Không thể tải thông tin')
      }
    } catch (err) {
      setError('Lỗi kết nối')
      console.error('Load driver detail error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChangeStatus = async (status: FleetJoinStatus) => {
    if (!driver || !id) return

    const statusText = status === FleetJoinStatus.APPROVED ? 'phê duyệt' : 'từ chối'
    const confirmMessage =
      status === FleetJoinStatus.APPROVED
        ? `Xác nhận phê duyệt tài xế "${driver.fullName}"?`
        : `Xác nhận từ chối yêu cầu của tài xế "${driver.fullName}"?`

    Alert.alert('Xác nhận', confirmMessage, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xác nhận',
        style: status === FleetJoinStatus.APPROVED ? 'default' : 'destructive',
        onPress: async () => {
          try {
            setActionLoading(true)
            const response = await ownerDriverLinkService.changeStatus({
              ownerDriverLinkId: id,
              status,
            })

            if (response.success) {
              Alert.alert('Thành công', response.message || `Đã ${statusText} tài xế`, [
                {
                  text: 'OK',
                  onPress: () => {
                    router.back()
                  },
                },
              ])
            } else {
              Alert.alert('Lỗi', response.error || 'Không thể cập nhật trạng thái')
            }
          } catch (err) {
            Alert.alert('Lỗi', 'Đã xảy ra lỗi khi cập nhật')
            console.error('Change status error:', err)
          } finally {
            setActionLoading(false)
          }
        },
      },
    ])
  }

  const getStatusInfo = (status: string): {
    text: string
    color: string
    bg: string
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']
  } => {
    switch (status) {
      case 'APPROVED':
        return {
          text: 'Đang hoạt động',
          color: '#10B981',
          bg: '#D1FAE5',
          icon: 'check-circle',
        }
      case 'PENDING':
        return {
          text: 'Chờ duyệt',
          color: '#F59E0B',
          bg: '#FEF3C7',
          icon: 'clock-outline',
        }
      case 'REJECTED':
        return {
          text: 'Đã từ chối',
          color: '#EF4444',
          bg: '#FEE2E2',
          icon: 'close-circle',
        }
      default:
        return {
          text: status,
          color: '#6B7280',
          bg: '#F3F4F6',
          icon: 'help-circle',
        }
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    )
  }

  if (error || !driver) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error || 'Không tìm thấy thông tin'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadDriverDetail}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const statusInfo = getStatusInfo(driver.status)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Avatar & Name Section */}
      <View style={styles.profileSection}>
        <View style={styles.avatarWrapper}>
          {driver.avatarUrl ? (
            <Image source={{ uri: driver.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="account" size={48} color="#94A3B8" />
            </View>
          )}
        </View>

        <Text style={styles.driverName}>{driver.fullName}</Text>
        <Text style={styles.phoneNumber}>{driver.phoneNumber}</Text>

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
          <MaterialCommunityIcons name={statusInfo.icon} size={16} color={statusInfo.color} />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
        </View>
      </View>

      {/* Info Cards */}
      <View style={styles.infoSection}>
        {/* License Card */}
        {driver.licenseNumber && (
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <MaterialCommunityIcons name="card-account-details" size={20} color="#3B82F6" />
              <Text style={styles.infoCardTitle}>Giấy phép lái xe</Text>
            </View>
            <Text style={styles.infoCardValue}>{driver.licenseNumber}</Text>
          </View>
        )}

        {/* Statistics Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <MaterialCommunityIcons name="chart-box" size={20} color="#3B82F6" />
            <Text style={styles.infoCardTitle}>Thống kê giờ lái</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <MaterialCommunityIcons name="clock-outline" size={24} color="#64748B" />
              <Text style={styles.statLabel}>Hôm nay</Text>
              <Text style={styles.statValue}>{driver.hoursDrivenToday.toFixed(1)} giờ</Text>
            </View>

            <View style={styles.statBox}>
              <MaterialCommunityIcons name="calendar-week" size={24} color="#64748B" />
              <Text style={styles.statLabel}>Tuần này</Text>
              <Text style={styles.statValue}>{driver.hoursDrivenThisWeek.toFixed(1)} giờ</Text>
            </View>

            <View style={styles.statBox}>
              <MaterialCommunityIcons name="calendar-month" size={24} color="#64748B" />
              <Text style={styles.statLabel}>Tháng này</Text>
              <Text style={styles.statValue}>{driver.hoursDrivenThisMonth.toFixed(1)} giờ</Text>
            </View>
          </View>

          {/* Can Drive Status */}
          <View
            style={[
              styles.canDriveStatus,
              { backgroundColor: driver.canDrive ? '#D1FAE5' : '#FEE2E2' },
            ]}
          >
            <MaterialCommunityIcons
              name={driver.canDrive ? 'check-circle' : 'alert-circle'}
              size={18}
              color={driver.canDrive ? '#10B981' : '#EF4444'}
            />
            <Text
              style={[
                styles.canDriveText,
                { color: driver.canDrive ? '#10B981' : '#EF4444' },
              ]}
            >
              {driver.canDrive ? 'Có thể lái xe' : 'Đã đạt giới hạn giờ lái'}
            </Text>
          </View>
        </View>

        {/* Timeline Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <MaterialCommunityIcons name="timeline-clock" size={20} color="#3B82F6" />
            <Text style={styles.infoCardTitle}>Lịch sử</Text>
          </View>

          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Gửi yêu cầu</Text>
              <Text style={styles.timelineValue}>
                {format(new Date(driver.requestedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
              </Text>
            </View>
          </View>

          {driver.approvedAt && (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: '#10B981' }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Phê duyệt</Text>
                <Text style={styles.timelineValue}>
                  {format(new Date(driver.approvedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Action Buttons (Only for PENDING status) */}
      {driver.status === 'PENDING' && (
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleChangeStatus(FleetJoinStatus.REJECTED)}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="close" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Từ chối</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleChangeStatus(FleetJoinStatus.APPROVED)}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Phê duyệt</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#64748B',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  avatarWrapper: {
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoSection: {
    padding: 16,
    gap: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  infoCardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  canDriveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  canDriveText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  timelineValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  actionSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
})

export default OwnerDriverDetailScreen

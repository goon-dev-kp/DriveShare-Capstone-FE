import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import notificationService, { NotificationDTO } from '@/services/notificationService'
import { useNotification } from '@/hooks/useNotification'

const NotificationListScreen = () => {
  const router = useRouter()
  const { refreshUnreadCount } = useNotification()
  
  const [notifications, setNotifications] = useState<NotificationDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [pageNumber, setPageNumber] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const pageSize = 20

  const fetchNotifications = async (page: number = 1, isRefresh: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      const response = await notificationService.getMyNotifications(page, pageSize)
      console.log('📬 Notifications response:', response)
      
      // Backend trả về: { message, statusCode, isSuccess, result: { Items, TotalCount, UnreadCount } }
      if (response?.isSuccess && response?.result) {
        const items = response.result.Items || response.result.items || []
        const total = response.result.TotalCount || response.result.totalCount || 0
        const totalPages = Math.ceil(total / pageSize)
        
        if (isRefresh || page === 1) {
          setNotifications(items)
        } else {
          setNotifications(prev => [...prev, ...items])
        }
        
        setTotalCount(total)
        setHasMore(page < totalPages)
        setPageNumber(page)
      }
    } catch (error: any) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchNotifications(1)
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchNotifications(1, true)
    refreshUnreadCount()
  }, [refreshUnreadCount])

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchNotifications(pageNumber + 1)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId)
      
      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.notificationId === notificationId ? { ...n, isRead: true } : n
        )
      )
      
      // Refresh unread count
      refreshUnreadCount()
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      
      // Refresh unread count
      refreshUnreadCount()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleDelete = async (notificationId: string) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc muốn xóa thông báo này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationService.deleteNotification(notificationId)
              setNotifications(prev => prev.filter(n => n.notificationId !== notificationId))
              setTotalCount(prev => prev - 1)
              refreshUnreadCount()
            } catch (error) {
              console.error('Error deleting notification:', error)
            }
          },
        },
      ]
    )
  }

  const handleNotificationPress = async (notification: NotificationDTO) => {
    // Mark as read
    if (!notification.isRead) {
      await handleMarkAsRead(notification.notificationId)
    }

    // Parse data and navigate
    if (notification.data) {
      try {
        const data = JSON.parse(notification.data)
        console.log('📱 Notification data:', data)
        
        // Navigate based on notification screen type
        if (data.screen === 'PostDetail' && data.id) {
          // Owner: Xem chi tiết bài đăng (PostPackage)
          router.push(`/(owner)/owner-v2/post-detail/${data.id}`)
        } else if (data.screen === 'PostTripDetail' && data.id) {
          // Driver: Xem chi tiết bài đăng (PostTrip) - Kèo xe
          router.push(`/(driver)/trip-post/${data.id}`)
        } else if (data.postId) {
          // Legacy: fallback
          router.push(`/(owner)/owner-v2/post-detail/${data.postId}`)
        } else if (data.tripId) {
          // Trip detail (for all roles)
          router.push(`/trip-detail/${data.tripId}`)
        }
      } catch (e) {
        console.error('Error parsing notification data:', e)
      }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Vừa xong'
    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    if (diffDays < 7) return `${diffDays} ngày trước`
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const renderNotification = ({ item }: { item: NotificationDTO }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <View style={[styles.iconBox, !item.isRead && styles.unreadIconBox]}>
          <MaterialCommunityIcons
            name="bell"
            size={24}
            color={!item.isRead ? '#3B82F6' : '#64748B'}
          />
        </View>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, !item.isRead && styles.unreadTitle]} numberOfLines={2}>
            {item.title}
          </Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>

        <Text style={styles.body} numberOfLines={3}>
          {item.body}
        </Text>

        <View style={styles.footerRow}>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.notificationId)}
          >
            <MaterialCommunityIcons name="delete-outline" size={18} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="bell-off-outline" size={80} color="#CBD5E1" />
      <Text style={styles.emptyTitle}>Chưa có thông báo</Text>
      <Text style={styles.emptySubtitle}>Các thông báo sẽ xuất hiện ở đây</Text>
    </View>
  )

  const renderFooter = () => {
    if (!loadingMore) return null
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Đang tải thông báo...</Text>
      </View>
    )
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Thông báo</Text>
          {totalCount > 0 && (
            <Text style={styles.countBadge}>{totalCount}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={handleMarkAllAsRead}
          disabled={unreadCount === 0}
        >
          <MaterialCommunityIcons
            name="check-all"
            size={24}
            color={unreadCount > 0 ? '#3B82F6' : '#CBD5E1'}
          />
        </TouchableOpacity>
      </View>

      {/* Unread Badge */}
      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <MaterialCommunityIcons name="bell-badge" size={20} color="#3B82F6" />
          <Text style={styles.unreadBannerText}>
            Bạn có {unreadCount} thông báo chưa đọc
          </Text>
        </View>
      )}

      {/* Notification List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.notificationId}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

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
  markAllButton: {
    padding: 8,
  },
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
  },
  unreadBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    gap: 12,
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
  unreadCard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BFDBFE',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadIconBox: {
    backgroundColor: '#DBEAFE',
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
    lineHeight: 20,
  },
  unreadTitle: {
    fontWeight: '700',
    color: '#1E293B',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 8,
    marginTop: 6,
  },
  body: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  deleteButton: {
    padding: 4,
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
})

export default NotificationListScreen

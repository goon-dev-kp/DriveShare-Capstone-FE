import api from '@/config/api'

export interface NotificationDTO {
  notificationId: string
  userId?: string
  title: string
  body: string
  data?: string // JSON string
  isRead: boolean
  createdAt: string
}

export interface PaginatedNotificationDTO {
  Items: NotificationDTO[]
  items?: NotificationDTO[]
  TotalCount: number
  totalCount?: number
  UnreadCount: number
  unreadCount?: number
}

export interface NotificationListResponse {
  data: NotificationDTO[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

class NotificationService {
  // Đăng ký Device Token
  async registerDeviceToken(deviceToken: string, platform: 'android' | 'ios' | 'web') {
    try {
      const response = await api.post('/api/Notification/register-token', {
        deviceToken,
        platform
      })
      return response.data
    } catch (error) {
      console.error('Error registering device token:', error)
      throw error
    }
  }

  // Lấy danh sách thông báo
  async getMyNotifications(pageNumber: number = 1, pageSize: number = 20) {
    try {
      const response = await api.get('/api/Notification/my-notifications', {
        params: { pageNumber, pageSize }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching notifications:', error)
      throw error
    }
  }

  // Đếm số thông báo chưa đọc
  async getUnreadCount() {
    try {
      const response = await api.get('/api/Notification/unread-count')
      // Backend trả về: { message, statusCode, isSuccess, result: { UnreadCount: number } }
      const unreadCount = response.data?.result?.UnreadCount ?? response.data?.result?.unreadCount ?? 0
      return unreadCount
    } catch (error: any) {
      // Ignore 401/403 (not logged in)
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return 0
      }
      console.error('Error getting unread count:', error)
      return 0
    }
  }

  // Đánh dấu đã đọc 1 thông báo
  async markAsRead(notificationId: string) {
    try {
      const response = await api.put(`/api/Notification/${notificationId}/mark-read`)
      return response.data
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  }

  // Đánh dấu tất cả đã đọc
  async markAllAsRead() {
    try {
      const response = await api.put('/api/Notification/mark-all-read')
      return response.data
    } catch (error) {
      console.error('Error marking all as read:', error)
      throw error
    }
  }

  // Xóa thông báo
  async deleteNotification(notificationId: string) {
    try {
      const response = await api.delete(`/api/Notification/${notificationId}`)
      return response.data
    } catch (error) {
      console.error('Error deleting notification:', error)
      throw error
    }
  }
}

export default new NotificationService()

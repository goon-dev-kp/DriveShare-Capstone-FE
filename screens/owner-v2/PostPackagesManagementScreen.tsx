
import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  StatusBar,
  TextInput
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons, Feather } from '@expo/vector-icons'
import { FreightPost } from '../../models/types'
import OwnerPostPackageList from './components/OwnerPostPackageList'
import PostPackageDetailModal from '@/screens/provider-v2/components/PostPackageDetailModal'
import AcceptFromPostModal from './components/AcceptFromPostModal'
import OwnerPostDetailModal from './components/OwnerPostDetailModal'
import usePostPackages from '@/hooks/usePostPackages'

interface Props {
  onBack?: () => void
}

// Màu sắc chủ đạo
const COLORS = {
  primary: '#0284C7',
  bg: '#F9FAFB',
  text: '#111827',
  border: '#E5E7EB'
}

// Status color mapping for posts
const STATUS_COLORS: Record<string, string> = {
  ALL: '#0284C7',
  OPEN: '#10B981', // green
  ACCEPTED: '#3B82F6', // blue
  CLOSED: '#6B7280', // gray
  EXPIRED: '#EF4444', // red
  CANCELLED: '#F59E0B', // orange
}

// Status label mapping
const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    ALL: 'Tất cả',
    OPEN: 'Đang mở',
    ACCEPTED: 'Đã chấp nhận',
    CLOSED: 'Đã đóng',
    EXPIRED: 'Hết hạn',
    CANCELLED: 'Đã hủy',
  }
  return labels[status] || status
}

// Get status color
const getStatusColor = (status: string): string => {
  return STATUS_COLORS[status] || '#9CA3AF'
}

const PostPackagesManagementScreen: React.FC<Props> = ({ onBack }) => {
  const router = useRouter()
  const {
    posts,
    loading,
    error,
    search,
    sortBy,
    sortOrder,
    setSearch,
    setSortBy,
    setSortOrder,
    fetchPage,
    refetch
  } = usePostPackages(1, 20)

  const [detailId, setDetailId] = useState<string | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [acceptVisible, setAcceptVisible] = useState(false)
  const [selectedPost, setSelectedPost] = useState<any | null>(null)
  const [isSortModalOpen, setIsSortModalOpen] = useState(false)
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success'
  })

  // Refetch data when screen is focused
  useFocusEffect(
    useCallback(() => {
      refetch()
    }, [refetch])
  )

  const showToast = (message: string, type: 'success' | 'error' = 'success', duration = 3000) => {
    setToast({ visible: true, message, type })
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), duration)
  }

  const openDetail = (postId: string) => {
    setDetailId(postId)
    setDetailVisible(true)
  }

  const handleCreatePost = () => {
    Alert.alert('Thông báo', 'Chức năng tạo bài đăng đang phát triển')
  }

  const handleSearchChange = (text: string) => {
    setSearch(text)
    const timer = setTimeout(() => {
      fetchPage(1, 20, text, sortBy, sortOrder)
    }, 500)
    return () => clearTimeout(timer)
  }

  const handleApplySort = (field: string, order: 'ASC' | 'DESC') => {
    setSortBy(field)
    setSortOrder(order)
    setIsSortModalOpen(false)
    showToast('Đã áp dụng sắp xếp')
    fetchPage(1, 20, search, field, order)
  }

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.statusText}>Đang tải bài đăng...</Text>
        </View>
      )
    }

    if (error) {
      return (
        <View style={styles.centeredContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchPage(1, 20)}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )
    }

    if (posts.length === 0) {
      return (
        <View style={styles.centeredContainer}>
          <Text style={styles.statusText}>
            {search ? 'Không tìm thấy bài đăng nào.' : 'Bạn chưa có bài đăng nào.'}
          </Text>
        </View>
      )
    }

    return (
      <OwnerPostPackageList
        posts={posts}
        onView={openDetail}
        onAccept={(postId: string) => {
          const p = posts.find((x) => x.id === postId)
          setSelectedPost(p ?? null)
          setAcceptVisible(true)
          return Promise.resolve() // Trả về Promise để tương thích
        }}
        getStatusColor={getStatusColor}
        onRefresh={() => fetchPage(1, 20, search, sortBy, sortOrder)}
      />
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (onBack ? onBack() : router.back())} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          <Text style={styles.headerBtnText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Săn tìm gói cước</Text>

        <TouchableOpacity onPress={handleCreatePost} style={styles.headerBtn}>
          {/* <Ionicons name="add" size={24} color={COLORS.primary} /> */}
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Tìm bài đăng..."
            style={styles.searchInput}
            value={search}
            onChangeText={handleSearchChange}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setIsSortModalOpen(true)}>
          <Ionicons name="options-outline" size={22} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* INFO BANNER */}
      <View style={styles.infoBanner}>
        <Feather name="info" size={16} color="#0284C7" />
        <Text style={styles.infoBannerText}>Hiển thị các bài đăng đang mở (OPEN)</Text>
      </View>

      <View style={styles.body}>{renderContent()}</View>

      {/* SORT MODAL */}
      {isSortModalOpen && (
        <View style={styles.sortModalBackdrop}>
          <View style={styles.sortModal}>
            <Text style={styles.sortModalTitle}>Sắp xếp theo</Text>
            
            <TouchableOpacity 
              style={[styles.sortOption, sortBy === 'title' && sortOrder === 'ASC' && styles.sortOptionActive]}
              onPress={() => handleApplySort('title', 'ASC')}
            >
              <Text style={styles.sortOptionText}>Tiêu đề (A-Z)</Text>
              {sortBy === 'title' && sortOrder === 'ASC' && <Feather name="check" size={20} color={COLORS.primary} />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.sortOption, sortBy === 'title' && sortOrder === 'DESC' && styles.sortOptionActive]}
              onPress={() => handleApplySort('title', 'DESC')}
            >
              <Text style={styles.sortOptionText}>Tiêu đề (Z-A)</Text>
              {sortBy === 'title' && sortOrder === 'DESC' && <Feather name="check" size={20} color={COLORS.primary} />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.sortOption, sortBy === 'offeredPrice' && sortOrder === 'ASC' && styles.sortOptionActive]}
              onPress={() => handleApplySort('offeredPrice', 'ASC')}
            >
              <Text style={styles.sortOptionText}>Giá (Thấp đến cao)</Text>
              {sortBy === 'offeredPrice' && sortOrder === 'ASC' && <Feather name="check" size={20} color={COLORS.primary} />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.sortOption, sortBy === 'offeredPrice' && sortOrder === 'DESC' && styles.sortOptionActive]}
              onPress={() => handleApplySort('offeredPrice', 'DESC')}
            >
              <Text style={styles.sortOptionText}>Giá (Cao đến thấp)</Text>
              {sortBy === 'offeredPrice' && sortOrder === 'DESC' && <Feather name="check" size={20} color={COLORS.primary} />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.sortOption, sortBy === 'status' && sortOrder === 'ASC' && styles.sortOptionActive]}
              onPress={() => handleApplySort('status', 'ASC')}
            >
              <Text style={styles.sortOptionText}>Trạng thái (A-Z)</Text>
              {sortBy === 'status' && sortOrder === 'ASC' && <Feather name="check" size={20} color={COLORS.primary} />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.sortOption, sortBy === 'status' && sortOrder === 'DESC' && styles.sortOptionActive]}
              onPress={() => handleApplySort('status', 'DESC')}
            >
              <Text style={styles.sortOptionText}>Trạng thái (Z-A)</Text>
              {sortBy === 'status' && sortOrder === 'DESC' && <Feather name="check" size={20} color={COLORS.primary} />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.sortCancelBtn}
              onPress={() => setIsSortModalOpen(false)}
            >
              <Text style={styles.sortCancelText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* MODALS - Thứ tự render quan trọng: DetailModal trước, AcceptModal sau (z-index cao hơn) */}
      <OwnerPostDetailModal
        visible={detailVisible}
        postId={detailId ?? undefined}
        onClose={() => setDetailVisible(false)}
        onAccept={(postId: string) => {
          const p = posts.find((x) => x.id === postId)
          setSelectedPost(p ?? null)
          setAcceptVisible(true)
          return Promise.resolve()
        }}
        onRefresh={() => fetchPage(1, 20, search, sortBy, sortOrder)}
      />
      <AcceptFromPostModal
        isOpen={acceptVisible}
        post={selectedPost}
        onClose={() => setAcceptVisible(false)}
        onSuccess={() => {
          // Đóng modal accept
          setAcceptVisible(false)
          // Đóng modal detail
          setDetailVisible(false)
          // Refresh danh sách
          fetchPage(1, 20, search, sortBy, sortOrder)
          // Hiển thị thông báo
          showToast('Đã chấp nhận bài đăng', 'success')
        }}
      />

      {/* TOAST */}
      {toast.visible && (
        <View style={[styles.toast, toast.type === 'success' ? styles.toastSuccess : styles.toastError]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: COLORS.border
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  headerBtn: { flexDirection: 'row', alignItems: 'center', padding: 4 },
  headerBtnText: { fontSize: 15, fontWeight: '500', color: COLORS.text, marginLeft: 4 },

  body: { flex: 1 },

  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  statusText: { fontSize: 16, color: '#6B7280' },
  errorText: { fontSize: 16, color: '#EF4444', textAlign: 'center', paddingHorizontal: 20 },
  retryButton: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryButtonText: { color: '#FFFFFF', fontWeight: '600' },

  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#E0F2FE',
    borderBottomWidth: 1,
    borderBottomColor: '#BAE6FD',
  },
  infoBannerText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0369A1',
  },

  // Sort Modal
  sortModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  sortModal: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  sortModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
  },
  sortOptionActive: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  sortOptionText: {
    fontSize: 15,
    color: '#111827',
  },
  sortCancelBtn: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sortCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Toast
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 32,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  toastSuccess: {
    backgroundColor: '#10B981',
  },
  toastError: {
    backgroundColor: '#EF4444',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  listContainer: {
    flex: 1,
  },
})

export default PostPackagesManagementScreen
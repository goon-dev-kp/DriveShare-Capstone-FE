import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  FlatList,
  RefreshControl,
  AppState,
  AppStateStatus,
  Modal,
  Pressable,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import ownerDriverLinkService, { DriverTeamInfoDTO } from '@/services/ownerDriverLinkService'
import userService, { OwnerProfileDTO } from '@/services/userService'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale/vi'

const DriverTeamScreen: React.FC = () => {
  const router = useRouter()
  const [teams, setTeams] = useState<DriverTeamInfoDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddOwnerForm, setShowAddOwnerForm] = useState(false)
  
  // Owner list states
  const [owners, setOwners] = useState<OwnerProfileDTO[]>([])
  const [loadingOwners, setLoadingOwners] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [pageNumber, setPageNumber] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  // Confirmation Modal States
  const [confirmModalVisible, setConfirmModalVisible] = useState(false)
  const [alertModalVisible, setAlertModalVisible] = useState(false)
  const [selectedOwner, setSelectedOwner] = useState<{ id: string; name: string } | null>(null)
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: 'success' | 'error' }>({ title: '', message: '', type: 'success' })
  
  // Search & Sort
  const [searchText, setSearchText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchBar, setShowSearchBar] = useState(false)
  const [sortField] = useState('fullname')
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC')
  
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadTeams()
  }, [])

  useEffect(() => {
    if (showAddOwnerForm) {
      fetchOwners(1)
    }

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && showAddOwnerForm) {
        setPageNumber(1)
        fetchOwners(1)
      }
    })

    return () => {
      subscription?.remove()
    }
  }, [showAddOwnerForm, searchQuery, sortField, sortDirection])

  const loadTeams = async () => {
    try {
      setLoading(true)
      const response = await ownerDriverLinkService.getMyTeams()

      if (response.success) {
        setTeams(response.data || [])
        setError(null)
      } else {
        setError(response.error || 'Không thể tải thông tin')
      }
    } catch (err) {
      setError('Lỗi kết nối')
      console.error('Load team info error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchOwners = async (page: number) => {
    if (page === 1) {
      setLoadingOwners(true)
    }

    try {
      const response = await userService.getUsersByRole(
        'Owner',
        page,
        10,
        searchQuery || undefined,
        sortField,
        sortDirection
      )

      console.log('getUsersByRole response:', response)

      if (response.isSuccess && response.result && response.result.data) {
        const { data, totalCount, hasNextPage } = response.result

        if (Array.isArray(data)) {
          if (page === 1) {
            setOwners(data)
          } else {
            setOwners(prev => [...prev, ...data])
          }

          setTotalCount(totalCount || 0)
          setHasMore(hasNextPage || false)
        } else {
          console.error('Data is not an array:', data)
          if (page === 1) {
            setOwners([])
          }
          setHasMore(false)
        }
      } else {
        console.log('No valid result:', response)
        if (page === 1) {
          setOwners([])
        }
        setHasMore(false)
      }
    } catch (err) {
      console.error('Fetch owners error:', err)
      if (page === 1) {
        setOwners([])
      }
      setHasMore(false)
    } finally {
      setLoadingOwners(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    setPageNumber(1)
    fetchOwners(1)
  }

  const handleLoadMore = () => {
    if (!loadingOwners && hasMore) {
      const nextPage = pageNumber + 1
      setPageNumber(nextPage)
      fetchOwners(nextPage)
    }
  }

  const handleSearch = () => {
    setSearchQuery(searchText.trim())
    setPageNumber(1)
  }

  const toggleSort = () => {
    setSortDirection(prev => (prev === 'ASC' ? 'DESC' : 'ASC'))
    setPageNumber(1)
  }

  const clearSearch = () => {
    setSearchText('')
    setSearchQuery('')
    setPageNumber(1)
  }

  const handleJoinRequest = (ownerId: string, ownerName: string) => {
    setSelectedOwner({ id: ownerId, name: ownerName })
    setConfirmModalVisible(true)
  }

  const confirmJoinRequest = async () => {
    if (!selectedOwner) return

    setConfirmModalVisible(false)
    
    try {
      setSubmitting(true)
      const response = await ownerDriverLinkService.createJoinRequest({
        OwnerId: selectedOwner.id,
      })

      if (response.success) {
        setAlertConfig({
          title: 'Thành công',
          message: response.message || 'Gửi yêu cầu thành công',
          type: 'success',
        })
        setAlertModalVisible(true)
        loadTeams()
      } else {
        setAlertConfig({
          title: 'Lỗi',
          message: response.error || 'Không thể gửi yêu cầu',
          type: 'error',
        })
        setAlertModalVisible(true)
      }
    } catch (err) {
      setAlertConfig({
        title: 'Lỗi',
        message: 'Đã xảy ra lỗi khi gửi yêu cầu',
        type: 'error',
      })
      setAlertModalVisible(true)
      console.error('Join request error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  type StatusInfo = {
    text: string
    color: string
    bg: string
    icon: keyof typeof MaterialCommunityIcons.glyphMap
  }

  const getStatusInfo = (status: string): StatusInfo => {
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

  // Render Team Card
  const TeamCard = ({ team }: { team: DriverTeamInfoDTO }) => {
    const statusInfo = getStatusInfo(team.status)
    
    return (
      <View style={styles.teamCard}>
        <View style={styles.teamCardHeader}>
          {team.ownerAvatar ? (
            <Image source={{ uri: team.ownerAvatar }} style={styles.teamAvatar} />
          ) : (
            <View style={styles.teamAvatarPlaceholder}>
              <MaterialCommunityIcons name="account" size={28} color="#94A3B8" />
            </View>
          )}
          
          <View style={styles.teamCardInfo}>
            <Text style={styles.teamOwnerName}>{team.ownerName || 'Chưa có thông tin'}</Text>
            <View style={styles.ownerCompanyRow}>
              <MaterialCommunityIcons name="email" size={12} color="#64748B" />
              <Text style={styles.teamCompanyText}>{team.ownerEmail}</Text>
            </View>
            <View style={[styles.teamStatusBadge, { backgroundColor: statusInfo.bg }]}>
              <MaterialCommunityIcons name={statusInfo.icon} size={14} color={statusInfo.color} />
              <Text style={[styles.teamStatusText, { color: statusInfo.color }]}>
                {statusInfo.text}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.teamCardFooter}>
          <View style={styles.teamInfoItem}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#64748B" />
            <Text style={styles.teamInfoText}>
              {format(new Date(team.requestedAt), 'dd/MM/yyyy', { locale: vi })}
            </Text>
          </View>
          {team.approvedAt && (
            <View style={styles.teamInfoItem}>
              <MaterialCommunityIcons name="check-circle-outline" size={16} color="#10B981" />
              <Text style={styles.teamInfoText}>
                {format(new Date(team.approvedAt), 'dd/MM/yyyy', { locale: vi })}
              </Text>
            </View>
          )}
        </View>
      </View>
    )
  }

  // Render Owner Card
  const renderOwnerCard = ({ item }: { item: OwnerProfileDTO }) => (
    <TouchableOpacity
      style={styles.ownerCard}
      onPress={() => handleJoinRequest(item.userId, item.fullName)}
      disabled={submitting}
    >
      <View style={styles.ownerCardHeader}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.ownerAvatar} />
        ) : (
          <View style={styles.ownerAvatarPlaceholder}>
            <MaterialCommunityIcons name="account" size={32} color="#94A3B8" />
          </View>
        )}

        <View style={styles.ownerCardInfo}>
          <Text style={styles.ownerCardName}>{item.fullName}</Text>
          {item.companyName && (
            <View style={styles.ownerCompanyRow}>
              <MaterialCommunityIcons name="office-building" size={14} color="#64748B" />
              <Text style={styles.ownerCompanyText}>{item.companyName}</Text>
            </View>
          )}
          {item.hasVerifiedCitizenId && (
            <View style={styles.verifiedBadge}>
              <MaterialCommunityIcons name="check-decagram" size={14} color="#10B981" />
              <Text style={styles.verifiedText}>Đã xác thực</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.ownerCardStats}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="car-multiple" size={18} color="#3B82F6" />
          <Text style={styles.statValue}>{item.totalVehicles}</Text>
          <Text style={styles.statLabel}>Xe</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="account-group" size={18} color="#8B5CF6" />
          <Text style={styles.statValue}>{item.totalDrivers}</Text>
          <Text style={styles.statLabel}>Tài xế</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="map-marker-path" size={18} color="#F59E0B" />
          <Text style={styles.statValue}>{item.totalTripsCreated}</Text>
          <Text style={styles.statLabel}>Chuyến</Text>
        </View>
      </View>

      <View style={styles.ownerCardFooter}>
        <MaterialCommunityIcons name="account-plus" size={18} color="#3B82F6" />
        <Text style={styles.ownerCardFooterText}>Gửi yêu cầu gia nhập</Text>
      </View>
    </TouchableOpacity>
  )

  // Render: Loading
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Đang tải thông tin đội xe...</Text>
      </View>
    )
  }

  // Render: Error
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadTeams}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // Main Screen with Teams List + Add Owner Feature
  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.screenHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Đội Xe Của Tôi</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        {/* Current Teams Section */}
        {teams.length > 0 && (
          <View style={styles.teamsSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account-group" size={24} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Đội xe của tôi ({teams.length})</Text>
          </View>
          
          {teams.map((team, index) => (
            <TeamCard key={index} team={team} />
          ))}
        </View>
      )}

      {/* Add Owner Button/Section */}
      <View style={styles.addOwnerSection}>
        <TouchableOpacity
          style={styles.addOwnerButton}
          onPress={() => setShowAddOwnerForm(!showAddOwnerForm)}
        >
          <MaterialCommunityIcons 
            name={showAddOwnerForm ? "minus-circle" : "plus-circle"} 
            size={24} 
            color="#3B82F6" 
          />
          <Text style={styles.addOwnerButtonText}>
            {showAddOwnerForm ? 'Đóng danh sách chủ xe' : 'Thêm chủ xe mới'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Owner Selection Form */}
      {showAddOwnerForm && (
        <View style={styles.ownerListSection}>
          {/* Header Section */}
          <View style={styles.listHeader}>
          <View style={styles.listHeaderTop}>
            <View style={styles.listHeaderIcon}>
              <MaterialCommunityIcons name="account-group-outline" size={32} color="#3B82F6" />
            </View>
            <View style={styles.listHeaderInfo}>
              <Text style={styles.listHeaderTitle}>Chọn chủ xe</Text>
              <Text style={styles.listHeaderSubtitle}>
                {totalCount > 0 ? `${totalCount} chủ xe có sẵn` : 'Không có chủ xe'}
              </Text>
            </View>
          </View>

          {/* Search & Sort Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={styles.searchToggle}
              onPress={() => setShowSearchBar(!showSearchBar)}
            >
              <MaterialCommunityIcons
                name={showSearchBar ? 'magnify-minus' : 'magnify'}
                size={22}
                color="#3B82F6"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.sortButton} onPress={toggleSort}>
              <MaterialCommunityIcons
                name={sortDirection === 'ASC' ? 'sort-ascending' : 'sort-descending'}
                size={22}
                color="#3B82F6"
              />
              <Text style={styles.sortButtonText}>
                {sortDirection === 'ASC' ? 'A → Z' : 'Z → A'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Collapsible Search Bar */}
          {showSearchBar && (
            <View style={styles.searchBarContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm theo tên, email, công ty..."
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              {searchText.length > 0 && (
                <TouchableOpacity style={styles.searchClearButton} onPress={clearSearch}>
                  <MaterialCommunityIcons name="close-circle" size={20} color="#94A3B8" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                <MaterialCommunityIcons name="magnify" size={20} color="#FFFFFF" />
                <Text style={styles.searchButtonText}>Tìm</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Owner List */}
        <FlatList
          data={owners}
          renderItem={renderOwnerCard}
          keyExtractor={item => item.userId}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#3B82F6']} />
          }
          ListEmptyComponent={
            !loadingOwners ? (
              <View style={styles.emptyListContainer}>
                <MaterialCommunityIcons name="account-off-outline" size={64} color="#CBD5E1" />
                <Text style={styles.emptyListTitle}>Không tìm thấy chủ xe</Text>
                <Text style={styles.emptyListSubtitle}>
                  {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Chưa có chủ xe nào trong hệ thống'}
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            loadingOwners && pageNumber > 1 ? (
              <View style={styles.loadingFooter}>
                <ActivityIndicator size="small" color="#3B82F6" />
              </View>
            ) : null
          }
        />

        {loadingOwners && pageNumber === 1 && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Đang tải danh sách chủ xe...</Text>
          </View>
        )}

        {/* Confirmation Modal */}
        <Modal
          visible={confirmModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setConfirmModalVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setConfirmModalVisible(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Xác nhận</Text>
              <Text style={styles.modalMessage}>
                Bạn muốn gửi yêu cầu gia nhập đội xe của "{selectedOwner?.name}"?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setConfirmModalVisible(false)}
                >
                  <Text style={styles.modalButtonTextCancel}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={confirmJoinRequest}
                  disabled={submitting}
                >
                  <Text style={styles.modalButtonTextConfirm}>
                    {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Alert Modal */}
        <Modal
          visible={alertModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setAlertModalVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setAlertModalVisible(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.alertModalContent}>
                <View
                  style={[
                    styles.alertIcon,
                    alertConfig.type === 'success' ? styles.alertIconSuccess : styles.alertIconError,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={alertConfig.type === 'success' ? 'check-circle' : 'alert-circle'}
                    size={32}
                    color={alertConfig.type === 'success' ? '#10B981' : '#EF4444'}
                  />
                </View>
                <Text style={styles.modalTitle}>{alertConfig.title}</Text>
                <Text style={styles.modalMessage}>{alertConfig.message}</Text>
                <TouchableOpacity
                  style={[
                    styles.alertButton,
                    alertConfig.type === 'success' ? styles.alertButtonSuccess : styles.alertButtonError,
                  ]}
                  onPress={() => setAlertModalVisible(false)}
                >
                  <Text style={styles.alertButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
        </View>
      )}

      {/* Modals */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setConfirmModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Xác nhận</Text>
            <Text style={styles.modalMessage}>
              Bạn muốn gửi yêu cầu gia nhập đội xe của "{selectedOwner?.name}"?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setConfirmModalVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmJoinRequest}
                disabled={submitting}
              >
                <Text style={styles.modalButtonTextConfirm}>
                  {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={alertModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAlertModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setAlertModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.alertModalContent}>
              <View
                style={[
                  styles.alertIcon,
                  alertConfig.type === 'success' ? styles.alertIconSuccess : styles.alertIconError,
                ]}
              >
                <MaterialCommunityIcons
                  name={alertConfig.type === 'success' ? 'check-circle' : 'alert-circle'}
                  size={32}
                  color={alertConfig.type === 'success' ? '#10B981' : '#EF4444'}
                />
              </View>
              <Text style={styles.modalTitle}>{alertConfig.title}</Text>
              <Text style={styles.modalMessage}>{alertConfig.message}</Text>
              <TouchableOpacity
                style={[
                  styles.alertButton,
                  alertConfig.type === 'success' ? styles.alertButtonSuccess : styles.alertButtonError,
                ]}
                onPress={() => setAlertModalVisible(false)}
              >
                <Text style={styles.alertButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 4,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  // Teams Section
  teamsSection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  teamCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  teamCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
  },
  teamAvatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  teamCardInfo: {
    flex: 1,
  },
  teamOwnerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  teamCompanyText: {
    fontSize: 12,
    color: '#64748B',
  },
  teamStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  teamStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  teamCardFooter: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  teamInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teamInfoText: {
    fontSize: 12,
    color: '#64748B',
  },
  // Add Owner Section
  addOwnerSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  addOwnerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#EFF6FF',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DBEAFE',
    borderStyle: 'dashed',
  },
  addOwnerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
  },
  // Owner List Section
  ownerListSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
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
  // Owner List Styles
  listHeader: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  listHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  listHeaderIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listHeaderInfo: {
    flex: 1,
  },
  listHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  listHeaderSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchToggle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    gap: 8,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1E293B',
  },
  searchClearButton: {
    position: 'absolute',
    right: 88,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    paddingHorizontal: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    gap: 6,
  },
  searchButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  ownerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ownerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ownerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  ownerAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ownerCardInfo: {
    flex: 1,
  },
  ownerCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  ownerCompanyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  ownerCompanyText: {
    fontSize: 13,
    color: '#64748B',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  ownerCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E2E8F0',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  ownerCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  ownerCardFooterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  emptyListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyListTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyListSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  headerSection: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
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
  ownerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerInfo: {
    flex: 1,
  },
  ownerLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  contactSection: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactText: {
    fontSize: 14,
    color: '#1E293B',
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
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
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: '#475569',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F1F5F9',
  },
  modalButtonConfirm: {
    backgroundColor: '#3B82F6',
  },
  modalButtonTextCancel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  modalButtonTextConfirm: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  alertModalContent: {
    alignItems: 'center',
  },
  alertIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  alertIconSuccess: {
    backgroundColor: '#D1FAE5',
  },
  alertIconError: {
    backgroundColor: '#FEE2E2',
  },
  alertButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertButtonSuccess: {
    backgroundColor: '#10B981',
  },
  alertButtonError: {
    backgroundColor: '#EF4444',
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})

export default DriverTeamScreen

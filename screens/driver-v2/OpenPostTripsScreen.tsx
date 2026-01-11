import React, { useState, useCallback } from 'react'
import { 
    View, Text, StyleSheet, FlatList, TouchableOpacity, 
    ActivityIndicator, RefreshControl, StatusBar, TextInput
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons'
import postTripService from '@/services/postTripService'

// --- 1. TYPES & HELPER FUNCTIONS ---

type AnyObj = Record<string, any>

function get(obj: AnyObj, ...keys: string[]) {
  for (const k of keys) {
    if (obj == null) return undefined
    obj = obj[k]
  }
  return obj
}

function normalizePost(raw: AnyObj) {
  const id = raw.postTripId || raw.PostTripId || raw.id || raw.Id
  const title = raw.title || raw.Title || ''
  const description = raw.description || raw.Description || ''
  const status = raw.status || raw.Status || 'UNKNOWN'
  const requiredPayloadInKg = raw.requiredPayloadInKg ?? raw.RequiredPayloadInKg
  
  const trip = raw.trip || raw.Trip
  const sRaw = get(trip || {}, 'StartLocationName') || get(trip || {}, 'startLocationName') || ''
  const eRaw = get(trip || {}, 'EndLocationName') || get(trip || {}, 'endLocationName') || ''
  const startName = typeof sRaw === 'string' ? sRaw : ''
  const endName = typeof eRaw === 'string' ? eRaw : ''
  
  const details = raw.postTripDetails || raw.PostTripDetails || []
  const createdAt = raw.createAt || raw.CreateAt
  
  const totalDrivers = details.reduce((s: number, d: AnyObj) => s + (d.requiredCount ?? d.RequiredCount ?? 0), 0)

  return { id, title, description, status, requiredPayloadInKg, startName, endName, details, createdAt, totalDrivers }
}

// --- 2. POST TRIP CARD ---

interface CardProps {
    item: ReturnType<typeof normalizePost>;
    onPress: () => void;
}

const PostTripCard: React.FC<CardProps> = ({ item, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.card}>
        <View style={styles.cardHeaderRow}>
            <View style={[styles.statusBadge, { backgroundColor: '#ECFDF5' }]}>
                <Text style={[styles.statusText, { color: '#059669' }]}>ĐANG MỞ</Text>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Ionicons name="time-outline" size={14} color="#9CA3AF" style={{marginRight: 4}}/>
                <Text style={styles.dateText}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'Vừa xong'}
                </Text>
            </View>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

        <View style={styles.routeContainer}>
            <View style={styles.routeRow}>
                <View style={styles.routeDotStart}>
                    <View style={styles.innerDot} />
                </View>
                <Text style={styles.routeText} numberOfLines={1}>
                    {item.startName || 'Điểm đi chưa xác định'}
                </Text>
            </View>
            
            <View style={styles.connectorContainer}>
                <View style={styles.connectorLine} />
            </View>

            <View style={styles.routeRow}>
                <View style={styles.routeDotEnd}>
                    <MaterialCommunityIcons name="map-marker" size={12} color="#FFF" />
                </View>
                <Text style={styles.routeText} numberOfLines={1}>
                    {item.endName || 'Điểm đến chưa xác định'}
                </Text>
            </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statsGrid}>
            <View style={styles.statItem}>
                <View style={[styles.iconBox, {backgroundColor: '#EEF2FF'}]}>
                    <MaterialCommunityIcons name="weight-kilogram" size={18} color="#4F46E5" />
                </View>
                <View>
                    <Text style={styles.statLabel}>Tải trọng</Text>
                    <Text style={styles.statValue}>
                        {item.requiredPayloadInKg ? `${item.requiredPayloadInKg} kg` : '--'}
                    </Text>
                </View>
            </View>

            <View style={styles.verticalLine} />

            <View style={styles.statItem}>
                <View style={[styles.iconBox, {backgroundColor: '#FEF3C7'}]}>
                    <Ionicons name="people" size={18} color="#D97706" />
                </View>
                <View>
                    <Text style={styles.statLabel}>Cần tuyển</Text>
                    <Text style={styles.statValue}>{item.totalDrivers} Tài xế</Text>
                </View>
            </View>
        </View>
    </TouchableOpacity>
  )
}

// --- 3. MAIN SCREEN ---

const OpenPostTripsScreen: React.FC = () => {
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [pageNumber, setPageNumber] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  
  const [searchText, setSearchText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<string>('CreateAt')
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC')
  const [showSearchBar, setShowSearchBar] = useState(false)

  const fetchPage = async (page: number, append = false) => {
    try {
      if (!append) setLoading(true)
      
      const res: any = await postTripService.getOpen(
        page, 
        10, 
        searchQuery || undefined,
        sortField,
        sortDirection
      )
      
      const ok = res?.isSuccess ?? (res?.statusCode === 200)
      const payload = res?.result || res?.data || res
      const data = payload?.data || payload?.items || payload?.results || payload
      const totalCount = payload?.totalCount ?? (Array.isArray(data) ? data.length : 0)
      
      const arr = Array.isArray(data) ? data : []
      const mapped = arr.map(normalizePost)
      
      setItems(prev => append ? [...prev, ...mapped] : mapped)
      setHasMore((page * 10) < totalCount)
    } catch (e) {
      console.error('Fetch posts error:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Mỗi lần focus vào trang này sẽ fetch API mới (không cache)
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 [OpenPostTrips] Screen focused - fetching fresh data...')
      
      // Reset states và fetch data mới
      setItems([])
      setPageNumber(1)
      setHasMore(true)
      fetchPage(1)
      
      // Cleanup khi blur (optional - có thể bỏ nếu muốn giữ data khi quay lại)
      return () => {
        console.log('👋 [OpenPostTrips] Screen blurred')
      }
    }, [searchQuery, sortField, sortDirection])
  )

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    setPageNumber(1)
    fetchPage(1)
  }, [searchQuery, sortField, sortDirection])

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return
    const next = pageNumber + 1
    setPageNumber(next)
    fetchPage(next, true)
  }, [loading, hasMore, pageNumber, searchQuery, sortField, sortDirection])

  const navigateToDetail = (id: string) => {
    router.push({ pathname: '/(driver)/trip-post/[postTripId]', params: { postTripId: id } })
  }

  const handleSearch = () => {
    setSearchQuery(searchText.trim())
    setPageNumber(1)
  }

  const handleClearSearch = () => {
    setSearchText('')
    setSearchQuery('')
    setPageNumber(1)
  }

  const toggleSort = () => {
    setSortDirection(prev => prev === 'ASC' ? 'DESC' : 'ASC')
    setPageNumber(1)
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tìm Chuyến Mới</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.iconBtn} 
            onPress={() => setShowSearchBar(!showSearchBar)}
          >
            <Ionicons name="search" size={20} color="#4B5563" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={toggleSort}>
            <MaterialCommunityIcons 
              name={sortDirection === 'ASC' ? 'sort-ascending' : 'sort-descending'} 
              size={20} 
              color="#4B5563" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {showSearchBar && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm chuyến theo tiêu đề, địa điểm..."
              placeholderTextColor="#9CA3AF"
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>Tìm</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && items.length === 0 ? (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Đang tải danh sách...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          renderItem={({ item }) => (
            <PostTripCard 
                item={item} 
                onPress={() => navigateToDetail(item.id)} 
            />
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
          }
          ListEmptyComponent={!loading ? (
              <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="clipboard-text-search-outline" size={64} color="#D1D5DB" />
                  <Text style={styles.emptyText}>Hiện chưa có bài đăng nào.</Text>
                  <Text style={styles.emptySubText}>Vui lòng quay lại sau!</Text>
              </View>
          ) : null}
          ListFooterComponent={
            loading && items.length > 0 ? 
            <ActivityIndicator style={{marginTop: 12}} color="#4F46E5" /> : 
            <View style={{height: 24}}/>
          }
        />
      )}
    </SafeAreaView>
  )
}

// --- 4. STYLES ---

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F3F4F6' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowOffset: {width:0, height:2}
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827', flex: 1 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 8, backgroundColor: '#F9FAFB', borderRadius: 8 },

  searchContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#1F2937',
  },
  clearBtn: { padding: 4 },
  searchBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  listContent: { padding: 16, paddingBottom: 32 },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14 },

  card: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: '#F3F4F6',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.06, 
    shadowRadius: 8, 
    elevation: 3 
  },
  
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  dateText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },

  cardTitle: { fontSize: 16, fontWeight: '800', color: '#111827', lineHeight: 24, marginBottom: 14 },

  routeContainer: { marginBottom: 8 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 24 },
  
  routeDotStart: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  innerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563EB' },
  
  routeDotEnd: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
  
  routeText: { fontSize: 14, color: '#374151', flex: 1, fontWeight: '500' },
  
  connectorContainer: { paddingLeft: 8.5, height: 16, justifyContent: 'center' },
  connectorLine: { width: 1, height: '100%', backgroundColor: '#D1D5DB' },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 14 },

  statsGrid: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 11, color: '#6B7280', marginBottom: 2 },
  statValue: { fontSize: 14, fontWeight: '700', color: '#111827' },
  verticalLine: { width: 1, height: 30, backgroundColor: '#F3F4F6', marginHorizontal: 8 },

  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#374151', marginTop: 16, fontSize: 16, fontWeight: '600' },
  emptySubText: { color: '#9CA3AF', marginTop: 4, fontSize: 14 },
})

export default OpenPostTripsScreen

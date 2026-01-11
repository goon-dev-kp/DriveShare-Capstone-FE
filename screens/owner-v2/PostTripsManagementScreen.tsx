import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import postTripService from '@/services/postTripService';
import PostTripCard from './components/PostTripCard';
import InlinePostTripSignModal from './components/InlinePostTripSignModal';
import InlinePostTripPaymentModal from './components/InlinePostTripPaymentModal';

const PostTripsManagementScreen: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Modal states for sign & payment
  const [signModalVisible, setSignModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const fetchPage = async (page: number, append = false) => {
    try {
      if (!append) setLoading(true);
      const res: any = await postTripService.getMy(page, 10);
      
      const payload = res?.result || res?.data || res;
      const data = payload?.data || payload?.items || payload?.results || payload || [];
      const total = payload?.totalCount ?? (Array.isArray(data) ? data.length : 0);
      
      const arr = Array.isArray(data) ? data : [];

      setItems(prev => append ? [...prev, ...arr] : arr);
      setHasMore((page * 10) < total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchPage(1); }, []));

  const onRefresh = () => { setRefreshing(true); setPageNumber(1); fetchPage(1); };
  const loadMore = () => { if (!loading && hasMore) { const next = pageNumber + 1; setPageNumber(next); fetchPage(next, true); } };

  const handleSign = (postId: string) => {
    setSelectedPostId(postId);
    setSignModalVisible(true);
  };

  const handlePay = (postId: string) => {
    setSelectedPostId(postId);
    setPaymentModalVisible(true);
  };

  const handleSignDone = () => {
    setSignModalVisible(false);
    setSelectedPostId(null);
    onRefresh();
  };

  const handlePaymentDone = () => {
    setPaymentModalVisible(false);
    setSelectedPostId(null);
    onRefresh();
  };

  const handleEdit = (post: any) => {
    Alert.alert('Chỉnh sửa', 'Tính năng đang phát triển');
  };

  const handleDelete = (post: any) => {
    Alert.alert('Xác nhận xóa', `Bạn có chắc muốn xóa bài đăng "${post.title || post.Title}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            // Note: implement delete endpoint if available
            Alert.alert('Thông báo', 'Tính năng xóa đang phát triển');
            // await postTripService.delete(post.postTripId || post.id);
            // onRefresh();
          } catch (e: any) {
            Alert.alert('Lỗi', e?.message || 'Không thể xóa bài đăng');
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Quản lý bài đăng</Text>
          <View style={{ width: 32 }} />
        </View>
        <Text style={styles.subTitle}>Danh sách các chuyến bạn đang tuyển tài xế</Text>
      </View>

      {loading && !refreshing && items.length === 0 ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.postTripId || item.id}
          renderItem={({ item }) => (
            <PostTripCard 
              post={item}
              onView={(id) => router.push({ pathname: '/(owner)/trip-post/[postTripId]', params: { postTripId: id } })}
              onSign={handleSign}
              onPay={handlePay}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item)}
              showActions={true}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
          ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>Chưa có bài đăng nào</Text></View>}
        />
      )}

      {/* Sign Modal */}
      <InlinePostTripSignModal
        visible={signModalVisible}
        postId={selectedPostId || undefined}
        onClose={() => setSignModalVisible(false)}
        onDone={handleSignDone}
      />

      {/* Payment Modal */}
      <InlinePostTripPaymentModal
        visible={paymentModalVisible}
        postId={selectedPostId || undefined}
        onClose={() => setPaymentModalVisible(false)}
        onDone={handlePaymentDone}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 20, paddingBottom: 10, backgroundColor: '#fff' },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 4 },
  pageTitle: { fontSize: 20, fontWeight: '800', color: '#111827', flex: 1, textAlign: 'center' },
  subTitle: { fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center' },
  listContent: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  emptyText: { color: '#9CA3AF', fontSize: 16 },
});

export default PostTripsManagementScreen;
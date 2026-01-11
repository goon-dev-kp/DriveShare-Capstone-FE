import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import postTripService from '@/services/postTripService';
import tripService from '@/services/tripService';
import StatusBadge from './components/StatusBadge';
import TripDetailModal from './components/TripDetailModal';
import InlinePostTripSignModal from './components/InlinePostTripSignModal';
import InlinePostTripPaymentModal from './components/InlinePostTripPaymentModal';
import { SafeAreaView } from 'react-native-safe-area-context';

// Normalizer riêng cho màn Detail
const normalizeDetail = (raw: any) => {
  const id = raw.postTripId || raw.PostTripId;
  const title = raw.title || raw.Title || '';
  const description = raw.description || raw.Description || '';
  const status = raw.status || raw.Status || 'UNKNOWN';
  const requiredPayload = raw.requiredPayloadInKg ?? raw.RequiredPayloadInKg;
  
  const tripRaw = raw.trip || raw.Trip || {};
  const tripInfo = {
    tripId: tripRaw.tripId || tripRaw.TripId,
    start: tripRaw.startLocationName || tripRaw.StartLocationName,
    end: tripRaw.endLocationName || tripRaw.EndLocationName,
    time: tripRaw.startTime || tripRaw.StartTime,
  };
  
  const details = (raw.postTripDetails || raw.PostTripDetails || []).map((d: any) => ({
    type: d.type || d.Type,
    count: d.requiredCount ?? d.RequiredCount,
    price: d.pricePerPerson ?? d.PricePerPerson,
    total: (d.totalBudget ?? d.TotalBudget) ?? ((d.pricePerPerson ?? 0) * (d.requiredCount ?? 0)),
    pickup: d.pickupLocation || d.PickupLocation || '—',
    dropoff: d.dropoffLocation || d.DropoffLocation || '—',
    garagePick: d.mustPickAtGarage ?? d.MustPickAtGarage,
    garageDrop: d.mustDropAtGarage ?? d.MustDropAtGarage,
  }));

  return { id, title, description, status, requiredPayload, tripInfo, details };
};

const formatCurrency = (v: any) => new Intl.NumberFormat('vi-VN').format(Number(v || 0));

const PostTripDetailScreen: React.FC = () => {
  const router = useRouter();
  const { postTripId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // State cho Trip Modal
  const [showTripModal, setShowTripModal] = useState(false);
  const [tripLoading, setTripLoading] = useState(false);
  const [tripData, setTripData] = useState<any>(null);
  const [tripError, setTripError] = useState<string | null>(null);
  
  // State cho Sign & Payment Modals
  const [showSignModal, setShowSignModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await postTripService.getById(String(postTripId));
      setData(normalizeDetail(res?.result || res?.data || res));
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [postTripId]);

  const handleSignDone = () => {
    setShowSignModal(false);
    // Tự động mở payment modal sau khi sign xong
    setTimeout(() => {
      setShowPaymentModal(true);
    }, 300);
  };

  const handlePaymentDone = () => {
    setShowPaymentModal(false);
    // Refresh data sau khi thanh toán xong
    loadData();
  };

  const handleActionButton = () => {
    const status = data?.status?.toUpperCase();
    if (status === 'AWAITING_SIGNATURE') {
      setShowSignModal(true);
    } else if (status === 'AWAITING_PAYMENT') {
      setShowPaymentModal(true);
    }
  };

  const fetchTripDetail = async () => {
    if (!data?.tripInfo?.tripId) return;
    setShowTripModal(true);
    if (tripData) return; // Đã load rồi thì không load lại

    setTripLoading(true);
    setTripError(null);
    try {
      const res: any = await tripService.getById(String(data.tripInfo.tripId));
      setTripData(res?.result || res?.data || res); // Normalize trong Modal nếu cần
    } catch (e: any) {
      setTripError('Không tải được dữ liệu chuyến');
    } finally {
      setTripLoading(false);
    }
  };

  if (loading) return <View style={styles.container}><View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View></View>;
  if (error || !data) return <View style={styles.container}><View style={styles.center}><Text>Lỗi tải trang</Text></View></View>;

  const totalBudget = data?.details.reduce((acc: number, cur: any) => acc + cur.total, 0) || 0;
  const status = data?.status?.toUpperCase();
  const showActionButton = status === 'AWAITING_SIGNATURE' || status === 'AWAITING_PAYMENT';

  return (
    <SafeAreaView  style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header with Back Button */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>Chi tiết bài đăng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Header Block */}
        <View style={styles.headerCard}>
          <StatusBadge status={data.status} />
          <Text style={styles.title}>{data.title}</Text>
          {!!data.description && <Text style={styles.desc}>{data.description}</Text>}
          
          <View style={styles.totalBudgetBox}>
            <Text style={styles.budgetLabel}>Tổng ngân sách dự kiến</Text>
            <Text style={styles.budgetValue}>{formatCurrency(totalBudget)} VND</Text>
          </View>
        </View>

        {/* Trip Info Block */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Thông tin tuyến</Text>
            <TouchableOpacity onPress={fetchTripDetail} style={styles.linkBtn}>
              <Text style={styles.linkText}>Xem chi tiết chuyến</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.routeContainer}>
            <Text style={styles.routeLabel}>Từ:</Text>
            <Text style={styles.routeVal}>{data.tripInfo.start}</Text>
            <View style={styles.dashLine} />
            <Text style={styles.routeLabel}>Đến:</Text>
            <Text style={styles.routeVal}>{data.tripInfo.end}</Text>
          </View>
          
          <View style={styles.metaRow}>
             <View style={styles.metaItem}>
               <Text style={styles.metaLabel}>Tải trọng</Text>
               <Text style={styles.metaVal}>{data.requiredPayload} kg</Text>
             </View>
             <View style={styles.metaItem}>
               <Text style={styles.metaLabel}>Khởi hành</Text>
               <Text style={styles.metaVal}>{new Date(data.tripInfo.time).toLocaleDateString('vi-VN')}</Text>
             </View>
          </View>
        </View>

        {/* Details List */}
        <Text style={styles.bigHeader}>Chi tiết tuyển dụng</Text>
        {data.details.map((d: any, idx: number) => (
          <View key={idx} style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Text style={styles.roleTitle}>{d.type === 'PRIMARY' ? 'Tài xế chính' : 'Tài xế phụ'}</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>x{d.count}</Text>
              </View>
            </View>
            
            <View style={styles.priceRow}>
              <Text style={styles.priceText}>{formatCurrency(d.price)} đ/người</Text>
              <Text style={styles.totalText}>Tổng: {formatCurrency(d.total)} đ</Text>
            </View>

            <View style={styles.locBlock}>
              <Text style={styles.locRow}><Text style={{fontWeight:'600'}}>Đón:</Text> {d.pickup} {d.garagePick && <Text style={styles.tag}> (Tại bãi)</Text>}</Text>
              <Text style={styles.locRow}><Text style={{fontWeight:'600'}}>Trả:</Text> {d.dropoff} {d.garageDrop && <Text style={styles.tag}> (Tại bãi)</Text>}</Text>
            </View>
          </View>
        ))}

        {/* Action Button */}
        {showActionButton && (
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleActionButton}>
              <Ionicons 
                name={status === 'AWAITING_SIGNATURE' ? 'create-outline' : 'card-outline'} 
                size={20} 
                color="#fff" 
              />
              <Text style={styles.actionBtnText}>
                {status === 'AWAITING_SIGNATURE' ? 'Ký hợp đồng' : 'Thanh toán ngay'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Button */}
        {showActionButton && (
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleActionButton}>
              <Ionicons 
                name={status === 'AWAITING_SIGNATURE' ? 'create-outline' : 'card-outline'} 
                size={20} 
                color="#fff" 
              />
              <Text style={styles.actionBtnText}>
                {status === 'AWAITING_SIGNATURE' ? 'Ký hợp đồng' : 'Thanh toán ngay'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* Modals */}
      <TripDetailModal 
        visible={showTripModal} 
        onClose={() => setShowTripModal(false)}
        loading={tripLoading}
        error={tripError}
        data={tripData}
      />
      
      <InlinePostTripSignModal
        visible={showSignModal}
        postId={String(postTripId)}
        onClose={() => setShowSignModal(false)}
        onDone={handleSignDone}
      />
      
      <InlinePostTripPaymentModal
        visible={showPaymentModal}
        postId={String(postTripId)}
        onClose={() => setShowPaymentModal(false)}
        onDone={handlePaymentDone}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  topHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  backBtn: { padding: 4 },
  topHeaderTitle: { fontSize: 18, fontWeight: '700', color: '#111827', flex: 1, textAlign: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actionContainer: { marginTop: 20, marginBottom: 20 },
  actionBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  
  // Header Card
  headerCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  title: { fontSize: 20, fontWeight: '800', color: '#111827', marginTop: 8, marginBottom: 6 },
  desc: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginBottom: 12 },
  totalBudgetBox: { backgroundColor: '#EEF2FF', padding: 12, borderRadius: 12, alignItems: 'center' },
  budgetLabel: { fontSize: 12, color: '#4338CA', marginBottom: 2 },
  budgetValue: { fontSize: 18, fontWeight: '700', color: '#312E81' },

  // Section Card
  sectionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  linkBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  linkText: { color: '#4F46E5', fontSize: 13, fontWeight: '600' },
  routeContainer: { paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: '#E5E7EB', marginBottom: 12 },
  routeLabel: { fontSize: 12, color: '#9CA3AF' },
  routeVal: { fontSize: 14, color: '#374151', fontWeight: '500', marginBottom: 4 },
  dashLine: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 4 },
  metaRow: { flexDirection: 'row', gap: 20 },
  metaItem: { },
  metaLabel: { fontSize: 12, color: '#9CA3AF' },
  metaVal: { fontSize: 14, fontWeight: '600', color: '#111827' },

  // Detail List
  bigHeader: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  detailCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  roleTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  countBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  countText: { fontSize: 12, fontWeight: '700', color: '#374151' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  priceText: { color: '#4F46E5', fontWeight: '600' },
  totalText: { color: '#6B7280', fontSize: 13 },
  locBlock: { gap: 6 },
  locRow: { fontSize: 13, color: '#4B5563' },
  tag: { color: '#DC2626', fontSize: 12, fontWeight: '500' },
});

export default PostTripDetailScreen;
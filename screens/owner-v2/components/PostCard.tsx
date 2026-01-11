// components/PostCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import StatusBadge from './StatusBadge'; // Import từ file trên

// Helper format tiền tệ
const formatCurrency = (v: any) => new Intl.NumberFormat('vi-VN').format(Number(v || 0));

export const normalizePost = (raw: any) => {
  const id = raw.postTripId || raw.PostTripId || raw.id;
  const title = raw.title || raw.Title || 'Không tiêu đề';
  const description = raw.description || raw.Description || '';
  const status = raw.status || raw.Status || 'UNKNOWN';
  const requiredPayload = raw.requiredPayloadInKg ?? raw.RequiredPayloadInKg;
  
  // Trip Info
  const trip = raw.trip || raw.Trip || {};
  const startName = trip.StartLocationName || trip.startLocationName || '';
  const endName = trip.EndLocationName || trip.endLocationName || '';
  
  const details = raw.postTripDetails || raw.PostTripDetails || [];
  
  // Tính tổng
  const totalDrivers = details.reduce((s: number, d: any) => s + (d.requiredCount ?? d.RequiredCount ?? 0), 0);
  const minPrice = details.length > 0 ? Math.min(...details.map((d: any) => d.pricePerPerson ?? d.PricePerPerson ?? 0)) : 0;

  return { id, title, description, status, requiredPayload, startName, endName, details, totalDrivers, minPrice };
};

const PostCard: React.FC<{ item: any; onPress: () => void }> = ({ item, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.card}>
      {/* Header: Title + Status */}
      <View style={styles.header}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.date}>Mã tin: {item.id.substring(0, 8)}...</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Body: Route & Stats */}
      <View style={styles.body}>
        <View style={styles.routeRow}>
          <View style={styles.dot} />
          <Text style={styles.routeText} numberOfLines={1}>{item.startName}</Text>
        </View>
        <View style={styles.connectLine} />
        <View style={styles.routeRow}>
          <View style={[styles.dot, styles.dotDest]} />
          <Text style={styles.routeText} numberOfLines={1}>{item.endName}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Tải trọng</Text>
            <Text style={styles.statValue}>{item.requiredPayload ?? '--'} kg</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Cần tuyển</Text>
            <Text style={styles.statValue}>{item.totalDrivers} tài xế</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Giá từ</Text>
            <Text style={[styles.statValue, { color: '#4F46E5' }]}>{formatCurrency(item.minPrice)} đ</Text>
          </View>
        </View>
      </View>

      {/* Footer Button */}
      <View style={styles.footer}>
        <Text style={styles.detailLink}>Xem chi tiết &rarr;</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: '#F3F4F6'
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  date: { fontSize: 12, color: '#9CA3AF' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 12 },
  body: { marginBottom: 12 },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6', marginRight: 8 },
  dotDest: { backgroundColor: '#F59E0B' },
  connectLine: { width: 2, height: 10, backgroundColor: '#E5E7EB', marginLeft: 3, marginBottom: 4 },
  routeText: { fontSize: 14, color: '#374151', flex: 1, fontWeight: '500' },
  statsContainer: { flexDirection: 'row', marginTop: 12, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, justifyContent: 'space-between' },
  statItem: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 11, color: '#6B7280', marginBottom: 2 },
  statValue: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  footer: { alignItems: 'flex-end' },
  detailLink: { fontSize: 13, fontWeight: '600', color: '#4F46E5' },
});

export default PostCard;
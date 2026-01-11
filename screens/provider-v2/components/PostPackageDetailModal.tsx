import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Dimensions,
  StatusBar,
  Platform
} from 'react-native';

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import postPackageService from '@/services/postPackageService';
import { useRouter } from 'expo-router';

// --- CONFIG ---
const { width } = Dimensions.get('window');
const COLORS = {
  primary: '#0284C7', // Sky 600
  secondary: '#64748B', // Slate 500
  background: '#F8FAFC', // Slate 50
  white: '#FFFFFF',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  textMain: '#0F172A',
  textSub: '#64748B',
  border: '#E2E8F0',
};

interface Props {
  visible: boolean;
  postId?: string | null;
  onClose: () => void;
}

// --- HELPER COMPONENTS ---

const StatusBadge = ({ status }: { status: string }) => {
  let bg = '#E0F2FE';
  let color = '#0284C7';
  
  const s = (status || '').toUpperCase();
  if (s === 'OPEN' || s === 'PENDING') { bg = '#FEF3C7'; color = '#D97706'; }
  else if (s === 'COMPLETED' || s === 'DELIVERED') { bg = '#D1FAE5'; color = '#059669'; }
  else if (s === 'CANCELLED') { bg = '#FEE2E2'; color = '#DC2626'; }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{status}</Text>
    </View>
  );
};

const AttributeChip = ({ icon, label, color = COLORS.secondary }: any) => (
  <View style={[styles.attrChip, { borderColor: color }]}>
    <MaterialCommunityIcons name={icon} size={14} color={color} />
    <Text style={[styles.attrText, { color }]}>{label}</Text>
  </View>
);

const DetailRow = ({ icon, label, value, isBold = false }: any) => (
  <View style={styles.detailRow}>
    <View style={styles.detailIcon}>{icon}</View>
    <View style={{ flex: 1 }}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, isBold && { fontWeight: '700', color: COLORS.textMain }]}>
        {value || '---'}
      </Text>
    </View>
  </View>
);

// --- MAIN COMPONENT ---

const PostPackageDetailModal: React.FC<Props> = ({ visible, postId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (visible && postId) fetchDetails();
  }, [visible, postId]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res: any = await postPackageService.getPostPackageDetails(postId!);
      setData(res?.result ?? res);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '---';
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours()}:${d.getMinutes() < 10 ? '0' : ''}${d.getMinutes()}`;
  };

  if (!visible) return null;

  const route = data?.shippingRoute;
  const suggestion = data?.driverSuggestion;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textMain} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Chi tiết đơn hàng</Text>
          <View style={{ width: 40 }} /> 
        </View>

        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ marginTop: 10, color: COLORS.secondary }}>Đang tải dữ liệu...</Text>
          </View>
        ) : data ? (
          <>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              
      
              <View style={styles.card}>
                <View style={styles.rowBetween}>
                  <StatusBadge status={data.status} />
                  <Text style={styles.dateText}>Ngày tạo: {formatDate(data.created)}</Text>
                </View>
                <Text style={styles.title}>{data.title}</Text>
                <Text style={styles.price}>{formatCurrency(data.offeredPrice)}</Text>
                {data.description && <Text style={styles.desc}>"{data.description}"</Text>}
              </View>

              {/* {suggestion && (
                <View style={[styles.card, { borderColor: COLORS.primary, borderWidth: 1, backgroundColor: '#F0F9FF' }]}>
                  <View style={styles.rowBetween}>
                     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <MaterialCommunityIcons name="robot" size={20} color={COLORS.primary} />
                        <Text style={styles.sectionHeaderSmall}>Đề xuất hệ thống</Text>
                     </View>
                     <View style={styles.tagSystem}>
                        <Text style={styles.tagSystemText}>{suggestion.systemRecommendation}</Text>
                     </View>
                  </View>
                  
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Khoảng cách</Text>
                        <Text style={styles.statValue}>{suggestion.distanceKm} km</Text>
                    </View>
                    <View style={styles.verticalLine} />
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Thời gian ước tính</Text>
                        <Text style={styles.statValue}>{suggestion.estimatedDurationHours} giờ</Text>
                    </View>
                  </View>


                  {suggestion.teamScenario?.isPossible && (
                     <View style={styles.scenarioBox}>
                        <Text style={styles.scenarioTitle}>Gợi ý: Team (Chạy đôi)</Text>
                        <Text style={styles.scenarioText}>{suggestion.teamScenario.message}</Text>
                     </View>
                  )}
                  {!suggestion.teamScenario?.isPossible && suggestion.soloScenario?.message && (
                     <Text style={[styles.scenarioText, { color: COLORS.danger, marginTop: 4 }]}>
                        {suggestion.soloScenario.message}
                     </Text>
                  )}
                </View>
              )} */}

              {/* 3. SHIPPING ROUTE (TIMELINE STYLE) */}
              <View style={styles.card}>
                <Text style={styles.sectionHeader}>Lộ trình vận chuyển</Text>
                
                <View style={styles.timelineContainer}>
                    {/* Start Point */}
                    <View style={styles.timelineItem}>
                        <View style={styles.timelineLeft}>
                            <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
                            <View style={styles.line} />
                        </View>
                        <View style={styles.timelineContent}>
                            <Text style={styles.locationLabel}>Điểm nhận hàng</Text>
                            <Text style={styles.address}>{route?.startLocation?.address}</Text>
                            <Text style={styles.timeInfo}>Dự kiến: {formatDate(route?.expectedPickupDate)}</Text>
                        </View>
                    </View>

                    {/* End Point */}
                    <View style={styles.timelineItem}>
                        <View style={styles.timelineLeft}>
                             <View style={[styles.dot, { backgroundColor: COLORS.danger }]} />
                        </View>
                        <View style={styles.timelineContent}>
                            <Text style={styles.locationLabel}>Điểm trả hàng</Text>
                            <Text style={styles.address}>{route?.endLocation?.address}</Text>
                            <Text style={styles.timeInfo}>Dự kiến: {formatDate(route?.expectedDeliveryDate)}</Text>
                        </View>
                    </View>
                </View>
              </View>

              {/* 4. PACKAGES & IMAGES */}
              <View style={styles.card}>
                <Text style={styles.sectionHeader}>Thông tin hàng hóa</Text>
                {(data.packages || []).map((pkg: any, index: number) => (
                    <View key={index} style={styles.packageItem}>
                        <View style={styles.rowBetween}>
                            <Text style={styles.pkgName}>{pkg.title}</Text>
                            <Text style={styles.pkgCode}>{pkg.packageCode}</Text>
                        </View>
                        <Text style={styles.pkgSub}>{pkg.weightKg}kg • {pkg.volumeM3}m³ • {pkg.item?.itemName}</Text>

                        {/* Attributes Chips */}
                        <View style={styles.chipContainer}>
                            {pkg.isFragile && <AttributeChip icon="glass-fragile" label="Dễ vỡ" color="#D97706" />}
                            {pkg.isRefrigerated && <AttributeChip icon="snowflake" label="Hàng lạnh" color="#0EA5E9" />}
                            {pkg.isHazardous && <AttributeChip icon="alert-octagon" label="Nguy hiểm" color="#DC2626" />}
                            {pkg.isLiquid && <AttributeChip icon="water" label="Chất lỏng" />}
                            {pkg.isBulky && <AttributeChip icon="arrow-expand-all" label="Cồng kềnh" />}
                        </View>

                        {/* Images ScrollView */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                            {/* Package Images */}
                            {pkg.packageImages?.map((img: any, i: number) => (
                                <Image key={`pkg-${i}`} source={{ uri: img.imageUrl }} style={styles.imageThumb} />
                            ))}
                             {/* Item Images */}
                             {pkg.item?.imageUrls?.map((img: any, i: number) => (
                                <Image key={`item-${i}`} source={{ uri: img.imageUrl }} style={styles.imageThumb} />
                            ))}
                            {(!pkg.packageImages?.length && !pkg.item?.imageUrls?.length) && (
                                <View style={styles.noImage}>
                                    <Ionicons name="image-outline" size={24} color={COLORS.secondary} />
                                    <Text style={{ fontSize: 10, color: COLORS.secondary }}>Không có ảnh</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                ))}
              </View>

              {/* 5. CONTACTS */}
              <View style={styles.card}>
                <Text style={styles.sectionHeader}>Liên hệ</Text>
                {(data.postContacts || []).map((c: any, i: number) => (
                    <View key={i} style={styles.contactRow}>
                        <View style={[styles.avatarPlaceholder, { backgroundColor: c.type === 'SENDER' ? '#DBEAFE' : '#DCFCE7' }]}>
                            <Text style={{ fontWeight: 'bold', color: c.type === 'SENDER' ? '#1E40AF' : '#166534' }}>
                                {c.type === 'SENDER' ? 'Gửi' : 'Nhận'}
                            </Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.contactName}>{c.fullName}</Text>
                            <Text style={styles.contactPhone}>{c.phoneNumber}</Text>
                            <Text style={styles.contactEmail}>{c.email}</Text>
                        </View>
                        <TouchableOpacity style={styles.callBtn}>
                            <Ionicons name="call" size={20} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                ))}
              </View>
              
              {/* Padding for Bottom Actions */}
              <View style={{ height: 80 }} />

            </ScrollView>

            {/* BOTTOM ACTIONS (STICKY) */}
            <View style={styles.bottomActions}>
                {(() => {
                    const st = (data?.status ?? '').toUpperCase();
                    if (st === 'AWAITING_SIGNATURE') {
                        return (
                            <View style={styles.rowBetween}>
                                <TouchableOpacity style={[styles.btn, styles.btnSuccess, { flex: 1, marginRight: 8 }]} 
                                    onPress={() => router.push(`/provider-v2/PostSignScreen?postId=${encodeURIComponent(postId || '')}`)}>
                                    <MaterialCommunityIcons name="pen" size={20} color="white" />
                                    <Text style={styles.btnText}>Ký & Thanh toán</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.btn, styles.btnPrimary, { flex: 0.8 }]}
                                    onPress={() => router.push(`/provider-v2/PostPaymentScreen?postId=${encodeURIComponent(postId || '')}`)}>
                                    <Text style={styles.btnText}>Thanh toán</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    }
                    if (st === 'AWAITING_PAYMENT') {
                        return (
                            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} 
                                onPress={() => router.push(`/provider-v2/PostPaymentScreen?postId=${encodeURIComponent(postId || '')}`)}>
                                <MaterialCommunityIcons name="credit-card-outline" size={20} color="white" />
                                <Text style={styles.btnText}>Thanh toán ngay</Text>
                            </TouchableOpacity>
                        );
                    }
                    // if (st === 'PENDING' || st === 'OPEN') {
                    //      return (
                    //         <TouchableOpacity style={[styles.btn, styles.btnWarning]} onPress={() => router.back()}>
                    //             <MaterialCommunityIcons name="pencil-outline" size={20} color="white" />
                    //             <Text style={styles.btnText}>Cập nhật đơn hàng</Text>
                    //         </TouchableOpacity>
                    //     );
                    // }
                    return (
                         <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={onClose}>
                            <Text style={[styles.btnText, { color: COLORS.textSub }]}>Đóng</Text>
                        </TouchableOpacity>
                    );
                })()}
            </View>
          </>
        ) : (
          <View style={styles.centerLoading}>
            <Text style={{ color: COLORS.textSub }}>Không tìm thấy dữ liệu</Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // LAYOUT
  scrollContent: { padding: 16, paddingBottom: 120 },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  
  // HEADER
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, elevation: 2
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textMain, flex: 1, textAlign: 'center' },
  closeBtn: { padding: 8 },

  // CARD STYLE
  card: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3
  },
  
  // TEXT STYLES
  title: { fontSize: 20, fontWeight: '800', color: COLORS.textMain, marginTop: 8, marginBottom: 4 },
  price: { fontSize: 24, fontWeight: '800', color: COLORS.primary, marginVertical: 4 },
  desc: { fontSize: 14, color: COLORS.textSub, fontStyle: 'italic', marginBottom: 8 },
  dateText: { fontSize: 12, color: COLORS.textSub },

  // SECTION HEADER
  sectionHeader: { fontSize: 16, fontWeight: '700', color: COLORS.textMain, marginBottom: 12, textTransform: 'uppercase' },
  sectionHeaderSmall: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  // BADGE & CHIPS
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  attrChip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4, marginRight: 8, marginBottom: 4 },
  attrText: { fontSize: 11, fontWeight: '600', marginLeft: 4 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 8 },

  // DRIVER SUGGESTION
  tagSystem: { backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  tagSystemText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', marginTop: 12, borderTopWidth: 1, borderColor: '#BAE6FD', paddingTop: 12 },
  statItem: { flex: 1, alignItems: 'center' },
  verticalLine: { width: 1, backgroundColor: '#BAE6FD' },
  statLabel: { fontSize: 12, color: COLORS.secondary },
  statValue: { fontSize: 16, fontWeight: '700', color: COLORS.textMain },
  scenarioBox: { marginTop: 12, padding: 10, backgroundColor: '#FFFFFF', borderRadius: 8 },
  scenarioTitle: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  scenarioText: { fontSize: 12, color: COLORS.textSub },

  // TIMELINE
  timelineContainer: { marginTop: 4 },
  timelineItem: { flexDirection: 'row', marginBottom: 4 },
  timelineLeft: { alignItems: 'center', width: 24, marginRight: 12 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  line: { width: 2, flex: 1, backgroundColor: '#E2E8F0', marginVertical: 4 },
  timelineContent: { flex: 1, paddingBottom: 20 },
  locationLabel: { fontSize: 12, color: COLORS.secondary, marginBottom: 2 },
  address: { fontSize: 14, color: COLORS.textMain, fontWeight: '500', marginBottom: 4 },
  timeInfo: { fontSize: 12, color: COLORS.primary, fontStyle: 'italic' },

  // PACKAGES
  packageItem: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  pkgName: { fontWeight: '700', fontSize: 15, color: COLORS.textMain },
  pkgCode: { fontSize: 12, color: COLORS.secondary, fontFamily: 'monospace' },
  pkgSub: { fontSize: 13, color: COLORS.textSub, marginTop: 4 },
  imageThumb: { width: 80, height: 80, borderRadius: 8, marginRight: 8, backgroundColor: '#E2E8F0' },
  noImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },

  // CONTACTS
  contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  contactName: { fontWeight: '600', color: COLORS.textMain },
  contactPhone: { fontSize: 13, color: COLORS.secondary },
  contactEmail: { fontSize: 12, color: COLORS.secondary },
  callBtn: { padding: 10, backgroundColor: COLORS.success, borderRadius: 50 },

  // ACTIONS (STICKY BOTTOM)
  bottomActions: {
    backgroundColor: COLORS.white,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10
  },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnSuccess: { backgroundColor: COLORS.success },
  btnWarning: { backgroundColor: COLORS.warning },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.border },
  btnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  
  // COMMON
  detailRow: { flexDirection: 'row', marginBottom: 8 },
  detailIcon: { width: 24, alignItems: 'center', marginRight: 8 },
  detailLabel: { fontSize: 12, color: COLORS.secondary },
  detailValue: { fontSize: 14, color: COLORS.textMain },
});

export default PostPackageDetailModal;
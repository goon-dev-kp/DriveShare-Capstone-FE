import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons'; 

// --- Interfaces (Mapping khớp với JSON Response của bạn) ---
interface TripContact {
  tripContactId: string;
  type: string;
  fullName: string;
  phoneNumber: string;
  note?: string | null;
}

interface DriverPrimary {
  driverId: string;
  fullName: string;
  phoneNumber: string;
}

interface DeliveryTerm {
  deliveryRecordTermId: string;
  content: string;
  displayOrder: number;
}

interface PackageInfo {
  packageId: string;
  packageCode: string;
  title: string;
  description: string;
  quantity: number;
  unit: string;
  weightKg: number;
  volumeM3: number;
  imageUrls?: string[];
  item?: {
    itemId: string;
    name: string;
    imageUrls?: string[];
  };
}

interface Surcharge {
  tripSurchargeId: string;
  type: string;
  amount: number;
  description: string;
  status: string;
}

interface Issue {
  tripDeliveryIssueId: string;
  issueType: string;
  description: string;
  status: string;
  createdAt: string;
  imageUrls: string[];
  surcharges?: Surcharge[];
}

// Props nhận vào toàn bộ object "result" từ API
export interface DeliveryRecordProps {
  data: {
    tripDeliveryRecordId: string;
    tripId: string;
    type: string; // PICKUP | DROPOFF
    status: string;
    notes: string;
    createAt: string; // API trả về string date
    
    driverSigned: boolean;
    driverSignedAt: string | null;
    contactSigned: boolean | null;
    contactSignedAt: string | null;

    tripContact: TripContact;
    driverPrimary: DriverPrimary;
    
    deliveryRecordTemplate?: {
        deliveryRecordTemplateId: string;
        templateName: string;
        version: string;
        type: string;
        createdAt: string;
        deliveryRecordTerms: DeliveryTerm[];
    };

    tripDetail?: {
        tripCode: string;
        status: string;
        type: string;
        packages: PackageInfo[];
        vehicle?: {
          licensePlate: string;
        };
        owner?: {
          companyName: string;
        };
    };

    issues?: Issue[];
  }
}

export const DeliveryRecordDocument: React.FC<DeliveryRecordProps> = ({ data }) => {
  // Safe destructuring (Bảo vệ crash nếu data null)
  if (!data) return <View><Text>Đang tải dữ liệu...</Text></View>;

  const {
    tripDeliveryRecordId,
    type,
    createAt,
    notes,
    tripContact,
    driverPrimary,
    deliveryRecordTemplate,
    tripDetail,
    driverSigned,
    driverSignedAt,
    contactSigned,
    contactSignedAt,
    issues = []
  } = data;

  const isPickup = type === 'PICKUP';
  const title = isPickup ? 'BIÊN BẢN GIAO XE & NHẬN HÀNG' : 'BIÊN BẢN GIAO HÀNG';
  const colorTheme = isPickup ? '#D97706' : '#2563EB'; // Cam hoặc Xanh

  // Hàm format ngày an toàn
  const formatDateShort = (dateString: string | null) => {
    if (!dateString) return '.../.../....';
    try {
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
    } catch (e) {
        return dateString;
    }
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <View style={styles.paperContainer}>
        
        {/* --- 1. Header Quốc Hiệu --- */}
        <View style={styles.headerRow}>
          <View style={styles.logoArea}>
             <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <MaterialCommunityIcons name="truck-fast-outline" size={24} color={colorTheme} />
                <Text style={[styles.brandText, {color: colorTheme}]}>DRIVESHARE</Text>
             </View>
             {/* FIX LỖI SUBSTRING: Kiểm tra null trước khi gọi hàm */}
             <Text style={styles.recordIdText}>
                ID: {(tripDeliveryRecordId || '').substring(0, 8).toUpperCase()}
             </Text>
          </View>
          <View style={styles.nationalMottoArea}>
            <Text style={styles.nationalTextBold}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</Text>
            <Text style={styles.nationalTextRegular}>Độc lập - Tự do - Hạnh phúc</Text>
            <View style={styles.underline} />
          </View>
        </View>

        {/* --- 2. Title --- */}
        <View style={styles.titleSection}>
          <Text style={[styles.recordTitle, { color: colorTheme }]}>{title}</Text>
          <Text style={styles.subTitle}>Mã chuyến: {tripDetail?.tripCode || '---'}</Text>
          <Text style={styles.dateText}>Ngày lập: {formatDateShort(createAt)}</Text>
        </View>

        {/* --- 3. Thông tin 2 bên --- */}
        <View style={styles.partiesTable}>
            <View style={styles.partiesRow}>
                {/* Bên Giao */}
                <View style={[styles.partyCell, { borderRightWidth: 1, borderColor: '#E5E7EB' }]}>
                    <Text style={styles.partyLabel}>{isPickup ? 'BÊN GIAO (NGƯỜI GỬI)' : 'BÊN GIAO (TÀI XẾ)'}</Text>
                    <Text style={styles.partyName}>
                        {isPickup ? (tripContact?.fullName || 'N/A') : (driverPrimary?.fullName || 'N/A')}
                    </Text>
                    <Text style={styles.partyInfo}>SĐT: {isPickup ? (tripContact?.phoneNumber || '') : (driverPrimary?.phoneNumber || '')}</Text>
                </View>

                {/* Bên Nhận */}
                <View style={styles.partyCell}>
                    <Text style={styles.partyLabel}>{isPickup ? 'BÊN NHẬN (TÀI XẾ)' : 'BÊN NHẬN (KHÁCH)'}</Text>
                    <Text style={styles.partyName}>
                        {isPickup ? (driverPrimary?.fullName || 'N/A') : (tripContact?.fullName || 'N/A')}
                    </Text>
                    <Text style={styles.partyInfo}>SĐT: {isPickup ? (driverPrimary?.phoneNumber || '') : (tripContact?.phoneNumber || '')}</Text>
                </View>
            </View>
        </View>

        {/* --- 4. Danh sách hàng hóa --- */}
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>I. THÔNG TIN HÀNG HÓA</Text>
            <View style={styles.packageTable}>
                <View style={[styles.packageHeaderRow, { backgroundColor: colorTheme + '15' }]}>
                    <Text style={[styles.phCol, { flex: 0.5 }]}>STT</Text>
                    <Text style={[styles.phCol, { flex: 2.5 }]}>Tên hàng</Text>
                    <Text style={[styles.phCol, { flex: 1, textAlign: 'right' }]}>SL</Text>
                    <Text style={[styles.phCol, { flex: 1, textAlign: 'right' }]}>KL(kg)</Text>
                </View>
                
                {/* Safe mapping packages */}
                {(tripDetail?.packages || []).map((pkg, index) => (
                    <View key={index} style={styles.packageRowWithImages}>
                        <View style={styles.packageRow}>
                            <Text style={[styles.pdCol, { flex: 0.5 }]}>{index + 1}</Text>
                            <View style={{ flex: 2.5 }}>
                                <Text style={styles.pkgName}>{pkg.title}</Text>
                                <Text style={styles.pkgCode}>{pkg.packageCode}</Text>
                            </View>
                            <Text style={[styles.pdCol, { flex: 1, textAlign: 'right' }]}>
                                {pkg.quantity} {pkg.unit}
                            </Text>
                            <Text style={[styles.pdCol, { flex: 1, textAlign: 'right' }]}>
                                {pkg.weightKg}
                            </Text>
                        </View>
                        
                        {/* Package Images */}
                        {pkg.imageUrls && pkg.imageUrls.length > 0 && (
                            <View style={styles.imageGallery}>
                                <Text style={styles.imageLabel}>Hình gói hàng:</Text>
                                <View style={styles.imageRow}>
                                    {pkg.imageUrls.slice(0, 4).map((url, imgIdx) => (
                                        <Image key={imgIdx} source={{ uri: url }} style={styles.packageImage} />
                                    ))}
                                </View>
                            </View>
                        )}
                        
                        {/* Item Images */}
                        {pkg.item?.imageUrls && pkg.item.imageUrls.length > 0 && (
                            <View style={styles.imageGallery}>
                                <Text style={styles.imageLabel}>Hình mặt hàng ({pkg.item.name}):</Text>
                                <View style={styles.imageRow}>
                                    {pkg.item.imageUrls.slice(0, 4).map((url, imgIdx) => (
                                        <Image key={imgIdx} source={{ uri: url }} style={styles.packageImage} />
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                ))}
            </View>
        </View>

        {/* --- 5. Ghi nhận sự cố (NẾU CÓ) --- */}
        {issues && issues.length > 0 && (
            <View style={[styles.sectionContainer, styles.issueBox]}>
                <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                    <Ionicons name="warning" size={18} color="#DC2626" />
                    <Text style={[styles.sectionHeader, { color: '#DC2626', marginBottom: 0, marginLeft: 6 }]}>
                        PHÁT SINH SỰ CỐ / KHIẾU NẠI
                    </Text>
                </View>
                {issues.map((issue) => (
                    <View key={issue.tripDeliveryIssueId} style={styles.issueItemContainer}>
                        <View style={styles.issueItem}>
                            <Text style={styles.issueType}>[{issue.issueType}]</Text>
                            <Text style={styles.issueDesc}>{issue.description}</Text>
                            <Text style={styles.issueDate}>Báo cáo lúc: {formatDateShort(issue.createdAt)}</Text>
                        </View>
                        
                        {/* Issue Images */}
                        {issue.imageUrls && issue.imageUrls.length > 0 && (
                            <View style={styles.issueImageGallery}>
                                <Text style={styles.issueImageLabel}>Hình minh chứng:</Text>
                                <View style={styles.imageRow}>
                                    {issue.imageUrls.slice(0, 4).map((url, imgIdx) => (
                                        <Image key={imgIdx} source={{ uri: url }} style={styles.issueImage} />
                                    ))}
                                </View>
                            </View>
                        )}
                        
                        {/* Surcharges/Compensation Claims */}
                        {issue.surcharges && issue.surcharges.length > 0 && (
                            <View style={styles.surchargeContainer}>
                                <Text style={styles.surchargeHeader}>💰 YÊU CẦU BỒI THƯỜNG:</Text>
                                {issue.surcharges.map((surcharge) => (
                                    <View key={surcharge.tripSurchargeId} style={styles.surchargeItem}>
                                        <View style={styles.surchargeRow}>
                                            <Text style={styles.surchargeLabel}>Số tiền:</Text>
                                            <Text style={styles.surchargeAmount}>
                                                {surcharge.amount.toLocaleString('vi-VN')} VNĐ
                                            </Text>
                                        </View>
                                        <View style={styles.surchargeRow}>
                                            <Text style={styles.surchargeLabel}>Trạng thái:</Text>
                                            <Text style={[
                                                styles.surchargeStatus,
                                                surcharge.status === 'PENDING' && styles.statusPending,
                                                surcharge.status === 'APPROVED' && styles.statusApproved,
                                                surcharge.status === 'REJECTED' && styles.statusRejected,
                                            ]}>
                                                {surcharge.status === 'PENDING' ? '⏳ Chờ xử lý' : 
                                                 surcharge.status === 'APPROVED' ? '✅ Chấp nhận' : 
                                                 surcharge.status === 'REJECTED' ? '❌ Từ chối' : surcharge.status}
                                            </Text>
                                        </View>
                                        {surcharge.description && (
                                            <View style={styles.surchargeDescRow}>
                                                <Text style={styles.surchargeLabel}>Lý do:</Text>
                                                <Text style={styles.surchargeDesc}>{surcharge.description}</Text>
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                ))}
            </View>
        )}

        {/* --- 6. Điều khoản kiểm tra (Checklist) --- */}
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>II. KẾT QUẢ KIỂM TRA & BÀN GIAO</Text>
            {(deliveryRecordTemplate?.deliveryRecordTerms || [])
                .sort((a,b) => a.displayOrder - b.displayOrder)
                .map((term) => (
                <View key={term.deliveryRecordTermId} style={styles.checklistRow}>
                    <View style={styles.checkbox}>
                        <Ionicons name="checkbox" size={20} color={colorTheme} />
                    </View>
                    <Text style={styles.checkContent}>{term.content}</Text>
                </View>
            ))}
            <Text style={styles.noteText}>* Ghi chú hệ thống: {notes || 'Không có'}</Text>
        </View>

        {/* --- 7. Chữ ký --- */}
        <View style={styles.signatureContainer}>
            {/* Chữ ký Tài xế */}
            <View style={styles.signBox}>
                <Text style={styles.signTitle}>ĐẠI DIỆN TÀI XẾ</Text>
                <Text style={styles.signSubTitle}>(Ký, ghi rõ họ tên)</Text>
                
                <View style={styles.signArea}>
                    {driverSigned ? (
                        <View style={[styles.stampBox, {borderColor: colorTheme}]}>
                            <Text style={[styles.stampText, {color: colorTheme}]}>ĐÃ XÁC NHẬN</Text>
                            <Text style={[styles.stampDate, {color: colorTheme}]}>{formatDateShort(driverSignedAt)}</Text>
                            <Text style={[styles.stampName, {color: colorTheme}]}>{driverPrimary?.fullName}</Text>
                        </View>
                    ) : (
                        <Text style={styles.pendingText}>Đang chờ ký...</Text>
                    )}
                </View>
            </View>

            {/* Chữ ký Khách hàng */}
            <View style={styles.signBox}>
                <Text style={styles.signTitle}>ĐẠI DIỆN KHÁCH HÀNG</Text>
                <Text style={styles.signSubTitle}>(Ký, ghi rõ họ tên)</Text>

                <View style={styles.signArea}>
                    {contactSigned ? (
                        <View style={[styles.stampBox, {borderColor: '#059669'}]}>
                            <Text style={[styles.stampText, {color: '#059669'}]}>ĐÃ NHẬN HÀNG</Text>
                            <Text style={[styles.stampDate, {color: '#059669'}]}>{formatDateShort(contactSignedAt)}</Text>
                            <Text style={[styles.stampName, {color: '#059669'}]}>{tripContact?.fullName}</Text>
                        </View>
                    ) : (
                        <View style={styles.dashedBox}>
                             <Text style={styles.pendingText}>(Chưa ký)</Text>
                        </View>
                    )}
                </View>
            </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
             <Text style={styles.footerText}>Biên bản này là bằng chứng giao nhận và cơ sở để giải quyết tranh chấp.</Text>
        </View>

      </View>
    </ScrollView>
  );
};

// --- Styles (Giữ nguyên như cũ) ---
const styles = StyleSheet.create({
  scrollView: { backgroundColor: '#F3F4F6' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  paperContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 12, marginBottom: 16 },
  logoArea: { flex: 1, justifyContent: 'center' },
  brandText: { fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  recordIdText: { fontSize: 10, color: '#6B7280', marginTop: 4 },
  nationalMottoArea: { flex: 1.5, alignItems: 'flex-end' },
  nationalTextBold: { fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', color: '#111827' },
  nationalTextRegular: { fontSize: 8, fontStyle: 'italic', color: '#4B5563', marginTop: 1 },
  underline: { width: 40, height: 1, backgroundColor: '#111827', marginTop: 2 },

  // Title
  titleSection: { alignItems: 'center', marginBottom: 20 },
  recordTitle: { fontSize: 18, fontWeight: '800', textTransform: 'uppercase', textAlign: 'center', marginBottom: 4 },
  subTitle: { fontSize: 12, fontWeight: '600', color: '#374151' },
  dateText: { fontSize: 11, color: '#6B7280', fontStyle: 'italic' },

  // Parties Table
  partiesTable: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, marginBottom: 24 },
  partiesRow: { flexDirection: 'row' },
  partyCell: { flex: 1, padding: 12 },
  partyLabel: { fontSize: 10, fontWeight: '700', color: '#6B7280', marginBottom: 4, textTransform: 'uppercase' },
  partyName: { fontSize: 13, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
  partyInfo: { fontSize: 11, color: '#4B5563' },

  // Section Common
  sectionContainer: { marginBottom: 20 },
  sectionHeader: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 8, textTransform: 'uppercase' },

  // Package Table
  packageTable: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, overflow: 'hidden' },
  packageHeaderRow: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  phCol: { fontSize: 10, fontWeight: '700', color: '#374151' },
  packageRowWithImages: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  packageRow: { flexDirection: 'row', padding: 8 },
  pdCol: { fontSize: 11, color: '#111827' },
  pkgName: { fontSize: 12, fontWeight: '600', color: '#111827' },
  pkgCode: { fontSize: 10, color: '#6B7280' },
  
  // Image Gallery
  imageGallery: { paddingHorizontal: 8, paddingBottom: 8 },
  imageLabel: { fontSize: 10, fontWeight: '600', color: '#6B7280', marginBottom: 4 },
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  packageImage: { width: 70, height: 70, borderRadius: 4, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },

  // Issues Box
  issueBox: { backgroundColor: '#FEF2F2', padding: 12, borderRadius: 6, borderWidth: 1, borderColor: '#FCA5A5' },
  issueItemContainer: { marginBottom: 12 },
  issueItem: { marginBottom: 6 },
  issueType: { fontSize: 11, fontWeight: '800', color: '#DC2626' },
  issueDesc: { fontSize: 12, color: '#7F1D1D', fontStyle: 'italic' },
  issueDate: { fontSize: 10, color: '#991B1B', marginTop: 2 },
  
  // Issue Images
  issueImageGallery: { marginTop: 6 },
  issueImageLabel: { fontSize: 10, fontWeight: '600', color: '#991B1B', marginBottom: 4 },
  issueImage: { width: 80, height: 80, borderRadius: 4, borderWidth: 1, borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },

  // Surcharge/Compensation
  surchargeContainer: { marginTop: 8, padding: 10, backgroundColor: '#FEF3C7', borderRadius: 6, borderWidth: 1, borderColor: '#F59E0B' },
  surchargeHeader: { fontSize: 11, fontWeight: '800', color: '#92400E', marginBottom: 6 },
  surchargeItem: { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#FDE68A' },
  surchargeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  surchargeLabel: { fontSize: 10, fontWeight: '600', color: '#78350F', marginRight: 6, minWidth: 70 },
  surchargeAmount: { fontSize: 13, fontWeight: '900', color: '#DC2626', flex: 1 },
  surchargeStatus: { fontSize: 11, fontWeight: '700', flex: 1 },
  statusPending: { color: '#F59E0B' },
  statusApproved: { color: '#059669' },
  statusRejected: { color: '#DC2626' },
  surchargeDescRow: { flexDirection: 'row', marginTop: 4 },
  surchargeDesc: { fontSize: 10, color: '#78350F', fontStyle: 'italic', flex: 1 },

  // Checklist
  checklistRow: { flexDirection: 'row', marginBottom: 8, paddingRight: 10 },
  checkbox: { marginRight: 8, marginTop: 1 },
  checkContent: { fontSize: 12, color: '#374151', lineHeight: 18, flex: 1 },
  noteText: { fontSize: 10, color: '#9CA3AF', fontStyle: 'italic', marginTop: 4 },

  // Signatures
  signatureContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 20 },
  signBox: { flex: 1, alignItems: 'center' },
  signTitle: { fontSize: 11, fontWeight: '700', color: '#111827' },
  signSubTitle: { fontSize: 9, color: '#6B7280', fontStyle: 'italic', marginBottom: 12 },
  signArea: { height: 80, justifyContent: 'center', alignItems: 'center', width: '100%' },
  
  // Stamp
  stampBox: { borderWidth: 2, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 4, alignItems: 'center', transform: [{ rotate: '-10deg' }], backgroundColor: '#fff' },
  stampText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  stampDate: { fontSize: 8 },
  stampName: { fontSize: 9, fontWeight: 'bold', marginTop: 2 },
  
  dashedBox: { borderWidth: 1, borderColor: '#D1D5DB', borderStyle: 'dashed', padding: 16, borderRadius: 4 },
  pendingText: { fontSize: 10, color: '#9CA3AF', fontStyle: 'italic' },

  // Footer
  footer: { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 12, alignItems: 'center' },
  footerText: { fontSize: 9, color: '#9CA3AF', fontStyle: 'italic' },
});
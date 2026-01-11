import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

interface HandoverRecordDocumentProps {
  type: 'HANDOVER' | 'RETURN';
  status: string;
  handoverUserName: string;
  receiverUserName: string;
  vehiclePlate: string;
  currentOdometer: number;
  fuelLevel: number;
  isEngineLightOn: boolean;
  notes: string;
  handoverSigned: boolean;
  handoverSignedAt: string | null;
  receiverSigned: boolean;
  receiverSignedAt: string | null;
  tripCode?: string;
  ownerCompany?: string;
  termResults?: Array<{
    termResultId: string;
    termContent: string;
    isOk: boolean;
    note: string | null;
    evidenceImageUrl?: string | null;
  }>;
  issues?: Array<{
    issueId: string;
    description: string;
    severity: string;
  }>;
}

export const HandoverRecordDocument: React.FC<HandoverRecordDocumentProps> = ({
  type,
  status,
  handoverUserName,
  receiverUserName,
  vehiclePlate,
  currentOdometer,
  fuelLevel,
  isEngineLightOn,
  notes,
  handoverSigned,
  handoverSignedAt,
  receiverSigned,
  receiverSignedAt,
  tripCode,
  ownerCompany,
  termResults,
  issues,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `Ngày ${date.getDate()} tháng ${date.getMonth() + 1} năm ${date.getFullYear()}`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')} - ${formatDate(dateString)}`;
  };

  const getRecordTitle = () => {
    return type === 'HANDOVER'
      ? 'BIÊN BẢN BÀN GIAO PHƯƠNG TIỆN'
      : 'BIÊN BẢN TRẢ PHƯƠNG TIỆN';
  };

  const getRecordSubtitle = () => {
    return type === 'HANDOVER'
      ? '(Chủ xe → Tài xế)'
      : '(Tài xế → Chủ xe)';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerCompany}>{ownerCompany || 'DRIVESHARE'}</Text>
          <Text style={styles.headerSubtext}>Hệ thống vận tải thông minh</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerCountry}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</Text>
          <Text style={styles.headerMotto}>Độc lập - Tự do - Hạnh phúc</Text>
          <Text style={styles.headerLine}>————————</Text>
        </View>
      </View>

      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>{getRecordTitle()}</Text>
        <Text style={styles.subtitle}>{getRecordSubtitle()}</Text>
      </View>

      {/* Date */}
      <View style={styles.dateSection}>
        <Text style={styles.dateText}>{formatDate(new Date().toISOString())}</Text>
      </View>

      {/* Trip Info */}
      {tripCode && (
        <View style={styles.tripSection}>
          <Text style={styles.sectionTitle}>THÔNG TIN CHUYẾN ĐI:</Text>
          <Text style={styles.tripInfo}>• Mã chuyến: {tripCode}</Text>
        </View>
      )}

      {/* Parties */}
      <View style={styles.partiesSection}>
        <View style={styles.party}>
          <Text style={styles.partyTitle}>
            {type === 'HANDOVER' ? 'BÊN GIAO (CHỦ XE):' : 'BÊN TRẢ (TÀI XẾ):'}
          </Text>
          <Text style={styles.partyInfo}>
            Họ tên: {type === 'HANDOVER' ? handoverUserName : receiverUserName}
          </Text>
        </View>

        <View style={styles.party}>
          <Text style={styles.partyTitle}>
            {type === 'HANDOVER' ? 'BÊN NHẬN (TÀI XẾ):' : 'BÊN NHẬN (CHỦ XE):'}
          </Text>
          <Text style={styles.partyInfo}>
            Họ tên: {type === 'HANDOVER' ? receiverUserName : handoverUserName}
          </Text>
        </View>
      </View>

      {/* Vehicle Info */}
      <View style={styles.vehicleSection}>
        <Text style={styles.sectionTitle}>THÔNG TIN PHƯƠNG TIỆN:</Text>
        <View style={styles.vehicleGrid}>
          <View style={styles.vehicleItem}>
            <Text style={styles.vehicleLabel}>Biển số xe:</Text>
            <Text style={styles.vehicleValue}>{vehiclePlate}</Text>
          </View>
          <View style={styles.vehicleItem}>
            <Text style={styles.vehicleLabel}>Số Km hiện tại:</Text>
            <Text style={styles.vehicleValue}>{currentOdometer.toLocaleString('vi-VN')} km</Text>
          </View>
          <View style={styles.vehicleItem}>
            <Text style={styles.vehicleLabel}>Mức nhiên liệu:</Text>
            <Text style={styles.vehicleValue}>{fuelLevel}%</Text>
          </View>
          <View style={styles.vehicleItem}>
            <Text style={styles.vehicleLabel}>Đèn báo động cơ:</Text>
            <Text style={[styles.vehicleValue, isEngineLightOn ? styles.warningText : styles.okText]}>
              {isEngineLightOn ? '⚠️ Sáng' : '✓ Tắt'}
            </Text>
          </View>
        </View>
      </View>

      {/* Inspection Terms */}
      {termResults && termResults.length > 0 && (
        <View style={styles.termsSection}>
          <Text style={styles.sectionTitle}>KIỂM TRA TÌNH TRẠNG XE:</Text>
          {termResults.map((term, index) => (
            <View key={term.termResultId} style={styles.termItem}>
              <Text style={[styles.termStatus, term.isOk ? styles.okText : styles.errorText]}>
                {term.isOk ? '✓' : '✗'}
              </Text>
              <View style={styles.termContent}>
                <Text style={styles.termText}>{index + 1}. {term.termContent || 'Hạng mục kiểm tra'}</Text>
                {term.note && <Text style={styles.termNote}>Ghi chú: {term.note}</Text>}
                {term.evidenceImageUrl && (
                  <View style={styles.evidenceImageContainer}>
                    <Image 
                      source={{ uri: term.evidenceImageUrl }} 
                      style={styles.evidenceImage}
                      resizeMode="cover"
                    />
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Issues */}
      {issues && issues.length > 0 && (
        <View style={styles.issuesSection}>
          <Text style={styles.sectionTitle}>CÁC VẤN ĐỀ PHÁT HIỆN:</Text>
          {issues.map((issue, index) => (
            <View key={issue.issueId} style={styles.issueItem}>
              <Text style={styles.issueNumber}>{index + 1}.</Text>
              <View style={styles.issueContent}>
                <Text style={styles.issueDescription}>{issue.description}</Text>
                <Text style={[styles.issueSeverity, getSeverityStyle(issue.severity)]}>
                  Mức độ: {getSeverityText(issue.severity)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Notes */}
      {notes && (
        <View style={styles.noteSection}>
          <Text style={styles.noteTitle}>Ghi chú:</Text>
          <Text style={styles.noteText}>{notes}</Text>
        </View>
      )}

      {/* Commitment */}
      <View style={styles.commitmentSection}>
        <Text style={styles.commitmentTitle}>CAM KẾT:</Text>
        <Text style={styles.commitmentText}>
          {type === 'HANDOVER'
            ? '• Bên nhận (Tài xế) cam kết sử dụng phương tiện đúng mục đích, tuân thủ luật giao thông và bảo quản xe cẩn thận.\n• Bên nhận chịu trách nhiệm về mọi hư hỏng, mất mát xảy ra trong quá trình sử dụng xe (trừ hao mòn tự nhiên).\n• Bên giao (Chủ xe) xác nhận phương tiện đã được kiểm tra và đảm bảo an toàn kỹ thuật.'
            : '• Bên trả (Tài xế) xác nhận đã bàn giao phương tiện theo đúng tình trạng cam kết.\n• Bên nhận (Chủ xe) xác nhận đã kiểm tra và tiếp nhận phương tiện.\n• Mọi tranh chấp phát sinh (nếu có) sẽ được giải quyết theo quy định pháp luật.'}
        </Text>
      </View>

      {/* Signatures */}
      <View style={styles.signatureSection}>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureTitle}>
            {type === 'HANDOVER' ? 'BÊN GIAO' : 'BÊN TRẢ'}
          </Text>
          <Text style={styles.signatureName}>
            {type === 'HANDOVER' ? handoverUserName : receiverUserName}
          </Text>
          {type === 'HANDOVER' ? (
            <>
              {handoverSigned && handoverSignedAt && (
                <Text style={styles.signatureDate}>{formatDateTime(handoverSignedAt)}</Text>
              )}
              {handoverSigned ? (
                <Text style={styles.signedText}>✓ Đã ký</Text>
              ) : (
                <Text style={styles.unsignedText}>(Chưa ký)</Text>
              )}
            </>
          ) : (
            <>
              {receiverSigned && receiverSignedAt && (
                <Text style={styles.signatureDate}>{formatDateTime(receiverSignedAt)}</Text>
              )}
              {receiverSigned ? (
                <Text style={styles.signedText}>✓ Đã ký</Text>
              ) : (
                <Text style={styles.unsignedText}>(Chưa ký)</Text>
              )}
            </>
          )}
        </View>

        <View style={styles.signatureBox}>
          <Text style={styles.signatureTitle}>
            {type === 'HANDOVER' ? 'BÊN NHẬN' : 'BÊN NHẬN'}
          </Text>
          <Text style={styles.signatureName}>
            {type === 'HANDOVER' ? receiverUserName : handoverUserName}
          </Text>
          {type === 'HANDOVER' ? (
            <>
              {receiverSigned && receiverSignedAt && (
                <Text style={styles.signatureDate}>{formatDateTime(receiverSignedAt)}</Text>
              )}
              {receiverSigned ? (
                <Text style={styles.signedText}>✓ Đã ký</Text>
              ) : (
                <Text style={styles.unsignedText}>(Chưa ký)</Text>
              )}
            </>
          ) : (
            <>
              {handoverSigned && handoverSignedAt && (
                <Text style={styles.signatureDate}>{formatDateTime(handoverSignedAt)}</Text>
              )}
              {handoverSigned ? (
                <Text style={styles.signedText}>✓ Đã ký</Text>
              ) : (
                <Text style={styles.unsignedText}>(Chưa ký)</Text>
              )}
            </>
          )}
        </View>
      </View>

      {/* Status Badge */}
      <View style={[styles.statusBadge, status === 'PENDING' ? styles.statusPending : styles.statusCompleted]}>
        <Text style={styles.statusText}>
          {status === 'PENDING' ? '⏳ Chờ ký' : '✓ Đã hoàn thành'}
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Biên bản được lập thành 02 bản, mỗi bên giữ 01 bản có giá trị pháp lý như nhau.
        </Text>
      </View>
    </View>
  );
};

const getSeverityStyle = (severity: string) => {
  switch (severity.toUpperCase()) {
    case 'HIGH':
      return { color: '#DC2626' };
    case 'MEDIUM':
      return { color: '#F59E0B' };
    case 'LOW':
      return { color: '#059669' };
    default:
      return { color: '#6B7280' };
  }
};

const getSeverityText = (severity: string) => {
  switch (severity.toUpperCase()) {
    case 'HIGH':
      return 'Cao';
    case 'MEDIUM':
      return 'Trung bình';
    case 'LOW':
      return 'Thấp';
    default:
      return severity;
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderWidth: 2,
    borderColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  headerCompany: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  headerSubtext: {
    fontSize: 10,
    marginTop: 2,
    color: '#6B7280',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerCountry: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  headerMotto: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
  },
  headerLine: {
    fontSize: 10,
    marginTop: 2,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#6B7280',
  },
  dateSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  dateText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  tripSection: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tripInfo: {
    fontSize: 11,
    marginBottom: 4,
  },
  partiesSection: {
    marginBottom: 16,
  },
  party: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#F0F9FF',
    borderRadius: 6,
  },
  partyTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  partyInfo: {
    fontSize: 11,
    marginBottom: 2,
  },
  vehicleSection: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
  },
  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  vehicleItem: {
    width: '48%',
    marginBottom: 8,
  },
  vehicleLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2,
  },
  vehicleValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  warningText: {
    color: '#DC2626',
  },
  okText: {
    color: '#059669',
  },
  errorText: {
    color: '#DC2626',
  },
  termsSection: {
    marginBottom: 16,
  },
  termItem: {
    flexDirection: 'row',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 4,
  },
  termStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  termContent: {
    flex: 1,
  },
  termText: {
    fontSize: 11,
    marginBottom: 2,
  },
  termNote: {
    fontSize: 10,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  evidenceImageContainer: {
    marginTop: 8,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  evidenceImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#F3F4F6',
  },
  issuesSection: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
  },
  issueItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  issueNumber: {
    fontSize: 11,
    fontWeight: 'bold',
    marginRight: 8,
  },
  issueContent: {
    flex: 1,
  },
  issueDescription: {
    fontSize: 11,
    marginBottom: 2,
  },
  issueSeverity: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  noteSection: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
  },
  noteTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  commitmentSection: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#DBEAFE',
    borderRadius: 6,
  },
  commitmentTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  commitmentText: {
    fontSize: 11,
    lineHeight: 18,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  signatureBox: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    marginHorizontal: 4,
  },
  signatureTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  signatureName: {
    fontSize: 11,
    marginBottom: 4,
  },
  signatureDate: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 8,
  },
  signedText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: 'bold',
  },
  unsignedText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  statusBadge: {
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusCompleted: {
    backgroundColor: '#D1FAE5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#000000',
    paddingTop: 12,
  },
  footerText: {
    fontSize: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

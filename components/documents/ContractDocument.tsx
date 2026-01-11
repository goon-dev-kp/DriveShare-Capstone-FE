import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

// --- Interfaces ---
interface ContractTerm {
  contractTermId: string;
  content: string;
  order: number;
}

interface ContractDocumentProps {
  contractCode: string;
  contractType: 'DRIVER_CONTRACT' | 'PROVIDER_CONTRACT';
  contractValue: number;
  currency: string;
  effectiveDate: string;
  terms: ContractTerm[];
  ownerName: string;
  ownerCompany?: string;
  ownerTaxCode?: string;
  counterpartyName: string;
  counterpartyPhone?: string;
  ownerSigned: boolean;
  ownerSignAt: string | null;
  counterpartySigned: boolean;
  counterpartySignAt: string | null;
  tripCode?: string;
  vehiclePlate?: string;
  startAddress?: string;
  endAddress?: string;
}

export const ContractDocument: React.FC<ContractDocumentProps> = ({
  contractCode,
  contractType,
  contractValue,
  currency,
  effectiveDate,
  terms,
  ownerName,
  ownerCompany,
  ownerTaxCode,
  counterpartyName,
  counterpartyPhone,
  ownerSigned,
  ownerSignAt,
  counterpartySigned,
  counterpartySignAt,
  tripCode,
  vehiclePlate,
  startAddress,
  endAddress,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `Ngày ${date.getDate()} tháng ${date.getMonth() + 1} năm ${date.getFullYear()}`;
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const getContractTitle = () => {
    return contractType === 'DRIVER_CONTRACT'
      ? 'HỢP ĐỒNG THUÊ TÀI XẾ'
      : 'HỢP ĐỒNG DỊCH VỤ VẬN TẢI';
  };

  return (
    <View style={styles.paperContainer}>
        
        {/* --- 1. Header Section --- */}
        <View style={styles.headerRow}>
          <View style={styles.logoArea}>
            {/* Logo Placeholder - Thay thế bằng require hình của bạn */}
            <Image 
              source={require('../../assets/icon-with-name.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            {ownerCompany && <Text style={styles.companySubText}>{ownerCompany.toUpperCase()}</Text>}
          </View>
          <View style={styles.nationalMottoArea}>
            <Text style={styles.nationalTextBold}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</Text>
            <Text style={styles.nationalTextRegular}>Độc lập - Tự do - Hạnh phúc</Text>
            <View style={styles.underline} />
          </View>
        </View>

        {/* --- 2. Title & Intro --- */}
        <View style={styles.titleSection}>
          <Text style={styles.contractTitle}>{getContractTitle()}</Text>
          <View style={styles.contractCodeBadge}>
            <Text style={styles.contractCodeText}>MÃ HĐ: {contractCode}</Text>
          </View>
          {/* --- 3. Legal Basis (Căn cứ pháp lý) --- */}
        <View style={styles.legalSection}>
          <Text style={styles.legalTextVi}>- Căn cứ Bộ luật Dân sự số 33/2005/QH11...</Text>
          <Text style={styles.legalTextVi}>- Căn cứ vào Luật Thương mại số 36/2005/QH11...</Text>
          <Text style={styles.legalTextVi}>- Căn cứ nhu cầu, khả năng và thỏa thuận của hai bên.</Text>
          
          <View style={{height: 8}} />
          
          <Text style={styles.legalTextEn}>- Pursuant to the Civil Code No. 33/2005/QH11...</Text>
          <Text style={styles.legalTextEn}>- Pursuant to the Commercial Law No. 36/2005/QH11...</Text>
          <Text style={styles.legalTextEn}>- Pursuant to the needs, abilities, and agreement of both parties.</Text>
        </View>
          <Text style={styles.dateText}>
           Chúng tôi gồm:
          </Text>
        </View>

        {/* --- 3. Parties Cards (Bên A / Bên B) --- */}
        <View style={styles.partiesContainer}>
          {/* Party A */}
          <View style={[styles.partyCard, styles.partyCardLeft]}>
            <View style={styles.partyHeader}>
              <Text style={styles.partyLabel}>BÊN A (CHỦ XE)</Text>
            </View>
            <View style={styles.partyBody}>
              <Text style={styles.partyName}>{ownerName}</Text>
              {ownerTaxCode && <Text style={styles.partyDetail}>MST: {ownerTaxCode}</Text>}
              <Text style={styles.partyDetail}>{ownerCompany || 'Cá nhân'}</Text>
            </View>
          </View>

          {/* Party B */}
          <View style={[styles.partyCard, styles.partyCardRight]}>
             <View style={[styles.partyHeader, styles.partyHeaderRight]}>
              <Text style={[styles.partyLabel, styles.partyLabelRight]}>BÊN B (ĐỐI TÁC)</Text>
            </View>
            <View style={styles.partyBody}>
              <Text style={styles.partyName}>{counterpartyName}</Text>
              <Text style={styles.partyDetail}>SĐT: {counterpartyPhone || '---'}</Text>
              <Text style={styles.partyDetail}>Vai trò: {contractType === 'DRIVER_CONTRACT' ? 'Tài xế' : 'Nhà cung cấp'}</Text>
            </View>
          </View>
        </View>

        {/* --- 4. Trip Info (Ticket Style) --- */}
        {tripCode && (
          <View style={styles.tripContainer}>
            <View style={styles.tripHeader}>
              <Text style={styles.tripTitle}>THÔNG TIN CHUYẾN ĐI</Text>
            </View>
            <View style={styles.tripContent}>
              <View style={styles.tripRow}>
                <Text style={styles.tripLabel}>Mã chuyến:</Text>
                <Text style={styles.tripValue}>{tripCode}</Text>
              </View>
              {vehiclePlate && (
                <View style={styles.tripRow}>
                  <Text style={styles.tripLabel}>Biển số:</Text>
                  <Text style={styles.tripValueBold}>{vehiclePlate}</Text>
                </View>
              )}
              {startAddress && (
                <View style={styles.routeContainer}>
                  <View style={styles.routeDotGreen} />
                  <Text style={styles.routeText} numberOfLines={2}>{startAddress}</Text>
                </View>
              )}
               {endAddress && (
                <View style={styles.routeContainer}>
                  <View style={styles.routeDotRed} />
                  <Text style={styles.routeText} numberOfLines={2}>{endAddress}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* --- 5. Value Section (Highlighted) --- */}
        <View style={styles.valueContainer}>
          <Text style={styles.valueLabel}>TỔNG GIÁ TRỊ HỢP ĐỒNG</Text>
          <Text style={styles.valueAmount}>
            {formatCurrency(contractValue)} <Text style={styles.currencyText}>{currency}</Text>
          </Text>
          <Text style={styles.valueWord}>
            (Bằng chữ: {convertNumberToWords(contractValue)} đồng)
          </Text>
        </View>

        {/* --- 6. Terms Section --- */}
        <View style={styles.termsContainer}>
          <Text style={styles.sectionHeader}>ĐIỀU KHOẢN THỎA THUẬN</Text>
          {terms.sort((a, b) => a.order - b.order).map((term) => (
            <View key={term.contractTermId} style={styles.termRow}>
              <View style={styles.termBadge}>
                <Text style={styles.termOrder}>{term.order}</Text>
              </View>
              <Text style={styles.termContent}>{term.content}</Text>
            </View>
          ))}
        </View>

        {/* --- 7. Signatures (Digital Stamp Style) --- */}
        <View style={styles.signatureContainer}>
          {/* Signature A */}
          <View style={styles.signBox}>
            <Text style={styles.signTitle}>ĐẠI DIỆN BÊN A</Text>
            <Text style={styles.signNamePlaceholder}>{ownerName}</Text>
            
            {ownerSigned ? (
              <View style={styles.stampBox}>
                <View style={styles.stampInner}>
                  <Text style={styles.stampText}>ĐÃ KÝ DUYỆT</Text>
                  <Text style={styles.stampDate}>{formatDateShort(ownerSignAt || '')}</Text>
                  <Text style={styles.stampCompany}>{ownerCompany ? 'DRIVESHARE CORP' : 'VERIFIED'}</Text>
                </View>
              </View>
            ) : (
               <View style={styles.waitingSign}>
                  <Text style={styles.waitingText}>(Chưa ký)</Text>
               </View>
            )}
          </View>

          {/* Signature B */}
          <View style={styles.signBox}>
            <Text style={styles.signTitle}>ĐẠI DIỆN BÊN B</Text>
            <Text style={styles.signNamePlaceholder}>{counterpartyName}</Text>
             
            {counterpartySigned ? (
              <View style={[styles.stampBox, styles.stampBoxGreen]}>
                <View style={[styles.stampInner, styles.stampInnerGreen]}>
                  <Text style={[styles.stampText, styles.stampTextGreen]}>ĐÃ KÝ TÊN</Text>
                  <Text style={[styles.stampDate, styles.stampDateGreen]}>{formatDateShort(counterpartySignAt || '')}</Text>
                  <Text style={[styles.stampCompany, styles.stampCompanyGreen]}>CONFIRMED</Text>
                </View>
              </View>
            ) : (
              <View style={styles.waitingSign}>
                  <Text style={styles.waitingText}>(Chưa ký)</Text>
               </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Văn bản này được tạo tự động bởi hệ thống DriveShare.
            Có giá trị pháp lý theo quy định hiện hành.
          </Text>
        </View>

    </View>
  );
};

// --- Helper Functions ---
const convertNumberToWords = (num: number): string => {
  if (num === 0) return 'Không';
  const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const teens = ['mười', 'mười một', 'mười hai', 'mười ba', 'mười bốn', 'mười lăm', 'mười sáu', 'mười bảy', 'mười tám', 'mười chín'];
  const tens = ['', 'mười', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];
  const thousands = ['', 'nghìn', 'triệu', 'tỷ'];

  const convert = (n: number): string => {
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const one = n % 10;
      return tens[ten] + (one ? ' ' + ones[one] : '');
    }
    if (n < 1000) {
      const hundred = Math.floor(n / 100);
      const rest = n % 100;
      return ones[hundred] + ' trăm' + (rest ? ' ' + convert(rest) : '');
    }
    return '';
  };
  let result = '';
  let unitIndex = 0;
  while (num > 0) {
    const segment = num % 1000;
    if (segment > 0) {
      const prefix = convert(segment);
      result = prefix + (thousands[unitIndex] ? ' ' + thousands[unitIndex] : '') + (result ? ' ' + result : '');
    }
    num = Math.floor(num / 1000);
    unitIndex++;
  }
  return result.charAt(0).toUpperCase() + result.slice(1);
};

// --- Styles ---
const styles = StyleSheet.create({
  paperContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 24,
    // Hiệu ứng bóng đổ (Shadow) giống tờ giấy
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E4E6EB',
  },
  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 16,
  },
  logoArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  logoImage: {
    width: 100,
    height: 40,
    marginBottom: 4,
  },
  companySubText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1A56DB', // Brand Blue
    letterSpacing: 0.5,
  },
  nationalMottoArea: {
    flex: 1.5,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  nationalTextBold: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#333',
  },
  nationalTextRegular: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#555',
    marginTop: 2,
  },
  underline: {
    width: 60,
    height: 1,
    backgroundColor: '#333',
    marginTop: 4,
  },
  // Title
  titleSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  contractTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A56DB',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  contractCodeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  contractCodeText: {
    fontSize: 11,
    color: '#1A56DB',
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    color: '#65676B',
    fontStyle: 'italic',
  },
  // Parties
  partiesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  partyCard: {
    width: '48%',
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E6EB',
    overflow: 'hidden',
  },
  partyCardLeft: {
    borderTopWidth: 4,
    borderTopColor: '#1A56DB', // Blue for Owner
  },
  partyCardRight: {
    borderTopWidth: 4,
    borderTopColor: '#059669', // Green for Partner
  },
  partyHeader: {
    padding: 8,
    backgroundColor: '#F0F2F5',
  },
  partyHeaderRight: {
    backgroundColor: '#ECFDF5',
  },
  partyLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1A56DB',
  },
  partyLabelRight: {
    color: '#059669',
  },
  partyBody: {
    padding: 10,
  },
  partyName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1C1E21',
    marginBottom: 4,
  },
  partyDetail: {
    fontSize: 10,
    color: '#65676B',
    marginBottom: 2,
  },
  // Trip Info
  tripContainer: {
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E4E6EB',
    borderRadius: 8,
    borderStyle: 'dashed',
    backgroundColor: '#F9FAFB',
  },
  tripHeader: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E6EB',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  tripTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4B5563',
    letterSpacing: 1,
  },
  tripContent: {
    padding: 12,
  },
  tripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tripLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  tripValue: {
    fontSize: 11,
    fontWeight: '500',
    color: '#111827',
  },
  tripValueBold: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  routeDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginTop: 3,
    marginRight: 8,
  },
  routeDotRed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginTop: 3,
    marginRight: 8,
  },
  routeText: {
    fontSize: 11,
    color: '#374151',
    flex: 1,
  },
  // Value
  valueContainer: {
    backgroundColor: '#FFFBEB', // Light Yellow
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  valueLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 4,
  },
  valueAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#B45309',
  },
  currencyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  valueWord: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#D97706',
    marginTop: 4,
    textAlign: 'center',
  },
  // Terms
  termsContainer: {
    marginBottom: 30,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1C1E21',
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#1A56DB',
    paddingLeft: 8,
  },
  termRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  termBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 0,
  },
  termOrder: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1A56DB',
  },
  termContent: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#4B5563',
    textAlign: 'justify',
  },
  // Signatures
  signatureContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  signBox: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  signTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
  },
  signNamePlaceholder: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
  },
  waitingSign: {
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 4,
    width: '80%',
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  // Stamp Effect
  stampBox: {
    marginTop: 0,
    width: 100,
    height: 60,
    borderWidth: 3,
    borderColor: '#DC2626', // Red Stamp
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-15deg' }],
    opacity: 0.8,
  },
  stampBoxGreen: {
    borderColor: '#059669',
  },
  stampInner: {
    width: 92,
    height: 52,
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stampInnerGreen: {
    borderColor: '#059669',
  },
  stampText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#DC2626',
    textTransform: 'uppercase',
  },
  stampTextGreen: {
    color: '#059669',
  },
  stampDate: {
    fontSize: 8,
    color: '#DC2626',
  },
  stampDateGreen: {
    color: '#059669',
  },
  stampCompany: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#DC2626',
    marginTop: 2,
  },
  stampCompanyGreen: {
    color: '#059669',
  },
  // Footer
  footer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  footerText: {
    fontSize: 9,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Legal Basis
  legalSection: { marginBottom: 15, paddingLeft: 10 },
  legalTextVi: { fontSize: 11, fontStyle: 'italic', color: '#374151', lineHeight: 16 },
  legalTextEn: { fontSize: 10, fontStyle: 'italic', color: '#6B7280', lineHeight: 15 },
});
import React from 'react'
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

interface TermsModalProps {
  visible: boolean
  onClose: () => void
}

const TermsModal: React.FC<TermsModalProps> = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          <View style={styles.modalContainer}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Điều Khoản & Chính Sách</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
    
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={true}
            >
            <Text style={styles.sectionTitle}>1. GIỚI THIỆU</Text>
            <Text style={styles.paragraph}>
              Chào mừng bạn đến với nền tảng DriveShare - nền tảng kết nối chủ xe, tài xế và nhà cung cấp dịch vụ vận tải. 
              Bằng việc đăng ký và sử dụng dịch vụ, bạn đồng ý tuân thủ các điều khoản và điều kiện dưới đây.
            </Text>

            <Text style={styles.sectionTitle}>2. ĐIỀU KIỆN SỬ DỤNG</Text>
            <Text style={styles.paragraph}>
              • Bạn phải từ đủ 18 tuổi trở lên để sử dụng dịch vụ.{'\n'}
              • Thông tin đăng ký phải chính xác, đầy đủ và trung thực.{'\n'}
              • Bạn chịu trách nhiệm bảo mật thông tin tài khoản của mình.{'\n'}
              • Nghiêm cấm sử dụng dịch vụ cho mục đích bất hợp pháp.
            </Text>

            <Text style={styles.sectionTitle}>3. QUYỀN VÀ NGHĨA VỤ CỦA NGƯỜI DÙNG</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>Quyền lợi:{'\n'}</Text>
              • Được sử dụng đầy đủ các tính năng của nền tảng.{'\n'}
              • Được bảo vệ thông tin cá nhân theo quy định pháp luật.{'\n'}
              • Được hỗ trợ kỹ thuật khi gặp sự cố.{'\n\n'}
              
              <Text style={styles.bold}>Nghĩa vụ:{'\n'}</Text>
              • Cung cấp thông tin chính xác khi đăng ký.{'\n'}
              • Tuân thủ các quy định về giao thông và an toàn.{'\n'}
              • Thanh toán đầy đủ các khoản phí dịch vụ.{'\n'}
              • Không vi phạm quyền lợi của người dùng khác.
            </Text>

            <Text style={styles.sectionTitle}>4. CHÍNH SÁCH BẢO MẬT</Text>
            <Text style={styles.paragraph}>
              DriveShare cam kết bảo vệ thông tin cá nhân của người dùng:{'\n\n'}
              • Thu thập chỉ những thông tin cần thiết cho hoạt động dịch vụ.{'\n'}
              • Không chia sẻ thông tin với bên thứ ba khi chưa có sự đồng ý.{'\n'}
              • Mã hóa và bảo mật dữ liệu người dùng.{'\n'}
              • Tuân thủ Luật An toàn thông tin mạng Việt Nam.
            </Text>

            <Text style={styles.sectionTitle}>5. THANH TOÁN VÀ PHÍ DỊCH VỤ</Text>
            <Text style={styles.paragraph}>
              • Nền tảng áp dụng phí hoa hồng trên mỗi chuyến đi thành công.{'\n'}
              • Giá cước được tính toán tự động dựa trên quãng đường và thời gian.{'\n'}
              • Người dùng có thể thanh toán qua ví điện tử hoặc chuyển khoản.{'\n'}
              • Hoàn tiền được xử lý trong vòng 7-10 ngày làm việc nếu có tranh chấp hợp lệ.
            </Text>

            <Text style={styles.sectionTitle}>6. TRÁCH NHIỆM VÀ GIỚI HẠN TRÁCH NHIỆM</Text>
            <Text style={styles.paragraph}>
              • DriveShare đóng vai trò kết nối, không trực tiếp cung cấp dịch vụ vận tải.{'\n'}
              • Người dùng tự chịu trách nhiệm về hành vi của mình trên nền tảng.{'\n'}
              • DriveShare không chịu trách nhiệm về thiệt hại phát sinh từ việc sử dụng sai mục đích.{'\n'}
              • Trong trường hợp bất khả kháng, DriveShare có quyền tạm ngưng dịch vụ.
            </Text>

            <Text style={styles.sectionTitle}>7. XỬ LÝ VI PHẠM</Text>
            <Text style={styles.paragraph}>
              Các hành vi vi phạm sau sẽ bị xử lý nghiêm khắc:{'\n\n'}
              • Cung cấp thông tin giả mạo.{'\n'}
              • Sử dụng dịch vụ cho mục đích phi pháp.{'\n'}
              • Gian lận trong thanh toán.{'\n'}
              • Quấy rối, xúc phạm người dùng khác.{'\n\n'}
              
              Hình thức xử lý: Cảnh cáo, tạm khóa tài khoản hoặc khóa vĩnh viễn tùy mức độ vi phạm.
            </Text>

            <Text style={styles.sectionTitle}>8. GIẢI QUYẾT TRANH CHẤP</Text>
            <Text style={styles.paragraph}>
              • Các tranh chấp sẽ được ưu tiên giải quyết thông qua thương lượng.{'\n'}
              • Nếu không thỏa thuận được, các bên có thể đưa ra Tòa án có thẩm quyền tại Việt Nam.{'\n'}
              • Luật áp dụng là Luật pháp Việt Nam.
            </Text>

            <Text style={styles.sectionTitle}>9. ĐIỀU KHOẢN CHUNG</Text>
            <Text style={styles.paragraph}>
              • DriveShare có quyền sửa đổi điều khoản này và sẽ thông báo trước 7 ngày.{'\n'}
              • Việc tiếp tục sử dụng sau khi có thay đổi đồng nghĩa với việc bạn chấp nhận điều khoản mới.{'\n'}
              • Nếu có bất kỳ điều khoản nào bị vô hiệu, các điều khoản còn lại vẫn có hiệu lực.
            </Text>

            <Text style={styles.sectionTitle}>10. THÔNG TIN LIÊN HỆ</Text>
            <Text style={styles.paragraph}>
              Nếu có thắc mắc về Điều khoản sử dụng, vui lòng liên hệ:{'\n\n'}
              • Email: support@driveshare.vn{'\n'}
              • Hotline: 1900-xxxx{'\n'}
              • Địa chỉ: Tầng X, Tòa nhà ABC, Quận 1, TP.HCM
            </Text>

            <Text style={styles.lastUpdated}>
              Cập nhật lần cuối: 01/12/2025
            </Text>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity onPress={onClose} style={styles.acceptButton}>
                <Text style={styles.acceptButtonText}>Đã hiểu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  } as ViewStyle,
  safeArea: {
    width: '100%',
    maxWidth: 500,
    height: '90%',
  } as ViewStyle,
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    flex: 1,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  } as ViewStyle,
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
  } as TextStyle,
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  closeButtonText: {
    fontSize: 20,
    color: '#718096',
    fontWeight: '600',
  } as TextStyle,
  content: {
    flex: 1,
  } as ViewStyle,
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  } as ViewStyle,
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00C6FF',
    marginTop: 16,
    marginBottom: 8,
  } as TextStyle,
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4A5568',
    marginBottom: 12,
  } as TextStyle,
  bold: {
    fontWeight: '600',
    color: '#2D3748',
  } as TextStyle,
  lastUpdated: {
    fontSize: 12,
    color: '#A0AEC0',
    fontStyle: 'italic',
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  } as TextStyle,
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  } as ViewStyle,
  acceptButton: {
    backgroundColor: '#00C6FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  } as ViewStyle,
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  } as TextStyle,
})

export default TermsModal

import React from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  Dimensions, 
  StatusBar, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const WelcomeScreen: React.FC = () => {
  const router = useRouter();

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.container}>
      {/* Cấu hình StatusBar: 
          - transparent để ảnh nền tràn lên
          - dark-content để icon màu đen dễ nhìn trên nền sáng 
      */}
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* --- PHẦN 1: TOP SECTION (Ảnh & Decor) --- */}
      <View style={styles.topSection}>
        
        {/* Decor: Hình tròn mờ làm nền cho ảnh bớt đơn điệu */}
        <View style={styles.blobCircle} />

        {/* Logo */}
        <View style={styles.logoContainer}>
             <Image 
                source={require('../../assets/icon-with-name.png')} 
                style={styles.logoImage}
                resizeMode="contain"
            />
        </View>

        {/* Ảnh chính */}
        <View style={styles.illustrationWrapper}>
          <Image
            source={require('../../assets/welcome.png')}
            style={styles.mainImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* --- PHẦN 2: BOTTOM SECTION (Nội dung chính) --- */}
      <View style={styles.bottomSheet}>
        <View style={styles.contentContainer}>
          
          {/* Header Texts */}
          <View style={styles.headerWrapper}>
            <Text style={styles.welcomeText}>Chào mừng đến</Text>
            <Text style={styles.brandName}>DriveShare</Text>
            <Text style={styles.tagline}>
              Hệ sinh thái vận tải thông minh kết nối Chủ xe, Tài xế và Nhà cung cấp.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {/* Nút Đăng nhập - Nổi bật */}
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              style={[styles.button, styles.primaryButton]}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Đăng Nhập</Text>
            </TouchableOpacity>

            {/* Nút Đăng ký - Viền nhẹ */}
            <TouchableOpacity
              onPress={() => router.push('/(auth)/register')}
              style={[styles.button, styles.outlineButton]}
              activeOpacity={0.7}
            >
              <Text style={styles.outlineButtonText}>Tạo tài khoản mới</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EBF5FF', // Màu nền tổng thể xanh rất nhạt
  },

  // --- TOP SECTION STYLES ---
  topSection: {
    flex: 0.55, // Chiếm 55% chiều cao (dành nhiều đất cho ảnh đẹp)
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end', // Đẩy nội dung xuống sát phần bottom sheet
    paddingBottom: 20,
    overflow: 'hidden', // Cắt các phần decor thừa
  },
  // Hình tròn trang trí phía sau
  blobCircle: {
    position: 'absolute',
    top: -width * 0.2,
    right: -width * 0.2,
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width,
    backgroundColor: '#DBEAFE', // Xanh đậm hơn nền một chút
    opacity: 0.6,
  },
  logoContainer: {
    position: 'absolute',
    top: (StatusBar.currentHeight || 40) + 10, // Cách tai thỏ một chút
    alignSelf: 'center',
    zIndex: 10,
  },
  logoImage: {
    width: 140, 
    height: 45,
  },
  illustrationWrapper: {
    width: width,
    height: '75%', // Chiếm phần lớn top section
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  mainImage: {
    width: width * 0.85,
    height: '100%',
  },

  // --- BOTTOM SHEET STYLES ---
  bottomSheet: {
    flex: 0.45, // Chiếm 45% còn lại
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    // Hiệu ứng đổ bóng nổi bật phần bottom sheet
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 25, // Shadow đậm cho Android
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24, // iOS cần padding bottom nhiều hơn do thanh gạt home
    justifyContent: 'space-between',
  },
  
  // TYPOGRAPHY
  headerWrapper: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4B5563', // Gray 600
    marginBottom: 4,
  },
  brandName: {
    fontSize: 34,
    fontWeight: '800',
    color: '#2563EB', // Blue 600
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 15,
    color: '#6B7280', // Gray 500
    textAlign: 'center',
    lineHeight: 24, // Dãn dòng dễ đọc
    paddingHorizontal: 10,
  },

  // BUTTONS
  buttonContainer: {
    width: '100%',
    gap: 14, // Khoảng cách giữa 2 nút (React Native 0.71+)
  },
  button: {
    width: '100%',
    height: 56, // Chiều cao chuẩn UX dễ bấm
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    // Shadow cho nút
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  outlineButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB', // Gray 200
  },
  outlineButtonText: {
    color: '#374151', // Gray 700
    fontSize: 17,
    fontWeight: '600',
  },
});

export default WelcomeScreen;
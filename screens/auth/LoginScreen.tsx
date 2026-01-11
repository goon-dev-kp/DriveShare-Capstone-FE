import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Role } from '@/models/types';
import { authService } from '@/services/authService';
import { useAuth } from '@/hooks/useAuth';

const COLORS = {
  primaryStart: '#00C6FF',
  primaryEnd: '#0072FF',
  activeBorder: '#00C6FF',
  textPrimary: '#2D3748',
  textSecondary: '#718096',
  inputBg: '#F7FAFC',
  borderColor: '#E2E8F0',
  bgColor: '#F9FAFB',
};

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>(Role.OWNER);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    setLoading(true);
    try {
      const response = await authService.login({ email, password }, role);
      if (response.isSuccess && response.result) {
        await login(response.result);
        const serverRole = response.result.role;
        const redirectPath =
          serverRole === Role.DRIVER ? '/(driver)/home' :
          serverRole === Role.OWNER ? '/(owner)/home' : '/(provider)/home';
        router.replace(redirectPath);
      } else {
        Alert.alert('Đăng nhập thất bại', response.message || 'Sai thông tin hoặc có lỗi xảy ra.');
      }
    } catch {
      Alert.alert('Lỗi', 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Component hiển thị Role Item
  const RoleItem = ({ itemRole, title, subTitle, iconSource }: { itemRole: Role, title: string, subTitle: string, iconSource: any }) => {
    const isActive = role === itemRole;
    return (
      <TouchableOpacity 
        style={[styles.roleItem, isActive && styles.roleItemActive]} 
        onPress={() => setRole(itemRole)}
        activeOpacity={0.8}
      >
        <Image 
          source={iconSource} 
          // Đã xóa logic tintColor để icon luôn hiện màu gốc
          style={styles.roleIcon}
          resizeMode="contain"
        />
        <Text style={[styles.roleTitle, isActive && styles.roleTitleActive]}>{title}</Text>
        <Text style={styles.roleSubTitle}>{subTitle}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.content}>
          <View style={styles.card}>
            
            {/* --- LOGO: Tăng kích thước --- */}
            <Image 
                source={require('../../assets/icon-with-name.png')} 
                style={styles.logo} 
                resizeMode="contain" 
            />
            
            <Text style={styles.headerTitle}>Đăng Nhập</Text>
            {/* <Text style={styles.headerSubtitle}>Vui lòng chọn vai trò của bạn:</Text> */}

            {/* --- BỘ CHỌN VAI TRÒ --- */}
            {/* <View style={styles.roleContainer}>
              <RoleItem 
                itemRole={Role.OWNER} 
                title="Chủ Xe" 
                subTitle="(Owner)" 
                iconSource={require('../../assets/icons/owner.png')} 
              />
              <RoleItem 
                itemRole={Role.PROVIDER} 
                title="Nhà Cung Cấp" 
                subTitle="(Provider)" 
                iconSource={require('../../assets/icons/provider.png')} 
              />
              <RoleItem 
                itemRole={Role.DRIVER} 
                title="Tài xế" 
                subTitle="(Driver)" 
                iconSource={require('../../assets/icons/driver.png')} 
              />
            </View> */}

            {/* Form nhập liệu */}
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Email hoặc Số điện thoại"
                placeholderTextColor={COLORS.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Mật khẩu"
                  placeholderTextColor={COLORS.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.showHideButton}>
                  <Text style={styles.showHideText}>{showPassword ? 'Ẩn' : 'Hiện'}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={handleSubmit} disabled={loading} activeOpacity={0.9} style={styles.buttonContainer}>
                <LinearGradient
                  colors={[COLORS.primaryStart, COLORS.primaryEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Đăng Nhập</Text>}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Bạn chưa có tài khoản? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.registerLink}>Đăng ký ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bgColor },
  container: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  content: { width: '100%', alignItems: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24, // Bo góc mềm mại hơn
    paddingHorizontal: 24,
    paddingVertical: 40,
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  // --- SỬA STYLE LOGO TO HƠN ---
  logo: { 
    width: 340,
    height: 120,
    marginBottom: 22,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  headerSubtitle: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 30 },
  
  roleContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 28 },
  roleItem: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    paddingVertical: 26, // larger tappable area
    alignItems: 'center',
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  roleItemActive: {
    backgroundColor: '#EBF8FF',
    borderColor: COLORS.activeBorder,
    borderWidth: 2, // Viền dày hơn khi chọn để dễ nhận biết
  },
  // --- SỬA STYLE ICON TO HƠN ---
  roleIcon: { 
    width: 88,
    height: 88,
    marginBottom: 12,
  },
  roleTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textSecondary, marginBottom: 4 },
  roleTitleActive: { color: COLORS.activeBorder },
  roleSubTitle: { fontSize: 12, color: COLORS.textSecondary },

  form: { width: '100%' },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 18,
    fontSize: 15,
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderRadius: 14,
    marginBottom: 24,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  showHideButton: { padding: 16 },
  showHideText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700' },

  buttonContainer: { width: '100%', borderRadius: 14, overflow: 'hidden' },
  gradientButton: { paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  forgotPassword: { alignSelf: 'center', marginTop: 20 },
  forgotPasswordText: { color: COLORS.activeBorder, fontSize: 14, fontWeight: '700' },

  footer: { flexDirection: 'row', marginTop: 30 },
  footerText: { color: COLORS.textSecondary, fontSize: 15 },
  registerLink: { color: COLORS.activeBorder, fontSize: 15, fontWeight: '700' },
});

export default LoginScreen;
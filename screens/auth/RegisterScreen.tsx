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
  ScrollView,
  StatusBar,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Role } from '../../models/types';
import { authService } from '../../services/authService';
import ImageUploader from '../provider-v2/components/ImageUploader';
import DatePicker from '@/components/DatePicker';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import TermsModal from '@/components/TermsModal';

// --- ĐỒNG BỘ MÀU VỚI LOGIN SCREEN ---
const COLORS = {
  primaryStart: '#00C6FF',
  primaryEnd: '#0072FF',
  activeBorder: '#00C6FF',
  textPrimary: '#2D3748',
  textSecondary: '#718096',
  inputBg: '#F7FAFC',
  borderColor: '#E2E8F0',
  bgColor: '#F9FAFB', 
  white: '#FFFFFF',
};

// --- QUAN TRỌNG: KHAI BÁO COMPONENT NÀY Ở NGOÀI ĐỂ KHÔNG BỊ MẤT FOCUS ---
interface InputFieldProps {
  icon: any;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  onFocusName: string;
  currentFocused: string | null;
  setFocused: (name: string | null) => void;
}

const InputField = ({ 
  icon, 
  placeholder, 
  value, 
  onChangeText, 
  secureTextEntry, 
  keyboardType, 
  onFocusName,
  currentFocused,
  setFocused 
}: InputFieldProps) => {
  const isFocused = currentFocused === onFocusName;
  return (
    <View style={[
      styles.inputContainer, 
      isFocused && styles.inputContainerFocused
    ]}>
      <Feather 
        name={icon} 
        size={20} 
        color={isFocused ? COLORS.activeBorder : COLORS.textSecondary} 
        style={styles.inputIcon} 
      />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        placeholderTextColor={COLORS.textSecondary}
        onFocus={() => setFocused(onFocusName)}
        onBlur={() => setFocused(null)}
      />
    </View>
  );
};

const RegisterScreen: React.FC = () => {
  const [userName, setUserName] = useState('');
  const [dob, setDob] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.OWNER);
  const [companyName, setCompanyName] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [avatar, setAvatar] = useState<{ uri?: string; imageURL?: string; base64?: string; fileName?: string; type?: string; } | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [dobDate, setDobDate] = useState<Date | null>(null)
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const router = useRouter();

  // --- LOGIC XỬ LÝ ---
  const handleSubmit = async () => {
    if (!userName || !email || !phoneNumber || !password || !confirmPassword || !agreed) {
        Alert.alert("Thiếu thông tin", "Vui lòng điền đầy đủ các trường bắt buộc và đồng ý điều khoản.");
        return;
    }
    if (password !== confirmPassword) {
        Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp.");
        return;
    }
    setLoading(true);
    try {
      const dobParsed = dobDate ?? (dob ? new Date(dob) : null)
      const commonPayload: any = {
        FullName: userName, Email: email, PhoneNumber: phoneNumber,
        Password: password, ConfirmPassword: confirmPassword, Address: address,
        DateOfBirth: dobParsed ? dobParsed.toISOString() : null,
      }

      let response: any;
      
      const buildAndSend = async (endpointPayload: any) => {
        // Debug: Log payload trước khi gửi
        console.log('📦 Register Payload:', JSON.stringify(endpointPayload, null, 2))
        
        // IMPORTANT: Backend uses [FromForm], so ALWAYS build FormData (like itemService)
        const form = new FormData()
        
        // Append all fields as strings, skip null/undefined/empty
        Object.keys(endpointPayload).forEach((k) => {
          const v = endpointPayload[k]
          if (v !== undefined && v !== null && v !== '') {
            form.append(k, String(v))
          }
        })
        
        // Attach avatar file if exists (using itemService upload pattern)
        if (avatar && avatar.uri) {
          const uri = avatar.uri;
          const fileName = avatar.fileName || 'avatar.jpg';
          const fileType = avatar.type || 'image/jpeg';
          
          // Cross-platform image upload handling (same as itemService)
          if (Platform.OS === 'web') {
            // Web: Convert URI to File object
            try {
              const response = await fetch(uri);
              const blob = await response.blob();
              const file = new File([blob], fileName, { type: fileType });
              form.append('AvatarFile', file);
            } catch (error) {
              console.error('Error converting image to File:', error);
              // Fallback: try to append URI directly
              // @ts-ignore
              form.append('AvatarFile', { uri, name: fileName, type: fileType });
            }
          } else {
            // Mobile: Ensure proper file:// URI for Android/iOS
            let mobileUri = uri;
            if (Platform.OS === 'android' && !uri.startsWith('file://') && !uri.startsWith('content://') && !uri.startsWith('http')) {
              mobileUri = `file://${uri}`;
            }
            
            const fileObj: any = {
              uri: mobileUri,
              name: fileName,
              type: fileType,
            };
            
            console.log('>>> [RegisterScreen] Appending avatar file (mobile):', JSON.stringify(fileObj));
            // @ts-ignore
            form.append('AvatarFile', fileObj);
          }
        }

        // Always send FormData to match backend [FromForm]
        if (role === Role.DRIVER) return await authService.registerDriver(form)
        if (role === Role.OWNER) return await authService.registerOwner(form)
        if (role === Role.PROVIDER) return await authService.registerProvider(form)
        return await authService.register(form)
      }

      if (role === Role.DRIVER) {
        response = await buildAndSend(commonPayload)
      } else if (role === Role.OWNER) {
        const ownerPayload = { ...commonPayload, CompanyName: companyName, TaxCode: taxCode, BussinessAddress: businessAddress }
        response = await buildAndSend(ownerPayload)
      } else if (role === Role.PROVIDER) {
        const providerPayload = { ...commonPayload, CompanyName: companyName, TaxCode: taxCode, BusinessAddress: businessAddress }
        response = await buildAndSend(providerPayload)
      } else {
        response = await buildAndSend({ ...commonPayload, role })
      }

      if (response.isSuccess) {
        Alert.alert("Thành công", "Tài khoản đã được tạo. Vui lòng đăng nhập.", [{ text: "OK", onPress: () => router.replace('/(auth)/login') }]);
      } else {
        Alert.alert('Đăng ký thất bại', response.message || 'Đã có lỗi xảy ra.');
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể hoàn tất đăng ký. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgColor }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgColor} />
      
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView 
            contentContainerStyle={styles.scrollContainer} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            
            <View style={styles.card}>
                {/* Header Style giống Login */}
                <Text style={styles.headerTitle}>Tạo Tài Khoản</Text>
                <Text style={styles.headerSubtitle}>Chọn vai trò và điền thông tin bên dưới</Text>

                {/* Role Selector */}
                <View style={styles.roleContainer}>
                    {[
                        { id: Role.OWNER, label: 'Chủ xe', sub: '(Owner)', icon: 'car-key' },
                        { id: Role.PROVIDER, label: 'Nhà CC', sub: '(Provider)', icon: 'domain' },
                        { id: Role.DRIVER, label: 'Tài xế', sub: '(Driver)', icon: 'steering' },
                    ].map((item) => {
                        const isActive = role === item.id;
                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.roleItem, isActive && styles.roleItemActive]}
                                onPress={() => setRole(item.id)}
                                activeOpacity={0.8}
                            >
                                <MaterialCommunityIcons 
                                    name={item.icon as any} 
                                    size={32} 
                                    color={isActive ? COLORS.activeBorder : COLORS.textSecondary} 
                                    style={{marginBottom: 8}}
                                />
                                <Text style={[styles.roleText, isActive && styles.roleTextActive]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        )
                    })}
                </View>

                {/* Avatar Uploader */}
                <View style={styles.avatarSection}>
                  <ImageUploader currentImage={avatar?.imageURL ?? avatar?.uri ?? null} onImageChange={(img) => setAvatar(img)} />
                    <Text style={styles.avatarHint}>Ảnh đại diện</Text>
                </View>

                {/* Form Fields - Sử dụng InputField đã tách ra ngoài */}
                <View style={styles.formSection}>
                    <InputField 
                        icon="user" 
                        placeholder="Họ và tên" 
                        value={userName} 
                        onChangeText={setUserName} 
                        onFocusName="userName"
                        currentFocused={focusedInput}
                        setFocused={setFocusedInput}
                    />
                    
                    <TouchableOpacity 
                        style={[styles.inputContainer, focusedInput === 'dob' && styles.inputContainerFocused]} 
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Feather name="calendar" size={20} color={dobDate ? COLORS.activeBorder : COLORS.textSecondary} style={styles.inputIcon} />
                        <Text style={[styles.dateText, !dobDate && { color: COLORS.textSecondary }]}>
                            {dobDate ? dobDate.toLocaleDateString('vi-VN') : 'Ngày sinh (DD/MM/YYYY)'}
                        </Text>
                    </TouchableOpacity>
                    
                    <InputField 
                        icon="phone" 
                        placeholder="Số điện thoại" 
                        value={phoneNumber} 
                        onChangeText={setPhoneNumber} 
                        keyboardType="phone-pad" 
                        onFocusName="phone"
                        currentFocused={focusedInput}
                        setFocused={setFocusedInput}
                    />

                    <View style={[styles.inputContainer, { paddingVertical: 2, paddingRight: 4, zIndex: 10 }]}>
                        <Feather name="map-pin" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                        <View style={{ flex: 1 }}>
                            <AddressAutocomplete
                                value={address}
                                onSelect={(suggestion) => setAddress(suggestion?.display || suggestion?.name || '')}
                                placeholder="Địa chỉ thường trú"
                            />
                        </View>
                    </View>

                    <InputField 
                        icon="mail" 
                        placeholder="Email" 
                        value={email} 
                        onChangeText={setEmail} 
                        keyboardType="email-address" 
                        onFocusName="email"
                        currentFocused={focusedInput}
                        setFocused={setFocusedInput}
                    />

                    {/* Extra Fields */}
                    {(role === Role.OWNER || role === Role.PROVIDER) && (
                    <View style={styles.extraFields}>
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>THÔNG TIN DOANH NGHIỆP</Text>
                            <View style={styles.dividerLine} />
                        </View>
                        <InputField 
                            icon="briefcase" 
                            placeholder="Tên công ty (nếu có)" 
                            value={companyName} 
                            onChangeText={setCompanyName} 
                            onFocusName="company"
                            currentFocused={focusedInput}
                            setFocused={setFocusedInput}
                        />
                        <InputField 
                            icon="hash" 
                            placeholder="Mã số thuế" 
                            value={taxCode} 
                            onChangeText={setTaxCode} 
                            onFocusName="tax"
                            currentFocused={focusedInput}
                            setFocused={setFocusedInput}
                        />
                        <View style={[styles.inputContainer, { paddingVertical: 2, paddingRight: 4, zIndex: 9 }]}>
                            <Feather name="map" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                            <View style={{ flex: 1 }}>
                                <AddressAutocomplete
                                    value={businessAddress}
                                    onSelect={(s) => setBusinessAddress(s?.display || s?.name || '')}
                                    placeholder="Địa chỉ kinh doanh"
                                />
                            </View>
                        </View>
                    </View>
                    )}

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 6 }}>
                            <InputField 
                                icon="lock" 
                                placeholder="Mật khẩu" 
                                value={password} 
                                onChangeText={setPassword} 
                                secureTextEntry 
                                onFocusName="pass"
                                currentFocused={focusedInput}
                                setFocused={setFocusedInput}
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 6 }}>
                            <InputField 
                                icon="check-circle" 
                                placeholder="Xác nhận" 
                                value={confirmPassword} 
                                onChangeText={setConfirmPassword} 
                                secureTextEntry 
                                onFocusName="confirmPass"
                                currentFocused={focusedInput}
                                setFocused={setFocusedInput}
                            />
                        </View>
                    </View>

                    {/* Terms Checkbox */}
                    <View style={styles.termsContainer}>
                        <TouchableOpacity 
                            style={styles.checkbox}
                            onPress={() => setAgreed(!agreed)}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.checkboxBox, agreed && styles.checkboxActive]}>
                                {agreed && <Feather name="check" size={14} color="#FFF" />}
                            </View>
                        </TouchableOpacity>
                        <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                            <Text style={styles.termsText}>Đồng ý với </Text>
                            <Text 
                                style={styles.linkText}
                                onPress={() => setShowTermsModal(true)}
                            >
                                Điều khoản & Chính sách
                            </Text>
                        </View>
                    </View>

                    {/* Submit Button Gradient */}
                    <TouchableOpacity 
                        style={styles.submitButtonContainer} 
                        onPress={handleSubmit} 
                        disabled={loading}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={[COLORS.primaryStart, COLORS.primaryEnd]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.submitGradient}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.submitText}>ĐĂNG KÝ NGAY</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Đã có tài khoản? </Text>
                    <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                    <Text style={styles.loginLink}>Đăng nhập</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={{ height: 40 }} /> 
          </ScrollView>
          
          <DatePicker
            visible={showDatePicker}
            value={dobDate || new Date(1990, 0, 1)}
            maximumDate={new Date()}
            onClose={() => setShowDatePicker(false)}
            onChange={(selectedDate?: Date) => {
              setShowDatePicker(false)
              if (selectedDate) setDobDate(selectedDate)
            }}
          />
          <TermsModal visible={showTermsModal} onClose={() => setShowTermsModal(false)} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgColor,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24, // Bo góc giống Login
    paddingHorizontal: 20,
    paddingVertical: 32,
    width: '100%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  // --- ROLE SELECTOR STYLE GIỐNG LOGIN (BOX STYLE) ---
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 10,
  },
  roleItem: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  roleItemActive: {
    backgroundColor: '#EBF8FF', // Xanh rất nhạt
    borderColor: COLORS.activeBorder,
    borderWidth: 2,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  roleTextActive: {
    color: COLORS.activeBorder,
  },
  // --- AVATAR ---
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarHint: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  // --- INPUT FORM (STYLE GIỐNG LOGIN) ---
  formSection: {
    gap: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg, // Màu nền Input giống Login
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    paddingHorizontal: 14,
    height: 52,
  },
  inputContainerFocused: {
    borderColor: COLORS.activeBorder, // Màu border focus giống Login
    backgroundColor: '#FFF',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    height: '100%',
  },
  dateText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  row: {
    flexDirection: 'row',
  },
  extraFields: {
    gap: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderColor,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  checkbox: {
    marginRight: 10,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.borderColor,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
  },
  checkboxActive: {
    backgroundColor: COLORS.activeBorder,
    borderColor: COLORS.activeBorder,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  linkText: {
    color: COLORS.activeBorder,
    fontWeight: '700',
  },
  submitButtonContainer: {
    marginTop: 10,
    borderRadius: 14,
    overflow: 'hidden',
  },
  submitGradient: {
    paddingVertical: 18, // Height giống Login
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  loginLink: {
    color: COLORS.activeBorder,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default RegisterScreen;
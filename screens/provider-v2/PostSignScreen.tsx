import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons' // Đảm bảo đã cài thư viện icon
import postPackageService from '@/services/postPackageService'
import contractTemplateService from '@/services/contractTemplateService'

const COLORS = {
  primary: '#0284C7', // Xanh chủ đạo
  background: '#F3F4F6', // Xám nhạt nền
  white: '#FFFFFF',
  textMain: '#111827',
  textSec: '#6B7280',
  border: '#E5E7EB',
  infoBg: '#E0F2FE',
  infoText: '#0369A1',
  success: '#10B981'
}

const PostSignScreen: React.FC = () => {
  const params: any = useLocalSearchParams()
  const router = useRouter()
  const postId = params.postId as string | undefined
  
  const [loading, setLoading] = useState(false)
  const [post, setPost] = useState<any>(null)
  const [contractTemplate, setContractTemplate] = useState<any | null>(null)
  const [modalVisible, setModalVisible] = useState(true)
  const [agreed, setAgreed] = useState(false) // State cho checkbox

  useEffect(() => {
    if (postId) {
      fetchDetails()
      fetchContract()
    }
  }, [postId])

  const fetchDetails = async () => {
    setLoading(true)
    try {
      const res: any = await postPackageService.getPostPackageDetails(postId!)
      setPost(res?.result ?? res)
    } catch (e) { console.warn(e) } finally { setLoading(false) }
  }

  const fetchContract = async () => {
    try {
      const resp: any = await contractTemplateService.getLatestProviderContract()
      const tpl = resp?.result ?? resp
      setContractTemplate(tpl)
    } catch (e) { console.warn('fetchContract failed', e); setContractTemplate(null) }
  }

  const handleSign = async () => {
    if (!agreed) return;

    Alert.alert(
      'Xác nhận ký kết',
      'Bạn đồng ý ủy quyền cho nền tảng tự động hoàn tất quy trình ký kết với Chủ hàng (Owner) dựa trên các điều khoản này?',
      [
        { text: 'Xem lại', style: 'cancel' },
        {
          text: 'Đồng ý & Ký',
          onPress: async () => {
            setLoading(true)
            try {
              const upd: any = await postPackageService.updatePostStatus(postId!, 'AWAITING_PAYMENT')
              const ok = upd?.isSuccess ?? upd?.statusCode === 200
              if (!ok) throw new Error(upd?.message || 'Không thể cập nhật trạng thái')
              
              setModalVisible(false)
              // Chuyển hướng hoặc thông báo
              Alert.alert('Thành công', 'Hợp đồng đã được ký. Vui lòng thanh toán để đăng bài.', [
                { text: 'OK', onPress: () => router.back() } 
                // Hoặc router.push('/payment') tùy luồng của bạn
              ])
            } catch (e: any) {
              Alert.alert('Lỗi', e?.message || 'Thất bại')
            } finally {
              setLoading(false)
            }
          }
        }
      ]
    )
  }

  const handleClose = () => {
    setModalVisible(false)
    router.back()
  }

  return (
    <Modal visible={modalVisible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        {/* 1. Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Xác nhận Hợp đồng</Text>
            <Text style={styles.headerSub}>Mã bài đăng: {post?.packageCode || '...'}</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={COLORS.textSec} />
          </TouchableOpacity>
        </View>

        {loading && !post ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ marginTop: 10, color: COLORS.textSec }}>Đang tải hợp đồng...</Text>
          </View>
        ) : (
          <>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              
              {/* 2. Info Banner (Authorization Explanation) */}
              <View style={styles.infoBanner}>
                <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.infoText} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoTitle}>Ủy quyền ký tự động</Text>
                  <Text style={styles.infoDesc}>
                    Bằng việc xác nhận, bạn đồng ý các điều khoản vận chuyển và ủy quyền cho nền tảng 
                    <Text style={{ fontWeight: '700' }}> tự động ký hợp đồng điện tử </Text> 
                    với Chủ hàng (Owner) khi họ chấp nhận chuyến xe này. Giúp tiết kiệm thời gian thao tác.
                  </Text>
                </View>
              </View>

              {/* 3. Contract Paper View */}
              <View style={styles.contractContainer}>
                <View style={styles.contractHeader}>
                  <MaterialCommunityIcons name="file-document-edit-outline" size={24} color={COLORS.primary} />
                  <Text style={styles.contractName}>
                    {contractTemplate?.contractTemplateName ?? 'HỢP ĐỒNG VẬN TẢI ĐIỆN TỬ'}
                  </Text>
                </View>
                
                <View style={styles.divider} />

                <View style={styles.termsList}>
                  {contractTemplate?.contractTerms && contractTemplate.contractTerms.length > 0 ? (
                    contractTemplate.contractTerms.map((t: any, idx: number) => (
                      <View key={idx} style={styles.termItem}>
                        <Text style={styles.termIndex}>Điều {idx + 1}:</Text>
                        <Text style={styles.termContent}>{t.content}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={{ textAlign: 'center', color: COLORS.textSec, fontStyle: 'italic' }}>
                      Đang tải nội dung điều khoản...
                    </Text>
                  )}
                </View>
                
                <Text style={styles.versionText}>Phiên bản hợp đồng: {contractTemplate?.version ?? '1.0'}</Text>
              </View>

              <View style={{ height: 100 }} /> 
            </ScrollView>

            {/* 4. Sticky Footer Action */}
            <View style={styles.footer}>
              {/* Checkbox Agreement */}
              <TouchableOpacity 
                style={styles.checkboxContainer} 
                activeOpacity={0.8}
                onPress={() => setAgreed(!agreed)}
              >
                <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                  {agreed && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
                </View>
                <Text style={styles.checkboxText}>
                  Tôi đã đọc, hiểu rõ và đồng ý với các điều khoản trên cũng như quy chế hoạt động của sàn.
                </Text>
              </TouchableOpacity>

              {/* Action Button */}
              <TouchableOpacity 
                style={[styles.btnPrimary, !agreed && styles.btnDisabled]} 
                onPress={handleSign} 
                disabled={loading || !agreed}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.btnText}>ĐỒNG Ý & TIẾP TỤC THANH TOÁN</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 }
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textMain },
  headerSub: { fontSize: 13, color: COLORS.textSec, marginTop: 2 },
  closeBtn: { padding: 4 },

  // Scroll Content
  scrollContent: { padding: 16, paddingBottom: 120 },

  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.infoBg,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 16,
    alignItems: 'flex-start'
  },
  infoTitle: { fontSize: 14, fontWeight: '700', color: COLORS.infoText, marginBottom: 4 },
  infoDesc: { fontSize: 13, color: '#0C4A6E', lineHeight: 18 },

  // Contract Paper
  contractContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  contractHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  contractName: { fontSize: 16, fontWeight: '700', color: COLORS.textMain, marginLeft: 8, textTransform: 'uppercase', textAlign: 'center', flex: 1 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  
  termsList: { marginTop: 4 },
  termItem: { marginBottom: 12 },
  termIndex: { fontSize: 14, fontWeight: '700', color: COLORS.textMain, marginBottom: 4 },
  termContent: { fontSize: 14, color: '#374151', lineHeight: 22, textAlign: 'justify' },
  versionText: { marginTop: 16, fontSize: 12, color: '#9CA3AF', textAlign: 'center', fontStyle: 'italic' },

  // Footer
  footer: {
    backgroundColor: COLORS.white,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },
  checkboxContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.textSec,
    marginRight: 10,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center'
  },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkboxText: { flex: 1, fontSize: 13, color: COLORS.textMain, lineHeight: 18 },
  
  btnPrimary: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 3
  },
  btnDisabled: { backgroundColor: '#9CA3AF', shadowOpacity: 0 },
  btnText: { color: COLORS.white, fontWeight: '700', fontSize: 15, textTransform: 'uppercase' }
})

export default PostSignScreen
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

interface WalletCardProps {
  balance?: string
  wallet?: any
  onDeposit?: () => void
  onWithdraw?: () => void
}

const WalletCard: React.FC<WalletCardProps> = ({ balance, wallet, onDeposit, onWithdraw }) => {
  const router = useRouter()
  const displayBalance = wallet?.balance ?? balance ?? '0'
  
  const handleDeposit = () => {
    if (onDeposit) {
      onDeposit()
    } else {
      router.push('/wallet-operations')
    }
  }
  
  const handleWithdraw = () => {
    if (onWithdraw) {
      onWithdraw()
    } else {
      router.push('/wallet-operations')
    }
  }
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Tổng quan Tài chính & Hoạt động</Text>
      
      <LinearGradient
        // Màu Gradient: Xanh đậm -> Vàng kim
        colors={['#10439F', '#DFA546']} 
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Nội dung bên trái */}
        <View style={styles.leftContent}>
          <Text style={styles.label}>Số dư khả dụng:</Text>
          <Text style={styles.balanceText}>{displayBalance} đ</Text>
          
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.btnDeposit} onPress={handleDeposit}>
              <Text style={styles.btnDepositText}>Nạp tiền</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.btnWithdraw} onPress={handleWithdraw}>
              <Text style={styles.btnWithdrawText}>Rút tiền</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hình ảnh Ví bên phải */}
        <View style={styles.rightContent}>
          {/* Nếu có ảnh thật thì dùng: 
             <Image source={require('../../assets/images/wallet.png')} style={styles.walletImage} /> 
          */}
          <MaterialCommunityIcons 
            name="wallet-giftcard" 
            size={80} 
            color="#FCD34D" 
            style={{ opacity: 0.9 }} 
          />
        </View>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  leftContent: {
    flex: 1,
  },
  rightContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 10,
  },
  walletImage: {
    width: 80, 
    height: 80, 
    resizeMode: 'contain'
  },
  label: {
    color: '#E2E8F0',
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
  },
  balanceText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnDeposit: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  btnDepositText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 13,
  },
  btnWithdraw: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  btnWithdrawText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
})

export default WalletCard
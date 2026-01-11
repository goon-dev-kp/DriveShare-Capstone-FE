import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { authService } from '../../services/authService'

const { width } = Dimensions.get('window')

const VerifyEmailScreen = () => {
  const router = useRouter()
  const params = useLocalSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [fadeAnim] = useState(new Animated.Value(0))
  const [scaleAnim] = useState(new Animated.Value(0.8))

  useEffect(() => {
    // Animate entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start()

    verifyEmail()
  }, [])

  const verifyEmail = async () => {
    try {
      const userId = params.userId as string
      const token = params.token as string

      if (!userId || !token) {
        setStatus('error')
        setMessage('Liên kết xác thực không hợp lệ. Vui lòng kiểm tra lại email của bạn.')
        return
      }

      // Call API to verify email
      const response = await authService.verifyEmail(userId, token)

      if (response.statusCode === 200) {
        setStatus('success')
        setMessage('Xác thực email thành công! Đang chuyển đến trang đăng nhập...')
        
        // Redirect to login after 2.5 seconds
        setTimeout(() => {
          router.replace('/login')
        }, 2500)
      } else {
        setStatus('error')
        setMessage(response.message || 'Xác thực email thất bại. Vui lòng thử lại.')
      }
    } catch (error: any) {
      console.error('Email verification error:', error)
      setStatus('error')
      setMessage(
        error?.response?.data?.message || 
        'Đã xảy ra lỗi khi xác thực email. Vui lòng thử lại sau.'
      )
    }
  }

  const renderIcon = () => {
    if (status === 'loading') {
      return (
        <View style={styles.iconContainer}>
          <ActivityIndicator size={80} color="#00C6FF" />
          <View style={styles.pulseContainer}>
            <Animated.View
              style={[
                styles.pulse,
                {
                  opacity: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.3],
                  }),
                },
              ]}
            />
          </View>
        </View>
      )
    }

    if (status === 'success') {
      return (
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.successIcon}>
            <Text style={styles.iconText}>✓</Text>
          </View>
        </Animated.View>
      )
    }

    if (status === 'error') {
      return (
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.errorIcon}>
            <Text style={styles.iconText}>✕</Text>
          </View>
        </Animated.View>
      )
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'loading':
        return 'Đang xác thực email...'
      case 'success':
        return 'Xác thực thành công!'
      case 'error':
        return 'Xác thực thất bại'
      default:
        return ''
    }
  }

  return (
    <LinearGradient
      colors={['#00C6FF', '#0072FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.card}>
          {renderIcon()}

          <Text style={styles.title}>{getStatusText()}</Text>
          <Text style={styles.message}>{message}</Text>

          {status === 'loading' && (
            <View style={styles.loadingBar}>
              <View style={styles.loadingBarTrack}>
                <Animated.View
                  style={[
                    styles.loadingBarFill,
                    {
                      width: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {status === 'error' && (
            <Text style={styles.helpText}>
              Nếu vấn đề vẫn tiếp diễn, vui lòng liên hệ bộ phận hỗ trợ.
            </Text>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>DriveShare Platform</Text>
          <Text style={styles.footerSubtext}>Nền tảng chia sẻ xe hàng đầu Việt Nam</Text>
        </View>
      </Animated.View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 40,
    width: '100%',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
      android: {
        elevation: 15,
      },
      web: {
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  iconContainer: {
    marginBottom: 30,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulse: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#00C6FF',
    position: 'absolute',
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 60,
    color: '#fff',
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  loadingBar: {
    marginTop: 30,
    width: '100%',
  },
  loadingBarTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingBarFill: {
    height: '100%',
    backgroundColor: '#00C6FF',
    borderRadius: 2,
  },
  helpText: {
    marginTop: 20,
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
})

export default VerifyEmailScreen

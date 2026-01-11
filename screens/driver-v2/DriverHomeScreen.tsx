

import React, { useEffect, useState, useRef } from 'react'
import { View, StyleSheet, ScrollView, StatusBar, Text, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'
import HeaderDriver from './components/HeaderDriver'
import DriverManagementTabs from './components/DriverManagementTabs'
import WalletCard from '@/components/WalletCard'
import DrivingHoursCard from './components/DrivingHoursCard'
import userService from '@/services/userService'
import driverWorkSessionService from '@/services/driverWorkSessionService'
import walletService from '@/services/walletService'
import { ekycService } from '@/services/ekycService'

const DriverHomeScreen: React.FC = () => {
  const { user, wallet } = useAuth()
  const authStore = useAuthStore

  // profile from server (prefer) or from global auth store
  const [profile, setProfile] = useState<any | null>(null)
  const driverData = (profile as any) ?? (user as any) ?? {}

  const [drivingStats, setDrivingStats] = useState({
    continuous: { current: 0, max: 4, status: 'SAFE' },
    daily: { current: 0, max: 10, status: 'SAFE' },
    weekly: { current: 0, max: 48, status: 'SAFE' }
  })

  const mountedRef = useRef<boolean>(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadProfileAndData = async () => {
    try {
      // 1) Fetch profile (my profile) - contains verification status
      const resp: any = await userService.getMyProfile()
      const prof = resp?.result ?? resp

      if (prof && mountedRef.current) {
        // Merge into existing auth user object and persist only if we already have a stored user (token/login flow)
        try {
          const existing = useAuthStore.getState().user
          if (existing) {
            const merged = {
              ...existing,
              profile: prof,
              userName: prof.fullName ?? existing.userName,
              email: prof.email ?? existing.email,
              phoneNumber: prof.phoneNumber ?? existing.phoneNumber,
              avatarUrl: prof.avatarUrl ?? existing.avatarUrl,
              hasVerifiedCitizenId: prof.hasVerifiedCitizenId ?? false,
              hasVerifiedDriverLicense: prof.hasVerifiedDriverLicense ?? false,
              hasDeclaredInitialHistory: prof.hasDeclaredInitialHistory ?? false,
            }
            useAuthStore.setState({ user: merged })
            await AsyncStorage.setItem('user', JSON.stringify(merged))
          }
        } catch (e) {
          console.warn('persist profile failed', e)
        }
        // always set local profile for immediate UI usage
        setProfile(prof)
      }

      // 2) Fetch wallet (best-effort)
      try {
        const wresp: any = await walletService.getMyWallet()
        const w = wresp?.result ?? wresp
        if (mountedRef.current) {
          useAuthStore.setState({ wallet: w })
          await AsyncStorage.setItem('wallet', JSON.stringify(w))
        }
      } catch (e) {
        console.warn('wallet fetch failed', e)
      }

      // 3) Fetch driver history: daily and weekly
      const today = new Date()
      const fromToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
      const toToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()

      const dailyResp: any = await driverWorkSessionService.getHistory({ FromDate: fromToday, ToDate: toToday, PageIndex: 1, PageSize: 100 })
      const dailyResult = dailyResp?.result ?? dailyResp
      const dailyHours = Number(dailyResult?.TotalHoursInPeriod ?? dailyResult?.totalHoursInPeriod ?? 0) || 0

      // weekly: last 7 days
      const weekFrom = new Date()
      weekFrom.setDate(today.getDate() - 6)
      const fromWeek = new Date(weekFrom.getFullYear(), weekFrom.getMonth(), weekFrom.getDate()).toISOString()
      const weeklyResp: any = await driverWorkSessionService.getHistory({ FromDate: fromWeek, ToDate: toToday, PageIndex: 1, PageSize: 500 })
      const weeklyResult = weeklyResp?.result ?? weeklyResp
      const weeklyHours = Number(weeklyResult?.TotalHoursInPeriod ?? weeklyResult?.totalHoursInPeriod ?? 0) || 0

      // check for active session (continuous): look into today's sessions for EndTime == null
      const sessions = dailyResult?.Sessions ?? []
      let continuousHours = 0
      const active = sessions.find((s: any) => !s.EndTime)
      if (active) {
        const start = new Date(active.StartTime)
        continuousHours = (Date.now() - start.getTime()) / (1000 * 60 * 60)
      }

      if (mountedRef.current) {
        setDrivingStats({
          continuous: { current: Number(continuousHours.toFixed(2)), max: 4, status: continuousHours >= 4 ? 'WARNING' : 'SAFE' },
          daily: { current: Number(dailyHours.toFixed(2)), max: 10, status: dailyHours >= 10 ? 'WARNING' : 'SAFE' },
          weekly: { current: Number(weeklyHours.toFixed(2)), max: 48, status: weeklyHours >= 48 ? 'WARNING' : 'SAFE' }
        })
      }
    } catch (e) {
      console.warn('DriverHome load failed', e)
    }
  }

  useEffect(() => {
    mountedRef.current = true
    return () => { 
      mountedRef.current = false
    }
  }, [])

  // Load data only when screen is focused (visible)
  useFocusEffect(
    React.useCallback(() => {
      if (mountedRef.current) {
        loadProfileAndData()
      }
      return () => {}
    }, [])
  )

  const onRefresh = async () => {
    try {
      setRefreshing(true)
      await loadProfileAndData()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <SafeAreaView style={styles.mainContainer} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 1. Header: Profile Info & Background */}
        <HeaderDriver driver={driverData} onRefresh={onRefresh} refreshing={refreshing} />

        <View style={styles.bodyContent}>
          {/* 2. Wallet: Thu nhập & Rút tiền */}
          <WalletCard wallet={wallet} />

          {/* 3. Giám sát giờ lái (Theo luật) */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>⏱️ Giám sát Giờ Lái Xe</Text>
            <DrivingHoursCard stats={drivingStats} />
          </View>

          {/* 4. Menu Quản lý: Tìm chuyến & Chuyến của tôi */}
          <DriverManagementTabs />

          {/* Padding bottom */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F1F5F9', // Xám xanh rất nhạt, dịu mắt
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  bodyContent: {
    paddingHorizontal: 16,
    marginTop: 0, // avoid overlapping header; wallet card sits below header
    paddingTop: 8,
  },
  sectionContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
    marginLeft: 4,
  },
})

export default DriverHomeScreen

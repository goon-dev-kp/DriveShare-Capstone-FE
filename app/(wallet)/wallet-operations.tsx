import React from 'react'
import { useRouter, useLocalSearchParams } from 'expo-router'
import WalletOperationsScreen from '@/screens/shared/WalletOperationsScreen'

export default function WalletOperationsPage() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const prefilledAmount = params.amount ? String(params.amount) : ''
  
  return (
    <WalletOperationsScreen 
      onBack={() => router.back()} 
      prefilledAmount={prefilledAmount}
    />
  )
}

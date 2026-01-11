import React from 'react'
import { useRouter } from 'expo-router'
import PackagesManagementScreen from '@/screens/provider-v2/PackagesManagementScreen'

export default function ProviderPackagesPage() {
  const router = useRouter()

  const handleBack = () => {
    // navigate back to provider home (fallback to router.back)
    try {
      router.push('/(provider)/home')
    } catch {
      router.back()
    }
  }

  return <PackagesManagementScreen onBack={handleBack} />
}

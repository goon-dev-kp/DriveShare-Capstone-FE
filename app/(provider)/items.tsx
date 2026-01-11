import React from 'react'
import { useRouter } from 'expo-router'
import ItemsManagementScreen from '@/screens/provider-v2/ItemsManagementScreen'

export default function ProviderItemsPage() {
  const router = useRouter()

  const handleBack = () => {
    // quay về trang provider home
    try {
      router.push('/(provider)/home')
    } catch {
      router.back()
    }
  }

  return <ItemsManagementScreen onBack={handleBack} />
}

import React from 'react'
import { useRouter } from 'expo-router'
import PostPackagesManagementScreen from '@/screens/owner-v2/PostPackagesManagementScreen'

export default function ProviderPostsPage() {
  const router = useRouter()
  const handleBack = () => {
    try {
      router.push('/(owner)/home')
    } catch {
      router.back()
    }
  }
  return <PostPackagesManagementScreen onBack={handleBack} />
}

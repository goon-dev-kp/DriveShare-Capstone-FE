import React from 'react'
import { useRouter } from 'expo-router'
import PostsManagementScreen from '@/screens/provider-v2/PostsManagementScreen'

export default function ProviderPostsPage() {
  const router = useRouter()

  const handleBack = () => {
    try {
      router.push('/(provider)/home')
    } catch {
      router.back()
    }
  }

  return <PostsManagementScreen onBack={handleBack} />
}

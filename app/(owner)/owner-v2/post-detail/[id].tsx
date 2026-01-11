import React, { useState, useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import OwnerPostDetailModal from '@/screens/owner-v2/components/OwnerPostDetailModal'

export default function OwnerPostDetailPage() {
  const { id } = useLocalSearchParams() as { id?: string }
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(true)

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      router.back()
    }, 100)
  }

  if (!id) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    )
  }

  return (
    <OwnerPostDetailModal
      visible={isVisible}
      postId={id}
      onClose={handleClose}
      onAccept={() => Promise.resolve()}
      onRefresh={() => {}}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
})

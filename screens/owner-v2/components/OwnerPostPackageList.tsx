

import React from 'react'
import { FlatList, View, Text, StyleSheet } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { FreightPost } from '@/models/types'
import OwnerPostPackageCard from './OwnerPostPackageCard'

interface Props {
  posts: FreightPost[]
  onView?: (postId: string) => void
  onAccept?: (postId: string) => void
  getStatusColor?: (status: string) => string
  onRefresh?: () => void
}

const OwnerPostPackageList: React.FC<Props> = ({ posts, onView, onAccept, getStatusColor, onRefresh }) => {
  
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBg}>
        <MaterialCommunityIcons name="file-document-edit-outline" size={48} color="#9CA3AF" />
      </View>
      <Text style={styles.emptyTitle}>Chưa có bài đăng</Text>
      <Text style={styles.emptySubtitle}>Tạo bài đăng mới để tìm tài xế vận chuyển hàng hóa của bạn.</Text>
    </View>
  )

  return (
    <FlatList
      data={posts}
      renderItem={({ item }) => (
        <OwnerPostPackageCard 
          post={item} 
          onView={onView}
          onAccept={onAccept}
          getStatusColor={getStatusColor}
          onRefresh={onRefresh}
        />
      )}
      keyExtractor={(i) => i.id}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  )
}

const styles = StyleSheet.create({
  listContent: { padding: 16, paddingBottom: 80 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
})

export default OwnerPostPackageList
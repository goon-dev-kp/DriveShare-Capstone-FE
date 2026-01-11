

import React from 'react'
import { View, Text, StyleSheet, FlatList } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { FreightPost } from '../../../models/types'
import PostPackageCard from './PostPackageCard'

interface PostListProps {
  posts: FreightPost[]
  onEdit: (post: FreightPost) => void
  onDelete: (postId: string) => void
  onView?: (postId: string) => void
  showActions?: boolean
  onSign?: (postId: string) => void
  onPay?: (postId: string) => void
}

const PostPackageList: React.FC<PostListProps> = ({ posts, onEdit, onDelete, onView, showActions = true, onSign, onPay }) => {
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBg}>
        <MaterialCommunityIcons name="file-document-edit-outline" size={48} color="#9CA3AF" />
      </View>
      <Text style={styles.emptyTitle}>Chưa có bài đăng nào</Text>
      <Text style={styles.emptySubtitle}>Tạo bài đăng mới để tìm tài xế vận chuyển.</Text>
    </View>
  )

  return (
    <FlatList
      data={posts}
      renderItem={({ item }) => (
        <PostPackageCard 
          post={item} 
          onEdit={() => onEdit(item)} 
          onDelete={() => onDelete(item.id)} 
          onView={onView}
          onSign={() => onSign?.(item.id)}
          onPay={() => onPay?.(item.id)}
          showActions={showActions}
        />
      )}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={renderEmpty}
      showsVerticalScrollIndicator={false}
    />
  )
}

const styles = StyleSheet.create({
  listContent: { padding: 16, paddingBottom: 80 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
  emptyIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
})

export default PostPackageList


import React from 'react'
import { View, Text, StyleSheet, FlatList } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Package } from '../../../models/types'
import PackageCard from './PackageCard'

interface PackageListProps {
  packages: any
  onEdit: (pkg: Package) => void
  onDelete: (packageId: string) => void
  onPost: (pkg: Package) => void
  getStatusColor?: (status: string) => string
}

const PackageList: React.FC<PackageListProps> = ({ packages, onEdit, onDelete, onPost, getStatusColor }) => {
  console.log('📦 [PackageList] Received packages:', packages);
  console.log('📦 [PackageList] Is array?', Array.isArray(packages));
  
  let list: Package[] = []
  if (Array.isArray(packages)) {
    list = packages
    console.log('📦 [PackageList] Using array directly, length:', list.length);
  } else if (packages?.data) {
    list = packages.data
    console.log('📦 [PackageList] Using packages.data, length:', list.length);
  } else if (packages?.items) {
    list = packages.items
    console.log('📦 [PackageList] Using packages.items, length:', list.length);
  }
  
  console.log('📦 [PackageList] Final list:', list);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBg}>
        <MaterialCommunityIcons name="package-variant-closed" size={48} color="#9CA3AF" />
      </View>
      <Text style={styles.emptyTitle}>Chưa có gói hàng</Text>
      <Text style={styles.emptySubtitle}>Tạo gói hàng từ sản phẩm để bắt đầu vận chuyển.</Text>
    </View>
  )

  return (
    <FlatList
      key="single-column-list"
      data={list}
      renderItem={({ item }) => (
        <PackageCard 
          pkg={item} 
          onEdit={() => onEdit(item)} 
          onDelete={() => onDelete(item.id)} 
          onPost={() => onPost(item)}
          getStatusColor={getStatusColor}
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
  listContent: { paddingHorizontal: 0, paddingTop: 8, paddingBottom: 80 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
})

export default PackageList
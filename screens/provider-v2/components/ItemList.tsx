import React from 'react'
import { View, Text, StyleSheet, FlatList } from 'react-native'
import { Item } from '../../../models/types'
import ItemCard from './ItemCard'
import { CubeIcon } from '../icons/ManagementIcons'

interface ItemListProps {
  items: Item[]
  onEdit: (item: Item) => void
  onDelete: (itemId: string) => void
  onPack: (item: Item) => void
  deletingId?: string | null
  getStatusColor?: (status: string) => string
}

const ItemList: React.FC<ItemListProps> = ({ items, onEdit, onDelete, onPack, deletingId, getStatusColor }) => {
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
<CubeIcon style={styles.emptyIcon} />
<Text style={styles.emptyTitle}>Không tìm thấy sản phẩm</Text>
<Text style={styles.emptySubtitle}>
        Hãy bắt đầu bằng cách thêm sản phẩm mới.
      </Text>
</View>
  )

  return (
    <FlatList
      key="single-column-list"
      data={items}
      renderItem={({ item }) => (
        <ItemCard
          item={item}
          onEdit={() => onEdit(item)}
          onDelete={() => onDelete(item.id)}
          onPack={() => onPack(item)}
          deleting={Boolean(deletingId && deletingId === item.id)}
          getStatusColor={getStatusColor}
        />
      )}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={renderEmptyComponent}
      style={styles.listContainer}
      contentContainerStyle={styles.listContentContainer}
    />
  )
}

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  listContentContainer: {
    paddingHorizontal: 0,
    paddingBottom: 120,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: '30%', // Đẩy xuống giữa màn hình
  },
  emptyIcon: {
    width: 60,
    height: 60,
    color: '#9CA3AF', // text-gray-400
  },
  emptyTitle: {
    fontSize: 20, // text-xl
    fontWeight: '600', // font-semibold
    color: '#374151', // text-gray-700
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280', // text-gray-500
    marginTop: 8,
  },

})

export default ItemList
// import React from 'react'
// import { View, Text, StyleSheet, FlatList } from 'react-native'
// import VehicleCard from './VehicleCard'
// import { Vehicle } from '../../../models/types'
// import { TruckIcon } from '../../provider-v2/icons/StatIcon'

// interface Props {
//   vehicles: any
//   onEdit: (v: Vehicle) => void
//   onDelete: (vehicleId: string) => void
// }

// const VehicleList: React.FC<Props> = ({ vehicles, onEdit, onDelete }) => {
//   let list: Vehicle[] = []
//   if (Array.isArray(vehicles)) list = vehicles
//   else if (vehicles && Array.isArray(vehicles.data)) list = vehicles.data
//   else if (vehicles && Array.isArray(vehicles.items)) list = vehicles.items
//   else if (vehicles && Array.isArray(vehicles.result)) list = vehicles.result

//   const renderEmpty = () => (
//     <View style={styles.emptyContainer}>
// <TruckIcon style={styles.emptyIcon} />
// <Text style={styles.emptyTitle}>Chưa có xe</Text>
// <Text style={styles.emptySubtitle}>Thêm xe để quản lý và tạo trip.</Text>
// </View>
//   )

//   return (
//     <FlatList
//       data={list}
//       renderItem={({ item }) => (
//         <VehicleCard vehicle={item} onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} />
//       )}
//       keyExtractor={(i) => i.id}
//       numColumns={2}
//       ListEmptyComponent={renderEmpty}
//       contentContainerStyle={styles.listContent}
//     />
//   )
// }

// const styles = StyleSheet.create({
//   listContent: { paddingHorizontal: 8, paddingBottom: 64 },
//   emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: '30%', paddingHorizontal: 20 },
//   emptyIcon: { width: 60, height: 60, color: '#9CA3AF' },
//   emptyTitle: { fontSize: 20, fontWeight: '600', color: '#374151', marginTop: 16, textAlign: 'center' },
//   emptySubtitle: { fontSize: 16, color: '#6B7280', marginTop: 8, textAlign: 'center' },
// })

// export default VehicleList

import React from 'react'
import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import VehicleCard from './VehicleCard'
import { Vehicle } from '../../../models/types'

interface Props {
  vehicles: any
  onEdit: (v: Vehicle) => void
  onDelete: (vehicleId: string) => void
  onPress?: (vehicleId: string) => void
}

const VehicleList: React.FC<Props> = ({ vehicles, onEdit, onDelete, onPress }) => {
  // Logic xử lý data đầu vào linh hoạt (giữ nguyên logic tốt của bạn)
  let list: Vehicle[] = []
  if (Array.isArray(vehicles)) list = vehicles
  else if (vehicles && Array.isArray(vehicles.data)) list = vehicles.data
  else if (vehicles && Array.isArray(vehicles.items)) list = vehicles.items
  else if (vehicles && Array.isArray(vehicles.result)) list = vehicles.result

  // Component hiển thị khi không có xe
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <MaterialCommunityIcons name="truck-outline" size={48} color="#9CA3AF" />
      </View>
      <Text style={styles.emptyTitle}>Chưa có xe nào</Text>
      <Text style={styles.emptySubtitle}>
        Thêm xe mới để bắt đầu quản lý và tạo chuyến đi.
      </Text>
    </View>
  )

  return (
    <FlatList
      data={list}
      renderItem={({ item }) => (
        <VehicleCard 
          vehicle={item} 
          onEdit={() => onEdit(item)} 
          onDelete={() => onDelete(item.id)} 
          onPress={() => onPress?.(item.id)}
        />
      )}
      keyExtractor={(item) => item.id.toString()}
      numColumns={2} // Layout lưới 2 cột
      columnWrapperStyle={styles.columnWrapper} // Căn chỉnh khoảng cách giữa 2 cột
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={renderEmpty}
      showsVerticalScrollIndicator={false}
    />
  )
}

const styles = StyleSheet.create({
  listContent: {
    padding: 10,
    paddingBottom: 100, // Chừa khoảng trống dưới cùng cho nút Action (nếu có) hoặc Tabbar
  },
  columnWrapper: {
    justifyContent: 'space-between', // Đẩy 2 card ra 2 bên
  },
  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
})

export default VehicleList
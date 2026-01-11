// import React from 'react'
// import { View, Text, StyleSheet, FlatList } from 'react-native'
// import TripCard from './TripCard'
// import { TruckIcon } from '@/screens/provider-v2/icons/StatIcon'

// interface TripProps {
//   trips: any
//   onView?: (tripId: string) => void
// }

// const OwnerTripList: React.FC<TripProps> = ({ trips, onView }) => {
//   let list: any[] = []
//   if (Array.isArray(trips)) list = trips
//   else if (trips && Array.isArray(trips.data)) list = trips.data
//   else if (trips && Array.isArray(trips.items)) list = trips.items
//   else if (trips && Array.isArray(trips.result)) list = trips.result

//   const renderEmpty = () => (
//     <View style={styles.emptyContainer}>
// <TruckIcon style={styles.emptyIcon} />
// <Text style={styles.emptyTitle}>Chưa có hành trình</Text>
// <Text style={styles.emptySubtitle}>Tạo hành trình sau khi bạn nhận đơn.</Text>
// </View>
//   )

//   return (
//     <FlatList
//       data={list}
//       renderItem={({ item }) => <TripCard trip={item} onView={onView} />}
//       keyExtractor={(i) => i.tripId ?? i.id ?? String(Math.random())}
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

// export default OwnerTripList

import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import TripCard from "./TripCard";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface TripProps {
  trips: any;
  onView?: (tripId: string) => void;
  onCancel?: (tripId: string, tripCode: string) => void;
  cancelling?: boolean;
}

const OwnerTripList: React.FC<TripProps> = ({
  trips,
  onView,
  onCancel,
  cancelling,
}) => {
  let list: any[] = [];
  if (Array.isArray(trips)) list = trips;
  else if (trips?.data) list = trips.data;
  else if (trips?.items) list = trips.items;
  else if (trips?.result) list = trips.result;

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBg}>
        <MaterialCommunityIcons
          name="truck-fast-outline"
          size={48}
          color="#9CA3AF"
        />
      </View>
      <Text style={styles.emptyTitle}>Chưa có hành trình</Text>
      <Text style={styles.emptySubtitle}>
        Hành trình sẽ xuất hiện khi bạn tạo chuyến xe.
      </Text>
    </View>
  );

  return (
    <FlatList
      data={list}
      renderItem={({ item }) => (
        <TripCard
          trip={item}
          onView={onView}
          onCancel={onCancel}
          cancelling={cancelling}
        />
      )}
      keyExtractor={(i) => i.tripId ?? i.id ?? String(Math.random())}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContent: { padding: 16, paddingBottom: 80 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 80,
    paddingHorizontal: 20,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  emptySubtitle: { fontSize: 14, color: "#6B7280", textAlign: "center" },
});

export default OwnerTripList;

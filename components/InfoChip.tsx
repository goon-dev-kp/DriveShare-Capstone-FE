import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export const InfoChip: React.FC<{
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string | number;
}> = ({ icon, label, value }) => (
  <View style={styles.infoChip}>
<Ionicons name={icon} size={22} color={Colors.primary} style={styles.icon} />
<View>
<Text style={styles.label}>{label}</Text>
<Text style={styles.value}>{value}</Text>
</View>
</View>
);

const styles = StyleSheet.create({
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGrey,
    borderRadius: 12,
    padding: 10,
    flex: 1,
    marginHorizontal: 5,
  },
  icon: { marginRight: 8 },
  label: { fontSize: 12, color: Colors.darkGrey },
  value: { fontSize: 14, fontWeight: '600', color: Colors.secondary },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export const DateSelector: React.FC<{
  days: number;
  setDays: React.Dispatch<React.SetStateAction<number>>;
}> = ({ days, setDays }) => (
  <View style={styles.container}>
<TouchableOpacity onPress={() => setDays(d => Math.max(0, d - 1))} style={styles.btn}>
<Text style={styles.text}>-</Text>
</TouchableOpacity>
<Text style={styles.value}>{days} ngày</Text>
<TouchableOpacity onPress={() => setDays(d => d + 1)} style={styles.btn}>
<Text style={styles.text}>+</Text>
</TouchableOpacity>
</View>
);

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btn: {
    backgroundColor: Colors.primaryLight,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontSize: 22, color: Colors.primary },
  value: { fontSize: 18, fontWeight: '600', marginHorizontal: 20 },
});

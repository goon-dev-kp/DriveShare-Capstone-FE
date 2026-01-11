import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export const OwnerCard: React.FC<{ avatarUrl: string; userName: string }> = ({ avatarUrl, userName }) => (
  <View style={styles.container}>
<Image source={{ uri: avatarUrl }} style={styles.avatar} />
<View>
<Text style={styles.name}>{userName}</Text>
<Text style={styles.role}>Chủ xe</Text>
</View>
</View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGrey,
    padding: 10,
    borderRadius: 12,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
  name: { fontSize: 16, fontWeight: 'bold', color: Colors.secondary },
  role: { fontSize: 13, color: Colors.darkGrey },
});

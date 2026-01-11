// components/StatusBadge.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const style = useMemo(() => {
    switch (status?.toUpperCase()) {
      case 'OPEN': return { bg: '#DCFCE7', text: '#166534' }; // Green
      case 'CLOSED': return { bg: '#F3F4F6', text: '#4B5563' }; // Gray
      case 'DELETED': return { bg: '#FEE2E2', text: '#991B1B' }; // Red
      case 'CANCELLED': return { bg: '#FEF2F2', text: '#EF4444' }; // Red lighter
      case 'COMPLETED': return { bg: '#F0F9FF', text: '#0369A1' }; // Blue
      default: return { bg: '#EEF2FF', text: '#4338CA' }; // Indigo
    }
  }, [status]);

  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.text, { color: style.text }]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  text: { fontSize: 12, fontWeight: '700' },
});

export default StatusBadge;
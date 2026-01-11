// components/TripDetailModal.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';

// Helper component cho mục Accordion
const SectionItem = ({ title, children, expanded, onPress }: any) => (
  <View style={styles.sectionContainer}>
    <TouchableOpacity style={styles.sectionHeader} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={{ fontSize: 18, color: '#6B7280' }}>{expanded ? '-' : '+'}</Text>
    </TouchableOpacity>
    {expanded && <View style={styles.sectionBody}>{children}</View>}
  </View>
);

const TripDetailModal = ({ visible, onClose, loading, error, data }: any) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ vehicle: true });
  const toggle = (key: string) => setExpanded(p => ({ ...p, [key]: !p[key] }));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Thông tin chuyến đi</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}><Text style={{fontSize:20}}>✕</Text></TouchableOpacity>
          </View>

          {loading ? <ActivityIndicator size="large" color="#4F46E5" style={{margin: 20}} /> : null}
          {!loading && error ? <Text style={styles.error}>{error}</Text> : null}
          
          {!loading && !error && data && (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Summary */}
              <View style={styles.summaryBox}>
                <Text style={styles.row}>Mã: <Text style={styles.bold}>{data.tripCode}</Text></Text>
                <Text style={styles.row}>Trạng thái: <Text style={styles.bold}>{data.status}</Text></Text>
              </View>

              <SectionItem title="Xe & Tuyến" expanded={expanded['vehicle']} onPress={() => toggle('vehicle')}>
                 <Text style={styles.text}>Xe: {data.vehicle?.model} - {data.vehicle?.plateNumber}</Text>
                 <Text style={styles.text}>Từ: {data.shippingRoute?.startAddress}</Text>
                 <Text style={styles.text}>Đến: {data.shippingRoute?.endAddress}</Text>
              </SectionItem>

              <SectionItem title={`Hàng hóa (${data.packages?.length || 0})`} expanded={expanded['pkg']} onPress={() => toggle('pkg')}>
                 {data.packages?.map((p: any, i: number) => (
                   <View key={i} style={styles.subItem}>
                     <Text style={styles.text}>Mã: {p.packageCode}</Text>
                     <Text style={styles.subText}>{p.weight}kg - {p.volume}</Text>
                   </View>
                 ))}
              </SectionItem>

              <SectionItem title={`Tài xế (${data.drivers?.length || 0})`} expanded={expanded['drivers']} onPress={() => toggle('drivers')}>
                 {data.drivers?.map((d: any, i: number) => (
                   <View key={i} style={styles.subItem}>
                     <Text style={styles.text}>{d.fullName} ({d.type})</Text>
                     <Text style={[styles.subText, {color: d.assignmentStatus === 'ACCEPTED' ? 'green' : 'orange'}]}>{d.assignmentStatus}</Text>
                   </View>
                 ))}
              </SectionItem>
            </ScrollView>
          )}
          
          <TouchableOpacity style={styles.btnDone} onPress={onClose}>
            <Text style={styles.btnDoneText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, height: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  closeBtn: { padding: 4 },
  error: { color: 'red', textAlign: 'center' },
  summaryBox: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 12, marginBottom: 16 },
  row: { fontSize: 14, color: '#374151', marginBottom: 4 },
  bold: { fontWeight: '600', color: '#111827' },
  sectionContainer: { marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, backgroundColor: '#F9FAFB' },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  sectionBody: { padding: 14, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  text: { fontSize: 14, color: '#374151', marginBottom: 4 },
  subItem: { marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 8 },
  subText: { fontSize: 12, color: '#6B7280' },
  btnDone: { backgroundColor: '#111827', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnDoneText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default TripDetailModal;
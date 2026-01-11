import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native'
import { Calendar } from 'react-native-calendars'

const formatISO = (d: Date) => d.toISOString().split('T')[0]

interface Props {
  value?: string
  onChange: (isoDate: string | null) => void
  placeholder?: string
  minDate?: string
  maxDate?: string
  label?: string
}

const DateInput: React.FC<Props> = ({ value, onChange, placeholder = 'Chọn ngày', minDate, maxDate, label }) => {
  const [visible, setVisible] = useState(false)
  const [selected, setSelected] = useState<string | null>(value || null)

  const open = () => setVisible(true)
  const close = () => setVisible(false)

  const confirm = () => {
    onChange(selected)
    close()
  }

  const quickPick = (days: number) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    const iso = formatISO(d)
    setSelected(iso)
    onChange(iso)
    close()
  }

  return (
    <View style={{ width: '100%', marginBottom: 12 }}>
      {label ? <Text style={{ marginBottom: 6, fontWeight: '600' }}>{label}</Text> : null}
      <TouchableOpacity onPress={open} style={styles.input}>
        <Text style={{ color: selected ? '#111827' : '#9CA3AF' }}>{selected ?? placeholder}</Text>
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={close}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Calendar
              onDayPress={(day) => { setSelected(day.dateString) }}
              markedDates={selected ? { [selected]: { selected: true } } : {}}
              minDate={minDate}
              maxDate={maxDate}
            />

            <View style={styles.quickRow}>
              <TouchableOpacity style={styles.quickBtn} onPress={() => quickPick(0)}><Text>Hôm nay</Text></TouchableOpacity>
              <TouchableOpacity style={styles.quickBtn} onPress={() => quickPick(1)}><Text>Ngày mai</Text></TouchableOpacity>
              <TouchableOpacity style={styles.quickBtn} onPress={() => quickPick(3)}><Text>+3 ngày</Text></TouchableOpacity>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={() => { setSelected(null); onChange(null); close() }} style={styles.actionCancel}><Text>Clear</Text></TouchableOpacity>
              <TouchableOpacity onPress={confirm} style={styles.actionConfirm}><Text style={{ color: '#fff' }}>Chọn</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, backgroundColor: '#fff' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 12, borderTopRightRadius: 12, maxHeight: '80%' },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  quickBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 8 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  actionCancel: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', flex: 1, alignItems: 'center', marginRight: 8 },
  actionConfirm: { padding: 12, borderRadius: 8, backgroundColor: '#0284C7', flex: 1, alignItems: 'center' }
})

export default DateInput

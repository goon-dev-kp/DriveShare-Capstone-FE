import React, { useState, useEffect } from 'react'
import { View, StyleSheet, TouchableOpacity, Text, Modal } from 'react-native'

interface Props {
  visible: boolean
  value: Date
  minimumDate?: Date
  maximumDate?: Date
  onClose: () => void
  onChange: (date: Date) => void
  title?: string
}

const DatePicker: React.FC<Props> = ({ 
  visible, 
  value, 
  minimumDate, 
  maximumDate, 
  onClose, 
  onChange,
  title = "Chọn ngày"
}) => {
  const [dateStr, setDateStr] = useState('')

  useEffect(() => {
    if (value) {
      setDateStr(value.toISOString().slice(0, 10))
    } else {
      setDateStr(new Date().toISOString().slice(0, 10))
    }
  }, [value, visible])

  const handleConfirm = () => {
    if (dateStr) {
      onChange(new Date(dateStr))
    }
    onClose()
  }

  const minDateStr = minimumDate ? minimumDate.toISOString().slice(0, 10) : undefined
  const maxDateStr = maximumDate ? maximumDate.toISOString().slice(0, 10) : undefined

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
          </View>
          
          <View style={styles.body}>
            <Text style={styles.label}>Nhập hoặc chọn ngày:</Text>
            {/* Native HTML Input styled */}
            <input
              type="date"
              value={dateStr}
              min={minDateStr}
              max={maxDateStr}
              onChange={(e) => setDateStr(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                backgroundColor: '#F9FAFB',
                color: '#111827',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            />
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.btnCancel}>
              <Text style={styles.btnCancelText}>Hủy bỏ</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={styles.btnConfirm}>
              <Text style={styles.btnConfirmText}>Xác nhận</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  btnCancelText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 15,
  },
  btnConfirm: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#F3F4F6',
  },
  btnConfirmText: {
    color: '#10439F', // Màu chủ đạo
    fontWeight: '700',
    fontSize: 15,
  },
})

export default DatePicker
import React, { useState, useEffect } from 'react'
import { 
  Platform, 
  View, 
  Modal, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  SafeAreaView 
} from 'react-native'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'

interface Props {
  visible: boolean
  value: Date
  minimumDate?: Date
  maximumDate?: Date
  onClose: () => void
  onChange: (date: Date) => void
  title?: string // Thêm title để biết đang chọn gì (vd: Ngày sinh)
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
  const [tempDate, setTempDate] = useState(value || new Date())

  useEffect(() => {
    if (visible && value) {
      setTempDate(value)
    }
  }, [visible, value])

  // --- ANDROID ---
  if (Platform.OS === 'android') {
    if (!visible) return null
    return (
      <DateTimePicker
        value={tempDate}
        mode="date"
        display="default" // Android tự handle giao diện dialog rất tốt
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
          onClose() // Đóng ngay sau khi chọn hoặc hủy
          if (event.type === 'set' && selectedDate) {
            onChange(selectedDate)
          }
        }}
      />
    )
  }

  // --- iOS ---
  // iOS cần Modal bọc ngoài để tạo UI đẹp và nút Confirm
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.iosBackdrop}>
        {/* Vùng bấm ra ngoài để tắt */}
        <TouchableOpacity style={styles.iosBackdropTouch} onPress={onClose} />

        <View style={styles.iosContainer}>
          {/* Header Buttons */}
          <View style={styles.iosHeader}>
            <TouchableOpacity onPress={onClose} style={styles.iosBtn}>
              <Text style={styles.iosBtnCancel}>Hủy</Text>
            </TouchableOpacity>
            
            <Text style={styles.iosTitle}>{title}</Text>

            <TouchableOpacity 
              onPress={() => {
                onChange(tempDate)
                onClose()
              }} 
              style={styles.iosBtn}
            >
              <Text style={styles.iosBtnConfirm}>Xác nhận</Text>
            </TouchableOpacity>
          </View>

          {/* Picker */}
          <View style={styles.iosPickerWrapper}>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner" // Dùng spinner để chọn năm xa cực nhanh
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              onChange={(_, date) => {
                if (date) setTempDate(date)
              }}
              locale="vi-VN" // Tiếng Việt
              textColor="#000000"
              themeVariant="light"
            />
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  // iOS Styles
  iosBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)', // Dim background
  },
  iosBackdropTouch: {
    flex: 1,
  },
  iosContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20, // Cho dòng iPhone X trở lên
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  iosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iosTitle: {
    fontWeight: '600',
    fontSize: 16,
    color: '#111827',
  },
  iosBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  iosBtnCancel: {
    color: '#6B7280',
    fontSize: 16,
  },
  iosBtnConfirm: {
    color: '#10439F', // Màu chủ đạo của app bạn
    fontSize: 16,
    fontWeight: '600',
  },
  iosPickerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
})

export default DatePicker
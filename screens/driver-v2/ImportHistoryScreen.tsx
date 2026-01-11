import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import driverWorkSessionService from '@/services/driverWorkSessionService'
import DatePicker from '@/components/DatePicker'

interface DailyHistoryLog {
  id: string
  date: Date
  hoursDriven: string
}

const ImportHistoryScreen: React.FC = () => {
  const router = useRouter()
  const [logs, setLogs] = useState<DailyHistoryLog[]>([
    { id: '1', date: new Date(), hoursDriven: '' },
  ])
  const [loading, setLoading] = useState(false)
  const [datePickerVisible, setDatePickerVisible] = useState(false)
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null)

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`)
    } else {
      Alert.alert(title, message)
    }
  }

  const addNewLog = () => {
    const newLog: DailyHistoryLog = {
      id: Date.now().toString(),
      date: new Date(),
      hoursDriven: '',
    }
    setLogs([...logs, newLog])
  }

  const removeLog = (id: string) => {
    if (logs.length === 1) {
      showAlert('Thông báo', 'Phải có ít nhất 1 bản ghi')
      return
    }
    setLogs(logs.filter((log) => log.id !== id))
  }

  const updateLog = (id: string, field: 'date' | 'hoursDriven', value: any) => {
    setLogs(
      logs.map((log) =>
        log.id === id ? { ...log, [field]: value } : log
      )
    )
  }

  const openDatePicker = (logId: string) => {
    setSelectedLogId(logId)
    setDatePickerVisible(true)
  }

  const handleDateChange = (newDate: Date) => {
    if (selectedLogId) {
      updateLog(selectedLogId, 'date', newDate)
    }
    setDatePickerVisible(false)
    setSelectedLogId(null)
  }

  const getSelectedLog = () => {
    return logs.find(log => log.id === selectedLogId) || logs[0]
  }

  const validateLogs = (): boolean => {
    for (const log of logs) {
      if (!log.hoursDriven || log.hoursDriven.trim() === '') {
        showAlert('Lỗi', 'Vui lòng nhập số giờ đã lái cho tất cả các ngày')
        return false
      }
      const hours = parseFloat(log.hoursDriven)
      if (isNaN(hours) || hours < 0 || hours > 24) {
        showAlert('Lỗi', 'Số giờ phải từ 0 đến 24')
        return false
      }
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateLogs()) return

    setLoading(true)
    try {
      const dto = {
        DailyLogs: logs.map((log) => ({
          Date: log.date.toISOString(),
          HoursDriven: parseFloat(log.hoursDriven),
        })),
      }

      const response: any = await driverWorkSessionService.importHistory(dto)

      if (response?.isSuccess) {
        if (Platform.OS === 'web') {
          window.alert('Thành công\n\nĐã import lịch sử giờ lái thành công!')
          router.replace('/(driver)/home')
        } else {
          Alert.alert('Thành công', 'Đã import lịch sử giờ lái thành công!', [
            { text: 'OK', onPress: () => router.replace('/(driver)/home') }
          ])
        }
      } else {
        const errorMsg = response?.message || 'Không thể import lịch sử'
        if (Platform.OS === 'web') {
          window.alert(`Lỗi\n\n${errorMsg}`)
          router.replace('/(driver)/home')
        } else {
          Alert.alert('Lỗi', errorMsg, [
            { text: 'OK', onPress: () => router.replace('/(driver)/home') }
          ])
        }
      }
    } catch (error: any) {
      console.error('Import history error:', error)
      const errorMsg = error?.message || 'Có lỗi xảy ra khi import lịch sử'
      if (Platform.OS === 'web') {
        window.alert(`Lỗi\n\n${errorMsg}`)
        router.replace('/(driver)/home')
      } else {
        Alert.alert('Lỗi', errorMsg, [
          { text: 'OK', onPress: () => router.replace('/(driver)/home') }
        ])
      }
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const getTotalHours = (): number => {
    return logs.reduce((sum, log) => {
      const hours = parseFloat(log.hoursDriven || '0')
      return sum + (isNaN(hours) ? 0 : hours)
    }, 0)
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Import Giờ Lái Khởi Tạo</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoIconContainer}>
          <MaterialCommunityIcons name="information" size={24} color="#3B82F6" />
        </View>
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoTitle}>Hướng dẫn</Text>
          <Text style={styles.infoText}>
            Nhập lịch sử giờ lái của bạn theo từng ngày. Hệ thống sẽ sử dụng dữ liệu này để theo dõi giờ lái hợp pháp.
          </Text>
        </View>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="calendar-range" size={20} color="#6B7280" />
          <Text style={styles.statLabel}>Số ngày</Text>
          <Text style={styles.statValue}>{logs.length}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="clock-outline" size={20} color="#6B7280" />
          <Text style={styles.statLabel}>Tổng giờ</Text>
          <Text style={styles.statValue}>{getTotalHours().toFixed(1)}h</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="clock-time-four" size={20} color="#6B7280" />
          <Text style={styles.statLabel}>TB/ngày</Text>
          <Text style={styles.statValue}>
            {logs.length > 0 ? (getTotalHours() / logs.length).toFixed(1) : '0.0'}h
          </Text>
        </View>
      </View>

      {/* Logs List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {logs.map((log, index) => (
          <View key={log.id} style={styles.logCard}>
            <View style={styles.logHeader}>
              <View style={styles.logNumberBadge}>
                <Text style={styles.logNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.logTitle}>Ngày {formatDate(log.date)}</Text>
              {logs.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeLog(log.id)}
                  style={styles.deleteButton}
                >
                  <MaterialCommunityIcons name="delete-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.logBody}>
              {/* Date Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ngày</Text>
                <TouchableOpacity 
                  style={styles.dateDisplayContainer}
                  onPress={() => openDatePicker(log.id)}
                >
                  <MaterialCommunityIcons name="calendar" size={18} color="#6B7280" />
                  <Text style={styles.dateDisplayText}>{formatDate(log.date)}</Text>
                </TouchableOpacity>
              </View>

              {/* Hours Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Số giờ đã lái</Text>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons name="clock-outline" size={18} color="#6B7280" />
                  <TextInput
                    style={styles.input}
                    placeholder="VD: 8.5"
                    keyboardType="decimal-pad"
                    value={log.hoursDriven}
                    onChangeText={(text) => updateLog(log.id, 'hoursDriven', text)}
                  />
                  <Text style={styles.inputUnit}>giờ</Text>
                </View>
                {log.hoursDriven && parseFloat(log.hoursDriven) > 10 && (
                  <View style={styles.warningContainer}>
                    <MaterialCommunityIcons name="alert" size={14} color="#F59E0B" />
                    <Text style={styles.warningText}>Vượt quá 10 giờ/ngày theo quy định</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        ))}

        {/* Add Button */}
        <TouchableOpacity style={styles.addButton} onPress={addNewLog}>
          <MaterialCommunityIcons name="plus-circle" size={24} color="#3B82F6" />
          <Text style={styles.addButtonText}>Thêm ngày</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="check-circle" size={20} color="#FFF" />
              <Text style={styles.submitButtonText}>Xác nhận Import</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      <DatePicker
        visible={datePickerVisible}
        value={getSelectedLog().date}
        onChange={handleDateChange}
        onClose={() => setDatePickerVisible(false)}
        maximumDate={new Date()}
        title="Chọn ngày"
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 12,
  },
  infoIconContainer: {
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  logCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
  },
  logTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  deleteButton: {
    padding: 4,
  },
  logBody: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  datePickerContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  dateDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  dateDisplayText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: '#1F2937',
  },
  inputUnit: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 6,
    padding: 8,
    gap: 6,
  },
  warningText: {
    fontSize: 12,
    color: '#D97706',
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
  },
  bottomActions: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
})

export default ImportHistoryScreen

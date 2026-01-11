import React from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import {
  TruckIcon,
  CurrencyDollarIcon,
  PackageIcon,
  StarIcon,
} from '../icons/StatIcon' // Giữ nguyên đường dẫn icon của bạn

// Lấy chiều rộng màn hình để tính toán tỷ lệ %
const { width } = Dimensions.get('window')

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => {
  return (
    <View style={styles.statCard}>
      {/* 1. Header của Card: Icon nằm riêng một hàng */}
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          {icon}
        </View>
      </View>

      {/* 2. Content: Số liệu và Tên nằm bên dưới */}
      <View style={styles.cardContent}>
        <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Text style={styles.statLabel} numberOfLines={2}>
          {label}
        </Text>
      </View>
    </View>
  )
}

const Stats: React.FC = () => {
  const colors = {
    blue: '#3B82F6',
    green: '#22C55E',
    orange: '#F97316',
    yellow: '#EAB308',
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Thống kê hoạt động</Text>
      
      <View style={styles.gridContainer}>
        <StatCard
          icon={<PackageIcon style={styles.icon} />}
          label="Sản phẩm"
          value="124"
          color={colors.blue}
        />
        <StatCard
          icon={<TruckIcon style={styles.icon} />}
          label="Gói hàng"
          value="8"
          color={colors.blue} 
        />
        <StatCard
          icon={<PackageIcon style={styles.icon} />} // Thay icon bài đăng nếu có
          label="Bài đăng"
          value="18"
          color={colors.blue}
        />
        <StatCard
          icon={<StarIcon style={styles.icon} />}
          label="Đánh giá trung bình"
          value="4.9"
          color={colors.blue}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    paddingHorizontal: 4,
    color: '#0F172A',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12, // Khoảng cách giữa các thẻ
  },
  statCard: {
    // Tính toán width: (Màn hình - padding 2 bên - gap ở giữa) / 2
    // Hoặc đơn giản là để 48% để nó tự chia đôi
    width: '48%', 
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    // Chuyển sang xếp dọc (mặc định của View là column)
    flexDirection: 'column', 
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    
    // Shadow nhẹ nhàng hơn
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    minHeight: 110, // Đảm bảo chiều cao đồng đều
  },
  cardHeader: {
    marginBottom: 12,
    width: '100%',
    alignItems: 'flex-start',
  },
  iconContainer: {
    padding: 10,
    borderRadius: 12,
    // Làm cho icon container nhìn mềm mại hơn (Optional: Thêm opacity nếu muốn)
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 20,
    height: 20,
    color: '#FFFFFF',
  },
  cardContent: {
    width: '100%',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    lineHeight: 18, // Tăng chiều cao dòng để chữ "Đánh giá..." dễ đọc hơn
  },
})

export default Stats
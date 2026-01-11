import React, { useState, ReactNode } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface CollapsibleSectionProps {
  title: string
  children: ReactNode
  defaultCollapsed?: boolean
  right?: ReactNode
  badge?: string | number
  accentColor?: string
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultCollapsed = false,
  right,
  badge,
  accentColor = '#4F46E5'
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  return (
    <View style={styles.wrapper}>
<TouchableOpacity style={styles.header} activeOpacity={0.8} onPress={() => setCollapsed(c => !c)}>
<View style={styles.headerLeft}>
<Text style={[styles.title, { color: accentColor }]} numberOfLines={1}>{title}</Text>
          {badge !== undefined && (
            <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>
          )}
        </View>
<View style={styles.headerRight}>
          {right}
          <Text style={styles.caret}>{collapsed ? '▾' : '▴'}</Text>
</View>
</TouchableOpacity>
      {!collapsed && <View style={styles.body}>{children}</View>}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 18 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '700', flexShrink: 1 },
  caret: { fontSize: 16, color: '#6B7280', marginLeft: 8 },
  body: { marginTop: 4 },
  badge: { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: 8 },
  badgeText: { color: '#4338CA', fontSize: 12, fontWeight: '600' }
})

export default CollapsibleSection
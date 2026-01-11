import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native'
import getMapTileCacheService, { type CachedRegion, type TileBounds } from '@/services/mapTileCacheService'

interface OfflineMapControlsProps {
  currentBounds?: TileBounds
  style?: any
}

export default function OfflineMapControls({
  currentBounds,
  style
}: OfflineMapControlsProps) {
  const [cachedRegions, setCachedRegions] = useState<CachedRegion[]>([])
  const [cacheSize, setCacheSize] = useState<number>(0)
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCachedRegions()
  }, [])

  const loadCachedRegions = async () => {
    try {
      const mapTileCacheService = getMapTileCacheService()
      const regions = await mapTileCacheService.getCachedRegions()
      const size = await mapTileCacheService.getCacheSize()
      setCachedRegions(regions)
      setCacheSize(size)
    } catch (error) {
      console.error('Failed to load cached regions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadCurrentRegion = async () => {
    if (!currentBounds) {
      Alert.alert('Lỗi', 'Không thể xác định vùng hiện tại')
      return
    }

    Alert.alert(
      'Tải bản đồ offline',
      'Tải bản đồ vùng hiện tại?\n\nZoom levels: 12-16\nDung lượng ước tính: ~10-50MB',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Tải xuống',
          onPress: async () => {
            setDownloading(true)
            setDownloadProgress(0)

            try {
              const regionName = `Vùng ${new Date().toLocaleDateString('vi-VN')}`
              const mapTileCacheService = getMapTileCacheService()
              
              await mapTileCacheService.downloadRegion(
                currentBounds,
                [12, 13, 14, 15, 16],
                regionName,
                (progress) => {
                  setDownloadProgress(progress)
                }
              )

              Alert.alert('Thành công', 'Đã tải xong bản đồ offline!')
              await loadCachedRegions()
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Tải xuống thất bại')
            } finally {
              setDownloading(false)
              setDownloadProgress(0)
            }
          }
        }
      ]
    )
  }

  const handleDeleteRegion = (region: CachedRegion) => {
    const mapTileCacheService = getMapTileCacheService()
    Alert.alert(
      'Xóa vùng đã tải',
      `Xóa "${region.name}"?\n\nDung lượng: ${mapTileCacheService.formatSize(region.sizeBytes)}`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await mapTileCacheService.deleteCachedRegion(region.id)
              await loadCachedRegions()
              Alert.alert('Đã xóa', 'Đã xóa vùng đã tải')
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Xóa thất bại')
            }
          }
        }
      ]
    )
  }

  if (loading) {
    return (
      <View style={[styles.container, style]}>
<ActivityIndicator size="small" color="#3B82F6" />
<Text style={styles.loadingText}>Đang tải...</Text>
</View>
    )
  }

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
<Text style={styles.title}>📡 Bản đồ Offline</Text>
<View style={styles.storageBadge}>
<Text style={styles.storageText}>
            💾 {getMapTileCacheService().formatSize(cacheSize)}
          </Text>
</View>
</View>

      {/* Download Current Region Button */}
      {currentBounds && (
        <TouchableOpacity
          style={[styles.downloadButton, downloading && styles.downloadButtonDisabled]}
          onPress={handleDownloadCurrentRegion}
          disabled={downloading}
          activeOpacity={0.7}
        >
<Text style={styles.downloadButtonIcon}>
            {downloading ? '⏳' : '⬇️'}
          </Text>
<View style={styles.downloadButtonTextContainer}>
<Text style={styles.downloadButtonText}>
              {downloading ? 'Đang tải...' : 'Tải vùng hiện tại'}
            </Text>
            {downloading && (
              <Text style={styles.downloadProgress}>
                {downloadProgress}%
              </Text>
            )}
          </View>
</TouchableOpacity>
      )}
{/* Cached Regions List */}
      <View style={styles.regionsContainer}>
<Text style={styles.regionsTitle}>
          Các vùng đã tải ({cachedRegions.length})
        </Text>
        
        {cachedRegions.length === 0 ? (
          <View style={styles.emptyState}>
<Text style={styles.emptyStateIcon}>🗺️</Text>
<Text style={styles.emptyStateText}>
              Chưa có vùng nào được tải
            </Text>
<Text style={styles.emptyStateHint}>
              Nhấn "Tải vùng hiện tại" để bắt đầu
            </Text>
</View>
        ) : (
          <ScrollView 
            style={styles.regionsList}
            contentContainerStyle={styles.regionsListContent}
            showsVerticalScrollIndicator={false}
          >
            {cachedRegions.map((region) => (
              <View key={region.id} style={styles.regionCard}>
<View style={styles.regionHeader}>
<Text style={styles.regionName}>{region.name}</Text>
<TouchableOpacity
                    onPress={() => handleDeleteRegion(region)}
                    style={styles.deleteButton}
                    activeOpacity={0.7}
                  >
<Text style={styles.deleteButtonText}>🗑️</Text>
</TouchableOpacity>
</View>
<View style={styles.regionStats}>
<View style={styles.regionStat}>
<Text style={styles.regionStatLabel}>📦 Tiles:</Text>
<Text style={styles.regionStatValue}>
                      {region.tileCount.toLocaleString()}
                    </Text>
</View>
<View style={styles.regionStat}>
<Text style={styles.regionStatLabel}>💾 Dung lượng:</Text>
<Text style={styles.regionStatValue}>
                      {getMapTileCacheService().formatSize(region.sizeBytes)}
                    </Text>
</View>
</View>
<View style={styles.regionMeta}>
<Text style={styles.regionMetaText}>
                    📅 {new Date(region.downloadedAt).toLocaleDateString('vi-VN')}
                  </Text>
<Text style={styles.regionMetaText}>
                    🔍 Zoom: {region.zoomLevels.join(', ')}
                  </Text>
</View>
</View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Info Text */}
      <Text style={styles.infoText}>
        💡 Bản đồ offline giúp điều hướng khi không có internet
      </Text>
</View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937'
  },
  storageBadge: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#818CF8'
  },
  storageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4338CA'
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  downloadButtonDisabled: {
    backgroundColor: '#9CA3AF'
  },
  downloadButtonIcon: {
    fontSize: 24,
    marginRight: 12
  },
  downloadButtonTextContainer: {
    flex: 1
  },
  downloadButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white'
  },
  downloadProgress: {
    fontSize: 12,
    color: 'white',
    marginTop: 2
  },
  regionsContainer: {
    marginBottom: 12
  },
  regionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 8
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4
  },
  emptyStateHint: {
    fontSize: 12,
    color: '#9CA3AF'
  },
  regionsList: {
    maxHeight: 300
  },
  regionsListContent: {
    gap: 12
  },
  regionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  regionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  regionName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1
  },
  deleteButton: {
    padding: 4
  },
  deleteButtonText: {
    fontSize: 20
  },
  regionStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8
  },
  regionStat: {
    flex: 1
  },
  regionStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2
  },
  regionStatValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937'
  },
  regionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  regionMetaText: {
    fontSize: 11,
    color: '#6B7280'
  },
  infoText: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center'
  }
})

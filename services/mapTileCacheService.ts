import AsyncStorage from '@react-native-async-storage/async-storage'

interface TileBounds {
  minLon: number
  minLat: number
  maxLon: number
  maxLat: number
}

interface CachedRegion {
  id: string
  name: string
  bounds: TileBounds
  zoomLevels: number[]
  downloadedAt: string
  tileCount: number
  sizeBytes: number
}

const CACHED_REGIONS_KEY = '@cached_regions'

/**
 * MapTileCacheService - Offline map tile caching
 * 
 * ⚠️ CURRENTLY DISABLED - Stub implementation only
 * Reason: expo-file-system v19+ requires complete API refactor
 */
class MapTileCacheService {
  private vietmapApiKey: string = 'c3e53caf753884406eec941d83e209f1ca00c908ca4d404a' // Tilemap Key

  async initialize() {
    console.warn('[MapTileCacheService] Offline maps disabled')
  }

  async downloadRegion(
    bounds: TileBounds,
    zoomLevels: number[],
    regionName: string,
    onProgress?: (percent: number) => void
  ): Promise<CachedRegion> {
    throw new Error('Offline map download not implemented')
  }

  async getCachedRegions(): Promise<CachedRegion[]> {
    try {
      const data = await AsyncStorage.getItem(CACHED_REGIONS_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  async deleteCachedRegion(regionId: string): Promise<void> {
    const regions = await this.getCachedRegions()
    const updated = regions.filter(r => r.id !== regionId)
    await AsyncStorage.setItem(CACHED_REGIONS_KEY, JSON.stringify(updated))
  }

  async getCacheSize(): Promise<number> {
    return 0
  }

  async isTileCached(z: number, x: number, y: number): Promise<boolean> {
    return false
  }

  async getTileUri(z: number, x: number, y: number): Promise<string> {
    return `https://maps.vietmap.vn/maps/tiles/lm/${z}/${x}/${y}@2x.png?apikey=${this.vietmapApiKey}`
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }
}

let instance: MapTileCacheService | null = null

export function getMapTileCacheService(): MapTileCacheService {
  if (!instance) {
    instance = new MapTileCacheService()
  }
  return instance
}

export default getMapTileCacheService
export type { TileBounds, CachedRegion }

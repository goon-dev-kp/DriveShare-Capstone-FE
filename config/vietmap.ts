// Centralized VietMap configuration for styles and API keys
// Two separate keys for different purposes:
// 1. TILEMAP_KEY: For map tiles rendering (vector/raster tiles)
// 2. SERVICES_KEY: For routing, geocoding, search, and other API services

// Tilemap Key - used for map tile rendering
export const vietmapTilemapKey: string =
  (typeof process !== 'undefined' && (process as any)?.env?.EXPO_PUBLIC_VIETMAP_TILEMAP_KEY) || 
  'c3e53caf753884406eec941d83e209f1ca00c908ca4d404a'

// Services Key - used for routing, geocoding, search APIs
export const vietmapServicesKey: string =
  (typeof process !== 'undefined' && (process as any)?.env?.EXPO_PUBLIC_VIETMAP_SERVICES_KEY) || 
  'bec96ec200a6dd15926c19125a5d297b423fab530540644d'

// Backward compatibility: default to Tilemap Key
export const vietmapAPIKey: string = vietmapTilemapKey

type VietmapTheme = 'default' | 'light' | 'dark'
type VietmapStyleType = 'vector' | 'raster'

const themeToCode = (theme: VietmapTheme): 'tm' | 'lm' | 'dm' => {
  switch (theme) {
    case 'default':
      return 'tm'
    case 'dark':
      return 'dm'
    case 'light':
    default:
      return 'lm'
  }
}

// Official Vietmap style endpoints (SDK v6+):
// Vector Default: https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=...
// Vector Light:   https://maps.vietmap.vn/maps/styles/lm/style.json?apikey=...
// Vector Dark:    https://maps.vietmap.vn/maps/styles/dm/style.json?apikey=...
// Raster Default: https://maps.vietmap.vn/maps/styles/tm/tiles.json?apikey=...
// Raster Light:   https://maps.vietmap.vn/maps/styles/lm/tiles.json?apikey=...
// Raster Dark:    https://maps.vietmap.vn/maps/styles/dm/tiles.json?apikey=...
export const vietmapStyleUrl = (theme: VietmapTheme = 'light', type: VietmapStyleType = 'vector') => {
  const code = themeToCode(theme)
  const suffix = type === 'vector' ? 'style.json' : 'tiles.json'
  const base = `https://maps.vietmap.vn/maps/styles/${code}/${suffix}`
  return vietmapTilemapKey ? `${base}?apikey=${encodeURIComponent(vietmapTilemapKey)}` : base
}


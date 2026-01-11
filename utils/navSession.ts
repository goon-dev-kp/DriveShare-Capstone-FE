import AsyncStorage from '@react-native-async-storage/async-storage'

export interface NavSessionData {
  startedAt: number
  routeSummary?: { points?: number }
}

const keyOf = (cacheKey: string) => `nav_session:${cacheKey}`

export async function getNavSession(cacheKey: string): Promise<NavSessionData | null> {
  try {
    const raw = await AsyncStorage.getItem(keyOf(cacheKey))
    return raw ? (JSON.parse(raw) as NavSessionData) : null
  } catch {
    return null
  }
}

export async function saveNavSession(cacheKey: string, data: NavSessionData): Promise<void> {
  try {
    await AsyncStorage.setItem(keyOf(cacheKey), JSON.stringify(data))
  } catch {}
}

export async function clearNavSession(cacheKey: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(keyOf(cacheKey))
  } catch {}
}

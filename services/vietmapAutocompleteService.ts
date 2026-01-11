import { vietmapServicesKey } from '@/vietmap_config'

type AutocompleteParams = {
  text: string
  focus?: { lat: number; lng: number }
  display_type?: number
  cityId?: number
  distId?: number
}

const BASE = 'https://maps.vietmap.vn/api/autocomplete/v4'

const buildUrl = (p: AutocompleteParams) => {
  const key = vietmapServicesKey || ''
  const qs = new URLSearchParams()
  qs.append('apikey', key)
  qs.append('text', p.text || '')
  if (p.focus) qs.append('focus', `${p.focus.lat},${p.focus.lng}`)
  if (p.display_type) qs.append('display_type', String(p.display_type))
  if (p.cityId) qs.append('cityId', String(p.cityId))
  if (p.distId) qs.append('distId', String(p.distId))
  return `${BASE}?${qs.toString()}`
}

const autocomplete = async (params: AutocompleteParams) => {
  if (!params.text || params.text.trim().length === 0) return []
  try {
    const url = buildUrl(params)
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`Vietmap autocomplete failed: ${resp.status}`)
    const data = await resp.json()
    // API returns an array of place objects
    return Array.isArray(data) ? data : (data?.result ?? [])
  } catch (e) {
    console.warn('vietmapAutocompleteService.autocomplete error', e)
    return []
  }
}

const vietmapAutocompleteService = { autocomplete }

export default vietmapAutocompleteService

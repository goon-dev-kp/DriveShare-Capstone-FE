import api from '@/config/api'
import { vietmapServicesKey } from '@/config/vietmap'

// --- RESPONSE DTO ---
interface ResponseDTO<T = any> {
  statusCode: number
  message?: string
  isSuccess: boolean
  result?: T
}

// --- LOCATION TYPE (Backend format) ---
export interface Location {
  address: string | null
  latitude: number | null
  longitude: number | null
}

// --- REQUEST DTO CHO CALCULATE ROUTE ---
export interface RouteCalculationRequestDTO {
  startLocation: Location
  endLocation: Location
  expectedPickupDate: string // ISO 8601 format
  expectedDeliveryDate?: string | null // ISO 8601 format - Optional, có thể null nếu chỉ muốn lấy gợi ý
}

// --- RESPONSE DTO TỪ CALCULATE ROUTE ---
export interface RouteCalculationResultDTO {
  isValid: boolean
  message: string
  distanceKm: number // Deprecated
  estimatedDistanceKm: number
  estimatedDurationHours: number
  travelTimeHours: number
  waitTimeHours: number
  suggestedMinDeliveryDate: string // ISO 8601 format
  restrictionNote: string
}

// --- SHIPPING ROUTE INPUT ---
export interface ShippingRouteInputDTO {
  startLocation: Location
  endLocation: Location
  expectedPickupDate: string // ISO 8601
  expectedDeliveryDate: string // ISO 8601
  startTimeToPickup?: string // TimeOnly format "HH:mm:ss" or null
  endTimeToPickup?: string
  startTimeToDelivery?: string
  endTimeToDelivery?: string
}

// --- POST CONTACT INPUT ---
export interface PostContactInputDTO {
  fullName: string
  phoneNumber: string
  email?: string
  address?: string
}

// --- POST PACKAGE CREATE DTO ---
export interface PostPackageCreateDTO {
  title: string
  description?: string
  offeredPrice: number
  shippingRoute: ShippingRouteInputDTO
  senderContact: PostContactInputDTO
  receiverContact: PostContactInputDTO
  packageIds: string[] // Array of Package GUIDs
  status: 'OPEN' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED'
}

// --- VIETMAP GEOCODE ---
interface VietmapSearchResult {
  ref_id: string
  display: string
  name: string
  address: string
  boundaries: any[]
  categories: string[]
  entry_points: any[]
}

interface VietmapPlaceDetail {
  display: string
  name: string
  address: string
  city: string
  district: string
  ward: string
  lat: number
  lng: number
}

/**
 * Geocode một địa chỉ text thành tọa độ sử dụng Vietmap API (2 bước)
 * Bước 1: Search API v3 - tìm địa điểm và lấy ref_id
 * Bước 2: Place API v3 - lấy tọa độ từ ref_id
 */
const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  if (!address) {
    console.warn('❌ Geocode: address is empty')
    return null
  }
  
  if (!vietmapServicesKey) {
    console.error('❌ Geocode: Vietmap API key is missing')
    return null
  }
  
  try {
    // Bước 1: Search API - tìm địa điểm
    const searchUrl = `https://maps.vietmap.vn/api/search/v3?apikey=${vietmapServicesKey}&text=${encodeURIComponent(address)}`
    console.log('🔍 Step 1: Searching for address:', address)
    
    const searchResponse = await fetch(searchUrl)
    
    if (!searchResponse.ok) {
      console.error('❌ Search API error:', searchResponse.status, searchResponse.statusText)
      return null
    }
    
    const searchData = await searchResponse.json()
    console.log('📥 Search results:', searchData?.length || 0, 'found')
    
    // Kiểm tra có kết quả không
    if (!Array.isArray(searchData) || searchData.length === 0) {
      console.warn('⚠️ No results found for address:', address)
      return null
    }
    
    const firstResult = searchData[0]
    const refId = firstResult.ref_id
    
    if (!refId) {
      console.error('❌ No ref_id in search result')
      return null
    }
    
    console.log('✅ Found ref_id:', refId)
    console.log('   Display:', firstResult.display)
    
    // Bước 2: Place API - lấy tọa độ từ ref_id
    const placeUrl = `https://maps.vietmap.vn/api/place/v3?apikey=${vietmapServicesKey}&refid=${refId}`
    console.log('🔍 Step 2: Getting coordinates for ref_id:', refId)
    
    const placeResponse = await fetch(placeUrl)
    
    if (!placeResponse.ok) {
      console.error('❌ Place API error:', placeResponse.status, placeResponse.statusText)
      return null
    }
    
    const placeData = await placeResponse.json()
    
    if (!placeData || typeof placeData.lat !== 'number' || typeof placeData.lng !== 'number') {
      console.error('❌ Invalid place data:', placeData)
      return null
    }
    
    console.log('✅ Geocoded successfully!')
    console.log('   Address:', placeData.display || placeData.name)
    console.log('   Coordinates:', { lat: placeData.lat, lng: placeData.lng })
    
    return { lat: placeData.lat, lng: placeData.lng }
    
  } catch (error) {
    console.error('❌ Geocode exception:', error)
    return null
  }
}

/**
 * Đảm bảo Location có đầy đủ tọa độ bằng cách geocode nếu thiếu
 */
const ensureLocationCoordinates = async (location: Location): Promise<Location> => {
  console.log('🔍 ensureLocationCoordinates input:', location)
  
  // If already has coordinates, validate and return
  if (location.latitude && location.longitude && location.address) {
    console.log('✅ Location already has coordinates:', location)
    return location
  }

  // Must have address to geocode
  if (!location.address || location.address.trim() === '') {
    console.error('❌ Cannot geocode: address is empty')
    throw new Error('Địa chỉ không được để trống')
  }

  console.log('🔍 Geocoding address:', location.address)

  const coords = await geocodeAddress(location.address)
  
  if (!coords || !coords.lat || !coords.lng) {
    console.error('❌ Geocoding failed for:', location.address)
    throw new Error(`Không thể tìm tọa độ cho địa chỉ: ${location.address}`)
  }

  const result: Location = {
    address: location.address,
    latitude: coords.lat,
    longitude: coords.lng
  }
  
  console.log('✅ Geocoded result:', result)
  
  // Final validation to ensure all fields are present
  if (!result.address || result.latitude === null || result.latitude === undefined || 
      result.longitude === null || result.longitude === undefined) {
    console.error('❌ Result validation failed:', result)
    throw new Error(`Kết quả geocoding không hợp lệ cho địa chỉ: ${location.address}`)
  }
  
  return result
}

/**
 * Tính toán lộ trình và gợi ý thời gian giao hàng
 * Lưu ý: Location phải có đầy đủ address, latitude, longitude
 */
const calculateRoute = async (dto: RouteCalculationRequestDTO): Promise<ResponseDTO<RouteCalculationResultDTO>> => {
  try {
    // Validate that locations have all required fields
    if (!dto.startLocation.address || !dto.startLocation.latitude || !dto.startLocation.longitude) {
      throw new Error('Start location must have address, latitude, and longitude')
    }
    if (!dto.endLocation.address || !dto.endLocation.latitude || !dto.endLocation.longitude) {
      throw new Error('End location must have address, latitude, and longitude')
    }

    console.log('📤 Sending calculate route request:', JSON.stringify(dto, null, 2))

    // Gọi Backend API để tính toán (Location đã có đầy đủ tọa độ)
    const response = await api.post<ResponseDTO<RouteCalculationResultDTO>>(
      '/api/PostPackage/calculate-route',
      dto
    )

    console.log('📥 Calculate route response:', response.data)

    return response.data
  } catch (error: any) {
    console.error('❌ Calculate route API error:', error)
    console.error('Error response:', error?.response?.data)
    
    // Trả về fallback ResponseDTO nếu API fail
    return {
      statusCode: 500,
      message: error?.response?.data?.message || error?.message || 'Không thể tính toán lộ trình',
      isSuccess: false,
      result: {
        isValid: false,
        message: error?.response?.data?.message || error?.message || 'Không thể tính toán lộ trình',
        distanceKm: 0,
        estimatedDistanceKm: 0,
        estimatedDurationHours: 0,
        travelTimeHours: 0,
        waitTimeHours: 0,
        suggestedMinDeliveryDate: new Date().toISOString(),
        restrictionNote: ''
      }
    }
  }
}

/**
 * Tạo bài đăng Provider Post Package
 * Lưu ý: ShippingRoute locations phải có đầy đủ address, latitude, longitude
 */
const createProviderPostPackage = async (dto: PostPackageCreateDTO): Promise<any> => {
  try {
    // Validate that locations have coordinates
    if (!dto.shippingRoute.startLocation.latitude || !dto.shippingRoute.startLocation.longitude) {
      console.warn('Create post: Start location missing coordinates')
    }
    if (!dto.shippingRoute.endLocation.latitude || !dto.shippingRoute.endLocation.longitude) {
      console.warn('Create post: End location missing coordinates')
    }

    const response = await api.post('/api/PostPackage/create-provider-post-package', dto)
    return response.data as ResponseDTO
  } catch (error: any) {
    console.error('Create post package error:', error)
    if (error.response) console.error('response', error.response.data)
    throw error
  }
}

/**
 * Lấy danh sách bài đăng của tôi
 */
const getMyPosts = async (params: {
  pageNumber?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  status?: string
} = {}): Promise<ResponseDTO> => {
  try {
    const res = await api.get('api/PostPackage/get-my-posts', { params })
    return res.data as ResponseDTO
  } catch (error: any) {
    console.error('getMyPosts failed', error)
    if (error.response) console.error('response', error.response.data)
    throw error
  }
}

/**
 * Lấy chi tiết bài đăng
 */
const getPostPackageDetails = async (postPackageId: string): Promise<ResponseDTO> => {
  try {
    const res = await api.get(`api/PostPackage/get-details/${postPackageId}`)
    return res.data as ResponseDTO
  } catch (error: any) {
    console.error('getPostPackageDetails failed', error)
    if (error.response) console.error('response', error.response.data)
    throw error
  }
}

/**
 * Lấy danh sách bài đăng mở (OPEN)
 */
const getOpenPosts = async (params: {
  pageNumber?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
} = {}): Promise<ResponseDTO> => {
  try {
    const res = await api.get('api/PostPackage/get-open', { params })
    return res.data as ResponseDTO
  } catch (error: any) {
    console.error('getOpenPosts failed', error)
    if (error.response) console.error('response', error.response.data)
    throw error
  }
}

/**
 * Cập nhật trạng thái bài đăng
 */
const updatePostStatus = async (postPackageId: string, newStatus: string): Promise<ResponseDTO> => {
  try {
    const payload = { PostPackageId: postPackageId, NewStatus: newStatus }
    const res = await api.put('api/PostPackage/change-post-package-status', payload)
    return res.data as ResponseDTO
  } catch (error: any) {
    console.error('updatePostStatus failed', error)
    if (error.response) console.error('response', error.response.data)
    throw error
  }
}

const postPackageService = {
  // Route calculation
  calculateRoute,
  geocodeAddress,
  ensureLocationCoordinates,
  
  // Post package operations
  createProviderPostPackage,
  getMyPosts,
  getPostPackageDetails,
  getOpenPosts,
  updatePostStatus
}

export default postPackageService
import api from '@/config/api'

// DriverType enum mirror (PRIMARY / SECONDARY)
export type DriverType = 'PRIMARY' | 'SECONDARY'

// Detail DTO
export interface PostTripDetailCreateDTO {
  Type: DriverType
  RequiredCount: number
  PricePerPerson: number
  PickupLocation: string
  DropoffLocation: string
  MustPickAtGarage: boolean
  MustDropAtGarage: boolean
  // Optional bonus / extra fee per detail line
  BonusAmount?: number
  // Optional deposit amount
  DepositAmount?: number
}

// Create DTO
export interface PostTripCreateDTO {
  Title: string
  Description: string
  TripId: string
  RequiredPayloadInKg?: number | null
  PostTripDetails: PostTripDetailCreateDTO[]
  Status: string
}

export interface PostTripViewDTO {
  postTripId: string
  tripId: string
  title: string
  description?: string
  status: string
  createAt?: string
  updateAt?: string
  requiredPayloadInKg?: number
  postTripDetails?: Array<{
    postTripDetailId?: string
    type: DriverType
    requiredCount: number
    pricePerPerson: number
    pickupLocation: string
    dropoffLocation: string
    mustPickAtGarage: boolean
    mustDropAtGarage: boolean
  }>
}

const postTripService = {
  async create(dto: PostTripCreateDTO) {
    // backend expects PostTripCreateDTO with PascalCase property names
    const res = await api.post('api/PostTrip', dto)
    return res.data
  },
  async getById(id: string) {
    const res = await api.get(`api/PostTrip/${id}`)
    return res.data
  },
  async getMy(pageNumber = 1, pageSize = 10) {
    const res = await api.get(`api/PostTrip/my-posts?pageNumber=${pageNumber}&pageSize=${pageSize}`)
    return res.data
  },
  async getOpen(
    pageNumber = 1, 
    pageSize = 10, 
    search?: string, 
    sortField?: string, 
    sortDirection?: string
  ) {
    let url = `api/PostTrip/open?pageNumber=${pageNumber}&pageSize=${pageSize}`
    if (search) url += `&search=${encodeURIComponent(search)}`
    if (sortField) url += `&sortField=${sortField}`
    if (sortDirection) url += `&sortDirection=${sortDirection}`
    
    const res = await api.get(url)
    return res.data
  }
  ,
  async updateStatus(postTripId: string, newStatus: string) {
    try {
      const payload = { PostTripId: postTripId, NewStatus: newStatus }
      const res = await api.put('api/PostTrip/change-post-trip-status', payload)
      return res.data
    } catch (e: any) {
      console.error('postTrip.updateStatus failed', e)
      if (e.response) console.error('response', e.response.data)
      throw e
    }
  }
}

export default postTripService
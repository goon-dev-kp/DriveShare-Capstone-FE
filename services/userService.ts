import api from '@/config/api'

// ================== DTOs ==================
export interface BaseProfileDTO {
  userId: string
  fullName: string
  email: string
  phoneNumber: string
  status: string
  dateOfBirth?: string
  avatarUrl?: string
  isEmailVerified: boolean
  isPhoneVerified: boolean
  address?: string
  role: string
  hasVerifiedCitizenId: boolean
}

export interface OwnerProfileDTO extends BaseProfileDTO {
  companyName?: string
  taxCode?: string
  businessAddress?: string
  averageRating?: number
  totalVehicles: number
  totalDrivers: number
  totalTripsCreated: number
}

export interface PaginatedOwners {
  data: OwnerProfileDTO[]
  totalCount: number
  currentPage: number
  pageSize: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

const userService = {
  async checkCCCDStatus() {
    try {
      const res = await api.get('api/UserDocument/check-cccd-status')
      return res.data
    } catch (e: any) {
      if (e?.response?.data) return e.response.data
      throw e
    }
  },

  async getMyProfile() {
    try {
      const res = await api.get('api/user/me')
      return res.data
    } catch (e: any) {
      if (e?.response?.data) return e.response.data
      throw e
    }
  },

  async getUsersByRole(
    roleName: string,
    pageNumber: number = 1,
    pageSize: number = 10,
    search?: string,
    sortField?: string,
    sortDirection?: string
  ) {
    try {
      let url = `api/User/role/${roleName}?pageNumber=${pageNumber}&pageSize=${pageSize}`
      if (search) url += `&search=${encodeURIComponent(search)}`
      if (sortField) url += `&sortField=${sortField}`
      if (sortDirection) url += `&sortDirection=${sortDirection}`

      console.log('getUsersByRole URL:', url)
      const res = await api.get(url)
      console.log('getUsersByRole raw response:', res.data)
      return res.data
    } catch (e: any) {
      console.error('getUsersByRole failed', e)
      if (e?.response?.data) return e.response.data
      throw e
    }
  }
}

export default userService

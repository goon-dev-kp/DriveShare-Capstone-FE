import api from '@/config/api'
import { ResponseDTO } from '@/models/types'

export interface EkycResult {
  documentId: string
  fullName: string
  identityNumber: string
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED'
  reason?: string
}

export interface VnptSdkConfig {
  accessToken: string
  tokenId: string
  tokenKey: string
}

export interface DocumentDetailDTO {
  userDocumentId?: string
  documentType: 'CCCD' | 'DRIVER_LINCENSE' | 'HEALTH_CHECK'
  frontImageUrl?: string
  backImageUrl?: string
  portraitImageUrl?: string
  identityNumber?: string
  fullName?: string
  dateOfBirth?: string
  issueDate?: string
  expiryDate?: string
  placeOfOrigin?: string
  placeOfResidence?: string
  issuePlace?: string
  licenseClass?: string
  status: 'ACTIVE' | 'INACTIVE' | 'REJECTED' | 'PENDING' | 'PENDING_REVIEW'
  reason?: string // Backend error response field
  rejectionReason?: string // Database field
  verifiedAt?: string
  createdAt?: string
}

export interface DriverDocumentsDTO {
  drivingLicense: DocumentDetailDTO | null
  healthCheck?: DocumentDetailDTO | null
}

export interface MyDocumentsResponseDTO {
  isDriver: boolean
  cccd: DocumentDetailDTO | null
  driverDocuments?: DriverDocumentsDTO
}

export interface RequestManualReviewDTO {
  UserDocumentId: string
  UserNote: string
}

// Note: Backend returns { result: boolean, message: string } at ResponseDTO level
// So we actually receive ResponseDTO<boolean> with message in ResponseDTO.message
export interface VerifiedStatusDTO {
  isVerified: boolean
  message: string
}

export const ekycService = {
  getVnptConfig: async (): Promise<ResponseDTO<VnptSdkConfig>> => {
    try {
      const response = await api.get<ResponseDTO<VnptSdkConfig>>('/api/VNPT/get-config')
      return response.data
    } catch (error: any) {
      console.error('ekycService.getVnptConfig failed', error)
      throw error
    }
  },
  uploadIdentityDocuments: async (
    front: File | { uri: string; name: string; type: string },
    back: File | { uri: string; name: string; type: string },
    selfie: File | { uri: string; name: string; type: string }
  ): Promise<ResponseDTO<EkycResult>> => {
    try {
      const formData = new FormData()

      // Handle different file formats (Web File vs React Native image picker)
      if (front instanceof File) {
        formData.append('front', front)
        formData.append('back', back as File)
        formData.append('selfie', selfie as File)
      } else {
        // React Native format
        formData.append('front', {
          uri: front.uri,
          name: front.name,
          type: front.type,
        } as any)
        formData.append('back', {
          uri: (back as any).uri,
          name: (back as any).name,
          type: (back as any).type,
        } as any)
        formData.append('selfie', {
          uri: (selfie as any).uri,
          name: (selfie as any).name,
          type: (selfie as any).type,
        } as any)
      }

      const response = await api.post<ResponseDTO<EkycResult>>(
        '/api/UserDocument/upload-identity',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      return response.data
    } catch (error: any) {
      console.error('ekycService.uploadIdentityDocuments failed', error)
      throw error
    }
  },

  checkCccdStatus: async (): Promise<ResponseDTO<boolean>> => {
    try {
      const response = await api.get('/api/UserDocument/check-cccd-status')
      return response.data
    } catch (error: any) {
      console.error('ekycService.checkCccdStatus failed', error)
      throw error
    }
  },

  checkVerifiedStatus: async (): Promise<ResponseDTO<boolean>> => {
    try {
      const response = await api.get<ResponseDTO<boolean>>('/api/UserDocument/check-verified-status')
      return response.data
    } catch (error: any) {
      console.error('ekycService.checkVerifiedStatus failed', error)
      throw error
    }
  },

  getMyDocuments: async (): Promise<ResponseDTO<MyDocumentsResponseDTO>> => {
    try {
      const response = await api.get<ResponseDTO<MyDocumentsResponseDTO>>('/api/UserDocument/my-documents')
      return response.data
    } catch (error: any) {
      console.error('ekycService.getMyDocuments failed', error)
      throw error
    }
  },

  verifyCccd: async (
    front: File | { uri: string; name: string; type: string },
    back: File | { uri: string; name: string; type: string },
    selfie: File | { uri: string; name: string; type: string }
  ): Promise<ResponseDTO<DocumentDetailDTO>> => {
    try {
      const formData = new FormData()
      
      if (front instanceof File) {
        formData.append('Front', front)
        formData.append('Back', back as File)
        formData.append('Selfie', selfie as File)
      } else {
        formData.append('Front', {
          uri: front.uri,
          name: front.name,
          type: front.type,
        } as any)
        formData.append('Back', {
          uri: (back as any).uri,
          name: (back as any).name,
          type: (back as any).type,
        } as any)
        formData.append('Selfie', {
          uri: (selfie as any).uri,
          name: (selfie as any).name,
          type: (selfie as any).type,
        } as any)
      }

      const response = await api.post<ResponseDTO<DocumentDetailDTO>>(
        '/api/UserDocument/verify-cccd',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      return response.data
    } catch (error: any) {
      console.error('ekycService.verifyCccd failed', error)
      throw error
    }
  },

  verifyLicense: async (
    front: File | { uri: string; name: string; type: string },
    selfie: File | { uri: string; name: string; type: string }
  ): Promise<ResponseDTO<DocumentDetailDTO>> => {
    try {
      const formData = new FormData()
      
      if (front instanceof File) {
        formData.append('Front', front)
        formData.append('Selfie', selfie as File)
      } else {
        formData.append('Front', {
          uri: front.uri,
          name: front.name,
          type: front.type,
        } as any)
        formData.append('Selfie', {
          uri: (selfie as any).uri,
          name: (selfie as any).name,
          type: (selfie as any).type,
        } as any)
      }

      const response = await api.post<ResponseDTO<DocumentDetailDTO>>(
        '/api/UserDocument/verify-license',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      return response.data
    } catch (error: any) {
      console.error('ekycService.verifyLicense failed', error)
      throw error
    }
  },

  requestManualReview: async (dto: RequestManualReviewDTO): Promise<ResponseDTO<DocumentDetailDTO>> => {
    try {
      const response = await api.post<ResponseDTO<DocumentDetailDTO>>(
        '/api/UserDocument/request-review',
        dto
      )
      return response.data
    } catch (error: any) {
      console.error('ekycService.requestManualReview failed', error)
      throw error
    }
  },

  verifyHealthCheck: async (
    front: File | { uri: string; name: string; type: string },
    back?: File | { uri: string; name: string; type: string } | null,
    selfie?: File | { uri: string; name: string; type: string } | null
  ): Promise<ResponseDTO<DocumentDetailDTO>> => {
    try {
      const formData = new FormData()
      
      // Front - bắt buộc
      if (front instanceof File) {
        formData.append('Front', front)
        if (back) {
          formData.append('Back', back as File)
        }
        if (selfie) {
          formData.append('Selfie', selfie as File)
        }
      } else {
        formData.append('Front', {
          uri: front.uri,
          name: front.name,
          type: front.type,
        } as any)
        if (back && 'uri' in back) {
          formData.append('Back', {
            uri: back.uri,
            name: back.name,
            type: back.type,
          } as any)
        }
        if (selfie && 'uri' in selfie) {
          formData.append('Selfie', {
            uri: selfie.uri,
            name: selfie.name,
            type: selfie.type,
          } as any)
        }
      }

      const response = await api.post<ResponseDTO<DocumentDetailDTO>>(
        '/api/UserDocument/verify-health-check',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      return response.data
    } catch (error: any) {
      console.error('ekycService.verifyHealthCheck failed', error)
      throw error
    }
  },
}

import api from '@/config/api'

interface ResponseDTO<T = any> {
  isSuccess?: boolean
  statusCode?: number
  message?: string
  result?: T
}

const tripProviderContractService = {
  async sendSignOtp(contractId: string) {
    try {
      // backend expects a GUID in the request body
      // send as an object so controller can bind to a GUID parameter or DTO
      // Provider-side OTP endpoint
      const res = await api.post('api/TripProviderContract/send-sign-otp', { contractId })
      return res.data as ResponseDTO
    } catch (e: any) {
      console.error('tripProviderContractService.sendSignOtp failed', e)
      if (e.response) console.error('response', e.response.data)
      throw e
    }
  },

  async signContract(dto: { ContractId: string; Otp: string }) {
    try {
      // Provider-side signing endpoint
      const res = await api.put('api/TripProviderContract/sign', dto)
      return res.data as ResponseDTO
    } catch (e: any) {
      console.error('tripProviderContractService.signContract failed', e)
      if (e.response) console.error('response', e.response.data)
      throw e
    }
  },

  async getById(contractId: string) {
    try {
      const res = await api.get(`api/TripProviderContract/provider-contracts/${contractId}`)
      return res.data as ResponseDTO
    } catch (e: any) {
      console.error('tripProviderContractService.getById failed', e)
      if (e.response) console.error('response', e.response.data)
      throw e
    }
  }
}

export default tripProviderContractService

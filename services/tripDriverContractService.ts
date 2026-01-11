import api from '@/config/api'

interface ResponseDTO<T = any> {
  isSuccess?: boolean
  statusCode?: number
  message?: string
  result?: T
}

const tripDriverContractService = {
  async sendSignOtp(contractId: string) {
    try {
      // driver-side OTP endpoint
      const res = await api.post('api/TripDriverContract/send-sign-otp', { contractId })
      return res.data as ResponseDTO
    } catch (e: any) {
      console.error('tripDriverContractService.sendSignOtp failed', e)
      if (e.response) console.error('response', e.response.data)
      throw e
    }
  },

  async signContract(dto: { ContractId: string; Otp: string }) {
    try {
      // driver-side signing endpoint
      const res = await api.put('api/TripDriverContract/sign', dto)
      return res.data as ResponseDTO
    } catch (e: any) {
      console.error('tripDriverContractService.signContract failed', e)
      if (e.response) console.error('response', e.response.data)
      throw e
    }
  }
}

export default tripDriverContractService

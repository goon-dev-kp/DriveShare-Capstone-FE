import api from '@/config/api'

interface ResponseDTO<T = any> {
  isSuccess?: boolean
  statusCode?: number
  message?: string
  result?: T
}

const contractTemplateService = {
  async getLatestByType(contractType: string) {
    try {
      const res = await api.get(`api/ContractTemplate/latest/${contractType}`)
      // follow existing project convention: backend may wrap result in { result }
      return res.data as ResponseDTO
    } catch (e: any) {
      console.error('contractTemplateService.getLatestByType failed', e)
      if (e.response) console.error('response', e.response.data)
      throw e
    }
  },

  async getLatestProviderContract() {
    return this.getLatestByType('PROVIDER_CONTRACT')
  },

  async getLatestDriverContract() {
    return this.getLatestByType('DRIVER_CONTRACT')
  }
}

export default contractTemplateService

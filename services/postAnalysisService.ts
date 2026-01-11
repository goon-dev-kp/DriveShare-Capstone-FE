import api from '@/config/api'

interface ResponseDTO<T = any> {
  isSuccess?: boolean
  statusCode?: number
  message?: string
  result?: T
}

const postAnalysisService = {
  async analyzePostTrip(postTripId: string) {
    try {
      const res = await api.post(`api/PostAnalysis/analyze-post-trip/${postTripId}`)
      return res.data as ResponseDTO
    } catch (e: any) {
      console.error('postAnalysisService.analyzePostTrip failed', e)
      if (e.response) console.error('response', e.response.data)
      throw e
    }
  }
}

export default postAnalysisService

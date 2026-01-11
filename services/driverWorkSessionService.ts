import api from '@/config/api'

const driverWorkSessionService = {
  async getHistory(filter: { FromDate?: string | null; ToDate?: string | null; PageIndex?: number; PageSize?: number }) {
    try {
      const params: any = {
        pageIndex: filter.PageIndex ?? 1,
        pageSize: filter.PageSize ?? 10,
      }
      if (filter.FromDate) params.fromDate = filter.FromDate
      if (filter.ToDate) params.toDate = filter.ToDate

      const res = await api.get('api/DriverWorkSession/history', { params })
      return res.data
    } catch (e: any) {
      if (e?.response?.data) return e.response.data
      throw e
    }
  }
,
  async start(dto: { TripId: string } | any) {
    try {
      const res = await api.post('api/DriverWorkSession/start', dto)
      return res.data
    } catch (e: any) {
      if (e?.response?.data) return e.response.data
      throw e
    }
  },
  async end(dto: { TripId?: string; DriverWorkSessionId?: string } | any) {
    try {
      console.log('[DriverWorkSession] Sending end request with DTO:', JSON.stringify(dto, null, 2));
      const res = await api.put('api/DriverWorkSession/end', dto, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return res.data
    } catch (e: any) {
      console.error('[DriverWorkSession] End request failed:', e?.response?.data || e?.message);
      if (e?.response?.data) return e.response.data
      throw e
    }
  }
,
  async checkEligibility() {
    try {
      const res = await api.get('api/DriverWorkSession/check-eligibility')
      return res.data
    } catch (e: any) {
      if (e?.response?.data) return e.response.data
      throw e
    }
  },
  async getCurrentSessionInTrip(tripId: string) {
    try {
      const res = await api.get(`api/DriverWorkSession/current-session/${tripId}`)
      return res.data
    } catch (e: any) {
      if (e?.response?.data) return e.response.data
      throw e
    }
  },
  async importHistory(dto: { DailyLogs: Array<{ Date: string; HoursDriven: number }> }) {
    try {
      const res = await api.post('api/DriverWorkSession/import-history', dto)
      return res.data
    } catch (e: any) {
      if (e?.response?.data) return e.response.data
      throw e
    }
  },
  
  // API mới: Lấy thông tin quỹ thời gian hiện tại của tài xế
  async getMyAvailability() {
    try {
      const res = await api.get('api/DriverWorkSession/my-availability')
      return res.data
    } catch (e: any) {
      if (e?.response?.data) return e.response.data
      throw e
    }
  },
  
  // API mới: Kiểm tra tài xế có phù hợp với chuyến đi không
  async checkSuitabilityForTrip(tripId: string) {
    try {
      const res = await api.get(`api/DriverWorkSession/check-suitability/${tripId}`)
      return res.data
    } catch (e: any) {
      if (e?.response?.data) return e.response.data
      throw e
    }
  }
}

export default driverWorkSessionService

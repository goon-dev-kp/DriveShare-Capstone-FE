import api from '@/config/api'

const walletService = {
  async getMyWallet() {
    try {
      const res = await api.get('api/wallets/my-wallet')
      return res.data
    } catch (e: any) {
      if (e?.response?.data) return e.response.data
      throw e
    }
  },
  async getMyHistory(pageNumber = 1, pageSize = 10) {
    try {
      const res = await api.get(`api/wallets/my-wallet/history?pageNumber=${pageNumber}&pageSize=${pageSize}`)
      return res.data
    } catch (e: any) {
      if (e?.response?.data) return e.response.data
      throw e
    }
  },
  async requestWithdrawal(amount: number, description: string) {
    try {
      // Backend expects PascalCase: Amount, Description
      const payload = {
        Amount: amount,
        Description: description
      }
      const res = await api.post('api/wallets/withdraw', payload)
      return res.data
    } catch (e: any) {
      if (e?.response?.data) return e.response.data
      throw e
    }
  },
  async createTopup(amount: number, description?: string) {
    try {
      // Backend expects PascalCase: Amount, Type, Description, etc.
      const payload = {
        Amount: amount,
        Type: 'TOPUP',
        Description: description || 'Nạp tiền qua ứng dụng',
        TripId: null,
        PostId: null,
        ExternalCode: null
      }
      const res = await api.post('api/wallets/topup', payload)
      return res.data
    } catch (e: any) {
      if (e?.response?.data) return e.response.data
      throw e
    }
  },
  // Legacy method for backward compatibility
  async topup(amount: number, description?: string) {
    return this.createTopup(amount, description)
  },
  async payForTrip(tripId: string, amount: number, description?: string) {
    try {
      const payload = {
        tripId,
        amount,
        type: 'TRIP_PAYMENT',
        description: description || `Thanh toán chuyến ${tripId}`,
      }
      const res = await api.post('api/wallets/payment', payload)
      return res.data
    } catch (e: any) {
      if (e?.response?.data) return e.response.data
      throw e
    }
  },
  async createPayment(dto: { amount: number; type: string; tripId?: string | null; postId?: string | null; description?: string; externalCode?: string | null }) {
    try {
      // Ensure required fields meet server validation
      const description = dto.description && dto.description.trim().length > 0 ? dto.description : 'Payment via app'

      // Allow either numeric enum values or string names; send as-is otherwise.
      // If caller passes a numeric-like string, convert to number so .NET can bind numeric enums.
      let typeValue: string | number = dto.type
      if (typeof dto.type === 'string' && dto.type.match(/^\d+$/)) {
        typeValue = Number(dto.type)
      }

      const payload = {
        Amount: dto.amount,
        Type: typeValue,
        TripId: dto.tripId || null,
        PostId: dto.postId || null,
        Description: description,
        ExternalCode: dto.externalCode || null,
      }

      // Helpful debug logging for server-side model binding issues
      // (Remove or lower log level in production)
      // eslint-disable-next-line no-console
      console.debug('walletService.createPayment payload:', payload)
      const res = await api.post('api/wallets/payment', payload)
      return res.data
    } catch (e: any) {
      if (e?.response?.data) return e.response.data
      throw e
    }
  },
  async create() {
    // Try common create endpoints if backend exposes them; fall back gracefully
    const endpoints = ['api/wallets/create', 'api/wallets/register']
    for (const ep of endpoints) {
      try {
        const res = await api.post(ep, {})
        return res.data
      } catch (e: any) {
        // try next
      }
    }
    return { isSuccess: false, statusCode: 404, message: 'Create wallet endpoint not available.' }
  }
}

export default walletService

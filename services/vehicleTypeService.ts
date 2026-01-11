import api from '@/config/api'

const vehicleTypeService = {
  getAll: async () => {
    const res = await api.get('api/VehicleType/get-all-vehicle-type')
    // backend wraps result in a ResponseDTO: { message, statusCode, success, result }
    return res.data?.result ?? res.data
  },
}

export default vehicleTypeService

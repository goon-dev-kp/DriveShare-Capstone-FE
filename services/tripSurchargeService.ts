import api from "@/config/api";

export enum SurchargeType {
  // Vehicle-related
  FUEL = "FUEL",
  DISTANCE = "DISTANCE",
  LATE_RETURN_VEHICLE = "LATE_RETURN_VEHICLE",
  CLEANING = "CLEANING",
  VEHICLE_DAMAGE = "VEHICLE_DAMAGE",
  
  // Cargo-related
  CARGO_DAMAGE = "CARGO_DAMAGE",
  CARGO_LOSS = "CARGO_LOSS",
  LATE_DELIVERY = "LATE_DELIVERY",
  MISDELIVERY = "MISDELIVERY",
  LOADING_UNLOADING_EXTRA = "LOADING_UNLOADING_EXTRA",
  
  // Legal & Others
  TRAFFIC_VIOLATION = "TRAFFIC_VIOLATION",
  UNAUTHORIZED_TOLL_FEE = "UNAUTHORIZED_TOLL_FEE",
  OTHER = "OTHER",
}

export interface TripSurchargeCreateDTO {
  TripId: string;
  Type: SurchargeType;
  Amount: number;
  Description: string;
  TripVehicleHandoverIssueId?: string;
  TripDeliveryIssueId?: string;
}

const tripSurchargeService = {
  /**
   * Contact creates surcharge claim (compensation request)
   * Uses accessToken from email link (no JWT auth)
   */
  async createByContact(dto: TripSurchargeCreateDTO, accessToken: string) {
    try {
      console.log("📤 Contact creating surcharge claim:", dto);
      const res = await api.post(`api/TripSurcharge/contact-create?accessToken=${accessToken}`, dto);
      return res.data;
    } catch (e: any) {
      console.error("createByContact failed", e);
      throw e.response?.data || e;
    }
  },

  /**
   * Owner creates surcharge (requires authentication)
   * POST api/TripSurcharge/create
   */
  async createByOwner(dto: TripSurchargeCreateDTO) {
    try {
      console.log("📤 Owner creating surcharge:", dto);
      const res = await api.post('api/TripSurcharge/create', dto);
      return res.data;
    } catch (e: any) {
      console.error("createByOwner failed", e);
      throw e.response?.data || e;
    }
  },
};

export default tripSurchargeService;

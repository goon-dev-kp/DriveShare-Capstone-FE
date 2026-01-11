import api, { apiPublic } from "@/config/api";

const tripService = {
  async createForOwner(payload: any) {
    try {
      const res = await api.post("api/trip/create-for-owner", payload);
      return res.data;
    } catch (e: any) {
      console.error("createForOwner failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },
  async createFromPost(payload: { PostPackageId: string; VehicleId: string }) {
    try {
      const res = await api.post("api/trip/owner-create-from-post", payload);
      return res.data;
    } catch (e: any) {
      console.error("createFromPost failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },
  async getByOwner(pageNumber = 1, pageSize = 20) {
    try {
      const res = await api.get(
        `api/trip/owner?pageNumber=${pageNumber}&pageSize=${pageSize}`
      );
      return res.data;
    } catch (e: any) {
      console.error("getByOwner failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },
  async getById(tripId: string) {
    try {
      const res = await api.get(`api/trip/${tripId}`);
      return res.data;
    } catch (e: any) {
      console.error("getById failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },
  async getTripsByDriver(pageNumber = 1, pageSize = 10) {
    try {
      const res = await api.get(
        `api/trip/driver?pageNumber=${pageNumber}&pageSize=${pageSize}`
      );
      return res.data;
    } catch (e: any) {
      console.error("getTripsByDriver failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },
  async signProviderContract(contractId: string) {
    try {
      const res = await api.put(`api/TripProviderContract/sign/${contractId}`);
      return res.data;
    } catch (e: any) {
      console.error("signProviderContract failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },
  async signDriverContract(contractId: string) {
    // Mirror provider contract signing pattern
    try {
      const res = await api.put(`api/TripDriverContract/sign/${contractId}`);
      return res.data;
    } catch (e: any) {
      console.error("signDriverContract failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },
  async getDriverContractPdfLink(
    contractId: string,
    includeTerms: boolean = true
  ) {
    try {
      const res = await api.get(
        `api/TripDriverContract/pdf-link/${contractId}?includeTerms=${includeTerms}`
      );
      return res.data;
    } catch (e: any) {
      console.error("getDriverContractPdfLink failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },
  async getTripsByProvider(params: {
    pageNumber: number;
    pageSize: number;
    search?: string;
    sortField?: string;
    sortDirection?: string;
    status?: string;
  }) {
    try {
      const queryParams = new URLSearchParams({
        pageNumber: params.pageNumber.toString(),
        pageSize: params.pageSize.toString(),
      });
      if (params.search) queryParams.append("search", params.search);
      if (params.sortField) queryParams.append("sortField", params.sortField);
      if (params.sortDirection)
        queryParams.append("sortDirection", params.sortDirection);
      if (params.status) queryParams.append("status", params.status);

      const res = await api.get(`api/trip/provider?${queryParams.toString()}`);
      return res.data;
    } catch (e: any) {
      console.error("getTripsByProvider failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },
  async getDeliveryRecordForDriver(recordId: string) {
    try {
      const res = await api.get(`api/tripdeliveryrecord/driver/${recordId}`);
      return res.data;
    } catch (e: any) {
      console.error("getDeliveryRecordForDriver failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },

  async getDeliveryRecordPdfLink(recordId: string) {
    try {
      const res = await api.get(`api/tripdeliveryrecord/pdf-link/${recordId}`);
      return res.data;
    } catch (e: any) {
      console.error("getDeliveryRecordPdfLink failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },

  async signDeliveryRecordAsDriver(recordId: string) {
    try {
      // Backend controller exposes POST api/tripdeliveryrecord/sign-delivery-record?tripDeliveryRecordId={id}
      const res = await api.post(
        `api/tripdeliveryrecord/sign-delivery-record?tripDeliveryRecordId=${recordId}`
      );
      return res.data;
    } catch (e: any) {
      console.error("signDeliveryRecordAsDriver failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },

  async sendSignOtp(recordId: string) {
    try {
      const res = await api.post(
        `api/tripdeliveryrecord/send-sign-otp/${recordId}`
      );
      return res.data;
    } catch (e: any) {
      console.error("sendSignOtp failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },

  async signDeliveryRecord(dto: { DeliveryRecordId: string; Otp: string }) {
    try {
      const res = await api.put(`api/tripdeliveryrecord/sign`, dto);
      return res.data;
    } catch (e: any) {
      console.error("signDeliveryRecord failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },

  async confirmDrivers(tripId: string) {
    try {
      const res = await api.put(`api/trip/confirm-drivers/${tripId}`);
      return res.data;
    } catch (e: any) {
      console.error("confirmDrivers failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },

  async changeStatus(dto: { TripId: string; NewStatus: string }) {
    try {
      const res = await api.put(`api/trip/change-status`, dto);
      return res.data;
    } catch (e: any) {
      console.error("changeStatus failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },
  // Public contact-facing APIs (anonymous access via accessToken)
  async getDeliveryRecordForContact(recordId: string, accessToken: string) {
    try {
      // Use public client so no Authorization header is attached
      const res = await apiPublic.get(
        `api/tripdeliveryrecord/contact/view/${recordId}?accessToken=${encodeURIComponent(
          accessToken
        )}`
      );
      return res.data;
    } catch (e: any) {
      console.error("getDeliveryRecordForContact failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },

  async sendOtpToContact(recordId: string, accessToken: string) {
    try {
      const payload = { AccessToken: accessToken };
      const res = await apiPublic.post(
        `api/tripdeliveryrecord/contact/send-otp/${recordId}`,
        payload
      );
      return res.data;
    } catch (e: any) {
      console.error("sendOtpToContact failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },

  async signDeliveryRecordForContact(dto: {
    DeliveryRecordId: string;
    Otp: string;
    AccessToken: string;
  }) {
    try {
      const res = await apiPublic.post(
        `api/tripdeliveryrecord/contact/sign`,
        dto
      );
      return res.data;
    } catch (e: any) {
      console.error("signDeliveryRecordForContact failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },

  // === VEHICLE HANDOVER RECORDS ===
  async getVehicleHandoverRecord(recordId: string) {
    try {
      const res = await api.get(`api/TripVehicleHandoverRecord/${recordId}`);
      return res.data;
    } catch (e: any) {
      console.error("getVehicleHandoverRecord failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },

  async getVehicleHandoverPdfLink(recordId: string) {
    try {
      const res = await api.get(
        `api/TripVehicleHandoverRecord/pdf-link/${recordId}`
      );
      return res.data;
    } catch (e: any) {
      console.error("getVehicleHandoverPdfLink failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },

  async updateVehicleHandoverChecklist(dto: {
    RecordId: string;
    CurrentOdometer?: number;
    FuelLevel?: number;
    IsEngineLightOn?: boolean;
    Notes?: string;
    ChecklistItems: Array<{
      TripVehicleHandoverTermResultId: string;
      IsPassed: boolean;
      Note?: string;
      EvidenceImage?: string | File | null; // File for web, uri string for mobile
    }>;
  }) {
    try {
      // Build FormData if there are any images
      const hasImages = dto.ChecklistItems.some((item) => item.EvidenceImage);

      if (hasImages) {
        const formData = new FormData();

        // Add basic fields
        formData.append("RecordId", dto.RecordId);
        if (dto.CurrentOdometer !== undefined) {
          formData.append("CurrentOdometer", dto.CurrentOdometer.toString());
        }
        if (dto.FuelLevel !== undefined) {
          formData.append("FuelLevel", dto.FuelLevel.toString());
        }
        if (dto.IsEngineLightOn !== undefined) {
          formData.append("IsEngineLightOn", dto.IsEngineLightOn.toString());
        }
        if (dto.Notes) {
          formData.append("Notes", dto.Notes);
        }

        // Add checklist items
        dto.ChecklistItems.forEach((item, index) => {
          console.log(`🔍 Processing ChecklistItem ${index}:`, item);
          if (!item.TripVehicleHandoverTermResultId) {
            console.error(
              `❌ Missing TripVehicleHandoverTermResultId for item ${index}:`,
              item
            );
            throw new Error(
              `ChecklistItem[${index}] missing TripVehicleHandoverTermResultId`
            );
          }
          formData.append(
            `ChecklistItems[${index}].TripVehicleHandoverTermResultId`,
            item.TripVehicleHandoverTermResultId
          );
          formData.append(
            `ChecklistItems[${index}].IsPassed`,
            item.IsPassed.toString()
          );
          if (item.Note) {
            formData.append(`ChecklistItems[${index}].Note`, item.Note);
          }

          // Handle image upload
          if (item.EvidenceImage) {
            if (typeof item.EvidenceImage === "string") {
              // Mobile: uri string
              const uriParts = item.EvidenceImage.split(".");
              const fileType = uriParts[uriParts.length - 1];
              formData.append(`ChecklistItems[${index}].EvidenceImage`, {
                uri: item.EvidenceImage,
                name: `evidence-${index}.${fileType}`,
                type: `image/${fileType}`,
              } as any);
            } else {
              // Web: File object
              formData.append(
                `ChecklistItems[${index}].EvidenceImage`,
                item.EvidenceImage
              );
            }
          }
        });

        const res = await api.put(
          `api/TripVehicleHandoverRecord/update-checklist`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        return res.data;
      } else {
        // No images, send as JSON
        const res = await api.put(
          `api/TripVehicleHandoverRecord/update-checklist`,
          dto
        );
        return res.data;
      }
    } catch (e: any) {
      console.error("updateVehicleHandoverChecklist failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },

  async reportHandoverIssue(formData: FormData) {
    try {
      const res = await api.post(
        "api/TripVehicleHandoverRecord/report-issue",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
        
      );
      return res.data;
    } catch (e: any) {
      console.error("reportHandoverIssue failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },

  async sendVehicleHandoverOtp(recordId: string) {
    try {
      const res = await api.post(
        `api/TripVehicleHandoverRecord/${recordId}/send-otp`
      );
      return res.data;
    } catch (e: any) {
      console.error("sendVehicleHandoverOtp failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },

  async signVehicleHandoverRecord(dto: { RecordId: string; Otp: string }) {
    try {
      const res = await api.post(`api/TripVehicleHandoverRecord/sign`, dto);
      return res.data;
    } catch (e: any) {
      console.error("signVehicleHandoverRecord failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },

  async analyzeDrivers(tripId: string) {
    try {
      const res = await api.get(`api/Trip/analyze-drivers/${tripId}`);
      return res.data;
    } catch (e: any) {
      console.error("analyzeDrivers failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },

  async cancelByOwner(tripId: string, reason?: string) {
    try {
      const res = await api.put("api/trip/cancel-by-owner", {
        TripId: tripId,
        Reason: reason || null,
      });
      return res.data;
    } catch (e: any) {
      console.error("cancelByOwner failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },

  async removeDriverFromTrip(assignmentId: string) {
    try {
      const res = await api.delete(`api/TripDriverAssignments/${assignmentId}`);
      return res.data;
    } catch (e: any) {
      console.error("removeDriverFromTrip failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },
};

export default tripService;

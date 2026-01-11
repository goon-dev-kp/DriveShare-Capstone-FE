import api from "@/config/api";

// ================== ENUMS ==================
export enum FleetJoinStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

// ================== DTOs ==================
export interface LinkedDriverDTO {
  ownerDriverLinkId: string;
  driverId: string;
  fullName: string;
  phoneNumber: string;
  avatarUrl?: string;
  licenseNumber?: string;
  status: string;
  requestedAt: string;
  approvedAt?: string;
  hoursDrivenToday: number;
  hoursDrivenThisWeek: number;
  hoursDrivenThisMonth: number;
  canDrive: boolean;
}

export interface DriverTeamInfoDTO {
  ownerDriverLinkId: string;
  status: string;
  requestedAt: string;
  approvedAt?: string;
  ownerId: string;
  ownerName: string;
  ownerPhoneNumber: string;
  ownerAvatar?: string;
  ownerEmail: string;
}

export interface CreateOwnerDriverLinkDTO {
  OwnerId: string; // Backend yêu cầu chữ O viết hoa
}

export interface ChangeStatusOwnerDriverLinkDTO {
  ownerDriverLinkId: string;
  status: FleetJoinStatus;
}

export interface PaginatedDrivers {
  data: LinkedDriverDTO[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

// ================== SERVICE ==================
class OwnerDriverLinkService {
  // Owner: Lấy danh sách tài xế đã liên kết
  async getMyDrivers(pageNumber: number = 1, pageSize: number = 10) {
    try {
      const response = await api.get<{
        isSuccess: boolean;
        result: PaginatedDrivers;
        message?: string;
      }>("/api/OwnerDriverLink/my-drivers", {
        params: { pageNumber, pageSize },
      });

      if (response.data.isSuccess) {
        return {
          success: true,
          data: response.data.result,
        };
      }

      return {
        success: false,
        error: response.data.message || "Không thể tải danh sách tài xế",
      };
    } catch (error: any) {
      console.error("Error fetching my drivers:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Lỗi kết nối",
      };
    }
  }

  // Owner: Lấy danh sách tài xế KHÔNG bị rejected (PENDING + APPROVED)
  async getMyDriversNotRejected(pageNumber: number = 1, pageSize: number = 10) {
    try {
      const response = await api.get<{
        isSuccess: boolean;
        result: PaginatedDrivers;
        message?: string;
      }>("/api/OwnerDriverLink/my-drivers/not-rejected", {
        params: { pageNumber, pageSize },
      });

      if (response.data.isSuccess) {
        return {
          success: true,
          data: response.data.result,
        };
      }

      return {
        success: false,
        error: response.data.message || "Không thể tải danh sách tài xế",
      };
    } catch (error: any) {
      console.error("Error fetching my drivers (not rejected):", error);
      return {
        success: false,
        error: error.response?.data?.message || "Lỗi kết nối",
      };
    }
  }

  // Driver: Lấy danh sách tất cả các team đang tham gia
  async getMyTeams() {
    try {
      const response = await api.get<{
        isSuccess: boolean;
        result?: DriverTeamInfoDTO;
        message?: string;
        statusCode?: number;
      }>("/api/OwnerDriverLink/my-team");

      if (response.data.isSuccess && response.data.result) {
        // Backend trả về single team, wrap thành array để consistent với UI
        return {
          success: true,
          data: [response.data.result],
        };
      }

      // Không có team nào
      return {
        success: true,
        data: [],
      };
    } catch (error: any) {
      // 404 = chưa thuộc đội nào
      if (error.response?.status === 404) {
        return {
          success: true,
          data: [],
        };
      }

      console.error("Error fetching my teams:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Lỗi kết nối",
      };
    }
  }

  // Driver: Kiểm tra đang thuộc đội xe nào (deprecated - dùng getMyTeams)
  async getMyTeamInfo() {
    try {
      const response = await api.get<{
        isSuccess: boolean;
        result?: DriverTeamInfoDTO;
        message?: string;
        statusCode?: number;
      }>("/api/OwnerDriverLink/my-team");

      if (response.data.isSuccess) {
        return {
          success: true,
          data: response.data.result,
        };
      }

      // 404 = chưa thuộc đội nào
      if (response.data.statusCode === 404) {
        return {
          success: true,
          data: null,
        };
      }

      return {
        success: false,
        error: response.data.message || "Không thể tải thông tin đội",
      };
    } catch (error: any) {
      // 404 = chưa thuộc đội nào
      if (error.response?.status === 404) {
        return {
          success: true,
          data: null,
        };
      }

      console.error("Error fetching team info:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Lỗi kết nối",
      };
    }
  }

  // Driver: Gửi yêu cầu gia nhập đội xe
  async createJoinRequest(dto: CreateOwnerDriverLinkDTO) {
    try {
      const response = await api.post<{
        isSuccess: boolean;
        result?: { linkId: string };
        message?: string;
      }>("/api/OwnerDriverLink", dto);

      if (response.data.isSuccess) {
        return {
          success: true,
          data: response.data.result,
          message: "Gửi yêu cầu thành công",
        };
      }

      return {
        success: false,
        error: response.data.message || "Không thể gửi yêu cầu",
      };
    } catch (error: any) {
      console.error("Error creating join request:", error);
      const statusCode = error.response?.status;

      if (statusCode === 409) {
        return {
          success: false,
          error: "Bạn đã gửi yêu cầu hoặc đã thuộc đội xe này",
        };
      }

      if (statusCode === 404) {
        return {
          success: false,
          error: "Không tìm thấy chủ xe",
        };
      }

      return {
        success: false,
        error: error.response?.data?.message || "Lỗi kết nối",
      };
    }
  }

  // Owner: Duyệt/từ chối yêu cầu
  async changeStatus(dto: ChangeStatusOwnerDriverLinkDTO) {
    try {
      const response = await api.post<{
        isSuccess: boolean;
        message?: string;
      }>("/api/OwnerDriverLink/change-status", dto);

      if (response.data.isSuccess) {
        return {
          success: true,
          message: response.data.message || "Cập nhật trạng thái thành công",
        };
      }

      return {
        success: false,
        error: response.data.message || "Không thể cập nhật trạng thái",
      };
    } catch (error: any) {
      console.error("Error changing status:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Lỗi kết nối",
      };
    }
  }
}

export default new OwnerDriverLinkService();

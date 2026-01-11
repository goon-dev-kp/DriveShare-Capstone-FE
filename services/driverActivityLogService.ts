import api from "@/config/api";

export interface DriverActivityLogDTO {
  driverActivityLogId: string;
  description: string;
  logLevel: string;
  createAt: string;
  driverId: string;
  driverName?: string;
  driverPhone?: string;
}

export interface PaginatedLogsDTO {
  data: DriverActivityLogDTO[];
  currentPage: number;
  pageSize: number;
  totalCount?: number;
  totalPages?: number;
}

const driverActivityLogService = {
  /**
   * Get my activity logs with pagination and optional filter
   * @param page - Page number (default: 1)
   * @param pageSize - Items per page (default: 10)
   * @param logLevel - Filter by level: "Info", "Warning", "Critical" (optional)
   */
  async getMyLogs(
    page: number = 1,
    pageSize: number = 10,
    logLevel?: string | null
  ) {
    try {
      const params: any = { page, pageSize };
      if (logLevel) params.logLevel = logLevel;

      // Try multiple possible endpoints (backend may use different controller name)
      // Common patterns: api/Driver/my-logs, api/DriverActivityLog/my-logs, api/Activity/my-logs
      const res = await api.get("api/DriverActivityLog/my-logs", { params });
      return res.data;
    } catch (e: any) {
      if (e?.response?.data) return e.response.data;
      throw e;
    }
  },
};

export default driverActivityLogService;

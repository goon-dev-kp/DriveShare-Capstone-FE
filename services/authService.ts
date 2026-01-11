// src/services/authService.ts
import api from "@/config/api";
import { jwtDecode } from "jwt-decode";
import { setToken, removeToken } from "@/utils/token";
import { ResponseDTO, AuthenticatedUser, Role } from "@/models/types";

interface DecodedToken {
  userId: string;
  fullName?: string;
  Role?: Role;
  exp?: number;
}

export const authService = {
  login: async (
    credentials: { email: string; password: string },
    role: Role
  ): Promise<ResponseDTO<AuthenticatedUser>> => {
    try {
      const response = await api.post<ResponseDTO>("/api/auth/login", {
        ...credentials,
        role,
      });

      const { statusCode, isSuccess, message, result } = response.data;
      if (!isSuccess || !result) {
        return { statusCode, isSuccess, message, result: null as any };
      }

      const { accessToken, refreshToken } = result as {
        accessToken: string;
        refreshToken: string;
      };

      // Xóa token cũ nếu có, sau đó lưu token mới
      try {
        await removeToken();
      } catch (e) {
        console.warn("[authService] removeToken warning", e);
      }
      await setToken(accessToken);

      // Đồng thời set header mặc định cho axios instance để chắc chắn request tiếp theo dùng token mới
      try {
        api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      } catch (e) {
        console.warn("[authService] fail to set axios default header", e);
      }

      const decoded = jwtDecode<DecodedToken>(accessToken);

      console.log("[authService] Decoded token:", decoded);

      // Sau khi lưu token, gọi API /api/user/me để lấy profile đầy đủ
      try {
        // Gọi profile kèm header rõ ràng để tránh trường hợp interceptor chưa đọc token kịp
        const profileResp = await api.get<ResponseDTO>("/api/user/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const profileData = profileResp.data?.result;

        // Gộp thông tin từ token + profile
        const user: AuthenticatedUser = {
          userId: decoded.userId,
          userName: profileData?.userName || decoded.fullName || "",
          email: profileData?.email || credentials.email,
          role: decoded.Role || role,
          accessToken,
          refreshToken,
          userStatus: profileData?.userStatus || ("ACTIVE" as any),
          phoneNumber: profileData?.phoneNumber || "",
          avatarUrl: profileData?.avatarUrl || undefined,
          // gắn thêm các trường của provider nếu có
          ...(profileData?.companyName
            ? { companyName: profileData.companyName }
            : {}),
          ...(profileData?.totalItems
            ? { totalItems: profileData.totalItems }
            : {}),
          ...(profileData?.totalPackages
            ? { totalPackages: profileData.totalPackages }
            : {}),
        } as AuthenticatedUser;

        // Attach raw profile payload so callers can access all profile fields
        (user as any).profile = profileData || profileResp.data || null;

        console.log("[authService] Final user object with profile:", user);

        return {
          statusCode,
          isSuccess: true,
          message,
          result: user,
        };
      } catch (err) {
        console.warn("[authService] Failed to fetch profile after login", err);

        // Nếu không lấy được profile thì trả về user tối thiểu từ token
        const user: AuthenticatedUser = {
          userId: decoded.userId,
          userName: decoded.fullName || "",
          email: credentials.email,
          role: decoded.Role || role,
          accessToken,
          refreshToken,
          userStatus: "ACTIVE" as any,
          phoneNumber: "",
        };

        return {
          statusCode,
          isSuccess: true,
          message,
          result: user,
        };
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "Đăng nhập thất bại. Vui lòng thử lại.";
      return {
        statusCode: error.response?.status || 500,
        isSuccess: false,
        message,
        result: null as any,
      };
    }
  },
  register: async (payload: any) => {
    try {
      const res = await api.post("/api/auth/register", payload);
      return res.data;
    } catch (e: any) {
      const statusCode = e?.response?.status || 0;
      const message =
        e?.response?.data?.message ||
        (e?.message === "Network Error"
          ? "Không thể kết nối đến máy chủ. Kiểm tra EXPO_PUBLIC_API_BASE_URL, mạng Wi‑Fi, và backend đang chạy."
          : "Đăng ký thất bại. Vui lòng thử lại.");

      // Avoid LogBox red screen in dev by not using console.error
      console.warn("[authService] register failed", {
        statusCode,
        message,
      });

      return {
        statusCode,
        isSuccess: false,
        message,
        result: null,
      };
    }
  },
  registerDriver: async (payload: any) => {
    try {
      // Backend uses [FromForm], so ALWAYS send as FormData (like itemService)
      if (typeof FormData !== "undefined" && payload instanceof FormData) {
        const res = await api.post("/api/Auth/register-driver", payload, {
          timeout: 60000,
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
      }
      // Fallback: wrap plain object into FormData
      console.warn("[registerDriver] Received plain object, wrapping into FormData");
      const form = new FormData();
      Object.keys(payload).forEach(k => {
        const v = payload[k];
        if (v !== undefined && v !== null && v !== '') {
          form.append(k, String(v));
        }
      });
      const res = await api.post("/api/Auth/register-driver", form, {
        timeout: 60000,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    } catch (e: any) {
      const statusCode = e?.response?.status || 0;
      const message =
        e?.response?.data?.message ||
        (e?.message === "Network Error"
          ? "Không thể kết nối đến máy chủ. Nếu bạn đang test trên điện thoại, đừng dùng localhost; hãy trỏ EXPO_PUBLIC_API_BASE_URL về IP LAN của máy chạy backend."
          : "Đăng ký tài xế thất bại. Vui lòng thử lại.");

      console.warn("[authService] registerDriver failed", {
        statusCode,
        message,
      });

      return {
        statusCode,
        isSuccess: false,
        message,
        result: null,
      };
    }
  },
  registerOwner: async (payload: any) => {
    try {
      if (typeof FormData !== "undefined" && payload instanceof FormData) {
        const res = await api.post("/api/auth/register-owner", payload, {
          timeout: 60000,
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
      }
      console.warn("[registerOwner] Received plain object, wrapping into FormData");
      const form = new FormData();
      Object.keys(payload).forEach(k => {
        const v = payload[k];
        if (v !== undefined && v !== null && v !== '') {
          form.append(k, String(v));
        }
      });
      const res = await api.post("/api/auth/register-owner", form, {
        timeout: 60000,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    } catch (e: any) {
      const statusCode = e?.response?.status || 0;
      const message =
        e?.response?.data?.message ||
        (e?.message === "Network Error"
          ? "Không thể kết nối đến máy chủ. Kiểm tra EXPO_PUBLIC_API_BASE_URL và backend."
          : "Đăng ký chủ xe thất bại. Vui lòng thử lại.");

      console.warn("[authService] registerOwner failed", {
        statusCode,
        message,
      });

      return {
        statusCode,
        isSuccess: false,
        message,
        result: null,
      };
    }
  },
  registerProvider: async (payload: any) => {
    try {
      if (typeof FormData !== "undefined" && payload instanceof FormData) {
        const res = await api.post("/api/auth/register-provider", payload, {
          timeout: 60000,
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
      }
      console.warn("[registerProvider] Received plain object, wrapping into FormData");
      const form = new FormData();
      Object.keys(payload).forEach(k => {
        const v = payload[k];
        if (v !== undefined && v !== null && v !== '') {
          form.append(k, String(v));
        }
      });
      const res = await api.post("/api/auth/register-provider", form, {
        timeout: 60000,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    } catch (e: any) {
      const statusCode = e?.response?.status || 0;
      const message =
        e?.response?.data?.message ||
        (e?.message === "Network Error"
          ? "Không thể kết nối đến máy chủ. Kiểm tra EXPO_PUBLIC_API_BASE_URL và backend."
          : "Đăng ký nhà cung cấp thất bại. Vui lòng thử lại.");

      console.warn("[authService] registerProvider failed", {
        statusCode,
        message,
      });

      return {
        statusCode,
        isSuccess: false,
        message,
        result: null,
      };
    }
  },
  verifyEmail: async (
    userId: string,
    token: string
  ): Promise<ResponseDTO<any>> => {
    try {
      const response = await api.get("/api/auth/verify-email", {
        params: { userId, token },
      });
      return response.data;
    } catch (e: any) {
      console.error("authService.verifyEmail failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },

  logout: async (): Promise<ResponseDTO<any>> => {
    try {
      // Gọi API logout với token trong header (interceptor tự động gán)
      const response = await api.post("/api/auth/logout");
      
      // Chỉ xóa token SAU KHI API logout thành công
      console.log("✅ API logout successful, removing token from storage...");
      await removeToken();
      
      // Xóa header axios
      delete api.defaults.headers.common["Authorization"];
      console.log("✅ Token removed from storage and header cleared");
      
      return response.data;
    } catch (e: any) {
      console.error("❌ authService.logout API failed", e);
      if (e.response) console.error("Response:", e.response.data);
      
      // Throw error để caller biết API failed
      throw e;
    }
  },
};

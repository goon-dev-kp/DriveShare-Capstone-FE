import { getToken } from "@/utils/token";
import axios from "axios";

// Load baseURL from environment variable
const baseURL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:5246/";

const api = axios.create({
  baseURL,
  timeout: 120000, // Tăng timeout lên 120s cho upload file
});
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Public client without attaching Authorization header.
const apiPublic = axios.create({ baseURL, timeout: 50000 });

export { apiPublic };
export default api;

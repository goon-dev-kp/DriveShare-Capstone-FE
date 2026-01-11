import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "accessToken";

/**
 * Lưu token vào AsyncStorage.
 * @param token - Chuỗi token cần lưu.
 */
export const setToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error("Lỗi khi lưu token:", error);
  }
};

/**
 * Lấy token từ AsyncStorage.
 * @returns - Promise chứa chuỗi token hoặc null nếu không tìm thấy.
 */
export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error("Lỗi khi lấy token:", error);
    return null;
  }
};

/**
 * Xóa token khỏi AsyncStorage.
 */
export const removeToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error("Lỗi khi xóa token:", error);
  }
};

/**
 * Xóa toàn bộ dữ liệu người dùng khi logout.
 */
export const clearAllUserData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      "accessToken",
      "user",
      "wallet",
      "verificationStatus",
    ]);
  } catch (error) {
    console.error("Lỗi khi xóa dữ liệu người dùng:", error);
  }
};

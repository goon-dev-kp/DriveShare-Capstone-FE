import api from "@/config/api";
import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

interface ResponseDTO<T = any> {
  isSuccess: boolean;
  statusCode: number;
  message?: string;
  result?: T;
}

const packageService = {
  async createPackage(payload: any) {
    try {
      console.log("📦 [packageService] Creating package with payload:", {
        ...payload,
        images: payload.images?.map((img: any, i: number) => ({
          index: i,
          type: img instanceof File ? 'File' : img instanceof Blob ? 'Blob' : 'URI',
          name: img.name || img.uri || 'unknown'
        }))
      });
      
      const formData = new FormData();
      
      // Append text fields
      formData.append("Title", payload.title || "");
      formData.append("Description", payload.description || "");
      formData.append("Quantity", String(payload.quantity || 1));
      formData.append("Unit", payload.unit || "piece");
      formData.append("WeightKg", String(payload.weightKg || 0));
      formData.append("VolumeM3", String(payload.volumeM3 || 0));
      formData.append("ItemId", payload.itemId || "");
      
      // Append boolean fields
      formData.append("IsFragile", String(payload.isFragile || false));
      formData.append("IsLiquid", String(payload.isLiquid || false));
      formData.append("IsRefrigerated", String(payload.isRefrigerated || false));
      formData.append("IsFlammable", String(payload.isFlammable || false));
      formData.append("IsHazardous", String(payload.isHazardous || false));
      formData.append("IsBulky", String(payload.isBulky || false));
      formData.append("IsPerishable", String(payload.isPerishable || false));
      formData.append("OtherRequirements", payload.otherRequirements || "");

      // Append images - Sử dụng logic giống itemService (đã test thành công)
      if (payload.images && payload.images.length > 0) {
        console.log(`📸 [packageService] Processing ${payload.images.length} images`);
        
        // Helper: convert data URL to Blob (CHỈ DÙNG CHO WEB)
        const dataUrlToBlob = async (dataUrl: string) => {
          try {
            const resp = await fetch(dataUrl);
            return await resp.blob();
          } catch (err) {
            try {
              const base64Marker = ';base64,';
              const parts = dataUrl.split(base64Marker);
              const contentType = dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'));
              const raw = atob(parts[1]);
              const rawLength = raw.length;
              const uInt8Array = new Uint8Array(rawLength);
              for (let i = 0; i < rawLength; ++i) {
                uInt8Array[i] = raw.charCodeAt(i);
              }
              return new Blob([uInt8Array], { type: contentType });
            } catch (e) {
              console.warn('Không thể chuyển dataURL sang Blob', e);
              throw e;
            }
          }
        };
        
        for (let i = 0; i < payload.images.length; i++) {
          const img = payload.images[i];
          
          // Lấy URI (fallback sang packageImageURL nếu uri là null)
          let uri: string | undefined;
          if (typeof img === 'string') uri = img;
          else if (typeof img === 'object') uri = img.uri ?? img.packageImageURL;
          
          console.log(`>>> [packageService] Đang xử lý ảnh URI: ${uri ? uri.substring(0, 30) + '...' : 'null'}`);
          
          if (!uri) {
            console.warn('Bỏ qua ảnh không hợp lệ (không tìm thấy URI):', img);
            continue;
          }
          
          try {
            if (uri.startsWith('data:')) {
              // ==========================
              // === LUỒNG (data:) ===
              // ==========================
              
              if (Platform.OS === 'web') {
                // === LUỒNG WEB ===
                console.log('>>> [packageService] Đang xử lý data:URL trên WEB');
                const blob = await dataUrlToBlob(uri);
                const fileName = img.fileName || `package_${Date.now()}_${i}.jpg`;
                // @ts-ignore
                formData.append('PackageImages', blob, fileName);
                
              } else {
                // === LUỒNG MOBILE (iOS-Edit) ===
                console.log('>>> [packageService] Đang xử lý data:URL trên MOBILE (iOS-Edit)');
                
                // Tách phần base64 ra
                const base64Data = uri.split(',')[1];
                
                // Lấy tên file và type
                const fileName = img.fileName || `package_${Date.now()}.jpg`;
                const mimeType = img.type || 'image/jpeg';
                
                // Tạo file tạm
                const baseDir = (FileSystem as any).cacheDirectory ?? (FileSystem as any).documentDirectory ?? '';
                const tempUri = baseDir + fileName;
                
                // Ghi dữ liệu base64 vào file tạm
                await FileSystem.writeAsStringAsync(tempUri, base64Data, {
                  encoding: (FileSystem as any).EncodingType?.Base64 ?? 'base64',
                });
                
                // Build object file
                const rnFile: any = {
                  uri: tempUri, // Dùng file: URI của file tạm
                  name: fileName,
                  type: mimeType,
                };
                
                // @ts-ignore
                formData.append('PackageImages', rnFile);
              }
            
            } else if (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('/')) {
              // ==================================
              // === LUỒNG MOBILE (file:) (Android/iOS-No-Edit) ===
              // ==================================
              
              const fileName = img.fileName || `package_${Date.now()}_${i}.jpg`;
              let mimeType = img.type || 'image/jpeg';
              // Fix: Đảm bảo MIME type có format đúng (image/jpeg không phải image)
              if (mimeType && !mimeType.includes('/')) {
                mimeType = `image/${mimeType}`;
              }
              
              const rnFile: any = {
                uri: uri,
                name: fileName,
                type: mimeType,
              };
              
              console.log(`>>> [packageService] ĐANG APPEND FILE MOBILE (file://): ${JSON.stringify(rnFile)}`);
              
              // @ts-ignore
              formData.append('PackageImages', rnFile);
              
            } else if (uri.startsWith('http://') || uri.startsWith('https://')) {
              // ===========================
              // === LUỒNG URL (http:) ===
              // ===========================
              try {
                const resp = await fetch(uri);
                const blob = await resp.blob();
                const fileName = img.fileName || `package_${Date.now()}_${i}.jpg`;
                // @ts-ignore
                formData.append('PackageImages', blob, fileName);
              } catch (e) {
                console.warn('Không thể tải ảnh từ URL:', uri, e);
              }
              
            } else {
              console.warn('Định dạng URI ảnh không được hỗ trợ:', uri);
            }
          } catch (err) {
            console.warn('Lỗi khi xử lý ảnh:', err);
            Alert.alert('Lỗi xử lý ảnh', (err as Error).message);
          }
        }
      } else {
        console.log("📸 [packageService] No images to upload");
      }

      const res = await api.post("api/package/provider-create-package", formData, {
        timeout: 60000, // 60 seconds
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    } catch (e: any) {
      console.error("createPackage failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },
  async getPackagesByUserId(
    params: {
      pageNumber?: number;
      pageSize?: number;
      search?: string;
      sortField?: string;
      sortOrder?: "ASC" | "DESC";
      status?: string;
    } = {}
  ) {
    try {
      const res = await api.get("api/package/get-packages-by-user", { params });
      return res.data;
    } catch (e: any) {
      console.error("getPackagesByUserId failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },
  async getMyPendingPackages(pageNumber = 1, pageSize = 10) {
    try {
      const res = await api.get("api/package/get-my-pending-packages", {
        params: { pageNumber, pageSize },
      });
      return res.data;
    } catch (e: any) {
      console.error("getMyPendingPackages failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },

  async getPackageById(packageId: string) {
    try {
      const res = await api.get(`api/package/get-package-by-id/${packageId}`);
      return res.data;
    } catch (e: any) {
      console.error("getPackageById failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },

  async updatePackage(payload: any) {
    try {
      console.log("📦 [packageService.updatePackage] Payload:", payload);
      
      const dto = {   
        PackageId: payload.packageId || payload.PackageId,
        Title: payload.title || payload.Title,
        Description: payload.description || payload.Description,
        Quantity: payload.quantity || payload.Quantity,
        Unit: payload.unit || payload.Unit,
        WeightKg: payload.weightKg || payload.WeightKg,
        VolumeM3: payload.volumeM3 || payload.VolumeM3,
        // Boolean fields - KHÔNG dùng || vì false || false = false (đúng), nhưng cần ?? để handle undefined
        IsFragile: payload.isFragile ?? payload.IsFragile ?? false,
        IsLiquid: payload.isLiquid ?? payload.IsLiquid ?? false,
        IsRefrigerated: payload.isRefrigerated ?? payload.IsRefrigerated ?? false,
        IsFlammable: payload.isFlammable ?? payload.IsFlammable ?? false,
        IsHazardous: payload.isHazardous ?? payload.IsHazardous ?? false,
        IsBulky: payload.isBulky ?? payload.IsBulky ?? false,
        IsPerishable: payload.isPerishable ?? payload.IsPerishable ?? false,
        OtherRequirements:
          payload.otherRequirements ?? payload.OtherRequirements ?? "",
      };
      
      console.log("📦 [packageService.updatePackage] DTO to send:", dto);
      const res = await api.put("api/package/update-package", dto);
      console.log("✅ [packageService.updatePackage] Response:", res.data);
      return res.data;
    } catch (e: any) {
      console.error("updatePackage failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },

  async deletePackage(packageId: string) {
    try {
      const res = await api.delete(`api/package/delete-package/${packageId}`);
      return res.data;
    } catch (e: any) {
      console.error("deletePackage failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },
};

export default packageService;
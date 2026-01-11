import api from "@/config/api";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

export interface CreateAssignmentPayload {
  tripId: string
  driverId: string
  type: number // 0 PRIMARY, 1 SECONDARY
  baseAmount: number
  bonusAmount?: number
  startLocation: { address: string; latitude: number; longitude: number }
  endLocation: { address: string; latitude: number; longitude: number }
}

export interface CreateAssignmentByPostTripDTO {
  postTripId: string
  postTripDetailId: string
  startLocation: string | null | { address: string; latitude: number; longitude: number }
  endLocation: string | null | { address: string; latitude: number; longitude: number }
}

const normalizeMimeType = (value?: string) => {
  const v = (value || "image/jpeg").trim();
  if (v.length === 0) return "image/jpeg";
  if (v.includes("/")) return v;
  // If type is just "jpeg" or "png", convert to "image/jpeg" etc.
  return `image/${v}`;
};

const extensionFromMime = (mimeType: string) => {
  const m = (mimeType || "").toLowerCase();
  if (m.includes("png")) return "png";
  if (m.includes("webp")) return "webp";
  if (m.includes("heic") || m.includes("heif")) return "heic";
  return "jpg";
};

const ensureFileName = (value: string | undefined, fallback: string) => {
  const name = (value || "").trim();
  return name.length > 0 ? name : fallback;
};

const appendEvidenceImage = async (
  formData: FormData,
  evidenceImage: any,
  fallbackPrefix: string
) => {
  const uri: string | undefined = evidenceImage?.imageURL || evidenceImage?.uri;
  if (!uri) throw new Error("Invalid image format");

  const mimeType = normalizeMimeType(evidenceImage?.type || evidenceImage?.mimeType);
  const ext = extensionFromMime(mimeType);
  let fileName = ensureFileName(
    evidenceImage?.fileName || evidenceImage?.name,
    `${fallbackPrefix}-${Date.now()}.${ext}`
  );
  if (!fileName.includes(".")) fileName = `${fileName}.${ext}`;

  if (uri.startsWith("data:")) {
    if (Platform.OS === "web") {
      const resp = await fetch(uri);
      const blob = await resp.blob();
      // @ts-ignore
      formData.append("EvidenceImage", blob, fileName);
      return;
    }

    const base64Data = uri.split(",")[1];
    if (!base64Data) throw new Error("Invalid base64 image");

    const baseDir =
      (FileSystem as any).cacheDirectory ??
      (FileSystem as any).documentDirectory ??
      "";
    const tempUri = baseDir + fileName;

    await FileSystem.writeAsStringAsync(tempUri, base64Data, {
      encoding: (FileSystem as any).EncodingType?.Base64 ?? "base64",
    });

    const rnFile: any = { uri: tempUri, name: fileName, type: mimeType };
    // @ts-ignore
    formData.append("EvidenceImage", rnFile);
    return;
  }

  if (uri.startsWith("content://") && Platform.OS !== "web") {
    const baseDir =
      (FileSystem as any).cacheDirectory ??
      (FileSystem as any).documentDirectory ??
      "";
    const tempUri = baseDir + fileName;
    try {
      await FileSystem.copyAsync({ from: uri, to: tempUri });
      const rnFile: any = { uri: tempUri, name: fileName, type: mimeType };
      // @ts-ignore
      formData.append("EvidenceImage", rnFile);
      return;
    } catch (e) {
      // Fall through and try content:// directly
      console.warn(
        "⚠️ [assignmentService] copyAsync failed, falling back to content://",
        e
      );
    }
  }

  if (
    uri.startsWith("file://") ||
    uri.startsWith("content://") ||
    uri.startsWith("/")
  ) {
    const rnFile: any = { uri, name: fileName, type: mimeType };
    // @ts-ignore
    formData.append("EvidenceImage", rnFile);
    return;
  }

  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    const resp = await fetch(uri);
    const blob = await resp.blob();
    // @ts-ignore
    formData.append("EvidenceImage", blob, fileName);
    return;
  }

  throw new Error("Unsupported image URI");
};

const assignmentService = {
  async assignDriverByOwner(payload: CreateAssignmentPayload) {
    try {
      const res = await api.post('api/TripDriverAssignments/assign-driver-by-owner', {
        tripId: payload.tripId,
        driverId: payload.driverId,
        type: payload.type,
        baseAmount: payload.baseAmount,
        bonusAmount: payload.bonusAmount,
        // Backend expects StartLocation/EndLocation as strings (address).
        StartLocation: (payload.startLocation && typeof payload.startLocation === 'string') ? payload.startLocation : (payload.startLocation?.address ?? ''),
        EndLocation: (payload.endLocation && typeof payload.endLocation === 'string') ? payload.endLocation : (payload.endLocation?.address ?? '')
      })
      return res.data
    } catch (e: any) {
      if (e?.response?.data) return e.response.data
      throw e
    }
  }
  ,
  async applyByPostTrip(payload: CreateAssignmentByPostTripDTO) {
    try {
      // Handle custom locations: null means use backend default, string means custom address
      let startLoc = null
      let endLoc = null
      
      if (payload.startLocation) {
        if (typeof payload.startLocation === 'string') {
          startLoc = payload.startLocation
        } else if ((payload.startLocation as any).address) {
          startLoc = (payload.startLocation as any).address
        }
      }
      
      if (payload.endLocation) {
        if (typeof payload.endLocation === 'string') {
          endLoc = payload.endLocation
        } else if ((payload.endLocation as any).address) {
          endLoc = (payload.endLocation as any).address
        }
      }
      
      const res = await api.post('api/TripDriverAssignments/apply-post-trip', {
        postTripId: payload.postTripId,
        postTripDetailId: payload.postTripDetailId,
        StartLocation: startLoc,
        EndLocation: endLoc
      })
      return res.data
    } catch (e: any) {
      if (e?.response?.data) return e.response.data
      throw e
    }
  }
  ,
  async driverCheckIn(tripId: string, latitude: number, longitude: number, currentAddress: string, evidenceImage: any) {
    try {
      const formData = new FormData()
      formData.append('TripId', tripId)
      formData.append('Latitude', String(latitude))
      formData.append('Longitude', String(longitude))
      if (currentAddress) formData.append('CurrentAddress', currentAddress)

      await appendEvidenceImage(formData, evidenceImage, "checkin");
      
      const res = await api.post('api/TripDriverAssignments/check-in', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return res.data
    } catch (e: any) {
      if (e?.response?.data) return e.response.data
      throw e
    }
  },

  async driverCheckOut(tripId: string, latitude: number, longitude: number, currentAddress: string, evidenceImage: any) {
    try {
      const formData = new FormData()
      formData.append('TripId', tripId)
      formData.append('Latitude', String(latitude))
      formData.append('Longitude', String(longitude))
      if (currentAddress) formData.append('CurrentAddress', currentAddress)

      await appendEvidenceImage(formData, evidenceImage, "checkout");
      
      const res = await api.post('api/TripDriverAssignments/check-out', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return res.data
    } catch (e: any) {
      if (e?.response?.data) return e.response.data
      throw e
    }
  }
}

export default assignmentService

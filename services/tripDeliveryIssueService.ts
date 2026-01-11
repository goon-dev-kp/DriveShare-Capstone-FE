import api from "@/config/api";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

export enum DeliveryIssueType {
  DAMAGED = "DAMAGED",
  LOST = "LOST",
  LATE = "LATE",
  WRONG_ITEM = "WRONG_ITEM",
}

export interface TripDeliveryIssueCreateDTO {
  TripId: string;
  DeliveryRecordId?: string;
  IssueType: DeliveryIssueType;
  Description: string;
}

type IssueImage = {
  uri: string;
  imageURL: string;
  fileName: string;
  type: string;
};

const normalizeMimeType = (value?: string) => {
  const v = value || "image/jpeg";
  return v.includes("/") ? v : `image/${v}`;
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

const dataUrlToBlob = async (dataUrl: string) => {
  // Web-only helper: convert data URL to Blob
  try {
    const resp = await fetch(dataUrl);
    return await resp.blob();
  } catch (err) {
    // Fallback for older browsers
    const base64Marker = ";base64,";
    const parts = dataUrl.split(base64Marker);
    const contentType = dataUrl.substring(
      dataUrl.indexOf(":") + 1,
      dataUrl.indexOf(";")
    );
    const raw = atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  }
};

const appendIssueImage = async (
  formData: FormData,
  fieldName: string,
  image: Partial<IssueImage>,
  index: number
) => {
  const uri = image.imageURL || image.uri;
  if (!uri) return;

  const mimeType = normalizeMimeType(image.type);
  const ext = extensionFromMime(mimeType);
  let fileName = ensureFileName(
    image.fileName,
    `issue_${Date.now()}_${index}.${ext}`
  );
  if (!fileName.includes(".")) fileName = `${fileName}.${ext}`;

  if (uri.startsWith("data:")) {
    if (Platform.OS === "web") {
      const blob = await dataUrlToBlob(uri);
      // @ts-ignore
      formData.append(fieldName, blob, fileName);
      return;
    }

    // Mobile (base64): write to temp file then attach as rnFile
    const base64Data = uri.split(",")[1];
    if (!base64Data) return;

    const baseDir =
      (FileSystem as any).cacheDirectory ??
      (FileSystem as any).documentDirectory ??
      "";
    const tempUri = baseDir + fileName;

    await FileSystem.writeAsStringAsync(tempUri, base64Data, {
      encoding: (FileSystem as any).EncodingType?.Base64 ?? "base64",
    });

    const rnFile: any = {
      uri: tempUri,
      name: fileName,
      type: mimeType,
    };
    console.log("📎 [TripDeliveryIssue] append data: image", {
      name: rnFile.name,
      type: rnFile.type,
      uriPrefix: String(rnFile.uri).slice(0, 20),
    });
    // @ts-ignore
    formData.append(fieldName, rnFile);
    return;
  }

  if (uri.startsWith("content://") && Platform.OS !== "web") {
    // On Android some servers/multipart impls can't read content:// directly.
    // Copy to cache and upload the file:// uri.
    const baseDir =
      (FileSystem as any).cacheDirectory ??
      (FileSystem as any).documentDirectory ??
      "";
    const tempUri = baseDir + fileName;
    try {
      await FileSystem.copyAsync({ from: uri, to: tempUri });
      const rnFile: any = { uri: tempUri, name: fileName, type: mimeType };
      console.log("📎 [TripDeliveryIssue] append content:// (copied)", {
        name: rnFile.name,
        type: rnFile.type,
        uriPrefix: String(rnFile.uri).slice(0, 20),
      });
      // @ts-ignore
      formData.append(fieldName, rnFile);
      return;
    } catch (e) {
      console.warn(
        "⚠️ [TripDeliveryIssue] copyAsync failed, falling back to content://",
        e
      );
      // Fall through to try uploading content:// directly
    }
  }

  if (uri.startsWith("file://") || uri.startsWith("content://") || uri.startsWith("/")) {
    const rnFile: any = { uri, name: fileName, type: mimeType };
    console.log("📎 [TripDeliveryIssue] append file/content image", {
      name: rnFile.name,
      type: rnFile.type,
      uriPrefix: String(rnFile.uri).slice(0, 20),
    });
    // @ts-ignore
    formData.append(fieldName, rnFile);
    return;
  }

  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    const resp = await fetch(uri);
    const blob = await resp.blob();
    // @ts-ignore
    formData.append(fieldName, blob, fileName);
    return;
  }
};

const tripDeliveryIssueService = {
  async reportIssue(dto: TripDeliveryIssueCreateDTO, images: IssueImage[]) {
    try {
      const formData = new FormData();
      
      // Append DTO fields
      formData.append("TripId", dto.TripId);
      if (dto.DeliveryRecordId) {
        formData.append("DeliveryRecordId", dto.DeliveryRecordId);
      }
      formData.append("IssueType", dto.IssueType);
      formData.append("Description", dto.Description);
      
      // Append image files (same approach as item/package upload)
      for (let i = 0; i < images.length; i++) {
        await appendIssueImage(formData, "Images", images[i], i);
      }

      console.log("📤 Driver sending FormData with", images.length, "images");
      const res = await api.post("api/TripDeliveryIssue/create", formData, {
        timeout: 60000,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data;
    } catch (e: any) {
      console.error("reportIssue failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },

  async reportIssueByContact(
    dto: TripDeliveryIssueCreateDTO,
    images: IssueImage[],
    accessToken: string
  ) {
    try {
      const formData = new FormData();
      
      // Append DTO fields
      formData.append("TripId", dto.TripId);
      if (dto.DeliveryRecordId) {
        formData.append("DeliveryRecordId", dto.DeliveryRecordId);
      }
      formData.append("IssueType", dto.IssueType);
      formData.append("Description", dto.Description);
      
      // Append image files (same approach as item/package upload)
      for (let i = 0; i < images.length; i++) {
        await appendIssueImage(formData, "Images", images[i], i);
      }

      console.log("📤 Contact sending FormData with", images.length, "images");
      const res = await api.post(
        `api/TripDeliveryIssue/contact-report?accessToken=${accessToken}`,
        formData,
        {
          timeout: 60000,
        headers: {
          "Content-Type": "multipart/form-data",
        },
        }
      );
      return res.data;
    } catch (e: any) {
      console.error("reportIssueByContact failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },

  async uploadIssueImage(imageUri: string): Promise<string> {
    try {
      // Create form data for image upload
      const formData = new FormData();
      const fileName = imageUri.split("/").pop() || "image.jpg";
      const fileType = fileName.split(".").pop() || "jpg";

      formData.append("file", {
        uri: imageUri,
        name: fileName,
        type: `image/${fileType}`,
      } as any);

      // Upload to your image service endpoint
      const res = await api.post("api/upload/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      return res.data.data.imageUrl || res.data.imageUrl;
    } catch (e: any) {
      console.error("uploadIssueImage failed", e);
      if (e.response) console.error("response", e.response.data);
      throw e;
    }
  },
};

export default tripDeliveryIssueService;

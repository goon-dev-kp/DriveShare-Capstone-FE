import api from '@/config/api'
import { Item, ResponseDTO } from '@/models/types'
import { Alert } from 'react-native'
import { Platform } from 'react-native';
// DÒNG ĐÃ SỬA:
import * as FileSystem from 'expo-file-system/legacy';
interface PaginatedResult<T = any> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

const itemService = {
  // Get items by user ID with search, sort, and status filter
  async getItemsByUserId(params: {
    pageNumber?: number
    pageSize?: number
    search?: string
    sortBy?: string
    sortOrder?: 'ASC' | 'DESC'
    status?: string
  } = {}) {
    const res = await api.get(`api/item/get-items-by-user-id`, { params })
    return res.data as ResponseDTO<PaginatedResult<any>>
  },

  async getItemById(itemId: string) {
    const res = await api.get(`api/item/get-item-by-id/${itemId}`)
    return res.data as ResponseDTO<Item>
  },


async createItem(payload: any) {
  try {
    const form = new FormData()

    // 1. Thêm các trường dữ liệu
    const getField = (pascal: string, camel: string) => (payload[pascal] ?? payload[camel])

    form.append('ItemName', String(getField('ItemName', 'itemName') ?? ''))
    form.append('Description', String(getField('Description', 'description') ?? ''))
    form.append('DeclaredValue', String(getField('DeclaredValue', 'declaredValue') ?? 0))
    form.append('Currency', String(getField('Currency', 'currency') ?? 'VND'))
    form.append('Price', String(getField('Price', 'price') ?? 0))
    // New inventory fields
    form.append('Quantity', String(getField('Quantity', 'quantity') ?? 1))
    form.append('Unit', String(getField('Unit', 'unit') || 'pcs'))

    // 2. Thêm hình ảnh
    const imagesRaw: any[] = payload.ItemImages ?? payload.images ?? []

    // helper: convert data URL to Blob (CHỈ DÙNG CHO WEB)
    const dataUrlToBlob = async (dataUrl: string) => {
      // (Hàm này giữ nguyên, nó dùng cho web)
      try {
        const resp = await fetch(dataUrl)
        return await resp.blob()
      } catch (err) {
        try {
          const base64Marker = ';base64,'
          const parts = dataUrl.split(base64Marker)
          const contentType = dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'))
          const raw = atob(parts[1])
          const rawLength = raw.length
          const uInt8Array = new Uint8Array(rawLength)
          for (let i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i)
          }
          return new Blob([uInt8Array], { type: contentType })
        } catch (e) {
          console.warn('Không thể chuyển dataURL sang Blob', e)
          throw e
        }
      }
    }

    for (let i = 0; i < imagesRaw.length; i++) {
      const img = imagesRaw[i] 

      // Lấy URI (fallback sang itemImageURL nếu uri là null)
      let uri: string | undefined
      if (typeof img === 'string') uri = img
      else if (typeof img === 'object') uri = img.uri ?? img.itemImageURL
      
      console.log(`>>> [createItem] Đang xử lý ảnh URI: ${uri ? uri.substring(0, 30) + '...' : 'null'}`)
      
      if (!uri) {
        console.warn('Bỏ qua ảnh không hợp lệ (không tìm thấy URI):', img)
        continue
      }

      try {
        if (uri.startsWith('data:')) {
          // ==========================
          // === L LUỒNG (data:) ===
          // ==========================
          
          if (Platform.OS === 'web') {
            // === LUỒNG WEB ===
            console.log('>>> [createItem] Đang xử lý data:URL trên WEB');
            const blob = await dataUrlToBlob(uri)
            const fileName = img.fileName || `photo-${Date.now()}-${i}.jpg`
            // @ts-ignore
            form.append('ItemImages', blob, fileName)

          } else {
            // === LUỒNG MOBILE (iOS-Edit) ===
            console.log('>>> [createItem] Đang xử lý data:URL trên MOBILE (iOS-Edit)');
            
            // Tách phần base64 ra
            const base64Data = uri.split(',')[1];
            
            // Lấy tên file và type
            const fileName = img.fileName || `photo-${Date.now()}.jpg`;
            const mimeType = img.type || 'image/jpeg';

            // Tạo file tạm
            // Access cacheDirectory via any cast to avoid TS typing issues; fall back to documentDirectory if needed.
            const baseDir = (FileSystem as any).cacheDirectory ?? (FileSystem as any).documentDirectory ?? '';
            const tempUri = baseDir + fileName;
            
            // Ghi dữ liệu base64 vào file tạm
                        await FileSystem.writeAsStringAsync(tempUri, base64Data, {
                            // Some versions of expo-file-system don't export EncodingType on the module type;
                            // cast to any to avoid the TypeScript error and fall back to the literal 'base64'.
                            encoding: (FileSystem as any).EncodingType?.Base64 ?? 'base64',
                        });

            // Build object file
            const rnFile: any = {
                uri: tempUri, // Dùng file: URI của file tạm
                name: fileName,
                type: mimeType,
            }


            
            // @ts-ignore
            form.append('ItemImages', rnFile);
          }
        
        } else if (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('/')) {
          // ==================================
          // === LUỒNG MOBILE (file:) (Android/iOS-No-Edit) ===
          // ==================================
          
          const fileName = img.fileName || `photo-${Date.now()}-${i}.jpg`;
          const mimeType = img.type || 'image/jpeg';

          const rnFile: any = {
            uri: uri,
            name: fileName,
            type: mimeType,
          }

          const debugFile = JSON.stringify(rnFile, null, 2);
          Alert.alert(
            '>>> [createItem] ĐANG APPEND FILE MOBILE (file://):', 
            debugFile
          );
          
          // @ts-ignore
          form.append('ItemImages', rnFile)

        } else if (uri.startsWith('http://') || uri.startsWith('https://')) {
          // ===========================
          // === LUỒNG URL (http:) ===
          // ===========================
          try {
            const resp = await fetch(uri)
            const blob = await resp.blob()
            const fileName = img.fileName || `photo-${Date.now()}-${i}.jpg`
            // @ts-ignore
            form.append('ItemImages', blob, fileName)
          } catch (e) {
            console.warn('Không thể tải ảnh từ URL:', uri, e)
          }

        } else {
          console.warn('Định dạng URI ảnh không được hỗ trợ:', uri)
        }
      } catch (err) {
        console.warn('Lỗi khi xử lý ảnh:', err)
        Alert.alert('Lỗi xử lý ảnh', (err as Error).message); // Thêm Alert lỗi ở đây
      }
    }

    // 4. Gửi request với timeout cao hơn (60s)
    const res = await api.post('api/item/provider-create-item', form, {
      timeout: 60000, // 60 seconds
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    return res.data as ResponseDTO

  } catch (e: any) {
    console.error('Lỗi khi tạo item (createItem):', e)
    if (e.response) {
      console.error('Response data:', e.response.data)
      console.error('Response status:', e.response.status)
      Alert.alert('Lỗi Server', `Status: ${e.response.status}`)
    } else if (e.request) {
      console.error('No response received:', e.request)
      Alert.alert('Lỗi Network', 'Không nhận được phản hồi từ server. Kiểm tra kết nối mạng hoặc thử lại sau.')
    } else {
      console.error('Error message:', e.message)
      Alert.alert('Lỗi', e.message)
    }
    throw e
  }
},

  async createItemImage(itemId: string, imageDataUrl: string) {
    // imageDataUrl is expected to be a data URL (data:image/..;base64,...)
    try {
      // convert data URL to Blob (works in browser). In React Native this may not be supported
      const blob = await (async () => {
        if (typeof window !== 'undefined' && imageDataUrl.startsWith('data:')) {
          const res = await fetch(imageDataUrl)
          return await res.blob()
        }
        // Fallback: try to fetch as well (some RN environments support it)
        const res = await fetch(imageDataUrl)
        return await res.blob()
      })()

      const form = new FormData()
      // backend expects fields: ItemId (Guid) and File (IFormFile)
      form.append('ItemId', itemId as any)
      // append file blob with filename
      // @ts-ignore
      form.append('File', blob, 'photo.jpg')

      // Let axios/browser set Content-Type including the multipart boundary
      const res = await api.post('api/itemimages/Create-ItemImage', form)
      return res.data as ResponseDTO
    } catch (e: any) {
      console.warn('createItemImage failed', e)
      throw e
    }
  },

  async updateItem(payload: any) {
    const res = await api.put('api/item/update-item', payload)
    return res.data as ResponseDTO
  },

  async deleteItem(itemId: string) {
    const res = await api.delete(`api/item/delete-item/${itemId}`)
    return res.data as ResponseDTO
  },
}

export default itemService

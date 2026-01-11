import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // Đảm bảo đã cài expo-linear-gradient

// Global type declarations for VNPT SDK
declare global {
  interface Window {
    SDK?: {
      launch: (config: any) => void;
    };
  }
}

interface VnptSdkConfig {
  accessToken: string;
  tokenId: string;
  tokenKey: string;
}

interface WebCccdScannerProps {
  config: VnptSdkConfig;
  onResult: (result: any) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
  style?: ViewStyle;
}

// --- LOGIC GIỮ NGUYÊN ---
let isSdkScriptsLoading = false;
let sdkScriptsLoadedPromise: Promise<void> | null = null;

const loadVnptSdkScripts = async () => {
    if (window.SDK) return;
    if (isSdkScriptsLoading && sdkScriptsLoadedPromise) return sdkScriptsLoadedPromise;

    console.log("🚀 Bắt đầu tải VNPT SDK scripts...");
    isSdkScriptsLoading = true;

    sdkScriptsLoadedPromise = new Promise(async (resolve, reject) => {
        try {
            const scripts = [
                '/js/dist/lib/VNPTQRBrowserApp.js',
                '/js/dist/lib/VNPTBrowserSDKAppV4.0.0.js',
                '/js/dist/web-sdk-version-3.2.0.0.js',
            ];

            for (const src of scripts) {
                if (document.querySelector(`script[src="${src}"]`)) continue;
                const script = document.createElement('script');
                script.src = src;
                script.async = false;
                script.defer = true;
                document.body.appendChild(script);

                await new Promise((res, rej) => {
                    script.onload = () => res(null);
                    script.onerror = () => rej(new Error(`Không thể tải script: ${src}`));
                });
            }
            await new Promise(r => setTimeout(r, 500));
            if (!window.SDK) throw new Error("Scripts đã tải nhưng window.SDK không tồn tại.");
            resolve();
        } catch (error) {
            sdkScriptsLoadedPromise = null;
            reject(error);
        } finally {
            isSdkScriptsLoading = false;
        }
    });
    return sdkScriptsLoadedPromise;
};

// --- COMPONENT CHÍNH ---
const WebCccdScanner: React.FC<WebCccdScannerProps> = ({ config, onResult, onError, onCancel, style }) => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Đang khởi tạo hệ thống...');
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    // WORKAROUND: Intercept cả fetch và XMLHttpRequest để block upload
    const originalFetch = window.fetch;
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    // Intercept fetch - SDK có thể đọc hash từ nhiều nơi khác nhau
    window.fetch = async function(...args: any[]) {
      const [url] = args;
      if (typeof url === 'string' && url.includes('/file-service/v1/addFile')) {
        console.log('🚫 Blocked fetch to VNPT:', url);
        const timestamp = Date.now();
        const mockHash = 'mock-hash-' + timestamp;
        
        // Try many possible structures that SDK might expect
        const mockData = { 
          code: '00',
          msg: 'Success',
          message: 'Success',
          hash: mockHash,
          file_hash: mockHash,
          fileHash: mockHash,
          data: { 
            fileId: 'mock-file-' + timestamp,
            file_id: 'mock-file-' + timestamp,
            hash: mockHash,
            file_hash: mockHash,
            fileHash: mockHash,
            url: 'data:image/png;base64,mock',
            image_url: 'data:image/png;base64,mock'
          },
          result: {
            hash: mockHash,
            fileId: 'mock-file-' + timestamp
          }
        };
        
        console.log('📦 Mock response structure:', JSON.stringify(mockData, null, 2));
        
        // Create proper Response object with reusable json()
        let jsonCalled = false;
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => {
            console.log('📦 SDK called response.json()', jsonCalled ? '(again)' : '(first time)');
            jsonCalled = true;
            return mockData;
          },
          text: async () => JSON.stringify(mockData),
          blob: async () => new Blob([JSON.stringify(mockData)], { type: 'application/json' }),
          headers: new Headers({ 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }),
          redirected: false,
          type: 'basic',
          url: url
        } as Response;
      }
      return originalFetch.apply(this, args as any);
    };
    
    // Intercept XMLHttpRequest
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...rest: any[]) {
      const urlStr = typeof url === 'string' ? url : url.toString();
      if (urlStr.includes('/file-service/v1/addFile')) {
        console.log('🚫 Blocked XHR to VNPT:', urlStr);
        (this as any)._intercepted = true;
      }
      return originalXHROpen.call(this, method, urlStr, ...rest);
    };
    
    XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
      if ((this as any)._intercepted) {
        console.log('🚫 Blocked XHR send to VNPT');
        setTimeout(() => {
          Object.defineProperty(this, 'status', { value: 200, writable: false });
          Object.defineProperty(this, 'statusText', { value: 'OK', writable: false });
          Object.defineProperty(this, 'readyState', { value: 4, writable: false });
          Object.defineProperty(this, 'responseText', { 
            value: JSON.stringify({ 
              code: '00',
              message: 'Success',
              hash: 'mock-hash-' + Date.now(),
              data: { 
                fileId: 'mock-file-' + Date.now(),
                hash: 'mock-hash-' + Date.now()
              }
            }), 
            writable: false 
          });
          this.dispatchEvent(new Event('load'));
          if (this.onload) this.onload(new Event('load') as any);
        }, 100);
        return;
      }
      return originalXHRSend.call(this, body);
    };
    
    const initSdk = async () => {
      try {
        if (!config.accessToken) throw new Error("Thiếu Access Token");
        if (isMounted.current) setStatus('Đang tải tài nguyên AI...');
        
        await loadVnptSdkScripts();
        if (!isMounted.current) return;
        if (!window.SDK) throw new Error("SDK không phản hồi.");

        if (isMounted.current) setStatus('Kết nối máy chủ eKYC...');
        
        const dataConfig = {
          CALL_BACK_END_FLOW: (result: any) => {
            console.log('✅ VNPT SDK Result:', result);
            if (isMounted.current) onResult(result);
          },
          HAS_BACKGROUND_IMAGE: false,
          MAX_SIZE_IMAGE: 1,
          LIST_TYPE_DOCUMENT: [-1, 4, 5, 6, 7],
          // Thử config khác để tắt upload
          IS_UPLOAD_IMAGE: false,
          IS_SAVE_IMAGE: false, 
          RETURN_BASE64: true,
          // Thêm config mới
          AUTO_CAPTURE: false, // Không tự động capture
          IS_CHECK_FACE: false, // Không check face để tránh upload
          IS_LIVENESS: false, // Không check liveness
        };

        if (isMounted.current) {
            setLoading(false);
            window.SDK.launch(dataConfig);
        }
      } catch (err: any) {
        if (isMounted.current) {
            setLoading(false);
            onError(err.message || 'Lỗi khởi tạo eKYC');
        }
      }
    };
    const timer = setTimeout(initSdk, 300);
    return () => {
      isMounted.current = false;
      clearTimeout(timer);
      try {
        const container = document.getElementById("ekyc_sdk_intergrated");
        if (container) container.innerHTML = "";
      } catch (e) {}
    };
  }, [config]);

  return (
    <View style={[styles.wrapper, style]}>
      {/* Header nhẹ nhàng với Gradient */}
      <LinearGradient
        colors={['#FFFFFF', '#F0F9FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
            <View style={styles.indicator} />
            <Text style={styles.headerTitle}>Máy quét thông minh</Text>
        </View>
        <View style={styles.badge}>
            <Text style={styles.badgeText}>AI POWERED</Text>
        </View>
      </LinearGradient>

      <View style={styles.cameraContainer}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0EA5E9" />
            <Text style={styles.loadingText}>{status}</Text>
          </View>
        )}

        {Platform.OS === 'web' ? (
            // @ts-ignore
            <div 
                id="ekyc_sdk_intergrated" 
                style={{ 
                    width: '100%', 
                    height: '100%', 
                    backgroundColor: '#000',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }} 
            />
        ) : (
            <Text style={{color: 'red', padding: 20}}>Chỉ hỗ trợ trên Web</Text>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
            Vui lòng giữ giấy tờ nằm trọn trong khung hình
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    height: 620,
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: "#0EA5E9",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F9FF',
  },
  headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
  },
  indicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#22C55E', // Green dot
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  badgeText: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '800',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#1E293B',
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: '500',
    color: '#64748B',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F9FF',
  },
  footerText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  }
});

export default WebCccdScanner;
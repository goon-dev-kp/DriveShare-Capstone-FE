/**
 * SignalR Tracking Service
 * Real-time Location Tracking với SignalR Hub
 * Hỗ trợ Driver (Publisher) và Viewer (Subscriber)
 */

import * as SignalR from '@microsoft/signalr';
import { getToken } from '@/utils/token';

export interface LocationUpdate {
  lat: number;
  lng: number;
  bearing: number;
  speed: number;
  driverName?: string;
  updatedAt?: string;
}

export interface SignalRConfig {
  baseURL: string; // Base API URL (e.g., http://192.168.100.49:5246/)
  onReceiveLocation?: (location: LocationUpdate) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: any) => void;
  disabled?: boolean; // Disable SignalR for simulation-only testing
}

class SignalRTrackingService {
  private connection: SignalR.HubConnection | null = null;
  private baseURL: string = '';
  private onReceiveLocation?: (location: LocationUpdate) => void;
  private onConnectionChange?: (connected: boolean) => void;
  private onError?: (error: any) => void;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 999; // Vô hạn retry
  private manualReconnectTimer?: ReturnType<typeof setInterval>;
  private currentTripId?: string; // Track current trip for manual reconnect

  /**
   * Initialize SignalR Connection
   */
  public async init(config: SignalRConfig): Promise<void> {
    if (config.disabled) {
      console.log('[SignalR] Disabled - Simulation mode only');
      return;
    }

    // Prevent duplicate initialization
    if (this.connection) {
      // If already connected, just update callbacks
      if (this.connection.state === SignalR.HubConnectionState.Connected) {
        console.log('[SignalR] Already connected, updating callbacks only');
        this.onReceiveLocation = config.onReceiveLocation;
        this.onConnectionChange = config.onConnectionChange;
        this.onError = config.onError;
        return;
      }
      // If not connected but connection exists, log warning
      console.warn('[SignalR] Connection exists but not connected, state:', this.connection.state);
      return;
    }

    this.baseURL = config.baseURL.replace(/\/$/, ''); // Remove trailing slash
    this.onReceiveLocation = config.onReceiveLocation;
    this.onConnectionChange = config.onConnectionChange;
    this.onError = config.onError;

    try {
      const token = await getToken();
      
      const hubURL = `${this.baseURL}/hubs/tracking`;
      console.log('[SignalR] Connecting to:', hubURL);

      this.connection = new SignalR.HubConnectionBuilder()
        .withUrl(hubURL, {
          accessTokenFactory: () => token || '',
          transport: SignalR.HttpTransportType.WebSockets | SignalR.HttpTransportType.LongPolling,
          skipNegotiation: false,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            // Exponential backoff: 2s, 4s, 8s, 15s, 30s (max)
            if (retryContext.previousRetryCount < 3) {
              return 2000 * Math.pow(2, retryContext.previousRetryCount); // 2s, 4s, 8s
            } else if (retryContext.previousRetryCount < 6) {
              return 15000; // 15s for attempts 3-5
            } else {
              return 30000; // 30s for attempts 6+
            }
          },
        })
        .configureLogging(SignalR.LogLevel.Information)
        .build();

      // Event handlers (using arrow functions to preserve 'this' context)
      this.connection.onclose((error) => {
        console.warn('[SignalR] Connection closed:', error?.message);
        if (this.onConnectionChange) {
          this.onConnectionChange(false);
        }
        
        // Start manual reconnect timer as backup
        this.startManualReconnect();
      });

      this.connection.onreconnecting((error) => {
        console.log('[SignalR] Reconnecting...', error?.message);
        this.reconnectAttempts++;
      });

      this.connection.onreconnected((connectionId) => {
        console.log('[SignalR] Reconnected. ConnectionId:', connectionId);
        this.reconnectAttempts = 0;
        this.stopManualReconnect();
        
        // Tự động rejoin trip group sau khi reconnect
        if (this.currentTripId) {
          // Use setTimeout to avoid blocking the reconnected event
          setTimeout(async () => {
            try {
              await this.joinTripGroup(this.currentTripId!);
              console.log('[SignalR] Auto-rejoined trip:', this.currentTripId);
            } catch (err) {
              console.error('[SignalR] Failed to rejoin trip:', err);
            }
          }, 100);
        }
        
        if (this.onConnectionChange) {
          this.onConnectionChange(true);
        }
      });

      // Listen for location updates from server
      this.connection.on('ReceiveLocation', (data: LocationUpdate) => {
        console.log('[SignalR] ReceiveLocation:', data);
        if (this.onReceiveLocation) {
          this.onReceiveLocation(data);
        }
      });

      // Start connection
      await this.connection.start();
      console.log('[SignalR] Connected successfully. ConnectionId:', this.connection.connectionId);
      
      if (this.onConnectionChange) {
        this.onConnectionChange(true);
      }
    } catch (error: any) {
      console.error('[SignalR] Connection failed:', error);
      if (this.onError) {
        this.onError(error);
      }
      throw error;
    }
  }

  /**
   * Join Trip Group (Both Driver & Viewer)
   */
  public async joinTripGroup(tripId: string): Promise<any> {
    if (!this.connection || this.connection.state !== SignalR.HubConnectionState.Connected) {
      throw new Error('[SignalR] Not connected');
    }

    try {
      console.log('[SignalR] Joining trip group:', tripId);
      this.currentTripId = tripId; // Track current trip
      const result = await this.connection.invoke('JoinTripGroup', tripId);
      console.log('[SignalR] Joined trip group:', tripId, 'Result:', result);
      return result;
    } catch (error: any) {
      console.error('[SignalR] Failed to join trip group:', error);
      throw error;
    }
  }

  /**
   * Leave Trip Group
   */
  public async leaveTripGroup(tripId: string): Promise<void> {
    if (!this.connection || this.connection.state !== SignalR.HubConnectionState.Connected) {
      console.warn('[SignalR] Not connected, cannot leave group');
      return;
    }

    try {
      console.log('[SignalR] Leaving trip group:', tripId);
      await this.connection.invoke('LeaveTripGroup', tripId);
      if (this.currentTripId === tripId) {
        this.currentTripId = undefined; // Clear tracked trip
      }
      console.log('[SignalR] Left trip group:', tripId);
    } catch (error: any) {
      console.error('[SignalR] Failed to leave trip group:', error);
    }
  }

  /**
   * Send Location Update (Driver Only)
   */
  public async sendLocationUpdate(
    tripId: string,
    lat: number,
    lng: number,
    bearing: number,
    speed: number
  ): Promise<void> {
    if (!this.connection || this.connection.state !== SignalR.HubConnectionState.Connected) {
      // Silent skip if not connected (normal in simulation-only mode)
      return;
    }

    try {
      await this.connection.invoke('SendLocationUpdate', tripId, lat, lng, bearing, speed);
      console.log(`[SignalR] Sent location: ${lat}, ${lng}, bearing: ${bearing}, speed: ${speed}`);
    } catch (error: any) {
      // Silent fail for CORS errors (expected when testing on web)
      const isCorsError = error?.message?.includes('Failed to fetch') || 
                          error?.message?.includes('CORS') ||
                          error?.message?.includes('Network Error');
      
      if (!isCorsError) {
        console.error('[SignalR] Failed to send location:', error);
        if (this.onError) {
          this.onError(error);
        }
      } else {
        // Just log once for CORS issue (backend needs to enable CORS)
        if (typeof (window as any).__signalr_cors_warned === 'undefined') {
          console.warn('[SignalR] ⚠️ CORS Error - Backend needs to enable CORS for', window.location.origin);
          (window as any).__signalr_cors_warned = true;
        }
      }
    }
  }

  /**
   * Get connection state
   */
  public getState(): string {
    if (!this.connection) return 'Disconnected';
    return SignalR.HubConnectionState[this.connection.state];
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.connection?.state === SignalR.HubConnectionState.Connected;
  }

  /**
   * Disconnect and cleanup
   */
  public async disconnect(): Promise<void> {
    if (!this.connection) return;

    try {
      console.log('[SignalR] Disconnecting...');
      this.stopManualReconnect();
      this.currentTripId = undefined;
      await this.connection.stop();
      this.connection = null;
      console.log('[SignalR] Disconnected');
      
      if (this.onConnectionChange) {
        this.onConnectionChange(false);
      }
    } catch (error: any) {
      console.error('[SignalR] Error during disconnect:', error);
    }
  }

  /**
   * Manual reconnect
   */
  public async reconnect(): Promise<void> {
    if (this.connection && this.connection.state === SignalR.HubConnectionState.Connected) {
      console.log('[SignalR] Already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('[SignalR] Already reconnecting...');
      return;
    }

    this.isConnecting = true;

    try {
      if (!this.connection) {
        throw new Error('[SignalR] No connection to reconnect');
      }
      
      await this.connection.start();
      console.log('[SignalR] Reconnected successfully');
      
      // Rejoin trip if available
      if (this.currentTripId) {
        try {
          await this.joinTripGroup(this.currentTripId);
          console.log('[SignalR] Auto-rejoined trip:', this.currentTripId);
        } catch (joinErr) {
          console.error('[SignalR] Failed to rejoin trip:', joinErr);
          // Don't throw - connection is established, just rejoin failed
        }
      }
      
      if (this.onConnectionChange) {
        this.onConnectionChange(true);
      }
    } catch (error: any) {
      console.error('[SignalR] Reconnect failed:', error);
      if (this.onError) {
        this.onError(error);
      }
      throw error; // Re-throw so caller knows reconnect failed
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Start manual reconnect timer (backup when automatic fails)
   */
  private startManualReconnect = (): void => {
    this.stopManualReconnect();
    
    console.log('[SignalR] Starting manual reconnect timer (30s interval)');
    this.manualReconnectTimer = setInterval(async () => {
      if (!this.isConnected()) {
        console.log('[SignalR] Manual reconnect attempt...');
        try {
          await this.reconnect();
        } catch (err) {
          console.error('[SignalR] Manual reconnect failed:', err);
        }
      } else {
        this.stopManualReconnect();
      }
    }, 30000); // Try every 30s
  }

  /**
   * Stop manual reconnect timer
   */
  private stopManualReconnect = (): void => {
    if (this.manualReconnectTimer) {
      clearInterval(this.manualReconnectTimer);
      this.manualReconnectTimer = undefined;
      console.log('[SignalR] Stopped manual reconnect timer');
    }
  }
}

// Export singleton instance
export const signalRTrackingService = new SignalRTrackingService();

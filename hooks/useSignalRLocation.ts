/**
 * SignalR Location Subscriber Hook
 * Subscribe to real-time location updates for a trip
 * Used by Owner & Provider screens
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { signalRTrackingService, LocationUpdate } from '@/services/signalRTrackingService';

export interface DriverLocation {
  latitude: number;
  longitude: number;
  bearing: number;
  speed: number;
  driverName?: string;
  timestamp: Date;
}

export interface UseSignalRLocationProps {
  tripId: string | undefined;
  enabled?: boolean; // Enable/disable tracking
}

export interface UseSignalRLocationResult {
  location: DriverLocation | null;
  connected: boolean;
  error: string | null;
  reconnect: () => Promise<void>; // Manual reconnect function
}

export function useSignalRLocation({ tripId, enabled = true }: UseSignalRLocationProps): UseSignalRLocationResult {
  const [location, setLocation] = useState<DriverLocation | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (!tripId || !enabled) return;

    // Prevent duplicate initialization
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      try {
        const baseURL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.100.49:5246/';

        // Initialize SignalR connection
        await signalRTrackingService.init({
          baseURL,
          onReceiveLocation: (data: LocationUpdate) => {
            console.log('[useSignalRLocation] Received location:', data);
            setLocation({
              latitude: data.lat,
              longitude: data.lng,
              bearing: data.bearing,
              speed: data.speed,
              driverName: data.driverName,
              timestamp: data.updatedAt ? new Date(data.updatedAt) : new Date(),
            });
          },
          onConnectionChange: (isConnected) => {
            console.log('[useSignalRLocation] Connection status:', isConnected);
            setConnected(isConnected);
            if (!isConnected) {
              setError('Mất kết nối SignalR');
            } else {
              setError(null);
            }
          },
          onError: (err) => {
            console.error('[useSignalRLocation] Error:', err);
            setError(err?.message || 'Lỗi kết nối');
          },
        });

        // Join trip group
        await signalRTrackingService.joinTripGroup(tripId);
        console.log('[useSignalRLocation] Joined trip group:', tripId);
      } catch (err: any) {
        console.error('[useSignalRLocation] Init failed:', err);
        setError(err?.message || 'Không thể kết nối');
      }
    };

    init();

    // Cleanup
    return () => {
      if (tripId) {
        console.log('[useSignalRLocation] Cleanup - leaving trip group');
        signalRTrackingService.leaveTripGroup(tripId);
        signalRTrackingService.disconnect();
        initRef.current = false;
      }
    };
  }, [tripId, enabled]);

  // Manual reconnect function
  const reconnect = useCallback(async () => {
    setError(null);
    try {
      await signalRTrackingService.reconnect();
    } catch (err: any) {
      setError(err?.message || 'Không thể kết nối lại');
    }
  }, []);

  return { location, connected, error, reconnect };
}

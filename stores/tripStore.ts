import { create } from 'zustand'

interface TripDetailCacheState {
  tripDetails: Record<string, any>
  setTripDetail: (tripId: string, detail: any) => void
  getTripDetail: (tripId: string) => any | null
  clear: () => void
}

export const useTripStore = create<TripDetailCacheState>((set, get) => ({
  tripDetails: {},
  setTripDetail: (tripId, detail) => set((s) => ({ tripDetails: { ...s.tripDetails, [tripId]: detail } })),
  getTripDetail: (tripId) => get().tripDetails[tripId] || null,
  clear: () => set({ tripDetails: {} }),
}))

export default useTripStore
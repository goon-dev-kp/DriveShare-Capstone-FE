import { useState, useEffect, useCallback } from 'react'
import tripService from '@/services/tripService'
import { ProviderTripSummary } from '@/models/types'
import { useAuth } from './useAuth'

interface UseProviderTripsResult {
  trips: ProviderTripSummary[]
  total: number
  page: number
  pageSize: number
  loading: boolean
  error: string | null
  search: string
  sortField: string
  sortDirection: 'ASC' | 'DESC'
  statusFilter: string
  setSearch: (search: string) => void
  setSortField: (field: string) => void
  setSortDirection: (direction: 'ASC' | 'DESC') => void
  setStatusFilter: (status: string) => void
  fetchPage: (page: number) => Promise<void>
}

export function useProviderTrips(): UseProviderTripsResult {
  const { user } = useAuth()
  const [trips, setTrips] = useState<ProviderTripSummary[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('tripCode')
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const fetchPage = useCallback(async (pageNum: number) => {
    if (!user?.userId) return
    setLoading(true)
    setError(null)
    try {
      const params: any = {
        pageNumber: pageNum,
        pageSize,
        search: search || undefined,
        sortField,
        sortDirection,
      }
      if (statusFilter !== 'ALL') {
        params.status = statusFilter
      }

      const res: any = await tripService.getTripsByProvider(params)
      const payload = res?.result ?? res
      const items = Array.isArray(payload?.data) ? payload.data : []
      
      // Map backend DTO to ProviderTripSummary
      const mapped: ProviderTripSummary[] = items.map((t: any) => ({
        tripId: t.tripId ?? t.TripId ?? '',
        tripCode: t.tripCode ?? t.TripCode ?? '',
        status: t.status ?? t.Status ?? 'N/A',
        createAt: t.createAt ?? t.CreateAt ?? '',
        updateAt: t.updateAt ?? t.UpdateAt ?? '',
        vehicleModel: t.vehicleModel ?? t.VehicleModel ?? 'N/A',
        vehiclePlate: t.vehiclePlate ?? t.VehiclePlate ?? 'N/A',
        vehicleType: t.vehicleType ?? t.VehicleType ?? 'N/A',
        ownerName: t.ownerName ?? t.OwnerName ?? 'N/A',
        ownerCompany: t.ownerCompany ?? t.OwnerCompany ?? 'N/A',
        startAddress: t.startAddress ?? t.StartAddress ?? 'N/A',
        endAddress: t.endAddress ?? t.EndAddress ?? 'N/A',
        estimatedDuration: t.estimatedDuration ?? t.EstimatedDuration ?? '',
        packageCodes: t.packageCodes ?? t.PackageCodes ?? [],
        driverNames: t.driverNames ?? t.DriverNames ?? [],
        tripRouteSummary: t.tripRouteSummary ?? t.TripRouteSummary ?? '',
      }))

      setTrips(mapped)
      setTotal(payload?.totalCount ?? mapped.length)
      setPage(pageNum)
    } catch (e: any) {
      console.error('[useProviderTrips] fetchPage error:', e)
      setError(e?.message || 'Không thể tải chuyến đi')
    } finally {
      setLoading(false)
    }
  }, [user?.userId, pageSize, search, sortField, sortDirection, statusFilter])

  // ✅ BỎ auto-fetch, chỉ fetch khi được gọi thủ công từ component
  // useEffect(() => {
  //   fetchPage(1)
  // }, [search, sortField, sortDirection, statusFilter])

  return {
    trips,
    total,
    page,
    pageSize,
    loading,
    error,
    search,
    sortField,
    sortDirection,
    statusFilter,
    setSearch,
    setSortField,
    setSortDirection,
    setStatusFilter,
    fetchPage,
  }
}

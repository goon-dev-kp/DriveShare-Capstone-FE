import { useState, useEffect, useCallback } from 'react'
import postPackageService from '@/services/postPackageService'
import { FreightPost } from '@/models/types'
import { useAuth } from './useAuth'

interface UseProviderPostsResult {
  posts: FreightPost[]
  total: number
  page: number
  pageSize: number
  loading: boolean
  error: string | null
  search: string
  sortBy: string
  sortOrder: 'ASC' | 'DESC'
  statusFilter: string
  setSearch: (search: string) => void
  setSortBy: (sortBy: string) => void
  setSortOrder: (order: 'ASC' | 'DESC') => void
  setStatusFilter: (status: string) => void
  fetchPage: (page: number) => Promise<void>
}

export function useProviderPosts(): UseProviderPostsResult {
  const { user } = useAuth()
  const [posts, setPosts] = useState<FreightPost[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('title')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC')
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
        sortBy,
        sortOrder,
      }
      if (statusFilter !== 'ALL') {
        params.status = statusFilter
      }

      const res: any = await postPackageService.getMyPosts(params)
      const payload = res?.result ?? res
      const items = Array.isArray(payload?.data) ? payload.data : []
      
      // Map backend DTO to FreightPost
      const mapped: FreightPost[] = items.map((p: any) => ({
        id: p.postPackageId ?? p.PostPackageId ?? p.id,
        packageId: p.packageId ?? null,
        title: p.title ?? '',
        description: p.description ?? '',
        offeredPrice: p.offeredPrice ?? 0,
        status: p.status ?? 'OPEN',
        shippingRoute: {
          startLocation: (() => {
            const srStart = p.shippingRoute?.startLocation
            if (srStart && typeof srStart === 'object') return srStart.address ?? JSON.stringify(srStart)
            const rootStart = p.startLocation
            if (rootStart && typeof rootStart === 'object') return rootStart.address ?? JSON.stringify(rootStart)
            return (p.startLocation ?? p.StartLocation ?? '')
          })(),
          endLocation: (() => {
            const srEnd = p.shippingRoute?.endLocation
            if (srEnd && typeof srEnd === 'object') return srEnd.address ?? JSON.stringify(srEnd)
            const rootEnd = p.endLocation
            if (rootEnd && typeof rootEnd === 'object') return rootEnd.address ?? JSON.stringify(rootEnd)
            return (p.endLocation ?? p.EndLocation ?? '')
          })(),
          expectedPickupDate: p.shippingRoute?.expectedPickupDate ?? p.expectedPickupDate ?? '',
          expectedDeliveryDate: p.shippingRoute?.expectedDeliveryDate ?? p.expectedDeliveryDate ?? '',
          startTimeToPickup: '09:00',
          endTimeToPickup: '17:00',
          startTimeToDelivery: '09:00',
          endTimeToDelivery: '17:00',
        },
        packageDetails: {
          title: `Gói (${p.packageCount ?? p.PackageCount ?? 0})`,
          description: p.description ?? '',
          quantity: p.packageCount ?? p.PackageCount ?? 0,
          unit: 'piece',
          weightKg: 0,
          volumeM3: 0,
          images: [],
        },
      }))

      setPosts(mapped)
      setTotal(payload?.totalCount ?? mapped.length)
      setPage(pageNum)
    } catch (e: any) {
      console.error('[useProviderPosts] fetchPage error:', e)
      setError(e?.message || 'Không thể tải bài đăng')
    } finally {
      setLoading(false)
    }
  }, [user?.userId, pageSize, search, sortBy, sortOrder, statusFilter])

  // ✅ BỎ auto-fetch, chỉ fetch khi được gọi thủ công từ component
  // useEffect(() => {
  //   fetchPage(1)
  // }, [search, sortBy, sortOrder, statusFilter])

  return {
    posts,
    total,
    page,
    pageSize,
    loading,
    error,
    search,
    sortBy,
    sortOrder,
    statusFilter,
    setSearch,
    setSortBy,
    setSortOrder,
    setStatusFilter,
    fetchPage,
  }
}

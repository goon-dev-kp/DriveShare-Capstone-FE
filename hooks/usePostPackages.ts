import { useCallback, useEffect, useState } from 'react'
import postPackageService from '@/services/postPackageService'
import { FreightPost } from '@/models/types'
import { useAuth } from './useAuth'

export const usePostPackages = (initialPage = 1, initialSize = 20) => {
  const { user } = useAuth()
  const userId = (user as any)?.userId

  const [posts, setPosts] = useState<FreightPost[]>([])
  const [total, setTotal] = useState<number>(0)
  const [page, setPage] = useState<number>(initialPage)
  const [pageSize, setPageSize] = useState<number>(initialSize)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('title')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  const fetchPage = useCallback(async (
    p = page, 
    size = pageSize, 
    searchQuery = search,
    sort = sortBy,
    order = sortOrder
  ) => {
    setLoading(true)
    setError(null)
    try {
      // Use get-open API - không có status filter vì chỉ lấy OPEN posts
      const res = await postPackageService.getOpenPosts({
        pageNumber: p,
        pageSize: size,
        search: searchQuery || undefined,
        sortBy: sort,
        sortOrder: order,
      })
      
      if (res && res.isSuccess && res.result) {
        const result: any = res.result
        const rawPosts: any[] = result.items ?? result.data ?? []
        const totalCount: number = result.totalCount ?? rawPosts.length

        // Map backend DTO to frontend FreightPost interface
        const dataPosts: FreightPost[] = rawPosts.map((p: any) => ({
          id: p.postPackageId ?? p.PostPackageId ?? p.id,
          packageId: p.packageId ?? null,
          title: p.title ?? '',
          description: p.description ?? '',
          offeredPrice: p.offeredPrice ?? 0,
          providerId: p.providerId ?? p.ProviderId ?? undefined,
          shippingRouteId: p.shippingRouteId ?? p.ShippingRouteId ?? undefined,
          status: p.status ?? 'OPEN',
          shippingRoute: {
            startLocation: (() => {
              const srStart = p.shippingRoute?.startLocation
              if (srStart && typeof srStart === 'object') return srStart.address ?? JSON.stringify(srStart)
              const rootStart = p.startLocation
              if (rootStart && typeof rootStart === 'object') return rootStart.address ?? JSON.stringify(rootStart)
              return p.startLocation ?? p.StartLocation ?? ''
            })(),
            endLocation: (() => {
              const srEnd = p.shippingRoute?.endLocation
              if (srEnd && typeof srEnd === 'object') return srEnd.address ?? JSON.stringify(srEnd)
              const rootEnd = p.endLocation
              if (rootEnd && typeof rootEnd === 'object') return rootEnd.address ?? JSON.stringify(rootEnd)
              return p.endLocation ?? p.EndLocation ?? ''
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

        setPosts(dataPosts)
        setTotal(totalCount)
        setPage(p)
        setPageSize(size)
      } else {
        setError(res?.message ?? 'Failed to fetch posts')
      }
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) fetchPage(initialPage, initialSize)
  }, [userId, fetchPage, initialPage, initialSize])

  const refetch = useCallback(() => {
    if (userId) fetchPage(page, pageSize, search, sortBy, sortOrder)
  }, [userId, page, pageSize, search, sortBy, sortOrder, fetchPage])

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
    setSearch,
    setSortBy,
    setSortOrder,
    fetchPage,
    setPage,
    setPageSize,
    refetch,
  }
}

export default usePostPackages

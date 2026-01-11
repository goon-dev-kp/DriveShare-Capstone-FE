import { useCallback, useEffect, useState } from 'react'
import packageService from '@/services/packageService'
import { Package } from '@/models/types'
import { useAuth } from './useAuth'

export const usePackages = (initialPage = 1, initialSize = 20) => {
  const { user } = useAuth()
  const userId = (user as any)?.userId

  const [packages, setPackages] = useState<Package[]>([])
  const [total, setTotal] = useState<number>(0)
  const [page, setPage] = useState<number>(initialPage)
  const [pageSize, setPageSize] = useState<number>(initialSize)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState<string>('')
  const [sortField, setSortField] = useState<string>('title')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  const fetchPage = useCallback(async (
    p = page, 
    size = pageSize, 
    searchQuery = search,
    sort = sortField,
    order = sortOrder,
    statusVal = statusFilter
  ) => {
    setLoading(true)
    setError(null)
    try {
      const res = await packageService.getPackagesByUserId({
        pageNumber: p,
        pageSize: size,
        search: searchQuery || undefined,
        sortField: sort,
        sortOrder: order,
        status: statusVal !== 'ALL' ? statusVal : undefined
      })
      
      console.log('📦 [usePackages] API response:', res);
      
      if (res && res.isSuccess && res.result) {
        const result: any = res.result
        // Ưu tiên lấy từ data (theo API response thực tế), rồi mới items
        const rawPackages: any[] = result.data ?? result.items ?? []
        const totalCount: number = result.totalCount ?? rawPackages.length
        
        console.log(`📦 [usePackages] Found ${rawPackages.length} packages`);

        // Map backend DTO to frontend Package interface
        const dataPackages: Package[] = rawPackages.map((pkg: any, idx: number) => {
          console.log(`  📦 Package ${idx}:`, {
            id: pkg.packageId,
            title: pkg.title,
            status: pkg.status,
            imagesCount: pkg.packageImages?.length || 0,
            attributes: {
              isFragile: pkg.isFragile,
              isLiquid: pkg.isLiquid,
              isRefrigerated: pkg.isRefrigerated,
              isFlammable: pkg.isFlammable,
              isHazardous: pkg.isHazardous,
              isBulky: pkg.isBulky,
              isPerishable: pkg.isPerishable,
            }
          });
          
          const imagesRaw = pkg.packageImages ?? pkg.images ?? []
          const images = (imagesRaw || []).map((img: any) => ({
            packageImageId: img.packageImageId ?? img.id ?? '',
            packageImageURL: img.imageUrl ?? img.packageImageURL ?? img.url ?? '',
          }))

          return {
            id: pkg.packageId ?? pkg.id ?? '',
            title: pkg.title ?? '',
            description: pkg.description ?? '',
            quantity: pkg.quantity ?? 0,
            unit: pkg.unit ?? 'piece',
            weightKg: pkg.weightKg ?? 0,
            volumeM3: pkg.volumeM3 ?? 0,
            status: pkg.status ?? 'PENDING',
            images,
            packageCode: pkg.packageCode ?? '',
            itemId: pkg.itemId ?? '',
            // Handling attributes
            isFragile: pkg.isFragile ?? false,
            isLiquid: pkg.isLiquid ?? false,
            isRefrigerated: pkg.isRefrigerated ?? false,
            isFlammable: pkg.isFlammable ?? false,
            isHazardous: pkg.isHazardous ?? false,
            isBulky: pkg.isBulky ?? false,
            isPerishable: pkg.isPerishable ?? false,
            otherRequirements: pkg.otherRequirements ?? '',
            // Additional fields
            ownerId: pkg.ownerId,
            providerId: pkg.providerId,
            postPackageId: pkg.postPackageId,
            tripId: pkg.tripId,
            createdAt: pkg.createdAt,
            packageImages: images,
          } as Package
        })

        setPackages(dataPackages)
        setTotal(totalCount)
        setPage(p)
        setPageSize(size)
      } else {
        setError(res?.message ?? 'Failed to fetch packages')
      }
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }, [userId])

  // REMOVED: No auto-fetch on mount, component will call fetchPage manually

  return {
    packages,
    total,
    page,
    pageSize,
    loading,
    error,
    search,
    sortField,
    sortOrder,
    statusFilter,
    setSearch,
    setSortField,
    setSortOrder,
    setStatusFilter,
    fetchPage,
    setPage,
    setPageSize,
  }
}

export default usePackages

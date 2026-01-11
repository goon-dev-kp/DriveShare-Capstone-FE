import { useCallback, useEffect, useState } from 'react'
import itemService from '@/services/itemService'
import { Item, ImageStatus } from '@/models/types'
import { useAuth } from './useAuth'

export const useItems = (initialPage = 1, initialSize = 20) => {
  const { user } = useAuth()
  const userId = (user as any)?.userId

  const [items, setItems] = useState<Item[]>([])
  const [total, setTotal] = useState<number>(0)
  const [page, setPage] = useState<number>(initialPage)
  const [pageSize, setPageSize] = useState<number>(initialSize)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('itemname')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  const fetchPage = useCallback(async (
    p = page, 
    size = pageSize, 
    searchQuery = search,
    sort = sortBy,
    order = sortOrder,
    statusVal = statusFilter
  ) => {
    setLoading(true)
    setError(null)
    try {
      const res = await itemService.getItemsByUserId({
        pageNumber: p,
        pageSize: size,
        search: searchQuery || undefined,
        sortBy: sort,
        sortOrder: order,
        status: statusVal !== 'ALL' ? statusVal : undefined
      })
      if (res && res.isSuccess && res.result) {
        // backend result shape may vary; try to read commonly used fields
        const result: any = res.result
        // support both { items, totalCount } and array with meta
        const rawItems: any[] = result.items ?? (result as any).data ?? []
        const totalCount: number = result.totalCount ?? (result as any).totalCount ?? rawItems.length

        // Normalize backend shape to frontend Item interface
        const dataItems: Item[] = rawItems.map((it: any) => {
          const imagesRaw = it.imageUrls ?? it.ImageUrls ?? it.images ?? []
          const images = (imagesRaw || []).map((img: any) => ({
            itemImageId: img.itemImageId ?? img.itemImageId ?? '',
            itemImageURL: img.imageUrl ?? img.itemImageURL ?? img.url ?? '',
            status: ImageStatus.ACTIVE,
          }))

          return {
            id: it.itemId ?? it.id ?? '',
            itemName: it.itemName ?? it.ItemName ?? '',
            description: it.description ?? it.Description ?? '',
            declaredValue: it.declaredValue ?? it.DeclaredValue ?? 0,
            currency: it.currency ?? it.Currency ?? 'VND',
            providerId: it.providerId ?? it.ProviderId ?? undefined,
            status: it.status ?? it.Status ?? 'PENDING',
            images,
            quantity: it.quantity ?? it.Quantity ?? 1,
            unit: it.unit ?? it.Unit ?? 'pcs',
          } as Item
        })

        setItems(dataItems)
        // DEBUG: log first item's images to ensure mapping is correct
        if (dataItems.length > 0) {
          // eslint-disable-next-line no-console
          console.debug('useItems: first item images:', dataItems[0].images)
        }
        setTotal(totalCount)
        setPage(p)
        setPageSize(size)
      } else {
        setError(res?.message ?? 'Failed to fetch items')
      }
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    // fetch on mount / when user available
    if (userId) fetchPage(initialPage, initialSize)
  }, [userId, fetchPage, initialPage, initialSize])

  // createItem: send ItemCreateDTO + ItemImages[] (multipart handled in service)
  const createItem = async (payload: any) => {
    setLoading(true)
    try {
      const createPayload: any = {
        ItemName: payload.itemName ?? payload.ItemName,
        Description: payload.description ?? payload.Description,
        DeclaredValue: payload.declaredValue ?? payload.DeclaredValue,
        Currency: payload.currency ?? payload.Currency ?? 'VND',
        Quantity: payload.quantity ?? payload.Quantity ?? 1,
        Unit: payload.unit ?? payload.Unit ?? 'pcs',
        // Price: payload.price ?? payload.Price ?? 0,
        ItemImages: payload.images ?? payload.ItemImages ?? [],
      }

      const res = await itemService.createItem(createPayload as any)
      if (res.isSuccess) await fetchPage(1, pageSize, search, sortBy, sortOrder, statusFilter)
      return res
    } finally {
      setLoading(false)
    }
  }

  const updateItem = async (payload: any) => {
    setLoading(true)
    try {
      const res = await itemService.updateItem(payload)
      if (res.isSuccess) await fetchPage(page, pageSize, search, sortBy, sortOrder, statusFilter)
      return res
    } finally {
      setLoading(false)
    }
  }

  const deleteItem = async (id: string) => {
    setLoading(true)
    try {
      const res = await itemService.deleteItem(id)
      if (res.isSuccess) await fetchPage(page, pageSize, search, sortBy, sortOrder, statusFilter)
      return res
    } finally {
      setLoading(false)
    }
  }

  return {
    items,
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
    setPage,
    setPageSize,
    createItem,
    updateItem,
    deleteItem,
  }
}

export default useItems

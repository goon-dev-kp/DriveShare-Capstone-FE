import { useState, useEffect, useCallback } from "react";
import vehicleService from "@/services/vehicleService";
import { Vehicle } from "@/models/types";
import { useAuth } from "./useAuth";

interface UseVehiclesResult {
  vehicles: Vehicle[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  search: string;
  sortBy: string;
  sortOrder: "ASC" | "DESC";
  statusFilter: string;
  setSearch: (search: string) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (order: "ASC" | "DESC") => void;
  setStatusFilter: (status: string) => void;
  fetchPage: (page: number) => Promise<void>;
  refetch: () => void;
}

export function useVehicles(): UseVehiclesResult {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdat");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchPage = useCallback(
    async (pageNum: number) => {
      if (!user?.userId) return;
      setLoading(true);
      setError(null);
      try {
        const params = {
          pageNumber: pageNum,
          pageSize,
          search: search || undefined,
          sortBy,
          sortOrder,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
        };

        const res: any = await vehicleService.getMyVehicles(params);
        const payload = res?.result ?? res;
        let items: any[] = [];
        if (payload && Array.isArray(payload.data)) items = payload.data;
        else if (payload && Array.isArray(payload.items)) items = payload.items;
        else if (Array.isArray(payload)) items = payload;

        const mapped: Vehicle[] = items.map((v: any) => ({
          id: v.vehicleId ?? v.id,
          plateNumber: v.plateNumber ?? "",
          model: v.model,
          brand: v.brand,
          color: v.color,
          yearOfManufacture: v.yearOfManufacture,
          payloadInKg: v.payloadInKg,
          volumeInM3: v.volumeInM3,
          status: v.status,
          vehicleType: v.vehicleType
            ? {
                vehicleTypeId: v.vehicleType.vehicleTypeId,
                vehicleTypeName: v.vehicleType.vehicleTypeName,
                description: v.vehicleType.description,
              }
            : undefined,
          isVerified: v.isVerified ?? v.IsVerified ?? false,
          documents: Array.isArray(v.documents)
            ? v.documents
            : Array.isArray(v.Documents)
            ? v.Documents
            : [],
          imageUrls: Array.isArray(v.imageUrls) ? v.imageUrls : [],
        }));

        setVehicles(mapped);
        setTotal(payload?.totalCount ?? mapped.length);
        setPage(pageNum);
      } catch (e: any) {
        console.error("[useVehicles] fetchPage error:", e);
        setError(e?.message || "Không thể tải danh sách xe");
      } finally {
        setLoading(false);
      }
    },
    [user?.userId, pageSize, search, sortBy, sortOrder]
  );

  useEffect(() => {
    fetchPage(1);
  }, [search, sortBy, sortOrder, statusFilter]);

  const refetch = useCallback(() => {
    fetchPage(page);
  }, [page, fetchPage]);

  return {
    vehicles,
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
    refetch,
  };
}

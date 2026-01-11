import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Modal,
  StatusBar,
  SafeAreaView,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import postTripService from "@/services/postTripService";
import tripService from "@/services/tripService";
import assignmentService from "@/services/assignmentService";
import postAnalysisService from "@/services/postAnalysisService";
import driverWorkSessionService from "@/services/driverWorkSessionService";
import walletService from "@/services/walletService";
import { useAuth } from "@/hooks/useAuth";
import { track } from "@/utils/analytics";
import useTripStore from "@/stores/tripStore";
import VietMapUniversal from "@/components/map/VietMapUniversal";
import { extractRouteWithSteps } from "@/utils/navigation";
import AddressAutocomplete from "@/components/AddressAutocomplete";

// --- HELPER FUNCTIONS ---
type AnyObj = Record<string, any>;
function get(obj: AnyObj, ...keys: string[]) {
  for (const k of keys) {
    if (obj == null) return undefined;
    obj = obj[k];
  }
  return obj;
}

function normalizePostTrip(raw: AnyObj) {
  const id = raw.postTripId || raw.PostTripId || raw.id || raw.Id;
  const title = raw.title || raw.Title || "";
  const description = raw.description || raw.Description || "";
  const status = raw.status || raw.Status || "UNKNOWN";
  const requiredPayloadInKg =
    raw.requiredPayloadInKg ?? raw.RequiredPayloadInKg;
  const tripRaw = raw.trip || raw.Trip || {};
  const trip = {
    tripId: tripRaw.tripId || tripRaw.TripId,
    startLocationName: tripRaw.startLocationName || tripRaw.StartLocationName,
    endLocationName: tripRaw.endLocationName || tripRaw.EndLocationName,
    startDate: tripRaw.startDate || tripRaw.StartDate,
    endDate: tripRaw.endDate || tripRaw.EndDate,
    vehicleModel: tripRaw.vehicleModel || tripRaw.VehicleModel,
    vehiclePlate: tripRaw.vehiclePlate || tripRaw.VehiclePlate,
    packageCount: tripRaw.packageCount || tripRaw.PackageCount,
    tripDescription: tripRaw.tripDescription || tripRaw.TripDescription,
  };
  const startName = trip.startLocationName || "";
  const endName = trip.endLocationName || "";
  const startDate = trip.startDate;
  const endDate = trip.endDate;
  const details = raw.postTripDetails || raw.PostTripDetails || [];
  return {
    id,
    title,
    description,
    status,
    requiredPayloadInKg,
    startName,
    endName,
    startDate,
    endDate,
    details,
    trip,
  };
}

// --- COMPONENTS ---

const StatusPill = ({ value }: { value: string }) => {
  const config = useMemo(() => {
    const map: Record<string, any> = {
      OPEN: { color: "#16A34A", bg: "#DCFCE7", label: "ĐANG TUYỂN" },
      CLOSED: { color: "#DC2626", bg: "#FEE2E2", label: "ĐÃ ĐÓNG" },
      COMPLETED: { color: "#4F46E5", bg: "#EEF2FF", label: "HOÀN THÀNH" },
    };
    return (
      map[value.toUpperCase()] || {
        color: "#6B7280",
        bg: "#F3F4F6",
        label: value,
      }
    );
  }, [value]);
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: config.bg, borderColor: config.color },
      ]}
    >
      <Text style={[styles.pillText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
};

const DriverPostTripDetailScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const postTripId = String((params as any).postTripId);
  const { user } = useAuth();
  const { getTripDetail, setTripDetail } = useTripStore();

  // States
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justApplied, setJustApplied] = useState(false);

  // AI Analysis
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  // Trip Detail (for rich data)
  const [tripDetail, setTripDetailState] = useState<any | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);

  // Driver Work Session States
  const [availability, setAvailability] = useState<any | null>(null);
  const [suitability, setSuitability] = useState<any | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);

  // Action States
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    visible: boolean;
    type: "success" | "error";
    message: string;
  }>({ visible: false, type: "success", message: "" });
  const [showDepositConfirm, setShowDepositConfirm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingDetail, setPendingDetail] = useState<AnyObj | null>(null);

  // Custom Location States (for assistant drivers)
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [customPickup, setCustomPickup] = useState<string>("");
  const [customDropoff, setCustomDropoff] = useState<string>("");
  const [locationError, setLocationError] = useState<string>("");
  const [selectedPickupSuggestion, setSelectedPickupSuggestion] =
    useState<any>(null);
  const [selectedDropoffSuggestion, setSelectedDropoffSuggestion] =
    useState<any>(null);

  // --- Logic ---
  const alreadyInTrip = useMemo(() => {
    if (!user?.userId) return false;
    return (tripDetail?.drivers || []).some((d: AnyObj) => {
      const did =
        d.driverId || d.DriverId || d.userId || d.UserId || d.id || d.Id;
      return String(did) === String(user.userId);
    });
  }, [tripDetail?.drivers, user?.userId]);

  const isPostOpen = (data?.status || "").toUpperCase() === "OPEN";

  useEffect(() => {
    fetchData();
  }, [postTripId]);

  const fetchDriverSessionData = async (tripId: string) => {
    setLoadingSession(true);
    try {
      // 1. Get my availability (quỹ thời gian)
      const availRes: any = await driverWorkSessionService.getMyAvailability();
      if (availRes?.isSuccess && availRes.result) {
        setAvailability(availRes.result);
      }

      // 2. Check suitability for this trip
      const suitRes: any =
        await driverWorkSessionService.checkSuitabilityForTrip(tripId);
      if (suitRes) {
        setSuitability(suitRes);
      }
    } catch (e: any) {
      console.error("Error fetching driver session data:", e);
    } finally {
      setLoadingSession(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await postTripService.getById(String(postTripId));

      // If backend returns 403 after we've just applied, treat as success and navigate back
      if (
        (res?.statusCode === 403 ||
          (typeof res?.message === "string" &&
            /forbidden/i.test(res.message))) &&
        justApplied
      ) {
        showToast("success", "Ứng tuyển thành công!");
        setJustApplied(false);
        router.back();
        return;
      }

      // If backend returns 403 and we did NOT just apply, this is a permission issue — show friendly message and go back
      if (
        res?.statusCode === 403 ||
        (typeof res?.message === "string" && /forbidden/i.test(res.message))
      ) {
        showToast("error", "Bạn không có quyền xem bài đăng này");
        router.back();
        return;
      }

      if (res?.isSuccess) {
        const normalized = normalizePostTrip(res.result);
        setData(normalized);

        // Fetch linked trip details
        if (normalized.trip?.tripId) {
          const tRes: any = await tripService.getById(normalized.trip.tripId);
          if (tRes?.isSuccess) {
            setTripDetailState(tRes.result);
            // Decode route
            if (tRes.result.tripRoute?.routeData) {
              const { coords } = extractRouteWithSteps(
                tRes.result.tripRoute.routeData
              );
              setRouteCoords(coords as [number, number][]);
            }
          }

          // Fetch Driver Work Session data
          fetchDriverSessionData(normalized.trip.tripId);
        }
      } else {
        setError(res?.message || "Không tải được bài đăng");
      }
    } catch (e: any) {
      // If server responds with 403 (forbidden) after an apply, show success and navigate back
      const status = e?.response?.status;
      const apiMessage = e?.response?.data?.message || e?.message || "";
      if ((status === 403 || /forbidden/i.test(apiMessage)) && justApplied) {
        showToast("success", "Ứng tuyển thành công!");
        setJustApplied(false);
        router.back();
        return;
      }

      // If thrown 403 (permission) and not justApplied, show friendly message and navigate back
      if (status === 403 || /forbidden/i.test(apiMessage)) {
        showToast("error", "Bạn không có quyền xem bài đăng này");
        router.back();
        return;
      }

      setError(e?.message || "Lỗi mạng");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500);
  };

  const fetchAIAnalysis = async () => {
    if (!postTripId) return;
    setLoadingAI(true);
    try {
      const res: any = await postAnalysisService.analyzePostTrip(postTripId);
      if (res?.isSuccess && res.result) {
        setAiAnalysis(res.result);
        setShowAIModal(true);
      } else {
        showToast("error", res?.message || "Không thể phân tích");
      }
    } catch (e: any) {
      showToast("error", e?.message || "Lỗi kết nối AI");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleApply = async (detail: AnyObj) => {
    if (!data?.id) return;
    const postTripDetailId =
      detail.postTripDetailId ||
      detail.PostTripDetailId ||
      detail.id ||
      detail.Id;
    const isAssistant = (detail.type || "PRIMARY") !== "PRIMARY";
    const depositAmount = detail.depositAmount || 0;

    // For assistant drivers with custom locations, use them; otherwise send null (backend will use default)
    const startLocation =
      isAssistant && customPickup.trim() ? customPickup.trim() : null;
    const endLocation =
      isAssistant && customDropoff.trim() ? customDropoff.trim() : null;

    setApplyingId(String(postTripDetailId));
    try {
      // Step 1: Apply for the assignment
      const res: any = await assignmentService.applyByPostTrip({
        postTripId: String(data.id),
        postTripDetailId: String(postTripDetailId),
        startLocation: startLocation as any,
        endLocation: endLocation as any,
      });

      if (res?.isSuccess || res?.statusCode === 201) {
        // ⚠️ BACKEND ĐÃ TỰ ĐỘNG XỬ LÝ THANH TOÁN CỌC TRONG API apply-post-trip
        // Không cần gọi thêm createPayment() ở đây để tránh trừ tiền 2 lần

        // Step 2: If there's a deposit, create payment transaction
        // if (depositAmount > 0) {
        //     try {
        //         const paymentRes: any = await walletService.createPayment({
        //             amount: depositAmount,
        //             type: 'DEPOSIT',
        //             tripId: data.trip?.tripId || null,
        //             postId: String(data.id),
        //             description: `Đặt cọệ cho chuyến ${data.title || data.id}`,
        //             externalCode: String(postTripDetailId)
        //         })
        //
        //         if (!paymentRes?.isSuccess) {
        //             // Payment failed but assignment succeeded - show warning
        //             showToast('error', `Ứng tuyển thành công nhưng thanh toán tiền cọệ thất bại: ${paymentRes?.message || 'Lỗi thanh toán'}`)
        //         } else {
        //             showToast('success', `Ứng tuyển và thanh toán tiền cọệ ${depositAmount.toLocaleString('vi-VN')} đ thành công!`)
        //         }
        //     } catch (paymentErr: any) {
        //         // Payment API failed but assignment succeeded
        //         showToast('error', `Ứng tuyển thành công nhưng không thể thanh toán tiền cọệ: ${paymentErr?.message || 'Lỗi kết nối'}`)
        //     }
        // } else {
        //     // No deposit required
        //     const successMsg = res?.message || 'Ứng tuyển thành công!'
        //     showToast('success', successMsg)
        // }

        // Show success message (backend đã xử lý cả deposit)
        const successMsg =
          depositAmount > 0
            ? `Ứng tuyển và thanh toán tiền cọc ${depositAmount.toLocaleString(
                "vi-VN"
              )} đ thành công!`
            : res?.message || "Ứng tuyển thành công!";
        showToast("success", successMsg);

        // Reset custom locations
        setCustomPickup("");
        setCustomDropoff("");

        // Optimistic UI update: avoid immediate refetch which may return 403/forbidden
        const newDriver = {
          driverId: user?.userId,
          fullName: (user as any)?.fullName || (user as any)?.userName || "",
          type: detail.type || detail.Type || "PRIMARY",
          assignmentStatus: "ACCEPTED",
          paymentStatus: depositAmount > 0 ? "PAID" : "UNPAID",
        };
        if (tripDetail) {
          setTripDetailState({
            ...tripDetail,
            drivers: [...(tripDetail.drivers || []), newDriver],
          });
        } else {
          setTripDetailState({ drivers: [newDriver] });
        }

        // mark that we just applied so fetchData can handle a 403 gracefully
        setJustApplied(true);
      } else {
        throw new Error(res?.message || "Thất bại");
      }
    } catch (e: any) {
      // Check if error is about location validation
      const errMsg =
        e?.response?.data?.message || e?.message || "Lỗi ứng tuyển";
      showToast("error", errMsg);
    } finally {
      setApplyingId(null);
      setShowConfirm(false);
      setShowLocationModal(false); // Close location modal after applying
    }
  };

  const openLocationModal = (detail: AnyObj) => {
    setPendingDetail(detail);
    setLocationError("");
    // Reset custom locations and suggestions when opening modal
    setCustomPickup("");
    setCustomDropoff("");
    setSelectedPickupSuggestion(null);
    setSelectedDropoffSuggestion(null);
    setShowLocationModal(true);
  };

  const closeLocationModal = () => {
    // Reset everything when closing without confirming
    setShowLocationModal(false);
    setCustomPickup("");
    setCustomDropoff("");
    setSelectedPickupSuggestion(null);
    setSelectedDropoffSuggestion(null);
    setLocationError("");
    setPendingDetail(null);
  };

  const confirmWithLocation = () => {
    if (!pendingDetail) return;
    // Don't close location modal, just show confirm on top
    setShowConfirm(true);
  };

  const openDepositConfirm = (detail: AnyObj) => {
    setPendingDetail(detail);
    // Reset custom locations khi ứng tuyển trực tiếp (không qua modal tùy chỉnh)
    setCustomPickup("");
    setCustomDropoff("");
    setSelectedPickupSuggestion(null);
    setSelectedDropoffSuggestion(null);
    // Chỉ hiển thị modal deposit nếu có tiền cọc > 0
    if ((detail.depositAmount || 0) > 0) {
      setShowDepositConfirm(true);
    } else {
      // Không có tiền cọc, confirm trực tiếp
      setShowConfirm(true);
    }
  };

  const confirmDeposit = () => {
    setShowDepositConfirm(false);
    // Sau khi đồng ý với thông báo tiền cọc, chuyển sang confirm apply
    setShowConfirm(true);
  };

  const openConfirm = (detail: AnyObj) => {
    setPendingDetail(detail);
    // Reset custom locations khi ứng tuyển trực tiếp
    setCustomPickup("");
    setCustomDropoff("");
    setSelectedPickupSuggestion(null);
    setSelectedDropoffSuggestion(null);
    setShowConfirm(true);
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  if (error || !data)
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || "Không có dữ liệu"}</Text>
      </View>
    );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Chi tiết Bài đăng
          </Text>
        </View>
        <TouchableOpacity
          onPress={fetchAIAnalysis}
          style={styles.aiBtn}
          disabled={loadingAI}
        >
          {loadingAI ? (
            <ActivityIndicator size="small" color="#8B5CF6" />
          ) : (
            <MaterialCommunityIcons
              name="robot-outline"
              size={20}
              color="#8B5CF6"
            />
          )}
        </TouchableOpacity>
        <StatusPill value={data.status} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 1. Map Preview */}
        <View style={styles.cardNoPadding}>
          <View style={styles.mapContainer}>
            <VietMapUniversal
              coordinates={routeCoords}
              style={{ height: 200 }}
              navigationActive={false}
            />
          </View>
          <View style={styles.routeInfoBox}>
            <View style={styles.routeRow}>
              <View style={[styles.dot, { backgroundColor: "#3B82F6" }]} />
              <Text style={styles.routeText}>{data.startName || "---"}</Text>
            </View>
            <View style={styles.routeConnector} />
            <View style={styles.routeRow}>
              <View style={[styles.dot, { backgroundColor: "#EF4444" }]} />
              <Text style={styles.routeText}>{data.endName || "---"}</Text>
            </View>
          </View>
        </View>

        {/* Driver Availability & Suitability Info */}
        {availability && (
          <View style={styles.card}>
            <View style={styles.sessionHeader}>
              <MaterialCommunityIcons
                name="clock-check-outline"
                size={24}
                color="#3B82F6"
              />
              <Text style={styles.sessionTitle}>Quỹ Thời Gian Của Bạn</Text>
            </View>

            <View style={styles.availabilityGrid}>
              <View style={styles.availabilityItem}>
                <Text style={styles.availabilityLabel}>Đã lái hôm nay</Text>
                <Text
                  style={[
                    styles.availabilityValue,
                    availability.drivenHoursToday > 8 && { color: "#F59E0B" },
                  ]}
                >
                  {availability.drivenHoursToday}h / 10h
                </Text>
                <Text style={styles.availabilitySubtext}>
                  Còn {availability.remainingHoursToday}h
                </Text>
              </View>

              <View style={styles.availabilityDivider} />

              <View style={styles.availabilityItem}>
                <Text style={styles.availabilityLabel}>Đã lái tuần này</Text>
                <Text
                  style={[
                    styles.availabilityValue,
                    availability.drivenHoursThisWeek > 40 && {
                      color: "#F59E0B",
                    },
                  ]}
                >
                  {availability.drivenHoursThisWeek}h / 48h
                </Text>
                <Text style={styles.availabilitySubtext}>
                  Còn {availability.remainingHoursThisWeek}h
                </Text>
              </View>
            </View>

            {availability.isBanned && (
              <View style={styles.warningBanner}>
                <Ionicons name="warning" size={18} color="#DC2626" />
                <Text style={styles.warningBannerText}>
                  {availability.message}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Suitability Check Result */}
        {suitability && (
          <View style={styles.card}>
            <View style={styles.sessionHeader}>
              <MaterialCommunityIcons
                name={
                  suitability.isSuccess
                    ? "check-circle-outline"
                    : "alert-circle-outline"
                }
                size={24}
                color={suitability.isSuccess ? "#059669" : "#DC2626"}
              />
              <Text style={styles.sessionTitle}>Kiểm Tra Phù Hợp</Text>
            </View>

            {suitability.isSuccess ? (
              <View style={styles.suitabilitySuccess}>
                <View style={styles.suitabilityRow}>
                  <Text style={styles.suitabilityLabel}>Giờ lái yêu cầu:</Text>
                  <Text style={styles.suitabilityValue}>
                    {suitability.result?.requiredHours?.toFixed(1)}h
                  </Text>
                </View>
                <View style={styles.suitabilityRow}>
                  <Text style={styles.suitabilityLabel}>
                    Giờ lái còn lại của bạn:
                  </Text>
                  <Text style={[styles.suitabilityValue, { color: "#059669" }]}>
                    {suitability.result?.driverRemainingHours?.toFixed(1)}h
                  </Text>
                </View>
                <View style={styles.successBanner}>
                  <Ionicons name="checkmark-circle" size={18} color="#059669" />
                  <Text style={styles.successBannerText}>
                    Bạn đủ điều kiện ứng tuyển chuyến này!
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.suitabilityError}>
                <Text style={styles.errorReason}>
                  {suitability.message || "Không phù hợp"}
                </Text>
                {suitability.result && (
                  <>
                    <View style={styles.suitabilityRow}>
                      <Text style={styles.suitabilityLabel}>
                        Giờ lái yêu cầu:
                      </Text>
                      <Text style={styles.suitabilityValue}>
                        {suitability.result.requiredHours?.toFixed(1)}h
                      </Text>
                    </View>
                    <View style={styles.suitabilityRow}>
                      <Text style={styles.suitabilityLabel}>
                        Giờ lái còn lại của bạn:
                      </Text>
                      <Text
                        style={[styles.suitabilityValue, { color: "#DC2626" }]}
                      >
                        {suitability.result.driverRemainingHours?.toFixed(1)}h
                      </Text>
                    </View>
                  </>
                )}
              </View>
            )}
          </View>
        )}

        {/* 2. Overview Info */}
        <View style={styles.card}>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.desc}>{data.description}</Text>

          <View style={styles.divider} />

          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Tải trọng</Text>
              <Text style={styles.value}>{data.requiredPayloadInKg} kg</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Khởi hành</Text>
              <Text style={styles.value}>
                {data.startDate
                  ? new Date(data.startDate).toLocaleDateString("vi-VN")
                  : "---"}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Kết thúc</Text>
              <Text style={styles.value}>
                {data.endDate
                  ? new Date(data.endDate).toLocaleDateString("vi-VN")
                  : "---"}
              </Text>
            </View>
          </View>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Tổng Slot</Text>
              <Text style={styles.value}>{data.details.length}</Text>
            </View>
            <View style={styles.gridItem} />
            <View style={styles.gridItem} />
          </View>
        </View>

        {/* 3. Positions (Slots) */}
        <Text style={styles.sectionTitle}>VỊ TRÍ CẦN TUYỂN</Text>

        {data.details.map((d: AnyObj, idx: number) => {
          const type =
            (d.type || "PRIMARY") === "PRIMARY" ? "Tài xế Chính" : "Tài xế Phụ";
          const salary = d.pricePerPerson || 0;
          const count = d.requiredCount || 0;
          // Check if slot is full: requiredCount === 0 means no more drivers needed
          const isFull = count === 0;

          return (
            <View key={idx} style={styles.slotCard}>
              <View style={styles.slotHeader}>
                <View style={styles.slotTypeTag}>
                  <Text style={styles.slotTypeText}>{type}</Text>
                </View>
                <Text style={styles.slotSalary}>
                  {salary.toLocaleString("vi-VN")} đ
                </Text>
              </View>

              <View style={styles.slotBody}>
                <View style={styles.slotRow}>
                  <Ionicons name="people-outline" size={16} color="#6B7280" />
                  <Text style={styles.slotText}>
                    Số lượng còn thiếu:{" "}
                    <Text
                      style={[styles.slotCount, isFull && styles.slotCountFull]}
                    >
                      {count}
                    </Text>
                  </Text>
                </View>
                <View style={styles.slotRow}>
                  <Ionicons name="location-outline" size={16} color="#6B7280" />
                  <Text style={styles.slotText}>
                    Đón: {d.pickupLocation || "---"}
                  </Text>
                </View>
                <View style={styles.slotRow}>
                  <Ionicons name="flag-outline" size={16} color="#6B7280" />
                  <Text style={styles.slotText}>
                    Trả: {d.dropoffLocation || "---"}
                  </Text>
                </View>
                {(d.depositAmount || 0) > 0 && (
                  <View style={styles.slotRow}>
                    <MaterialCommunityIcons
                      name="cash"
                      size={16}
                      color="#F59E0B"
                    />
                    <Text style={styles.slotText}>
                      Đặt cọc:{" "}
                      <Text style={{ fontWeight: "700", color: "#F59E0B" }}>
                        {d.depositAmount.toLocaleString("vi-VN")} đ
                      </Text>
                    </Text>
                  </View>
                )}
              </View>

              {/* Apply Button */}
              {!alreadyInTrip && isPostOpen && (
                <View style={styles.actionContainer}>
                  {type === "Tài xế Phụ" && (
                    <TouchableOpacity
                      style={[
                        styles.customLocationBtn,
                        (applyingId ||
                          isFull ||
                          (suitability && !suitability.isSuccess)) &&
                          styles.btnDisabled,
                      ]}
                      onPress={() => openLocationModal(d)}
                      disabled={
                        !!applyingId ||
                        isFull ||
                        (suitability && !suitability.isSuccess)
                      }
                    >
                      <Ionicons name="location" size={16} color="#4F46E5" />
                      <Text style={styles.customLocationText}>
                        Tùy chỉnh điểm đón/trả
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.applyBtn,
                      (applyingId ||
                        isFull ||
                        (suitability && !suitability.isSuccess)) &&
                        styles.btnDisabled,
                      type === "Tài xế Phụ" && styles.applyBtnSecondary,
                    ]}
                    onPress={() => openDepositConfirm(d)}
                    disabled={
                      !!applyingId ||
                      isFull ||
                      (suitability && !suitability.isSuccess)
                    }
                  >
                    {applyingId === String(d.postTripDetailId) ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.applyBtnText}>
                        {isFull
                          ? "Đã đủ người"
                          : suitability && !suitability.isSuccess
                          ? "Không đủ điều kiện"
                          : "Ứng tuyển ngay"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {alreadyInTrip && (
                <View style={styles.joinedBanner}>
                  <Ionicons name="checkmark-circle" size={18} color="#059669" />
                  <Text style={styles.joinedText}>
                    Bạn đã tham gia chuyến này
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        {/* 4. Trip Context (Vehicle & Owner) - Optional */}
        {tripDetail && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Thông tin bổ sung</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Xe:</Text>
              <Text style={styles.infoValue}>
                {tripDetail.vehicle?.plateNumber} - {tripDetail.vehicle?.model}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Chủ xe:</Text>
              <Text style={styles.infoValue}>{tripDetail.owner?.fullName}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Deposit Confirmation Modal */}
      <Modal
        visible={showDepositConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDepositConfirm(false)}
      >
        <View style={styles.confirmModalBackdrop}>
          <View style={styles.depositModalCard}>
            <View style={styles.depositModalHeader}>
              <MaterialCommunityIcons
                name="cash-multiple"
                size={48}
                color="#F59E0B"
              />
              <Text style={styles.depositModalTitle}>Xác nhận đặt cọc</Text>
            </View>

            <View style={styles.depositInfoBox}>
              <Text style={styles.depositInfoTitle}>Thông tin ứng tuyển</Text>
              <View style={styles.depositInfoRow}>
                <Text style={styles.depositInfoLabel}>Vị trí:</Text>
                <Text style={styles.depositInfoValue}>
                  {pendingDetail?.type === "PRIMARY"
                    ? "Tài xế Chính"
                    : "Tài xế Phụ"}
                </Text>
              </View>
              <View style={styles.depositInfoRow}>
                <Text style={styles.depositInfoLabel}>Lương:</Text>
                <Text style={[styles.depositInfoValue, { color: "#059669" }]}>
                  {pendingDetail?.pricePerPerson?.toLocaleString("vi-VN")} đ
                </Text>
              </View>
              <View style={styles.dividerThin} />
              <View style={styles.depositInfoRow}>
                <Text style={styles.depositAmountLabel}>Tiền đặt cọc:</Text>
                <Text style={styles.depositAmountValue}>
                  {(pendingDetail?.depositAmount || 0).toLocaleString("vi-VN")}{" "}
                  đ
                </Text>
              </View>
            </View>

            <View style={styles.depositWarningBox}>
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
              <Text style={styles.depositWarningText}>
                Bạn cần đặt cọc để xác nhận ứng tuyển. Số tiền sẽ được hoàn trả
                sau khi hoàn thành chuyến đi.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => setShowDepositConfirm(false)}
              >
                <Text style={styles.btnSecondaryText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={confirmDeposit}
              >
                <Text style={styles.btnPrimaryText}>Đồng ý đặt cọc</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Location Modal (Assistant Drivers Only) */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="slide"
        onRequestClose={closeLocationModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.locationModalCard}>
            <View style={styles.locationModalHeader}>
              <Text style={styles.modalTitle}>Tùy chỉnh điểm đón/trả</Text>
              <TouchableOpacity onPress={closeLocationModal}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.warningBox}>
              <Ionicons name="information-circle" size={20} color="#F59E0B" />
              <Text style={styles.warningText}>
                Điểm đón/trả tùy chỉnh chỉ hợp lệ khi nằm trên tuyến đường và
                cách đường dưới 5km. Để trống nếu muốn dùng điểm mặc định.
              </Text>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Điểm đón (tùy chọn)</Text>
                <AddressAutocomplete
                  value={customPickup}
                  onSelect={(suggestion) => {
                    setSelectedPickupSuggestion(suggestion);
                    setCustomPickup(
                      suggestion.display ||
                        suggestion.name ||
                        suggestion.address ||
                        ""
                    );
                  }}
                  placeholder="Nhập địa chỉ đón dọc đường..."
                  displayType={1}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Điểm trả (tùy chọn)</Text>
                <AddressAutocomplete
                  value={customDropoff}
                  onSelect={(suggestion) => {
                    setSelectedDropoffSuggestion(suggestion);
                    setCustomDropoff(
                      suggestion.display ||
                        suggestion.name ||
                        suggestion.address ||
                        ""
                    );
                  }}
                  placeholder="Nhập địa chỉ trả dọc đường..."
                  displayType={1}
                />
              </View>
            </ScrollView>

            {locationError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{locationError}</Text>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={closeLocationModal}
              >
                <Text style={styles.btnSecondaryText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={confirmWithLocation}
              >
                <Text style={styles.btnPrimaryText}>Tiếp tục</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirm Modal - Appears on top of location modal */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirm(false)}
      >
        <View style={styles.confirmModalBackdrop}>
          <View style={styles.confirmModalCard}>
            <Text style={styles.modalTitle}>Xác nhận Ứng tuyển</Text>
            <Text style={styles.modalDesc}>
              Bạn có chắc chắn muốn ứng tuyển vị trí
              <Text style={{ fontWeight: "bold" }}>
                {" "}
                {pendingDetail?.type === "PRIMARY"
                  ? "Tài xế Chính"
                  : "Tài xế Phụ"}{" "}
              </Text>
              với mức lương
              <Text style={{ fontWeight: "bold", color: "#2563EB" }}>
                {" "}
                {pendingDetail?.pricePerPerson?.toLocaleString()} đ
              </Text>
              ?
            </Text>

            {/* Show custom locations if set, otherwise show default message */}
            {customPickup || customDropoff ? (
              <View style={styles.customLocSummary}>
                <Text style={styles.customLocTitle}>
                  📍 Địa điểm tùy chỉnh:
                </Text>
                {customPickup && (
                  <Text style={styles.customLocText}>Đón: {customPickup}</Text>
                )}
                {customDropoff && (
                  <Text style={styles.customLocText}>Trả: {customDropoff}</Text>
                )}
              </View>
            ) : pendingDetail?.type !== "PRIMARY" ? (
              <View style={styles.defaultLocSummary}>
                <Text style={styles.defaultLocTitle}>
                  📍 Sử dụng điểm đón/trả mặc định:
                </Text>
                <Text style={styles.defaultLocText}>
                  Đón: {pendingDetail?.pickupLocation || "---"}
                </Text>
                <Text style={styles.defaultLocText}>
                  Trả: {pendingDetail?.dropoffLocation || "---"}
                </Text>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => setShowConfirm(false)}
              >
                <Text style={styles.btnSecondaryText}>Quay lại</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => pendingDetail && handleApply(pendingDetail)}
              >
                <Text style={styles.btnPrimaryText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* AI Analysis Modal */}
      <Modal
        visible={showAIModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAIModal(false)}
      >
        <SafeAreaView style={styles.modalBackdrop}>
          <View style={styles.aiModalCard}>
            <View style={styles.aiModalHeader}>
              <View style={styles.aiModalTitleRow}>
                <MaterialCommunityIcons
                  name="robot-outline"
                  size={32}
                  color="#8B5CF6"
                />
                <Text style={styles.aiModalTitle}>Phân tích AI</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAIModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {aiAnalysis && (
              <ScrollView
                style={styles.aiModalContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Verdict Badge */}
                <View
                  style={[
                    styles.verdictBadge,
                    aiAnalysis.verdict?.includes("THƠM")
                      ? styles.verdictGood
                      : styles.verdictWarning,
                  ]}
                >
                  <Text style={styles.verdictText}>
                    {aiAnalysis.verdict || "PHÂN TÍCH"}
                  </Text>
                  <Text style={styles.scoreText}>
                    ⭐ {aiAnalysis.score?.toFixed(1) || 0}/10
                  </Text>
                </View>

                {/* Short Summary */}
                {aiAnalysis.shortSummary && (
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryText}>
                      {aiAnalysis.shortSummary}
                    </Text>
                  </View>
                )}

                {/* Financial Section */}
                {aiAnalysis.financial && (
                  <View style={styles.aiSection}>
                    <View style={styles.aiSectionHeader}>
                      <MaterialCommunityIcons
                        name="cash-multiple"
                        size={20}
                        color="#059669"
                      />
                      <Text style={styles.aiSectionTitle}>Tài chính</Text>
                    </View>
                    <View style={styles.aiSectionBody}>
                      <View style={styles.aiRow}>
                        <Text style={styles.aiLabel}>Đánh giá:</Text>
                        <Text style={styles.aiValue}>
                          {aiAnalysis.financial.assessment}
                        </Text>
                      </View>
                      {aiAnalysis.financial.estimatedRevenue && (
                        <View style={styles.aiRow}>
                          <Text style={styles.aiLabel}>Doanh thu dự kiến:</Text>
                          <Text style={[styles.aiValue, { color: "#059669" }]}>
                            {aiAnalysis.financial.estimatedRevenue}
                          </Text>
                        </View>
                      )}
                      {aiAnalysis.financial.marketTrend && (
                        <View style={styles.aiRow}>
                          <Text style={styles.aiLabel}>Xu hướng:</Text>
                          <Text style={styles.aiValue}>
                            {aiAnalysis.financial.marketTrend}
                          </Text>
                        </View>
                      )}
                      {aiAnalysis.financial.profitabilityScore > 0 && (
                        <View style={styles.scoreBar}>
                          <Text style={styles.scoreBarLabel}>
                            Lợi nhuận: {aiAnalysis.financial.profitabilityScore}
                            /10
                          </Text>
                          <View style={styles.scoreBarBg}>
                            <View
                              style={[
                                styles.scoreBarFill,
                                {
                                  width: `${
                                    (aiAnalysis.financial.profitabilityScore /
                                      10) *
                                    100
                                  }%`,
                                },
                              ]}
                            />
                          </View>
                        </View>
                      )}
                      {aiAnalysis.financial.details && (
                        <Text style={styles.detailsText}>
                          {aiAnalysis.financial.details}
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {/* Operational Section */}
                {aiAnalysis.operational && (
                  <View style={styles.aiSection}>
                    <View style={styles.aiSectionHeader}>
                      <MaterialCommunityIcons
                        name="truck-fast"
                        size={20}
                        color="#2563EB"
                      />
                      <Text style={styles.aiSectionTitle}>Vận hành</Text>
                    </View>
                    <View style={styles.aiSectionBody}>
                      {aiAnalysis.operational.vehicleRecommendation && (
                        <View style={styles.opItem}>
                          <Ionicons name="car" size={16} color="#6B7280" />
                          <Text style={styles.opText}>
                            {aiAnalysis.operational.vehicleRecommendation}
                          </Text>
                        </View>
                      )}
                      {aiAnalysis.operational.routeDifficulty && (
                        <View style={styles.opItem}>
                          <Ionicons
                            name="trail-sign"
                            size={16}
                            color="#6B7280"
                          />
                          <Text style={styles.opText}>
                            Độ khó: {aiAnalysis.operational.routeDifficulty}
                          </Text>
                        </View>
                      )}
                      {aiAnalysis.operational.urgencyLevel && (
                        <View style={styles.opItem}>
                          <Ionicons name="time" size={16} color="#6B7280" />
                          <Text style={styles.opText}>
                            Mức độ gấp: {aiAnalysis.operational.urgencyLevel}
                          </Text>
                        </View>
                      )}
                      {aiAnalysis.operational.cargoNotes && (
                        <View style={styles.opItem}>
                          <MaterialCommunityIcons
                            name="package-variant"
                            size={16}
                            color="#6B7280"
                          />
                          <Text style={styles.opText}>
                            {aiAnalysis.operational.cargoNotes}
                          </Text>
                        </View>
                      )}
                      {aiAnalysis.operational.routeNotes && (
                        <View style={styles.noteBox}>
                          <Text style={styles.noteTitle}>
                            📍 Ghi chú tuyến đường:
                          </Text>
                          <Text style={styles.noteText}>
                            {aiAnalysis.operational.routeNotes}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Recommended Actions */}
                {aiAnalysis.recommendedActions &&
                  aiAnalysis.recommendedActions.length > 0 && (
                    <View style={styles.aiSection}>
                      <View style={styles.aiSectionHeader}>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color="#F59E0B"
                        />
                        <Text style={styles.aiSectionTitle}>
                          Khuyến nghị hành động
                        </Text>
                      </View>
                      <View style={styles.aiSectionBody}>
                        {aiAnalysis.recommendedActions.map(
                          (action: string, idx: number) => (
                            <View key={idx} style={styles.actionItem}>
                              <Text style={styles.actionBullet}>•</Text>
                              <Text style={styles.actionText}>{action}</Text>
                            </View>
                          )
                        )}
                      </View>
                    </View>
                  )}

                {/* Risk Warning */}
                {aiAnalysis.riskWarning && (
                  <View style={styles.riskWarningBox}>
                    <Ionicons name="warning" size={20} color="#DC2626" />
                    <Text style={styles.riskWarningText}>
                      {aiAnalysis.riskWarning}
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}

            <View style={styles.aiModalFooter}>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => setShowAIModal(false)}
              >
                <Text style={styles.btnPrimaryText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Toast */}
      {toast.visible && (
        <View
          style={[
            styles.toast,
            toast.type === "success" ? styles.toastSuccess : styles.toastError,
          ]}
        >
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 16, paddingBottom: 120 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: { padding: 8, marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  aiBtn: {
    padding: 8,
    marginRight: 8,
    backgroundColor: "#F5F3FF",
    borderRadius: 8,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  pillText: { fontSize: 11, fontWeight: "700" },

  // Cards
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardNoPadding: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  // Map
  mapContainer: { height: 200 },
  routeInfoBox: { padding: 16, backgroundColor: "#FFF" },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  routeConnector: {
    height: 16,
    borderLeftWidth: 1,
    borderLeftColor: "#D1D5DB",
    borderStyle: "dashed",
    marginLeft: 6,
    marginVertical: 4,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  routeText: { fontSize: 14, color: "#1F2937", flex: 1, fontWeight: "500" },

  // Overview
  title: { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 8 },
  desc: { fontSize: 14, color: "#4B5563", lineHeight: 20 },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 16 },
  grid: { flexDirection: "row", justifyContent: "space-between" },
  gridItem: { alignItems: "center", flex: 1 },
  label: { fontSize: 12, color: "#6B7280", marginBottom: 4 },
  value: { fontSize: 14, fontWeight: "700", color: "#111827" },

  // Section
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Slot Card
  slotCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  slotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  slotTypeTag: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  slotTypeText: { fontSize: 12, fontWeight: "700", color: "#4338CA" },
  slotSalary: { fontSize: 16, fontWeight: "800", color: "#059669" },
  slotBody: { padding: 16, gap: 8 },
  slotRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  slotText: { fontSize: 13, color: "#374151" },
  slotCount: { fontWeight: "700", color: "#2563EB" },
  slotCountFull: { color: "#DC2626" },
  actionContainer: { padding: 16, paddingTop: 0, gap: 8 },
  customLocationBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    gap: 6,
  },
  customLocationText: { color: "#4F46E5", fontWeight: "600", fontSize: 13 },
  applyBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#4F46E5",
  },
  applyBtnSecondary: { backgroundColor: "#6B7280" },
  applyBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  btnDisabled: { backgroundColor: "#A5B4FC" },
  joinedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "#ECFDF5",
    gap: 8,
  },
  joinedText: { color: "#065F46", fontWeight: "600" },

  // Additional Info
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  infoLabel: { fontSize: 14, color: "#6B7280" },
  infoValue: { fontSize: 14, fontWeight: "600", color: "#111827" },

  // Driver Work Session Styles
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  sessionTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  availabilityGrid: { flexDirection: "row", alignItems: "stretch", gap: 12 },
  availabilityItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  availabilityLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
    textAlign: "center",
  },
  availabilityValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  availabilitySubtext: { fontSize: 11, color: "#9CA3AF", fontWeight: "600" },
  availabilityDivider: { width: 1, backgroundColor: "#E5E7EB" },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    padding: 10,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  warningBannerText: {
    flex: 1,
    fontSize: 13,
    color: "#991B1B",
    fontWeight: "600",
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    padding: 10,
    backgroundColor: "#ECFDF5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  successBannerText: {
    flex: 1,
    fontSize: 13,
    color: "#065F46",
    fontWeight: "600",
  },
  suitabilitySuccess: { gap: 8 },
  suitabilityError: { gap: 8 },
  suitabilityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  suitabilityLabel: { fontSize: 14, color: "#6B7280", flex: 1 },
  suitabilityValue: { fontSize: 14, fontWeight: "700", color: "#111827" },
  errorReason: {
    fontSize: 14,
    color: "#DC2626",
    fontWeight: "600",
    marginBottom: 8,
    padding: 10,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
    paddingTop: 40,
  },
  modalCard: { backgroundColor: "#FFF", borderRadius: 16, padding: 20 },
  locationModalCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    maxHeight: "90%",
  },
  confirmModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 20,
  },
  confirmModalCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  depositModalCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
  },
  depositModalHeader: { alignItems: "center", marginBottom: 20 },
  depositModalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginTop: 12,
    textAlign: "center",
  },
  depositInfoBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  depositInfoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  depositInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  depositInfoLabel: { fontSize: 14, color: "#6B7280" },
  depositInfoValue: { fontSize: 14, fontWeight: "600", color: "#111827" },
  dividerThin: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 12 },
  depositAmountLabel: { fontSize: 15, fontWeight: "700", color: "#111827" },
  depositAmountValue: { fontSize: 18, fontWeight: "800", color: "#F59E0B" },
  depositWarningBox: {
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 10,
    gap: 10,
    alignItems: "flex-start",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  depositWarningText: {
    flex: 1,
    fontSize: 13,
    color: "#991B1B",
    lineHeight: 20,
  },
  customLocSummary: {
    backgroundColor: "#F0F9FF",
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#3B82F6",
  },
  customLocTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E40AF",
    marginBottom: 6,
  },
  customLocText: { fontSize: 12, color: "#1E3A8A", marginTop: 2 },
  defaultLocSummary: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#6B7280",
  },
  defaultLocTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
  },
  defaultLocText: { fontSize: 12, color: "#4B5563", marginTop: 2 },
  locationModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  warningBox: {
    flexDirection: "row",
    backgroundColor: "#FFFBEB",
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  warningText: { flex: 1, fontSize: 12, color: "#92400E", lineHeight: 18 },
  inputGroup: { marginBottom: 16 },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  inputWrapper: { position: "relative" as "relative" },
  inputIcon: {
    position: "absolute" as "absolute",
    left: 12,
    top: 12,
    zIndex: 1,
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBoxText: { color: "#991B1B", fontSize: 13, fontWeight: "500" },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111827",
    textAlign: "center",
  },
  modalDesc: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  modalActions: { flexDirection: "row", gap: 12 },
  btnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  btnSecondaryText: { fontWeight: "600", color: "#374151" },
  btnPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#2563EB",
    alignItems: "center",
  },
  btnPrimaryText: { fontWeight: "600", color: "#FFF" },

  // Toast
  toast: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  toastSuccess: { backgroundColor: "#059669" },
  toastError: { backgroundColor: "#DC2626" },
  toastText: { color: "#FFF", fontWeight: "600" },
  errorText: { color: "#DC2626" },

  // AI Modal
  aiModalCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    maxHeight: "85%",
    maxWidth: 500,
    width: "100%",
    alignSelf: "center",
    marginTop: 20,
  },
  aiModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  aiModalTitleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  aiModalTitle: { fontSize: 20, fontWeight: "800", color: "#111827" },
  aiModalContent: { padding: 20 },
  aiModalFooter: { padding: 16, borderTopWidth: 1, borderTopColor: "#F3F4F6" },

  // Verdict
  verdictBadge: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
    gap: 8,
  },
  verdictGood: {
    backgroundColor: "#D1FAE5",
    borderWidth: 2,
    borderColor: "#059669",
  },
  verdictWarning: {
    backgroundColor: "#FEF3C7",
    borderWidth: 2,
    borderColor: "#F59E0B",
  },
  verdictText: { fontSize: 18, fontWeight: "800", color: "#111827" },
  scoreText: { fontSize: 16, fontWeight: "700", color: "#059669" },

  // Summary
  summaryBox: {
    backgroundColor: "#F0F9FF",
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
  },
  summaryText: {
    fontSize: 14,
    color: "#1E3A8A",
    lineHeight: 20,
    fontWeight: "500",
  },

  // AI Sections
  aiSection: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  aiSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  aiSectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  aiSectionBody: { gap: 10 },
  aiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  aiLabel: { fontSize: 13, color: "#6B7280", flex: 1 },
  aiValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    textAlign: "right",
  },
  detailsText: {
    fontSize: 13,
    color: "#4B5563",
    marginTop: 8,
    fontStyle: "italic",
    lineHeight: 18,
  },

  // Score Bar
  scoreBar: { marginTop: 8 },
  scoreBarLabel: { fontSize: 12, color: "#6B7280", marginBottom: 4 },
  scoreBarBg: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  scoreBarFill: { height: "100%", backgroundColor: "#059669", borderRadius: 4 },

  // Operational Items
  opItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  opText: { fontSize: 13, color: "#374151", flex: 1 },
  noteBox: {
    backgroundColor: "#FFFBEB",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  noteTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#92400E",
    marginBottom: 4,
  },
  noteText: { fontSize: 13, color: "#78350F", lineHeight: 18 },

  // Actions
  actionItem: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  actionBullet: { fontSize: 16, color: "#F59E0B", fontWeight: "700" },
  actionText: { fontSize: 13, color: "#374151", flex: 1, lineHeight: 18 },

  // Risk Warning
  riskWarningBox: {
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 10,
    gap: 10,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  riskWarningText: {
    flex: 1,
    fontSize: 13,
    color: "#991B1B",
    lineHeight: 18,
    fontWeight: "600",
  },
});

export default DriverPostTripDetailScreen;

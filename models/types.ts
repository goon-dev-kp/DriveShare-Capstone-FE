// --- ENUMS CƠ BẢN ---
export enum Role {
  DRIVER = "Driver",
  OWNER = "Owner",
  ADMIN = "Admin",
  PROVIDER = "Provider",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

// --- ITEM STATUS ---

export enum ItemStatus {
  PENDING = "PENDING",
  IN_WAREHOUSE = "IN_WAREHOUSE",
  PACKAGED = "PACKAGED",
  IN_USE = "IN_USE",
}

export enum ImageStatus {
  ACTIVE = "ACTIVE",
  DELETED = "DELETED",
}

// --- PACKAGE STATUS ---
export enum PackageStatus {
  PENDING = "PENDING", // Just created, not yet posted for delivery
  OPEN = "OPEN", // Posted for delivery, available for drivers
  CLOSED = "CLOSED", // A driver has accepted, or the job is finished
  DELETED = "DELETED", // Soft delete
}

// --- POST STATUS ---
export enum PostStatus {
  OPEN = "OPEN",
  IN_TRANSIT = "IN_TRANSIT",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

// --- VEHICLE STATUS ---
export enum VehicleStatus {
  ACTIVE = "ACTIVE",
  IN_USE = "IN_USE",
  INACTIVE = "INACTIVE",
  DELETED = "DELETED",
}

// --- DOCUMENT TYPE ---
export enum DocumentType {
  CCCD = "CCCD",
  DRIVER_LICENSE = "DRIVER_LICENSE",
  VEHICLE_LICENSE = "VEHICLE_LICENSE",
  CIVIL_INSURANCE = "CIVIL_INSURANCE", // BẢO HIỂM DÂN SỰ
  PHYSICAL_INSURANCE = "PHYSICAL_INSURANCE", // BẢO HIỂM VẬT CHẤT
}

// --- VEHICLE IMAGE TYPE ---
export enum VehicleImageType {
  OTHER = "OTHER", // Ảnh khác
  OVERVIEW = "OVERVIEW", // Ảnh toàn cảnh xe
  LICENSE_PLATE = "LICENSE_PLATE", // Ảnh biển số xe
}

// --- DOCUMENT STATUS ---
export enum DocumentStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

// --- INTERFACES CƠ BẢN ---
export interface User {
  userId: string;
  userName: string;
  email: string;
  phoneNumber: string;
  role: Role;
  userStatus: UserStatus;
  avatarUrl?: string;
}

export interface Provider extends User {
  companyName: string;
  taxCode?: string;
  bussinessAddress?: string;
  averageRating?: number;
}

export interface AuthenticatedUser extends User {
  accessToken: string;
  refreshToken: string;
}
// --- ITEM & PACKAGE INTERFACES ---

export interface ItemImage {
  itemImageId: string;
  itemImageURL: string;
  status: ImageStatus;
}

export interface Item {
  id: string;
  itemName: string;
  description?: string;
  declaredValue?: number;
  currency: string;
  providerId?: string;
  status: ItemStatus;
  images: ItemImage[];
  quantity?: number; // Added: inventory count
  unit?: string; // Added: inventory unit label
}

export interface PackageImage {
  packageImageId: string;
  packageImageURL?: string;
  imageUrl?: string;
  createdAt: string;
  status?: ImageStatus;
}

export interface Package {
  id: string;
  packageCode?: string;
  title: string;
  description?: string;
  quantity: number;
  unit: string;
  weightKg: number;
  volumeM3: number;
  images: PackageImage[];
  itemId: string;
  status: PackageStatus;
  otherRequirements?: string;
  handlingAttributes?: string[];
  isFragile?: boolean;
  isLiquid?: boolean;
  isRefrigerated?: boolean;
  isFlammable?: boolean;
  isHazardous?: boolean;
  isBulky?: boolean;
  isPerishable?: boolean;
  ownerId?: string;
  providerId?: string;
  postPackageId?: string;
  tripId?: string;
  createdAt?: string;
  packageImages?: PackageImage[];
}

export interface ShippingRoute {
  startLocation: string;
  endLocation: string;
  expectedPickupDate: string;
  expectedDeliveryDate: string;
  startTimeToPickup: string;
  endTimeToPickup: string;
  startTimeToDelivery: string;
  endTimeToDelivery: string;
}

// --- VEHICLE ---
export interface VehicleType {
  vehicleTypeId: string;
  vehicleTypeName: string;
  description?: string;
}

export interface VehicleImage {
  vehicleImageId: string;
  imageURL: string;
  caption?: string;
  createdAt?: string;
  imageType?: VehicleImageType;
}

export interface VehicleDocumentDetail {
  vehicleDocumentId: string;
  documentType: DocumentType;
  frontDocumentUrl?: string;
  backDocumentUrl?: string;
  expirationDate?: string;
  status: DocumentStatus;
  adminNotes?: string;
  createdAt: string;
  processedAt?: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  model?: string;
  brand?: string;
  color?: string;
  yearOfManufacture?: number;
  payloadInKg?: number;
  volumeInM3?: number;
  status?: VehicleStatus;
  vehicleType?: VehicleType;
  owner?: { userId: string; fullName?: string; companyName?: string };
  imageUrls?: VehicleImage[];
}

export interface OwnerDetail {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  createdAt: string;
  lastUpdatedAt: string;
  status: UserStatus;
  dateOfBirth?: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  address?: string;
  taxCode?: string;
  businessAddress?: string;
  companyName?: string;
  averageRating?: number;
}

export interface VehicleDetail extends Vehicle {
  vehicleId: string;
  vehicleType: VehicleType;
  owner: OwnerDetail;
  imageUrls: VehicleImage[];
  documents: VehicleDocumentDetail[];
}

// --- POST PACKAGE ---
export interface FreightPost {
  id: string;
  packageId: string;
  title: string;
  description: string;
  shippingRoute: ShippingRoute;
  status: PostStatus;
  packageDetails: Omit<Package, "id" | "itemId" | "status">;
  offeredPrice: number;
  providerId?: string;
  shippingRouteId?: string;
}

// models/types.ts (hoặc services/types.ts)

// 🚩 Tóm tắt Hình ảnh (dùng chung)
export interface ImageSummary {
  imageUrl: string; // Thêm id nếu cần, dựa trên DTO C# của bạn (ItemImageSummaryDTO)
  itemImageId?: string;
}

// 🚩 Tóm tắt Item (Hàng hóa)
export interface ItemSummary {
  itemId: string;
  itemName: string;
  description: string;
  declaredValue: number;
  images: string[]; // 🚩 Dựa trên JSON, đây là List<string>
}

// 🚩 Tóm tắt Package (Gói hàng)
export interface PackageSummary {
  packageId: string;
  packageCode: string;
  weight: number;
  volume: number;
  imageUrls: string[]; // 🚩 Thêm hình ảnh package
  items: ItemSummary[]; // 🚩 Chứa danh sách item
}

// 🚩 Tóm tắt Vehicle (Xe)
export interface VehicleSummary {
  vehicleId: string;
  plateNumber: string;
  model: string;
  vehicleTypeName: string;
  imageUrls: string[]; // 🚩 Thêm hình ảnh xe
}

// 🚩 Tóm tắt Owner (Chủ xe)
export interface OwnerSummary {
  ownerId: string;
  fullName: string;
  companyName: string;
  phoneNumber: string;
}

// 🚩 Tóm tắt Route (Lộ trình dự kiến)
export interface RouteDetail {
  startAddress: string;
  endAddress: string;
  estimatedDuration: string; // JSON trả về string "30.00:00:00"
}

// 🚩 Tóm tắt TripRoute (Lộ trình thực tế)
export interface TripRouteSummary {
  distanceKm: number;
  durationMinutes: number;
  routeData: string; // Đây là chuỗi JSON GeoJSON
}

// 🚩 Tóm tắt Provider (Nhà cung cấp)
export interface ProviderSummary {
  providerId: string;
  companyName: string;
  taxCode: string;
  averageRating: number;
}

// 🚩 Tóm tắt Driver (Tài xế)
export interface DriverAssignment {
  assignmentId: string;
  driverId: string;
  fullName: string;
  type: string; // "PRIMARY" | "SECONDARY"
  assignmentStatus: string;
  paymentStatus: string;
  baseAmount: number;
  depositAmount: number;
  depositStatus: string;
  startAddress?: string;
  startLat?: number;
  startLng?: number;
  endAddress?: string;
  endLat?: number;
  endLng?: number;
  isOnBoard: boolean; // ✅ CHECK-IN STATUS - Tài xế đã lên xe chưa
  onBoardTime: string | null;
  onBoardLocation: string | null;
  onBoardImage: string | null;
  checkInNote: string | null;
  isFinished: boolean;
  offBoardTime: string | null;
  offBoardLocation: string | null;
  offBoardImage: string | null;
  checkOutNote: string | null;
}

// 🚩 Tóm tắt Contact (Liên hệ)
export interface TripContact {
  tripContactId: string;
  type: "SENDER" | "RECEIVER";
  fullName: string;
  phoneNumber: string;
  note?: string;
}

// 🚩 Tóm tắt Contract (Hợp đồng)
export interface ContractSummary {
  contractId: string;
  contractCode: string;
  status: string;
  type: string;
  contractValue: number;
  currency: string;
  effectiveDate?: string;
  expirationDate?: string;
  fileURL?: string;
  // Optional terms when backend includes them (e.g., providerContracts)
  terms?: ContractTermInTripDTO[]; // UI-only (từ code cũ của bạn)
  signed?: boolean;
  signedAt?: string;
  // Signature states from backend
  ownerSigned?: boolean;
  ownerSignAt?: string;
  counterpartySigned?: boolean;
  counterpartySignAt?: string;
}

// 🚩 Contract Party (Bên ký kết)
export interface ContractPartyDTO {
  userId: string;
  fullName: string;
  companyName?: string;
  taxCode?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  role: string;
}

// 🚩 Contract Template
export interface ContractTemplateDTO {
  contractTemplateId: string;
  contractTemplateName: string;
  version: string;
  createdAt: string;
  type: string;
}

// 🚩 Contract Term Detail
export interface ContractTermDTO {
  contractTermId: string;
  content: string;
  order: number;
  contractTemplateId: string;
}

// 🚩 Trip Provider Contract Detail
export interface TripProviderContractDTO {
  contractId: string;
  contractCode: string;
  tripId: string;
  tripCode: string;
  contractTemplateId: string;
  templateName: string;
  version: string;
  contractValue: number;
  currency: string;
  status: string;
  type: string;
  ownerSigned: boolean;
  ownerSignAt?: string;
  providerSigned: boolean;
  providerSignAt?: string;
  fileURL?: string;
  createAt: string;
  effectiveDate?: string;
  expirationDate?: string;
  note?: string;
  partyA: ContractPartyDTO;
  partyB: ContractPartyDTO;
}

// 🚩 Trip Provider Contract Detail Response
export interface TripProviderContractDetailDTO {
  contract: TripProviderContractDTO;
  template: ContractTemplateDTO;
  terms: ContractTermDTO[];
}

// === 🚀 DTO CHÍNH CHO MÀN HÌNH CHI TIẾT ===
export interface TripDetailFullDTO {
  tripId: string;
  tripCode: string;
  status: string;
  createAt: string;
  updateAt: string;
  vehicle: VehicleSummary;
  owner: OwnerSummary;
  shippingRoute: RouteDetail;
  tripRoute: TripRouteSummary;
  provider?: ProviderSummary; // Có thể null
  packages: PackageSummary[]; // 🚩 Dùng DTO chi tiết
  drivers: DriverAssignment[];
  contacts: TripContact[];
  driverContracts: ContractSummary[];
  providerContracts: ContractSummary; // 🚩 Chỉ 1 // (Các trường khác như Records, Compensations, Issues... có thể thêm vào đây)
}

// --- CONTRACT TERMS (Chi tiết điều khoản trong hợp đồng) ---
export interface ContractTermInTripDTO {
  contractTermId: string;
  content: string;
  order: number;
  contractTemplateId: string;
}

// --- DELIVERY RECORD TERMS ---
export interface DeliveryRecordTermInTripDTO {
  deliveryRecordTermId: string;
  content: string;
  displayOrder: number;
}

// --- DELIVERY RECORD ---
export interface TripDeliveryRecordDTO {
  tripDeliveryRecordId: string;
  recordType: string;
  note?: string;
  createAt: string;
  terms: DeliveryRecordTermInTripDTO[];
}

// --- VEHICLE HANDOVER RECORD TERMS ---
export interface VehicleHandoverTermDTO {
  vehicleHandoverTermId: string;
  content: string;
  displayOrder: number;
  isChecked?: boolean;
  deviation?: string;
}

// --- VEHICLE HANDOVER RECORD ---
export interface TripVehicleHandoverRecordDTO {
  tripVehicleHandoverRecordId: string;
  recordType: string; // 'VEHICLE_PICKUP' or 'VEHICLE_DROPOFF'
  note?: string;
  createAt: string;
  terms: VehicleHandoverTermDTO[];
  driverSigned?: boolean;
  driverSignAt?: string;
  ownerSigned?: boolean;
  ownerSignAt?: string;
}

// --- COMPENSATION ---
export interface TripCompensationDTO {
  tripCompensationId: string;
  reason: string;
  amount: number;
}

// --- DELIVERY ISSUE ---
export interface TripDeliveryIssueDTO {
  tripDeliveryIssueId: string;
  issueType: string;
  description: string;
  status: string;
}

// Extend main DTO with additional collections from backend mapping
export interface TripDetailFullDTOExtended extends TripDetailFullDTO {
  deliveryRecords: TripDeliveryRecordDTO[];
  compensations: TripCompensationDTO[];
  issues: TripDeliveryIssueDTO[];
  tripVehicleHandoverRecordId?: string;
  tripVehicleReturnRecordId?: string;
  handoverReadDTOs?: any[]; // Array of vehicle handover records with status
}

// --- RESPONSE DTO CHUNG ---
export interface ResponseDTO<T = any> {
  statusCode: number;
  message?: string;
  isSuccess: boolean;
  result?: T;
}

// === Provider Trip Summary (from GetAllTripsByProviderAsync) ===
export interface ProviderTripSummary {
  tripId: string;
  tripCode: string;
  status: string;
  createAt: string;
  updateAt: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleType: string;
  ownerName: string;
  ownerCompany: string;
  startAddress: string;
  endAddress: string;
  estimatedDuration: string; // TimeSpan serialized
  packageCodes: string[];
  driverNames: string[];
  tripRouteSummary: string;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

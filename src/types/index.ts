export type Product = {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AIAccount = {
  id: string;
  productId: string;
  accountName: string;
  loginEmail?: string;
  note?: string;
  purchaseDate: string;
  durationMonths: 1 | 6 | 12;
  expiryDate: string;
  maxSlots: 5;
  status: "active" | "expired" | "disabled";
  createdAt: string;
  updatedAt: string;
};

export type Customer = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type Subscription = {
  id: string;
  customerId: string;
  aiAccountId: string;
  productId: string;
  registrationDate: string;
  durationMonths: 1 | 6 | 12;
  expiryDate: string;
  status: "active" | "expired" | "cancelled";
  note?: string;
  createdAt: string;
  updatedAt: string;
};

// Kiểu dữ liệu bổ sung hỗ trợ hiển thị UI và tính toán động
export type SlotStatus = "empty" | "available" | "full";
export type ExpiryStatus = "normal" | "warning" | "expired";

export type AIAccountWithSlots = AIAccount & {
  usedSlots: number;
  availableSlots: number;
  slotStatus: SlotStatus;
  expiryStatus: ExpiryStatus;
  productName: string;
};

export type SubscriptionDetail = Subscription & {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  productName: string;
  accountName: string;
  loginEmail?: string;
  expiryStatus: ExpiryStatus;
};

export type DashboardStats = {
  totalProducts: number;
  totalAIAccounts: number;
  totalCustomers: number;
  activeSubscriptions: number;
  totalUsedSlots: number;
  totalAvailableSlots: number;
  fullAccountsCount: number;
  warningAccountsCount: number;
  warningCustomersCount: number;
};

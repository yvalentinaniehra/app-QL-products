import type { Product, AIAccount, Customer, Subscription } from "../types";

const KEYS = {
  PRODUCTS: "ai_products",
  ACCOUNTS: "ai_accounts",
  CUSTOMERS: "ai_customers",
  SUBSCRIPTIONS: "ai_subscriptions",
  VERSION: "ai_data_version",
};

export const CURRENT_VERSION = "1.0.0";

// Dữ liệu mẫu khởi tạo
export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "p-chatgpt",
    name: "ChatGPT Plus",
    description: "Tài khoản ChatGPT Plus chính chủ, hỗ trợ GPT-4o và các tính năng nâng cao.",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "p-claude",
    name: "Claude Pro",
    description: "Trải nghiệm Claude 3.5 Sonnet và Opus với giới hạn tin nhắn cao hơn.",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "p-gemini",
    name: "Gemini Advanced",
    description: "Sử dụng Gemini 1.5 Pro tích hợp sâu vào Google Workspace.",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "p-canva",
    name: "Canva Pro",
    description: "Thiết kế đồ họa chuyên nghiệp không giới hạn tài nguyên.",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "p-perplexity",
    name: "Perplexity Pro",
    description: "Công cụ tìm kiếm AI chuyên sâu, hỗ trợ nhiều model (Claude, GPT, Gemini).",
    isActive: false, // Ngừng sử dụng sản phẩm này để test lọc
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

export const DEFAULT_ACCOUNTS: AIAccount[] = [
  {
    id: "acc-chatgpt-01",
    productId: "p-chatgpt",
    accountName: "ChatGPT Pro Team 01",
    loginEmail: "chatgpt.team01@gmail.com",
    note: "Tài khoản ChatGPT Plus mua gói 12 tháng. Chưa cấp cho khách nào.",
    purchaseDate: "2026-01-01",
    durationMonths: 12,
    expiryDate: "2027-01-01",
    maxSlots: 5,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "acc-claude-01",
    productId: "p-claude",
    accountName: "Claude Pro Shared 01",
    loginEmail: "claude.shared01@gmail.com",
    note: "Claude Pro gói 6 tháng. Đã cấp 3/5 slots active.",
    purchaseDate: "2026-03-01",
    durationMonths: 6,
    expiryDate: "2026-09-01",
    maxSlots: 5,
    status: "active",
    createdAt: "2026-03-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "acc-gemini-01",
    productId: "p-gemini",
    accountName: "Gemini Adv Promo 01",
    loginEmail: "gemini.promo01@gmail.com",
    note: "Gói 12 tháng. Đã cấp đủ 5/5 slots active. Sắp hết hạn vào ngày 28/07/2026.",
    purchaseDate: "2025-07-28",
    durationMonths: 12,
    expiryDate: "2026-07-28", // Ngày hiện tại là 18/07/2026 -> Còn 10 ngày (Sắp hết hạn)
    maxSlots: 5,
    status: "active",
    createdAt: "2025-07-28T00:00:00.000Z",
    updatedAt: "2025-07-28T00:00:00.000Z",
  },
  {
    id: "acc-canva-01",
    productId: "p-canva",
    accountName: "Canva Pro Agency 01",
    loginEmail: "canva.agency01@gmail.com",
    note: "Tài khoản Canva Pro đã hết hạn sử dụng.",
    purchaseDate: "2025-06-01",
    durationMonths: 12,
    expiryDate: "2026-06-01", // Đã hết hạn vào ngày 01/06/2026
    maxSlots: 5,
    status: "expired",
    createdAt: "2025-06-01T00:00:00.000Z",
    updatedAt: "2025-06-01T00:00:00.000Z",
  },
];

export const DEFAULT_CUSTOMERS: Customer[] = [
  { id: "cust-a", name: "Nguyễn Văn An", email: "an.nguyen@gmail.com", phone: "0901234567", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "cust-b", name: "Trần Thị Bình", email: "binh.tran@gmail.com", phone: "0912345678", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "cust-c", name: "Lê Văn Cường", email: "cuong.le@gmail.com", phone: "0923456789", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "cust-d", name: "Phạm Minh Đức", email: "duc.pham@gmail.com", phone: "0934567890", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "cust-e", name: "Hoàng Thanh Em", email: "em.hoang@gmail.com", phone: "0945678901", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "cust-f", name: "Ngô Quốc Khánh", email: "khanh.ngo@gmail.com", phone: "0956789012", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "cust-g", name: "Vũ Văn Giang", email: "giang.vu@gmail.com", phone: "0967890123", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "cust-h", name: "Đỗ Phương Hoa", email: "hoa.do@gmail.com", phone: "0978901234", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
];

export const DEFAULT_SUBSCRIPTIONS: Subscription[] = [
  // Đăng ký cho Tài khoản Claude (Cấp 3 khách active)
  {
    id: "sub-01",
    customerId: "cust-a",
    aiAccountId: "acc-claude-01",
    productId: "p-claude",
    registrationDate: "2026-03-01",
    durationMonths: 6,
    expiryDate: "2026-09-01",
    status: "active",
    note: "Đăng ký Claude Pro 6 tháng",
    createdAt: "2026-03-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "sub-02",
    customerId: "cust-d",
    aiAccountId: "acc-claude-01",
    productId: "p-claude",
    registrationDate: "2026-05-01",
    durationMonths: 1, // Đã hết hạn vào ngày 01/06/2026. Sẽ được tự động cập nhật là expired
    expiryDate: "2026-06-01",
    status: "expired",
    note: "Khách dùng thử 1 tháng, đã hết hạn.",
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
  },
  {
    id: "sub-03",
    customerId: "cust-e",
    aiAccountId: "acc-claude-01",
    productId: "p-claude",
    registrationDate: "2026-05-01",
    durationMonths: 1, // Đã hủy
    expiryDate: "2026-06-01",
    status: "cancelled",
    note: "Khách hủy đăng ký sớm.",
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
  },
  {
    id: "sub-04",
    customerId: "cust-f",
    aiAccountId: "acc-claude-01",
    productId: "p-claude",
    registrationDate: "2026-03-01",
    durationMonths: 6,
    expiryDate: "2026-09-01",
    status: "active",
    note: "Gói 6 tháng đồng hành cùng công ty.",
    createdAt: "2026-03-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "sub-05",
    customerId: "cust-g",
    aiAccountId: "acc-claude-01",
    productId: "p-claude",
    registrationDate: "2026-07-01",
    durationMonths: 1,
    expiryDate: "2026-08-01", // Active đến 01/08/2026
    status: "active",
    note: "Đăng ký ngắn hạn.",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  },

  // Đăng ký cho Tài khoản Gemini (Cấp 5/5 khách active)
  {
    id: "sub-gemini-1",
    customerId: "cust-b",
    aiAccountId: "acc-gemini-01",
    productId: "p-gemini",
    registrationDate: "2025-07-28",
    durationMonths: 12,
    expiryDate: "2026-07-28", // Active, sắp hết hạn (10 ngày nữa)
    status: "active",
    createdAt: "2025-07-28T00:00:00.000Z",
    updatedAt: "2025-07-28T00:00:00.000Z",
  },
  {
    id: "sub-gemini-2",
    customerId: "cust-c",
    aiAccountId: "acc-gemini-01",
    productId: "p-gemini",
    registrationDate: "2025-07-28",
    durationMonths: 12,
    expiryDate: "2026-07-28", // Active, sắp hết hạn
    status: "active",
    createdAt: "2025-07-28T00:00:00.000Z",
    updatedAt: "2025-07-28T00:00:00.000Z",
  },
  {
    id: "sub-gemini-3",
    customerId: "cust-d",
    aiAccountId: "acc-gemini-01",
    productId: "p-gemini",
    registrationDate: "2025-07-28",
    durationMonths: 12,
    expiryDate: "2026-07-28", // Active, sắp hết hạn
    status: "active",
    createdAt: "2025-07-28T00:00:00.000Z",
    updatedAt: "2025-07-28T00:00:00.000Z",
  },
  {
    id: "sub-gemini-4",
    customerId: "cust-h",
    aiAccountId: "acc-gemini-01",
    productId: "p-gemini",
    registrationDate: "2025-07-28",
    durationMonths: 12,
    expiryDate: "2026-07-28", // Active, sắp hết hạn
    status: "active",
    createdAt: "2025-07-28T00:00:00.000Z",
    updatedAt: "2025-07-28T00:00:00.000Z",
  },
  {
    id: "sub-gemini-5",
    customerId: "cust-a",
    aiAccountId: "acc-gemini-01",
    productId: "p-gemini",
    registrationDate: "2025-07-28",
    durationMonths: 12,
    expiryDate: "2026-07-28", // Active, sắp hết hạn
    status: "active",
    createdAt: "2025-07-28T00:00:00.000Z",
    updatedAt: "2025-07-28T00:00:00.000Z",
  },

  // Đăng ký cho Tài khoản Canva (1 khách đã hết hạn)
  {
    id: "sub-canva-1",
    customerId: "cust-h",
    aiAccountId: "acc-canva-01",
    productId: "p-canva",
    registrationDate: "2025-06-01",
    durationMonths: 12,
    expiryDate: "2026-06-01", // Đã hết hạn cùng tài khoản
    status: "expired",
    createdAt: "2025-06-01T00:00:00.000Z",
    updatedAt: "2025-06-01T00:00:00.000Z",
  },
];

export function getRawData<T>(key: string, defaultValue: T[]): T[] {
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${key} from localStorage`, error);
    return defaultValue;
  }
}

export function setRawData<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing ${key} to localStorage`, error);
  }
}

export function initializeStorage(forceReset = false): void {
  try {
    const version = localStorage.getItem(KEYS.VERSION);
    if (version !== CURRENT_VERSION || forceReset) {
      localStorage.clear();
      localStorage.setItem(KEYS.VERSION, CURRENT_VERSION);
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
      localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(DEFAULT_ACCOUNTS));
      localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(DEFAULT_CUSTOMERS));
      localStorage.setItem(KEYS.SUBSCRIPTIONS, JSON.stringify(DEFAULT_SUBSCRIPTIONS));
    } else {
      // Đảm bảo các key luôn tồn tại
      if (!localStorage.getItem(KEYS.PRODUCTS)) localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
      if (!localStorage.getItem(KEYS.ACCOUNTS)) localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(DEFAULT_ACCOUNTS));
      if (!localStorage.getItem(KEYS.CUSTOMERS)) localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(DEFAULT_CUSTOMERS));
      if (!localStorage.getItem(KEYS.SUBSCRIPTIONS)) localStorage.setItem(KEYS.SUBSCRIPTIONS, JSON.stringify(DEFAULT_SUBSCRIPTIONS));
    }
  } catch (error) {
    console.error("Error initializing localStorage", error);
  }
}

export const storage = {
  getProducts: () => getRawData<Product>(KEYS.PRODUCTS, DEFAULT_PRODUCTS),
  saveProducts: (products: Product[]) => setRawData<Product>(KEYS.PRODUCTS, products),
  
  getAccounts: () => getRawData<AIAccount>(KEYS.ACCOUNTS, DEFAULT_ACCOUNTS),
  saveAccounts: (accounts: AIAccount[]) => setRawData<AIAccount>(KEYS.ACCOUNTS, accounts),
  
  getCustomers: () => getRawData<Customer>(KEYS.CUSTOMERS, DEFAULT_CUSTOMERS),
  saveCustomers: (customers: Customer[]) => setRawData<Customer>(KEYS.CUSTOMERS, customers),
  
  getSubscriptions: () => getRawData<Subscription>(KEYS.SUBSCRIPTIONS, DEFAULT_SUBSCRIPTIONS),
  saveSubscriptions: (subscriptions: Subscription[]) => setRawData<Subscription>(KEYS.SUBSCRIPTIONS, subscriptions),

  clearAll: () => {
    localStorage.removeItem(KEYS.PRODUCTS);
    localStorage.removeItem(KEYS.ACCOUNTS);
    localStorage.removeItem(KEYS.CUSTOMERS);
    localStorage.removeItem(KEYS.SUBSCRIPTIONS);
    initializeStorage(true);
  },

  purgeAll: () => {
    localStorage.clear();
    localStorage.setItem(KEYS.VERSION, CURRENT_VERSION);
    setRawData(KEYS.PRODUCTS, []);
    setRawData(KEYS.ACCOUNTS, []);
    setRawData(KEYS.CUSTOMERS, []);
    setRawData(KEYS.SUBSCRIPTIONS, []);
  }
};

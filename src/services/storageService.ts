import type { Product, AIAccount, Customer, Subscription, AIAccountWithSlots, SubscriptionDetail, DashboardStats } from "../types";
import { storage, CURRENT_VERSION, DEFAULT_PRODUCTS, DEFAULT_ACCOUNTS, DEFAULT_CUSTOMERS, DEFAULT_SUBSCRIPTIONS } from "../storage/localStorage";
import { calculateExpiryDate, getExpiryStatus } from "../utils/date";
import { formatISO } from "date-fns";

// Helper để tạo id ngẫu nhiên — dùng crypto API an toàn hơn Math.random()
function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().replace(/-/g, '').substring(0, 12)}`;
}

// Lấy thời gian ISO hiện tại
function getNowISO(): string {
  return new Date().toISOString();
}

/**
 * Tự động cập nhật trạng thái các tài khoản AI và các đăng ký đã hết hạn dựa trên ngày hiện tại.
 */
export function autoUpdateStatuses(): void {
  const todayStr = formatISO(new Date(), { representation: "date" }); // yyyy-MM-dd
  
  // 1. Cập nhật Subscriptions hết hạn
  const subscriptions = storage.getSubscriptions();
  let subChanged = false;
  const updatedSubscriptions = subscriptions.map((sub) => {
    if (sub.status === "active" && sub.expiryDate < todayStr) {
      subChanged = true;
      return {
        ...sub,
        status: "expired" as const,
        updatedAt: getNowISO(),
      };
    }
    return sub;
  });
  if (subChanged) {
    storage.saveSubscriptions(updatedSubscriptions);
  }

  // 2. Cập nhật AI Accounts hết hạn
  const accounts = storage.getAccounts();
  let accChanged = false;
  const updatedAccounts = accounts.map((acc) => {
    if (acc.status === "active" && acc.expiryDate < todayStr) {
      accChanged = true;
      return {
        ...acc,
        status: "expired" as const,
        updatedAt: getNowISO(),
      };
    }
    return acc;
  });
  if (accChanged) {
    storage.saveAccounts(updatedAccounts);
  }
}

export const storageService = {
  // ==========================================
  // PRODUCT SERVICES
  // ==========================================
  getProducts: (): Product[] => {
    return storage.getProducts();
  },

  getProductById: (id: string): Product | undefined => {
    return storage.getProducts().find((p) => p.id === id);
  },

  createProduct: (data: Omit<Product, "id" | "createdAt" | "updatedAt">): Product => {
    const products = storage.getProducts();
    const newProduct: Product = {
      ...data,
      id: generateId("p"),
      createdAt: getNowISO(),
      updatedAt: getNowISO(),
    };
    products.push(newProduct);
    storage.saveProducts(products);
    return newProduct;
  },

  updateProduct: (id: string, data: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>): Product => {
    const products = storage.getProducts();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) throw new Error("Không tìm thấy sản phẩm");
    
    const updatedProduct: Product = {
      ...products[index],
      ...data,
      updatedAt: getNowISO(),
    };
    products[index] = updatedProduct;
    storage.saveProducts(products);
    return updatedProduct;
  },

  deleteProduct: (id: string): void => {
    const accounts = storage.getAccounts();
    const hasLinkedAccount = accounts.some((acc) => acc.productId === id);
    if (hasLinkedAccount) {
      throw new Error("Không thể xóa sản phẩm đã liên kết với tài khoản AI. Vui lòng xóa tài khoản hoặc đổi sản phẩm của tài khoản trước.");
    }
    
    const products = storage.getProducts();
    const filtered = products.filter((p) => p.id !== id);
    storage.saveProducts(filtered);
  },

  // ==========================================
  // AI ACCOUNT SERVICES
  // ==========================================
  getAccounts: (): AIAccountWithSlots[] => {
    autoUpdateStatuses();
    const accounts = storage.getAccounts();
    const subscriptions = storage.getSubscriptions();
    const products = storage.getProducts();

    return accounts.map((acc) => {
      // Chỉ tính các subscription đang hoạt động (active) cho tài khoản này
      const activeSubs = subscriptions.filter(
        (sub) => sub.aiAccountId === acc.id && sub.status === "active"
      );
      
      const usedSlots = activeSubs.length;
      const availableSlots = Math.max(0, acc.maxSlots - usedSlots);
      
      let slotStatus: "empty" | "available" | "full" = "empty";
      if (usedSlots === acc.maxSlots) {
        slotStatus = "full";
      } else if (usedSlots > 0) {
        slotStatus = "available";
      }

      const expiryStatus = getExpiryStatus(acc.expiryDate);
      const productName = products.find((p) => p.id === acc.productId)?.name || "Sản phẩm không xác định";

      return {
        ...acc,
        usedSlots,
        availableSlots,
        slotStatus,
        expiryStatus,
        productName,
      };
    });
  },

  getAccountById: (id: string): AIAccountWithSlots | undefined => {
    return storageService.getAccounts().find((acc) => acc.id === id);
  },

  createAccount: (data: Omit<AIAccount, "id" | "expiryDate" | "maxSlots" | "createdAt" | "updatedAt">): AIAccount => {
    const accounts = storage.getAccounts();
    const expiryDate = calculateExpiryDate(data.purchaseDate, data.durationMonths);
    
    // Tự động kiểm tra hạn để set status ban đầu
    const todayStr = formatISO(new Date(), { representation: "date" });
    let status = data.status;
    if (status === "active" && expiryDate < todayStr) {
      status = "expired";
    }

    const newAccount: AIAccount = {
      ...data,
      id: generateId("acc"),
      maxSlots: 5,
      expiryDate,
      status,
      createdAt: getNowISO(),
      updatedAt: getNowISO(),
    };
    accounts.push(newAccount);
    storage.saveAccounts(accounts);
    return newAccount;
  },

  updateAccount: (id: string, data: Partial<Omit<AIAccount, "id" | "maxSlots" | "createdAt" | "updatedAt">>): AIAccount => {
    const accounts = storage.getAccounts();
    const index = accounts.findIndex((acc) => acc.id === id);
    if (index === -1) throw new Error("Không tìm thấy tài khoản AI");

    const currentAccount = accounts[index];
    const purchaseDate = data.purchaseDate ?? currentAccount.purchaseDate;
    const durationMonths = data.durationMonths ?? currentAccount.durationMonths;
    const expiryDate = calculateExpiryDate(purchaseDate, durationMonths);

    // Tự động kiểm tra hạn để set status
    let status = data.status ?? currentAccount.status;
    const todayStr = formatISO(new Date(), { representation: "date" });
    if (status === "active" && expiryDate < todayStr) {
      status = "expired";
    } else if (status === "expired" && expiryDate >= todayStr) {
      status = "active";
    }

    const updatedAccount: AIAccount = {
      ...currentAccount,
      ...data,
      expiryDate,
      status,
      updatedAt: getNowISO(),
    };

    // Nếu cập nhật tài khoản làm thay đổi ngày hết hạn, kiểm tra xem có subscription active nào vượt quá ngày hết hạn mới hay không
    if (expiryDate !== currentAccount.expiryDate) {
      const activeSubs = storage.getSubscriptions().filter(
        (sub) => sub.aiAccountId === id && sub.status === "active"
      );
      const hasInvalidSub = activeSubs.some((sub) => sub.expiryDate > expiryDate);
      if (hasInvalidSub) {
        throw new Error(`Không thể cập nhật tài khoản: Ngày hết hạn mới (${expiryDate}) nhỏ hơn ngày hết hạn của khách hàng đang hoạt động thuộc tài khoản này.`);
      }
    }

    accounts[index] = updatedAccount;
    storage.saveAccounts(accounts);
    return updatedAccount;
  },

  deleteAccount: (id: string, forceDeleteRelated = false): void => {
    const subscriptions = storage.getSubscriptions();
    const activeSubs = subscriptions.filter((sub) => sub.aiAccountId === id && sub.status === "active");

    if (activeSubs.length > 0 && !forceDeleteRelated) {
      throw new Error("Không thể xóa tài khoản AI đang có khách hàng sử dụng hoạt động. Vui lòng hủy/xóa các đăng ký của khách hàng trước hoặc chọn tùy chọn xóa liên quan.");
    }

    const accounts = storage.getAccounts();
    const filteredAccounts = accounts.filter((acc) => acc.id !== id);
    storage.saveAccounts(filteredAccounts);

    // Cascade delete/update subscriptions
    const updatedSubs = forceDeleteRelated 
      ? subscriptions.filter((sub) => sub.aiAccountId !== id)
      : subscriptions.map((sub) => sub.aiAccountId === id ? { ...sub, status: "cancelled" as const, updatedAt: getNowISO() } : sub);
    
    storage.saveSubscriptions(updatedSubs);
  },

  // ==========================================
  // CUSTOMER SERVICES
  // ==========================================
  getCustomers: (): Customer[] => {
    return storage.getCustomers();
  },

  getCustomerById: (id: string): Customer | undefined => {
    return storage.getCustomers().find((cust) => cust.id === id);
  },

  createCustomer: (data: Omit<Customer, "id" | "createdAt" | "updatedAt">): Customer => {
    const customers = storage.getCustomers();
    const newCustomer: Customer = {
      ...data,
      id: generateId("cust"),
      createdAt: getNowISO(),
      updatedAt: getNowISO(),
    };
    customers.push(newCustomer);
    storage.saveCustomers(customers);
    return newCustomer;
  },

  updateCustomer: (id: string, data: Partial<Omit<Customer, "id" | "createdAt" | "updatedAt">>): Customer => {
    const customers = storage.getCustomers();
    const index = customers.findIndex((cust) => cust.id === id);
    if (index === -1) throw new Error("Không tìm thấy khách hàng");

    const updatedCustomer: Customer = {
      ...customers[index],
      ...data,
      updatedAt: getNowISO(),
    };
    customers[index] = updatedCustomer;
    storage.saveCustomers(customers);
    return updatedCustomer;
  },

  deleteCustomer: (id: string): void => {
    const activeSubs = storage.getSubscriptions().filter((sub) => sub.customerId === id && sub.status === "active");
    if (activeSubs.length > 0) {
      throw new Error("Không thể xóa khách hàng đang có đăng ký dịch vụ hoạt động. Vui lòng hủy đăng ký trước.");
    }

    const customers = storage.getCustomers();
    const filteredCustomers = customers.filter((cust) => cust.id !== id);
    storage.saveCustomers(filteredCustomers);

    // Dọn các subscription cũ (cancelled/expired) của khách hàng này để giải phóng bộ nhớ
    const subscriptions = storage.getSubscriptions();
    const filteredSubs = subscriptions.filter((sub) => sub.customerId !== id);
    storage.saveSubscriptions(filteredSubs);
  },

  // ==========================================
  // SUBSCRIPTION SERVICES
  // ==========================================
  getSubscriptions: (): Subscription[] => {
    autoUpdateStatuses();
    return storage.getSubscriptions();
  },

  getSubscriptionsWithDetails: (): SubscriptionDetail[] => {
    autoUpdateStatuses();
    const subscriptions = storage.getSubscriptions();
    const customers = storage.getCustomers();
    const accounts = storage.getAccounts();
    const products = storage.getProducts();

    return subscriptions.map((sub) => {
      const customer = customers.find((c) => c.id === sub.customerId);
      const account = accounts.find((a) => a.id === sub.aiAccountId);
      const product = products.find((p) => p.id === sub.productId);

      return {
        ...sub,
        customerName: customer?.name || "Khách hàng không xác định",
        customerEmail: customer?.email,
        customerPhone: customer?.phone,
        productName: product?.name || "Sản phẩm không xác định",
        accountName: account?.accountName || "Tài khoản không xác định",
        loginEmail: account?.loginEmail,
        expiryStatus: getExpiryStatus(sub.expiryDate),
      };
    });
  },

  createSubscription: (data: Omit<Subscription, "id" | "expiryDate" | "productId" | "createdAt" | "updatedAt">): Subscription => {
    const subscriptions = storage.getSubscriptions();
    const accounts = storage.getAccounts();
    
    // Tìm tài khoản AI
    const account = accounts.find((acc) => acc.id === data.aiAccountId);
    if (!account) throw new Error("Tài khoản AI không tồn tại");

    // 1. Ràng buộc: Trạng thái tài khoản phải active
    if (account.status !== "active") {
      throw new Error("Không thể cấp tài khoản đã hết hạn hoặc đang bị vô hiệu hóa.");
    }

    // 2. Ràng buộc: Sức chứa không vượt quá 5 slot active
    const activeSubsForAccount = subscriptions.filter(
      (sub) => sub.aiAccountId === data.aiAccountId && sub.status === "active"
    );
    if (activeSubsForAccount.length >= 5) {
      throw new Error("Tài khoản AI này đã đầy chỗ (5/5). Không thể cấp thêm khách hàng mới.");
    }

    // 3. Ràng buộc: Không tạo 2 subscription active giống nhau cho cùng khách và cùng tài khoản
    if (data.status === "active") {
      const duplicateSub = subscriptions.some(
        (sub) => sub.customerId === data.customerId && sub.aiAccountId === data.aiAccountId && sub.status === "active"
      );
      if (duplicateSub) {
        throw new Error("Khách hàng này đã được cấp tài khoản AI này và đang hoạt động.");
      }
    }

    // Tính expiryDate của khách
    const duration = data.durationMonths ?? 12; // Mặc định 12 tháng nếu không chọn
    const expiryDate = calculateExpiryDate(data.registrationDate, duration);

    // 4. Ràng buộc: Ngày hết hạn của khách không được vượt quá ngày hết hạn của tài khoản
    if (expiryDate > account.expiryDate && data.status === "active") {
      throw new Error(`Ngày hết hạn của khách (${expiryDate}) không được vượt quá ngày hết hạn của tài khoản AI (${account.expiryDate}). Vui lòng chọn thời hạn ngắn hơn hoặc gia hạn tài khoản gốc.`);
    }

    const newSub: Subscription = {
      ...data,
      id: generateId("sub"),
      productId: account.productId, // Lấy tự động từ tài khoản AI
      durationMonths: duration,
      expiryDate,
      createdAt: getNowISO(),
      updatedAt: getNowISO(),
    };

    subscriptions.push(newSub);
    storage.saveSubscriptions(subscriptions);
    return newSub;
  },

  updateSubscription: (id: string, data: Partial<Omit<Subscription, "id" | "productId" | "createdAt" | "updatedAt">>): Subscription => {
    const subscriptions = storage.getSubscriptions();
    const index = subscriptions.findIndex((sub) => sub.id === id);
    if (index === -1) throw new Error("Không tìm thấy đăng ký");

    const currentSub = subscriptions[index];
    const aiAccountId = data.aiAccountId ?? currentSub.aiAccountId;
    const customerId = data.customerId ?? currentSub.customerId;
    const status = data.status ?? currentSub.status;

    const accounts = storage.getAccounts();
    const account = accounts.find((acc) => acc.id === aiAccountId);
    if (!account) throw new Error("Tài khoản AI không tồn tại");

    // Nếu thay đổi tài khoản hoặc kích hoạt lại
    if (aiAccountId !== currentSub.aiAccountId || (status === "active" && currentSub.status !== "active")) {
      if (account.status !== "active") {
        throw new Error("Không thể cấp tài khoản đã hết hạn hoặc đang bị vô hiệu hóa.");
      }
      
      const activeSubsForAccount = subscriptions.filter(
        (sub) => sub.aiAccountId === aiAccountId && sub.status === "active" && sub.id !== id
      );
      if (activeSubsForAccount.length >= 5) {
        throw new Error("Tài khoản AI này đã đầy chỗ (5/5). Không thể chuyển khách sang tài khoản này.");
      }
    }

    // Check duplicate
    if (status === "active") {
      const duplicateSub = subscriptions.some(
        (sub) => sub.customerId === customerId && sub.aiAccountId === aiAccountId && sub.status === "active" && sub.id !== id
      );
      if (duplicateSub) {
        throw new Error("Khách hàng này đã được cấp tài khoản AI này và đang hoạt động.");
      }
    }

    const registrationDate = data.registrationDate ?? currentSub.registrationDate;
    const durationMonths = data.durationMonths ?? currentSub.durationMonths;
    const expiryDate = calculateExpiryDate(registrationDate, durationMonths);

    // Ràng buộc hạn dùng
    if (expiryDate > account.expiryDate && status === "active") {
      throw new Error(`Ngày hết hạn của khách (${expiryDate}) không được vượt quá ngày hết hạn của tài khoản AI (${account.expiryDate}).`);
    }

    const updatedSub: Subscription = {
      ...currentSub,
      ...data,
      productId: account.productId,
      expiryDate,
      updatedAt: getNowISO(),
    };

    subscriptions[index] = updatedSub;
    storage.saveSubscriptions(subscriptions);
    return updatedSub;
  },

  cancelSubscription: (id: string): void => {
    const subscriptions = storage.getSubscriptions();
    const index = subscriptions.findIndex((sub) => sub.id === id);
    if (index === -1) throw new Error("Không tìm thấy đăng ký");

    subscriptions[index] = {
      ...subscriptions[index],
      status: "cancelled",
      updatedAt: getNowISO(),
    };
    storage.saveSubscriptions(subscriptions);
  },

  deleteSubscription: (id: string): void => {
    const subscriptions = storage.getSubscriptions();
    const filtered = subscriptions.filter((sub) => sub.id !== id);
    storage.saveSubscriptions(filtered);
  },

  // ==========================================
  // DASHBOARD SERVICES
  // ==========================================
  getDashboardStats: (): DashboardStats => {
    const products = storageService.getProducts();
    const accounts = storageService.getAccounts();
    const customers = storageService.getCustomers();
    const subscriptions = storageService.getSubscriptions();

    const totalProducts = products.length;
    const totalAIAccounts = accounts.length;
    const totalCustomers = customers.length;
    
    const activeSubscriptions = subscriptions.filter((sub) => sub.status === "active").length;
    
    // Tính tổng số slots đang dùng trên tất cả các accounts active
    const totalUsedSlots = accounts.reduce((acc, curr) => acc + curr.usedSlots, 0);
    const totalAvailableSlots = accounts.reduce((acc, curr) => acc + curr.availableSlots, 0);
    
    const fullAccountsCount = accounts.filter((acc) => acc.slotStatus === "full").length;
    const warningAccountsCount = accounts.filter((acc) => acc.expiryStatus === "warning").length;
    
    // Đếm khách hàng sắp hết hạn trong 30 ngày (status === active và expiryStatus === warning)
    const warningCustomersCount = subscriptions.filter(
      (sub) => sub.status === "active" && getExpiryStatus(sub.expiryDate) === "warning"
    ).length;

    return {
      totalProducts,
      totalAIAccounts,
      totalCustomers,
      activeSubscriptions,
      totalUsedSlots,
      totalAvailableSlots,
      fullAccountsCount,
      warningAccountsCount,
      warningCustomersCount,
    };
  },

  // ==========================================
  // BACKUP & RESTORE SERVICES
  // ==========================================
  getDemoData: () => {
    return {
      products: DEFAULT_PRODUCTS,
      accounts: DEFAULT_ACCOUNTS,
      customers: DEFAULT_CUSTOMERS,
      subscriptions: DEFAULT_SUBSCRIPTIONS
    };
  },

  exportData: (): string => {
    const data = {
      products: storage.getProducts(),
      accounts: storage.getAccounts(),
      customers: storage.getCustomers(),
      subscriptions: storage.getSubscriptions(),
      version: CURRENT_VERSION,
      exportedAt: getNowISO(),
    };
    return JSON.stringify(data, null, 2);
  },

  importData: (jsonStr: string): void => {
    try {
      const data = JSON.parse(jsonStr);
      
      // Kiểm tra cấu trúc dữ liệu thô
      if (!data.products || !Array.isArray(data.products) ||
          !data.accounts || !Array.isArray(data.accounts) ||
          !data.customers || !Array.isArray(data.customers) ||
          !data.subscriptions || !Array.isArray(data.subscriptions)) {
        throw new Error("Cấu trúc file backup không hợp lệ. Vui lòng kiểm tra lại file.");
      }

      // Validate sơ bộ dữ liệu
      // (Thực tế Zod schema sẽ được dùng ở tầng cao hơn hoặc tại đây)
      storage.saveProducts(data.products);
      storage.saveAccounts(data.accounts);
      storage.saveCustomers(data.customers);
      storage.saveSubscriptions(data.subscriptions);
      
      // Auto update status ngay sau khi import
      autoUpdateStatuses();
    } catch (e) {
      throw new Error(`Lỗi phân tích cú pháp JSON hoặc lỗi lưu trữ: ${(e as Error).message}`);
    }
  }
};

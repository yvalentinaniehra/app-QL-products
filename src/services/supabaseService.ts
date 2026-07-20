import { supabase } from "./supabaseClient";
import type { 
  Product, 
  AIAccount, 
  Customer, 
  Subscription, 
  AIAccountWithSlots, 
  SubscriptionDetail, 
  DashboardStats 
} from "../types";
import { calculateExpiryDate, getExpiryStatus } from "../utils/date";

// Helper để tạo id ngẫu nhiên — dùng crypto API an toàn hơn Math.random()
function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().replace(/-/g, '').substring(0, 12)}`;
}

// ============================================================================
// 1. MAPPERS (CHUYỂN ĐỔI SNAKE_CASE <-> CAMELCASE)
// ============================================================================

const mapProductFromDB = (p: any): Product => ({
  id: p.id,
  name: p.name,
  description: p.description || "",
  isActive: p.is_active,
  createdAt: p.created_at,
  updatedAt: p.updated_at
});

const mapAccountFromDB = (a: any): AIAccount => ({
  id: a.id,
  productId: a.product_id,
  accountName: a.account_name,
  loginEmail: a.login_email || "",
  note: a.note || "",
  purchaseDate: a.purchase_date,
  durationMonths: a.duration_months as 1 | 6 | 12,
  expiryDate: a.expiry_date,
  maxSlots: a.max_slots,
  status: a.status as "active" | "expired" | "disabled",
  createdAt: a.created_at,
  updatedAt: a.updated_at
});

const mapCustomerFromDB = (c: any): Customer => ({
  id: c.id,
  name: c.name,
  email: c.email || "",
  phone: c.phone || "",
  note: c.note || "",
  createdAt: c.created_at,
  updatedAt: c.updated_at
});

const mapSubscriptionFromDB = (s: any): Subscription => ({
  id: s.id,
  customerId: s.customer_id,
  aiAccountId: s.ai_account_id,
  productId: s.product_id,
  registrationDate: s.registration_date,
  durationMonths: s.duration_months as 1 | 6 | 12,
  expiryDate: s.expiry_date,
  status: s.status as "active" | "expired" | "cancelled",
  note: s.note || "",
  createdAt: s.created_at,
  updatedAt: s.updated_at
});

const mapProductToDB = (p: Partial<Product>) => {
  const res: any = {};
  if (p.name !== undefined) res.name = p.name;
  if (p.description !== undefined) res.description = p.description;
  if (p.isActive !== undefined) res.is_active = p.isActive;
  res.updated_at = new Date().toISOString();
  return res;
};

const mapAccountToDB = (a: any) => {
  const res: any = {};
  if (a.productId !== undefined) res.product_id = a.productId;
  if (a.accountName !== undefined) res.account_name = a.accountName;
  if (a.loginEmail !== undefined) res.login_email = a.loginEmail;
  if (a.note !== undefined) res.note = a.note;
  if (a.purchaseDate !== undefined) res.purchase_date = a.purchaseDate;
  if (a.durationMonths !== undefined) res.duration_months = a.durationMonths;
  if (a.expiryDate !== undefined) res.expiry_date = a.expiryDate;
  if (a.status !== undefined) res.status = a.status;
  res.updated_at = new Date().toISOString();
  return res;
};

const mapCustomerToDB = (c: any) => {
  const res: any = {};
  if (c.name !== undefined) res.name = c.name;
  if (c.email !== undefined) res.email = c.email;
  if (c.phone !== undefined) res.phone = c.phone;
  if (c.note !== undefined) res.note = c.note;
  res.updated_at = new Date().toISOString();
  return res;
};

const mapSubscriptionToDB = (s: any) => {
  const res: any = {};
  if (s.customerId !== undefined) res.customer_id = s.customerId;
  if (s.aiAccountId !== undefined) res.ai_account_id = s.aiAccountId;
  if (s.productId !== undefined) res.product_id = s.productId;
  if (s.registrationDate !== undefined) res.registration_date = s.registrationDate;
  if (s.durationMonths !== undefined) res.duration_months = s.durationMonths;
  if (s.expiryDate !== undefined) res.expiry_date = s.expiryDate;
  if (s.status !== undefined) res.status = s.status;
  res.updated_at = new Date().toISOString();
  return res;
};

// ============================================================================
// 2. AUTO UPDATE STATUSES (TỰ ĐỘNG CẬP NHẬT TRẠNG THÁI HẾT HẠN TRÊN CLOUD)
// ============================================================================

export async function autoUpdateStatuses(): Promise<void> {
  if (!supabase) return;
  const todayStr = new Date().toISOString().split("T")[0];
  try {
    // Cập nhật tài khoản AI hết hạn
    await supabase
      .from("ai_accounts")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("status", "active")
      .lt("expiry_date", todayStr);

    // Cập nhật đăng ký hết hạn
    await supabase
      .from("subscriptions")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("status", "active")
      .lt("expiry_date", todayStr);
  } catch (error) {
    console.error("Lỗi khi tự động cập nhật trạng thái trên Supabase:", error);
  }
}

// ============================================================================
// 3. CORE SERVICES (CRUD & BUSINESS LOGICS)
// ============================================================================

export const supabaseService = {
  // --- PRODUCTS SERVICE ---
  getProducts: async (): Promise<Product[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(mapProductFromDB);
  },

  createProduct: async (data: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<void> => {
    if (!supabase) return;
    const newProduct = {
      id: generateId("p"),
      name: data.name,
      description: data.description || "",
      is_active: data.isActive,
    };
    const { error } = await supabase.from("products").insert(newProduct);
    if (error) throw error;
  },

  updateProduct: async (id: string, data: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>): Promise<void> => {
    if (!supabase) return;
    const dbData = mapProductToDB(data);
    const { error } = await supabase.from("products").update(dbData).eq("id", id);
    if (error) throw error;
  },

  deleteProduct: async (id: string): Promise<void> => {
    if (!supabase) return;
    // Chặn xóa nếu có tài khoản AI gốc đang liên kết
    const { count, error: countErr } = await supabase
      .from("ai_accounts")
      .select("*", { count: "exact", head: true })
      .eq("product_id", id);
    if (countErr) throw countErr;
    if (count && count > 0) {
      throw new Error("Không thể xóa sản phẩm này vì đang có tài khoản AI liên kết. Vui lòng xóa tài khoản trước.");
    }

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
  },

  // --- ACCOUNTS SERVICE ---
  getAccounts: async (): Promise<AIAccountWithSlots[]> => {
    if (!supabase) return [];

    // Lấy accounts kèm thông tin product
    const { data: accountsData, error: accErr } = await supabase
      .from("ai_accounts")
      .select("*, products(name)");
    if (accErr) throw accErr;

    // Lấy toàn bộ subscriptions active để đếm slots
    const { data: subsData, error: subsErr } = await supabase
      .from("subscriptions")
      .select("ai_account_id")
      .eq("status", "active");
    if (subsErr) throw subsErr;

    const activeSubsCountMap = (subsData || []).reduce((acc: Record<string, number>, sub: any) => {
      acc[sub.ai_account_id] = (acc[sub.ai_account_id] || 0) + 1;
      return acc;
    }, {});

    return (accountsData || []).map((a: any) => {
      const account = mapAccountFromDB(a);
      const usedSlots = activeSubsCountMap[a.id] || 0;
      const availableSlots = Math.max(0, a.max_slots - usedSlots);

      let slotStatus: "empty" | "available" | "full" = "empty";
      if (usedSlots >= a.max_slots) slotStatus = "full";
      else if (usedSlots > 0) slotStatus = "available";

      const expiryStatus = getExpiryStatus(account.expiryDate);

      return {
        ...account,
        productName: a.products?.name || "Sản phẩm không xác định",
        usedSlots,
        availableSlots,
        slotStatus,
        expiryStatus,
      };
    });
  },

  createAccount: async (data: Omit<AIAccount, "id" | "expiryDate" | "maxSlots" | "createdAt" | "updatedAt">): Promise<void> => {
    if (!supabase) return;
    const expiryDate = calculateExpiryDate(data.purchaseDate, data.durationMonths);
    const newAccount = {
      id: generateId("acc"),
      product_id: data.productId,
      account_name: data.accountName,
      login_email: data.loginEmail || "",
      note: data.note || "",
      purchase_date: data.purchaseDate,
      duration_months: data.durationMonths,
      expiry_date: expiryDate,
      max_slots: 5,
      status: data.status || "active",
    };
    const { error } = await supabase.from("ai_accounts").insert(newAccount);
    if (error) throw error;
  },

  updateAccount: async (id: string, data: Partial<Omit<AIAccount, "id" | "maxSlots" | "createdAt" | "updatedAt">>): Promise<void> => {
    if (!supabase) return;
    const dbData = mapAccountToDB(data);

    // Nếu thay đổi ngày mua hoặc thời hạn, tính toán lại ngày hết hạn
    if (data.purchaseDate || data.durationMonths) {
      // Đọc thông tin cũ để lấy các trường còn thiếu
      const { data: oldAcc, error: readErr } = await supabase.from("ai_accounts").select("*").eq("id", id).single();
      if (readErr) throw readErr;

      const pDate = data.purchaseDate || oldAcc.purchase_date;
      const dMonths = data.durationMonths || oldAcc.duration_months;
      dbData.expiry_date = calculateExpiryDate(pDate, dMonths as 1 | 6 | 12);
    }

    const { error } = await supabase.from("ai_accounts").update(dbData).eq("id", id);
    if (error) throw error;
  },

  deleteAccount: async (id: string, force = false): Promise<void> => {
    if (!supabase) return;
    // Đếm subscriptions active
    const { count, error: countErr } = await supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("ai_account_id", id)
      .eq("status", "active");
    if (countErr) throw countErr;

    if (count && count > 0 && !force) {
      throw new Error("Tài khoản này đang được cấp phát cho khách hàng. Vui lòng hủy đăng ký trước hoặc chọn xóa cưỡng chế.");
    }

    const { error } = await supabase.from("ai_accounts").delete().eq("id", id);
    if (error) throw error;
  },

  // --- CUSTOMERS SERVICE ---
  getCustomers: async (): Promise<Customer[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(mapCustomerFromDB);
  },

  createCustomer: async (data: Omit<Customer, "id" | "createdAt" | "updatedAt">): Promise<Customer> => {
    if (!supabase) throw new Error("Chưa kết nối Supabase");
    const newCust = {
      id: generateId("cust"),
      name: data.name,
      email: data.email || "",
      phone: data.phone || "",
      note: data.note || "",
    };
    const { error } = await supabase.from("customers").insert(newCust);
    if (error) throw error;
    return mapCustomerFromDB(newCust);
  },

  updateCustomer: async (id: string, data: Partial<Omit<Customer, "id" | "createdAt" | "updatedAt">>): Promise<void> => {
    if (!supabase) return;
    const dbData = mapCustomerToDB(data);
    const { error } = await supabase.from("customers").update(dbData).eq("id", id);
    if (error) throw error;
  },

  deleteCustomer: async (id: string): Promise<void> => {
    if (!supabase) return;

    // Kiểm tra khách hàng có đăng ký active không — chặn xóa nếu còn
    const { count, error: countErr } = await supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", id)
      .eq("status", "active");
    if (countErr) throw countErr;
    if (count && count > 0) {
      throw new Error("Không thể xóa khách hàng đang có đăng ký dịch vụ hoạt động. Vui lòng hủy đăng ký trước.");
    }

    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) throw error;
  },

  // --- SUBSCRIPTIONS SERVICE ---
  getSubscriptionsWithDetails: async (): Promise<SubscriptionDetail[]> => {
    if (!supabase) return [];
    // Lấy subscriptions kèm thông tin liên kết
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*, customers(*), ai_accounts(*), products(*)")
      .order("created_at", { ascending: false });
    if (error) throw error;

    return (data || []).map((s: any) => {
      const sub = mapSubscriptionFromDB(s);
      return {
        ...sub,
        customerName: s.customers?.name || "Khách hàng không xác định",
        customerEmail: s.customers?.email || "",
        customerPhone: s.customers?.phone || "",
        accountName: s.ai_accounts?.account_name || "Tài khoản không xác định",
        productName: s.products?.name || "Sản phẩm không xác định",
        expiryStatus: getExpiryStatus(sub.expiryDate),
      };
    });
  },

  createSubscription: async (data: Omit<Subscription, "id" | "expiryDate" | "productId" | "createdAt" | "updatedAt">): Promise<void> => {
    if (!supabase) return;
    // 1. Kiểm tra tài khoản gốc
    const { data: acc, error: accErr } = await supabase
      .from("ai_accounts")
      .select("*")
      .eq("id", data.aiAccountId)
      .single();
    if (accErr) throw accErr;
    if (!acc) throw new Error("Không tìm thấy tài khoản AI gốc.");

    // Ràng buộc 1: Chặn cấp nếu tài khoản đã hết hạn hoặc bị disabled
    if (acc.status === "disabled") throw new Error("Không thể cấp phát: Tài khoản AI gốc đang bị vô hiệu hóa.");
    if (acc.status === "expired") throw new Error("Không thể cấp phát: Tài khoản AI gốc đã hết hạn dùng.");

    // Ràng buộc 2: Chặn cấp nếu tài khoản đã đủ 5 slots
    const { count, error: countErr } = await supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("ai_account_id", data.aiAccountId)
      .eq("status", "active");
    if (countErr) throw countErr;
    if (count && count >= 5) throw new Error("Tài khoản AI gốc đã đủ 5 vị trí đang hoạt động.");

    // 2. Tính toán ngày hết hạn đăng ký
    const expiryDate = calculateExpiryDate(data.registrationDate, data.durationMonths);

    // Ràng buộc 3: Hạn dùng của khách không được vượt quá hạn dùng tài khoản gốc
    if (expiryDate > acc.expiry_date) {
      throw new Error(`Thời gian hết hạn của khách hàng (${expiryDate}) không được vượt quá hạn dùng của tài khoản AI gốc (${acc.expiry_date}).`);
    }

    const newSub = {
      id: generateId("sub"),
      customer_id: data.customerId,
      ai_account_id: data.aiAccountId,
      product_id: acc.product_id, // Kế thừa từ tài khoản gốc
      registration_date: data.registrationDate,
      duration_months: data.durationMonths,
      expiry_date: expiryDate,
      status: data.status || "active",
      note: data.note || "",
    };

    const { error } = await supabase.from("subscriptions").insert(newSub);
    if (error) throw error;
  },

  updateSubscription: async (id: string, data: Partial<Omit<Subscription, "id" | "productId" | "createdAt" | "updatedAt">>): Promise<void> => {
    if (!supabase) return;
    const dbData = mapSubscriptionToDB(data);

    // Nếu đổi ngày đăng ký hoặc thời hạn, tính lại ngày hết hạn
    if (data.registrationDate || data.durationMonths) {
      const { data: oldSub, error: readSubErr } = await supabase.from("subscriptions").select("*").eq("id", id).single();
      if (readSubErr) throw readSubErr;

      const regDate = data.registrationDate || oldSub.registration_date;
      const dMonths = data.durationMonths || oldSub.duration_months;
      const newExpiry = calculateExpiryDate(regDate, dMonths as 1 | 6 | 12);

      // Kiểm tra xem có vượt quá hạn của tài khoản AI gốc không
      const { data: acc, error: readAccErr } = await supabase.from("ai_accounts").select("expiry_date").eq("id", oldSub.ai_account_id).single();
      if (readAccErr) throw readAccErr;

      if (newExpiry > acc.expiry_date) {
        throw new Error(`Hạn dùng của khách (${newExpiry}) không được vượt quá hạn tài khoản AI gốc (${acc.expiry_date}).`);
      }
      dbData.expiry_date = newExpiry;
    }

    const { error } = await supabase.from("subscriptions").update(dbData).eq("id", id);
    if (error) throw error;
  },

  cancelSubscription: async (id: string): Promise<void> => {
    if (!supabase) return;
    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  deleteSubscription: async (id: string): Promise<void> => {
    if (!supabase) return;
    const { error } = await supabase.from("subscriptions").delete().eq("id", id);
    if (error) throw error;
  },

  // --- DATABASE UTILITIES (RESET / PURGE / IMPORT) ---
  resetDatabaseToDemo: async (demoData: {
    products: any[];
    accounts: any[];
    customers: any[];
    subscriptions: any[];
  }): Promise<void> => {
    if (!supabase) return;
    
    // 1. Xóa sạch dữ liệu cũ theo trật tự để tránh vi phạm khóa ngoại
    await supabase.from("subscriptions").delete().neq("id", "");
    await supabase.from("ai_accounts").delete().neq("id", "");
    await supabase.from("products").delete().neq("id", "");
    await supabase.from("customers").delete().neq("id", "");

    // 2. Chèn dữ liệu mới
    if (demoData.products.length > 0) {
      const dbProducts = demoData.products.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || "",
        is_active: p.isActive,
        created_at: p.createdAt,
        updated_at: p.updatedAt
      }));
      const { error } = await supabase.from("products").insert(dbProducts);
      if (error) throw error;
    }

    if (demoData.customers.length > 0) {
      const dbCustomers = demoData.customers.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email || "",
        phone: c.phone || "",
        note: c.note || "",
        created_at: c.createdAt,
        updated_at: c.updatedAt
      }));
      const { error } = await supabase.from("customers").insert(dbCustomers);
      if (error) throw error;
    }

    if (demoData.accounts.length > 0) {
      const dbAccounts = demoData.accounts.map(a => ({
        id: a.id,
        product_id: a.productId,
        account_name: a.accountName,
        login_email: a.loginEmail || "",
        note: a.note || "",
        purchase_date: a.purchaseDate,
        duration_months: a.durationMonths,
        expiry_date: a.expiryDate,
        max_slots: a.maxSlots || 5,
        status: a.status,
        created_at: a.createdAt,
        updated_at: a.updatedAt
      }));
      const { error } = await supabase.from("ai_accounts").insert(dbAccounts);
      if (error) throw error;
    }

    if (demoData.subscriptions.length > 0) {
      const dbSubs = demoData.subscriptions.map(s => ({
        id: s.id,
        customer_id: s.customerId,
        ai_account_id: s.aiAccountId,
        product_id: s.productId,
        registration_date: s.registrationDate,
        duration_months: s.durationMonths,
        expiry_date: s.expiryDate,
        status: s.status,
        note: s.note || "",
        created_at: s.createdAt,
        updated_at: s.updatedAt
      }));
      const { error } = await supabase.from("subscriptions").insert(dbSubs);
      if (error) throw error;
    }
  },

  purgeDatabase: async (): Promise<void> => {
    if (!supabase) return;
    await supabase.from("subscriptions").delete().neq("id", "");
    await supabase.from("ai_accounts").delete().neq("id", "");
    await supabase.from("products").delete().neq("id", "");
    await supabase.from("customers").delete().neq("id", "");
  },

  getStats: async (): Promise<DashboardStats> => {
    if (!supabase) {
      return {
        totalProducts: 0,
        totalAIAccounts: 0,
        totalCustomers: 0,
        activeSubscriptions: 0,
        totalUsedSlots: 0,
        totalAvailableSlots: 0,
        fullAccountsCount: 0,
        warningAccountsCount: 0,
        warningCustomersCount: 0,
      };
    }

    // Tự động kiểm tra hạn dùng trước khi tính metrics (đã chuyển sang refresh())

    const todayStr = new Date().toISOString().split("T")[0];
    const warningDateStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Query 1: Tổng quan Products
    const { count: productsCount } = await supabase.from("products").select("*", { count: "exact", head: true });
    
    // Query 2: Tổng quan Khách hàng
    const { count: customersCount } = await supabase.from("customers").select("*", { count: "exact", head: true });

    // Query 3: Tài khoản AI gốc
    const { data: accountsData } = await supabase.from("ai_accounts").select("id, max_slots, status, expiry_date");
    
    // Query 4: Đăng ký khách hàng
    const { data: subsData } = await supabase.from("subscriptions").select("ai_account_id, status, expiry_date");

    const totalProducts = productsCount || 0;
    const totalAIAccounts = accountsData?.length || 0;
    const totalCustomers = customersCount || 0;

    const activeSubs = (subsData || []).filter(s => s.status === "active");
    const activeSubscriptions = activeSubs.length;
    const totalUsedSlots = activeSubscriptions;

    // Đếm slots theo tài khoản
    const activeSubsCountMap = activeSubs.reduce((acc: Record<string, number>, sub: any) => {
      acc[sub.ai_account_id] = (acc[sub.ai_account_id] || 0) + 1;
      return acc;
    }, {});

    let totalAvailableSlots = 0;
    let fullAccountsCount = 0;
    let warningAccountsCount = 0;

    (accountsData || []).forEach((a) => {
      const max = a.max_slots || 5;
      const used = activeSubsCountMap[a.id] || 0;
      totalAvailableSlots += Math.max(0, max - used);

      if (used >= max && a.status === "active") {
        fullAccountsCount++;
      }

      if (a.status === "active" && a.expiry_date >= todayStr && a.expiry_date <= warningDateStr) {
        warningAccountsCount++;
      }
    });

    const warningCustomersCount = activeSubs.filter(
      (s) => s.expiry_date >= todayStr && s.expiry_date <= warningDateStr
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
  }
};

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { 
  Product, 
  AIAccountWithSlots, 
  Customer, 
  SubscriptionDetail, 
  DashboardStats, 
  AIAccount, 
  Subscription 
} from "../types";
import { storageService } from "../services/storageService";
import { initializeStorage, storage } from "../storage/localStorage";
import type { ToastType } from "../components/UIComponents";
import { googleDriveService } from "../services/googleDriveService";
import type { GoogleUser } from "../services/googleDriveService";
import { supabaseService, autoUpdateStatuses as supabaseAutoUpdate } from "../services/supabaseService";
import { isSupabaseConfigured, supabase } from "../services/supabaseClient";

interface StoreContextType {
  products: Product[];
  accounts: AIAccountWithSlots[];
  customers: Customer[];
  subscriptions: SubscriptionDetail[];
  stats: DashboardStats;
  loading: boolean;
  isOnline: boolean; // Chỉ báo ứng dụng đang chạy trực tuyến
  
  // Toast State
  toast: { message: string; type: ToastType } | null;
  showToast: (message: string, type: ToastType) => void;
  hideToast: () => void;
  
  // Actions Product
  addProduct: (data: Omit<Product, "id" | "createdAt" | "updatedAt">) => Promise<boolean>;
  updateProduct: (id: string, data: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  
  // Actions Account
  addAccount: (data: Omit<AIAccount, "id" | "expiryDate" | "maxSlots" | "createdAt" | "updatedAt">) => Promise<boolean>;
  updateAccount: (id: string, data: Partial<Omit<AIAccount, "id" | "maxSlots" | "createdAt" | "updatedAt">>) => Promise<boolean>;
  deleteAccount: (id: string, force?: boolean) => Promise<boolean>;
  
  // Actions Customer
  addCustomer: (data: Omit<Customer, "id" | "createdAt" | "updatedAt">) => Promise<Customer | null>;
  updateCustomer: (id: string, data: Partial<Omit<Customer, "id" | "createdAt" | "updatedAt">>) => Promise<boolean>;
  deleteCustomer: (id: string) => Promise<boolean>;
  
  // Actions Subscription
  addSubscription: (data: Omit<Subscription, "id" | "expiryDate" | "productId" | "createdAt" | "updatedAt">) => Promise<boolean>;
  updateSubscription: (id: string, data: Partial<Omit<Subscription, "id" | "productId" | "createdAt" | "updatedAt">>) => Promise<boolean>;
  cancelSubscription: (id: string) => Promise<boolean>;
  deleteSubscription: (id: string) => Promise<boolean>;
  
  // System Actions
  resetDatabase: () => Promise<void>;
  purgeDatabase: () => Promise<void>;
  importJson: (jsonStr: string) => Promise<boolean>;
  exportJson: () => Promise<string>;
  refresh: () => Promise<void>;

  // Google Cloud Sync Actions & States
  googleUser: GoogleUser | null;
  googleClientId: string;
  isSyncing: boolean;
  setGoogleClientId: (clientId: string) => void;
  loginGoogle: () => Promise<boolean>;
  logoutGoogle: () => void;
  backupToGoogleDrive: () => Promise<boolean>;
  restoreFromGoogleDrive: () => Promise<boolean>;
  syncToGoogleSheets: () => Promise<boolean>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [accounts, setAccounts] = useState<AIAccountWithSlots[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionDetail[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalAIAccounts: 0,
    totalCustomers: 0,
    activeSubscriptions: 0,
    totalUsedSlots: 0,
    totalAvailableSlots: 0,
    fullAccountsCount: 0,
    warningAccountsCount: 0,
    warningCustomersCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Toast actions
  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // Load và đồng bộ lại dữ liệu
  const refresh = useCallback(async () => {
    try {
      if (isSupabaseConfigured) {
        // Chạy auto-update statuses 1 lần duy nhất trước khi load data
        await supabaseAutoUpdate();

        const loadedProducts = await supabaseService.getProducts();
        const loadedAccounts = await supabaseService.getAccounts();
        const loadedCustomers = await supabaseService.getCustomers();
        const loadedSubs = await supabaseService.getSubscriptionsWithDetails();
        const loadedStats = await supabaseService.getStats();

        setProducts(loadedProducts);
        setAccounts(loadedAccounts);
        setCustomers(loadedCustomers);
        setSubscriptions(loadedSubs);
        setStats(loadedStats);
      } else {
        // Đảm bảo dữ liệu đã được khởi tạo
        initializeStorage();
        
        const loadedProducts = storageService.getProducts();
        const loadedAccounts = storageService.getAccounts();
        const loadedCustomers = storageService.getCustomers();
        const loadedSubs = storageService.getSubscriptionsWithDetails();
        const loadedStats = storageService.getDashboardStats();

        setProducts(loadedProducts);
        setAccounts(loadedAccounts);
        setCustomers(loadedCustomers);
        setSubscriptions(loadedSubs);
        setStats(loadedStats);
      }
    } catch (error) {
      console.error("Failed to load store data", error);
      showToast("Lỗi tải dữ liệu: " + (error as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refresh();
    
    // Tự động kiểm tra hết hạn mỗi phút một lần
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Google Cloud Sync States
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [googleToken, setGoogleToken] = useState<{ token: string; expiresAt: number } | null>(null);
  const [googleClientId, setGoogleClientIdState] = useState<string>(() => {
    return (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || localStorage.getItem("google_client_id") || "";
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const setGoogleClientId = useCallback((id: string) => {
    setGoogleClientIdState(id);
    localStorage.setItem("google_client_id", id);
  }, []);

  const loginGoogle = async (): Promise<boolean> => {
    if (!googleClientId) {
      showToast("Vui lòng nhập Google Client ID trước", "error");
      return false;
    }
    setIsSyncing(true);
    try {
      const token = await googleDriveService.requestToken(googleClientId);
      const user = await googleDriveService.getUserInfo(token);
      setGoogleToken({
        token,
        expiresAt: Date.now() + 3500 * 1000,
      });
      setGoogleUser(user);
      showToast(`Đã kết nối tài khoản Google: ${user.email}`, "success");
      setIsSyncing(false);
      return true;
    } catch (error) {
      showToast((error as Error).message, "error");
      setIsSyncing(false);
      return false;
    }
  };

  const logoutGoogle = useCallback(() => {
    setGoogleUser(null);
    setGoogleToken(null);
    showToast("Đã đăng xuất tài khoản Google", "info");
  }, [showToast]);

  const getValidToken = async (): Promise<string | null> => {
    if (!googleToken || !googleUser) {
      const ok = await loginGoogle();
      if (ok && googleToken) {
        return googleToken.token;
      }
      return null;
    }

    if (googleToken.expiresAt > Date.now() + 300 * 1000) {
      return googleToken.token;
    }

    const ok = await loginGoogle();
    if (ok && googleToken) {
      return googleToken.token;
    }
    return null;
  };

  const backupToGoogleDrive = async (): Promise<boolean> => {
    const token = await getValidToken();
    if (!token) return false;

    setIsSyncing(true);
    try {
      const localDataStr = await exportJson();
      const existingFile = await googleDriveService.findBackupFile(token);
      const fileId = existingFile?.id;
      
      await googleDriveService.uploadBackupFile(token, localDataStr, fileId);
      showToast("Sao lưu dữ liệu lên Google Drive thành công", "success");
      setIsSyncing(false);
      return true;
    } catch (error) {
      showToast(`Sao lưu Drive thất bại: ${(error as Error).message}`, "error");
      setIsSyncing(false);
      return false;
    }
  };

  const restoreFromGoogleDrive = async (): Promise<boolean> => {
    const token = await getValidToken();
    if (!token) return false;

    setIsSyncing(true);
    try {
      const existingFile = await googleDriveService.findBackupFile(token);
      if (!existingFile) {
        showToast("Không tìm thấy tệp sao lưu trên Google Drive.", "error");
        setIsSyncing(false);
        return false;
      }

      const driveData = await googleDriveService.downloadBackupFile(token, existingFile.id);
      
      if (isSupabaseConfigured) {
        await supabaseService.resetDatabaseToDemo(driveData);
      } else {
        storageService.importData(JSON.stringify(driveData));
      }
      
      await refresh();
      showToast("Khôi phục dữ liệu từ Google Drive thành công", "success");
      setIsSyncing(false);
      return true;
    } catch (error) {
      showToast(`Khôi phục Drive thất bại: ${(error as Error).message}`, "error");
      setIsSyncing(false);
      return false;
    }
  };

  const syncToGoogleSheets = async (): Promise<boolean> => {
    const token = await getValidToken();
    if (!token) return false;

    setIsSyncing(true);
    try {
      let spreadsheetId = await googleDriveService.findSpreadsheet(token);
      if (!spreadsheetId) {
        showToast("Không tìm thấy bảng tính cũ, đang tạo mới...", "info");
        spreadsheetId = await googleDriveService.createSpreadsheet(token);
      }

      const tables = {
        products: isSupabaseConfigured ? await supabaseService.getProducts() : storageService.getProducts(),
        accounts: isSupabaseConfigured ? await supabaseService.getAccounts() : storageService.getAccounts(),
        subscriptions: isSupabaseConfigured ? await supabaseService.getSubscriptionsWithDetails() : storageService.getSubscriptionsWithDetails(),
      };

      await googleDriveService.syncToGoogleSheets(token, spreadsheetId, tables);
      showToast("Đồng bộ dữ liệu sang Google Sheets thành công", "success");
      setIsSyncing(false);
      return true;
    } catch (error) {
      showToast(`Đồng bộ Sheets thất bại: ${(error as Error).message}`, "error");
      setIsSyncing(false);
      return false;
    }
  };

  // --- Product actions ---
  const addProduct = async (data: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<boolean> => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabaseService.createProduct(data);
      } else {
        storageService.createProduct(data);
      }
      await refresh();
      showToast("Thêm sản phẩm mới thành công", "success");
      return true;
    } catch (error) {
      showToast((error as Error).message, "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (id: string, data: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>): Promise<boolean> => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabaseService.updateProduct(id, data);
      } else {
        storageService.updateProduct(id, data);
      }
      await refresh();
      showToast("Cập nhật thông tin sản phẩm thành công", "success");
      return true;
    } catch (error) {
      showToast((error as Error).message, "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabaseService.deleteProduct(id);
      } else {
        storageService.deleteProduct(id);
      }
      await refresh();
      showToast("Xóa sản phẩm thành công", "success");
      return true;
    } catch (error) {
      showToast((error as Error).message, "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // --- Account actions ---
  const addAccount = async (data: Omit<AIAccount, "id" | "expiryDate" | "maxSlots" | "createdAt" | "updatedAt">): Promise<boolean> => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabaseService.createAccount(data);
      } else {
        storageService.createAccount(data);
      }
      await refresh();
      showToast("Thêm tài khoản AI thành công", "success");
      return true;
    } catch (error) {
      showToast((error as Error).message, "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateAccount = async (id: string, data: Partial<Omit<AIAccount, "id" | "maxSlots" | "createdAt" | "updatedAt">>): Promise<boolean> => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabaseService.updateAccount(id, data);
      } else {
        storageService.updateAccount(id, data);
      }
      await refresh();
      showToast("Cập nhật tài khoản AI thành công", "success");
      return true;
    } catch (error) {
      showToast((error as Error).message, "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (id: string, force = false): Promise<boolean> => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabaseService.deleteAccount(id, force);
      } else {
        storageService.deleteAccount(id, force);
      }
      await refresh();
      showToast(force ? "Xóa tài khoản AI và các đăng ký liên quan thành công" : "Xóa tài khoản AI thành công", "success");
      return true;
    } catch (error) {
      showToast((error as Error).message, "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // --- Customer actions ---
  const addCustomer = async (data: Omit<Customer, "id" | "createdAt" | "updatedAt">): Promise<Customer | null> => {
    setLoading(true);
    try {
      let result: Customer;
      if (isSupabaseConfigured) {
        result = await supabaseService.createCustomer(data);
      } else {
        result = storageService.createCustomer(data);
      }
      await refresh();
      showToast("Thêm khách hàng thành công", "success");
      return result;
    } catch (error) {
      showToast((error as Error).message, "error");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateCustomer = async (id: string, data: Partial<Omit<Customer, "id" | "createdAt" | "updatedAt">>): Promise<boolean> => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabaseService.updateCustomer(id, data);
      } else {
        storageService.updateCustomer(id, data);
      }
      await refresh();
      showToast("Cập nhật thông tin khách hàng thành công", "success");
      return true;
    } catch (error) {
      showToast((error as Error).message, "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabaseService.deleteCustomer(id);
      } else {
        storageService.deleteCustomer(id);
      }
      await refresh();
      showToast("Xóa khách hàng thành công", "success");
      return true;
    } catch (error) {
      showToast((error as Error).message, "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // --- Subscription actions ---
  const addSubscription = async (data: Omit<Subscription, "id" | "expiryDate" | "productId" | "createdAt" | "updatedAt">): Promise<boolean> => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabaseService.createSubscription(data);
      } else {
        storageService.createSubscription(data);
      }
      await refresh();
      showToast("Phân bổ tài khoản AI cho khách hàng thành công", "success");
      return true;
    } catch (error) {
      showToast((error as Error).message, "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateSubscription = async (id: string, data: Partial<Omit<Subscription, "id" | "productId" | "createdAt" | "updatedAt">>): Promise<boolean> => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabaseService.updateSubscription(id, data);
      } else {
        storageService.updateSubscription(id, data);
      }
      await refresh();
      showToast("Cập nhật đăng ký của khách hàng thành công", "success");
      return true;
    } catch (error) {
      showToast((error as Error).message, "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabaseService.cancelSubscription(id);
      } else {
        storageService.cancelSubscription(id);
      }
      await refresh();
      showToast("Hủy đăng ký của khách hàng thành công", "success");
      return true;
    } catch (error) {
      showToast((error as Error).message, "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteSubscription = async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabaseService.deleteSubscription(id);
      } else {
        storageService.deleteSubscription(id);
      }
      await refresh();
      showToast("Xóa đăng ký thành công", "success");
      return true;
    } catch (error) {
      showToast((error as Error).message, "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // --- System actions ---
  const resetDatabase = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        // Nạp dữ liệu mẫu ban đầu của storageService lên Supabase
        const demoData = storageService.getDemoData();
        await supabaseService.resetDatabaseToDemo(demoData);
      } else {
        storage.clearAll();
      }
      await refresh();
      showToast("Khôi phục cơ sở dữ liệu mẫu thành công", "success");
    } catch (error) {
      showToast("Khôi phục dữ liệu mẫu thất bại: " + (error as Error).message, "error");
    } finally {
      setLoading(false);
    }
  };

  const purgeDatabase = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabaseService.purgeDatabase();
      } else {
        storage.purgeAll();
      }
      await refresh();
      showToast("Xóa sạch toàn bộ dữ liệu thành công", "warning");
    } catch (error) {
      showToast("Xóa sạch dữ liệu thất bại: " + (error as Error).message, "error");
    } finally {
      setLoading(false);
    }
  };

  const importJson = async (jsonStr: string): Promise<boolean> => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const parsed = JSON.parse(jsonStr);
        await supabaseService.resetDatabaseToDemo(parsed);
      } else {
        storageService.importData(jsonStr);
      }
      await refresh();
      showToast("Nhập dữ liệu từ file JSON thành công", "success");
      return true;
    } catch (error) {
      showToast("Nhập dữ liệu thất bại: " + (error as Error).message, "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const exportJson = async (): Promise<string> => {
    try {
      if (isSupabaseConfigured) {
        const productsList = await supabaseService.getProducts();
        // Lấy ai_accounts dạng thô từ database để export
        const { data: accountsData } = await supabase!.from("ai_accounts").select("*");
        const accountsList = (accountsData || []).map((a: any) => ({
          id: a.id,
          productId: a.product_id,
          accountName: a.account_name,
          loginEmail: a.login_email || "",
          note: a.note || "",
          purchaseDate: a.purchase_date,
          durationMonths: a.duration_months,
          expiryDate: a.expiry_date,
          maxSlots: a.max_slots,
          status: a.status,
          createdAt: a.created_at,
          updatedAt: a.updated_at
        }));
        
        const customersList = await supabaseService.getCustomers();
        
        // Lấy subscriptions dạng thô từ database để export
        const { data: subsData } = await supabase!.from("subscriptions").select("*");
        const subsList = (subsData || []).map((s: any) => ({
          id: s.id,
          customerId: s.customer_id,
          aiAccountId: s.ai_account_id,
          productId: s.product_id,
          registrationDate: s.registration_date,
          durationMonths: s.duration_months,
          expiryDate: s.expiry_date,
          status: s.status,
          note: s.note || "",
          createdAt: s.created_at,
          updatedAt: s.updated_at
        }));

        const exportDataObj = {
          version: "1.0.0",
          exportedAt: new Date().toISOString(),
          products: productsList,
          accounts: accountsList,
          customers: customersList,
          subscriptions: subsList
        };
        showToast("Xuất dữ liệu thành công", "success");
        return JSON.stringify(exportDataObj, null, 2);
      } else {
        const data = storageService.exportData();
        showToast("Xuất dữ liệu thành công", "success");
        return data;
      }
    } catch (error) {
      showToast("Xuất dữ liệu thất bại: " + (error as Error).message, "error");
      return "";
    }
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        accounts,
        customers,
        subscriptions,
        stats,
        loading,
        isOnline: isSupabaseConfigured,
        toast,
        showToast,
        hideToast,
        addProduct,
        updateProduct,
        deleteProduct,
        addAccount,
        updateAccount,
        deleteAccount,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addSubscription,
        updateSubscription,
        cancelSubscription,
        deleteSubscription,
        resetDatabase,
        purgeDatabase,
        importJson,
        exportJson,
        refresh,
        googleUser,
        googleClientId,
        isSyncing,
        setGoogleClientId,
        loginGoogle,
        logoutGoogle,
        backupToGoogleDrive,
        restoreFromGoogleDrive,
        syncToGoogleSheets,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};

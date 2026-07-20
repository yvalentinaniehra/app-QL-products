import { useState, useEffect } from "react";
import { StoreProvider } from "./hooks/useStore";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { ProductsPage } from "./pages/ProductsPage";
import { AIAccountsPage } from "./pages/AIAccountsPage";
import { CustomersPage } from "./pages/CustomersPage";
import { BackupPage } from "./pages/BackupPage";
import { LoginPage } from "./pages/LoginPage";
import { authService, type AuthUser } from "./services/authService";
import { isSupabaseConfigured } from "./services/supabaseClient";
import { Loader2 } from "lucide-react";

function AppContent({ currentUser, onLogout }: { currentUser: AuthUser | null; onLogout: () => void }) {
  const [currentPage, setCurrentPage] = useState<string>("dashboard");

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage setCurrentPage={setCurrentPage} />;
      case "products":
        return <ProductsPage />;
      case "accounts":
        return <AIAccountsPage />;
      case "customers":
        return <CustomersPage />;
      case "backup":
        return <BackupPage />;
      default:
        return <DashboardPage setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage} currentUser={currentUser} onLogout={onLogout}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  const [authState, setAuthState] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    // Nếu không dùng Supabase → bỏ qua auth, vào thẳng app (Offline mode)
    if (!isSupabaseConfigured) {
      setAuthState("authenticated");
      return;
    }

    // Kiểm tra session hiện tại
    authService.getCurrentUser().then((user) => {
      if (user) {
        setCurrentUser(user);
        setAuthState("authenticated");
      } else {
        setAuthState("unauthenticated");
      }
    });

    // Lắng nghe thay đổi session (login/logout từ tab khác...)
    const subscription = authService.onAuthStateChange((user) => {
      if (user) {
        setCurrentUser(user);
        setAuthState("authenticated");
      } else {
        setCurrentUser(null);
        setAuthState("unauthenticated");
      }
    });

    return () => {
      if (subscription && typeof subscription.unsubscribe === "function") {
        subscription.unsubscribe();
      }
    };
  }, []);

  const handleLogout = async () => {
    await authService.signOut();
    setCurrentUser(null);
    setAuthState("unauthenticated");
  };

  // Màn hình loading khi đang kiểm tra session
  if (authState === "loading") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl shadow-lg">
            <span className="text-white font-bold text-xl">AI</span>
          </div>
          <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
          <p className="text-slate-500 text-sm">Đang kiểm tra phiên đăng nhập...</p>
        </div>
      </div>
    );
  }

  // Màn hình đăng nhập nếu chưa xác thực
  if (authState === "unauthenticated") {
    return (
      <LoginPage
        onLoginSuccess={() => {
          authService.getCurrentUser().then((user) => {
            if (user) {
              setCurrentUser(user);
              setAuthState("authenticated");
            }
          });
        }}
      />
    );
  }

  // App bình thường khi đã xác thực
  return (
    <StoreProvider>
      <AppContent currentUser={currentUser} onLogout={handleLogout} />
    </StoreProvider>
  );
}

export default App;

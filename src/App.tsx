import { useState } from "react";
import { StoreProvider } from "./hooks/useStore";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { ProductsPage } from "./pages/ProductsPage";
import { AIAccountsPage } from "./pages/AIAccountsPage";
import { CustomersPage } from "./pages/CustomersPage";
import { BackupPage } from "./pages/BackupPage";

function AppContent() {
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
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}

export default App;

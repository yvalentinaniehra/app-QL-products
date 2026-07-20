import React, { useState, useEffect } from "react";
import { useStore } from "../hooks/useStore";
import { Toast } from "./UIComponents";
import { SubscriptionFormModal } from "./SubscriptionFormModal";
import { 
  LayoutDashboard, 
  Layers, 
  KeyRound, 
  Users, 
  DatabaseBackup, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  PlusCircle
} from "lucide-react";
import { formatDateDisplay } from "../utils/date";

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentPage, 
  setCurrentPage 
}) => {
  const { toast, hideToast } = useStore();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewSubModalOpen, setIsNewSubModalOpen] = useState(false);

  // 1. Đồng bộ Theme từ localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("ai_theme") as "light" | "dark" | null;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (systemPrefersDark ? "dark" : "light");
    
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("ai_theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Menu items cấu hình
  const menuItems = [
    { id: "dashboard", label: "Tổng quan", icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: "products", label: "Sản phẩm AI", icon: <Layers className="h-5 w-5" /> },
    { id: "accounts", label: "Tài khoản AI", icon: <KeyRound className="h-5 w-5" /> },
    { id: "customers", label: "Khách hàng", icon: <Users className="h-5 w-5" /> },
    { id: "backup", label: "Sao lưu & Hệ thống", icon: <DatabaseBackup className="h-5 w-5" /> },
  ];

  const getPageTitle = () => {
    switch (currentPage) {
      case "dashboard": return "Bảng điều khiển Tổng quan";
      case "products": return "Quản lý Sản phẩm AI";
      case "accounts": return "Quản lý Tài khoản AI";
      case "customers": return "Quản lý Khách hàng & Đăng ký";
      case "backup": return "Sao lưu & Phục hồi dữ liệu";
      default: return "Quản lý tài khoản AI";
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 transition-colors duration-200">
      
      {/* =======================================================================
          SIDEBAR - DESKTOP MODE
          ======================================================================= */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200/80 dark:border-gray-800/80 shadow-xs">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800/50">
          <div className="flex items-center justify-center h-9 w-9 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200 dark:shadow-none font-bold text-lg">
            AI
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white leading-none">
              AI Account Hub
            </h1>
            <span className="text-[10px] text-indigo-500 font-medium tracking-wide uppercase">
              Management System
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition duration-200 ${
                currentPage === item.id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-gray-800 flex items-center justify-center font-semibold text-xs text-indigo-600 dark:text-indigo-400">
                AD
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">Admin</p>
                <p className="text-[10px] text-gray-500">Quản trị viên</p>
              </div>
            </div>
            
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl transition text-gray-500 dark:text-gray-400 cursor-pointer"
              title="Chuyển chế độ sáng/tối"
            >
              {theme === "light" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>
      </aside>

      {/* =======================================================================
          SIDEBAR - MOBILE DRAWER
          ======================================================================= */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Overlay */}
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />
          
          <div className="relative flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-xl z-10 animate-fade-in">
            {/* Header Drawer */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-8 w-8 bg-indigo-600 rounded-lg text-white font-bold text-sm">
                  AI
                </div>
                <span className="font-bold text-gray-900 dark:text-white">AI Account Hub</span>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav Drawer */}
            <nav className="flex-1 px-4 py-6 space-y-1.5">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentPage(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition duration-200 ${
                    currentPage === item.id
                      ? "bg-indigo-600 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Footer Drawer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-gray-800 flex items-center justify-center font-semibold text-xs text-indigo-600 dark:text-indigo-400">
                  AD
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">Admin</p>
                  <p className="text-[10px] text-gray-500">Quản trị viên</p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="p-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl transition text-gray-600 dark:text-gray-400"
              >
                {theme === "light" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          MAIN APP CONTENT LAYER
          ======================================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-800/80 shadow-2xs">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Open Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              <Menu className="h-5.5 w-5.5" />
            </button>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-850 px-3 py-1.5 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
              Hôm nay: <span className="font-semibold text-gray-800 dark:text-gray-200">{formatDateDisplay(todayStr)}</span>
            </div>
            
            {/* Quick Allocate Action Button */}
            <button
              onClick={() => setIsNewSubModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg hover:shadow-indigo-100 dark:hover:shadow-none transition duration-200 cursor-pointer"
            >
              <PlusCircle className="h-4.5 w-4.5" />
              <span className="hidden sm:inline">Cấp tài khoản</span>
            </button>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* =======================================================================
          GLOBAL FLOATING ELEMENTS (TOAST & MODALS)
          ======================================================================= */}
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      {/* global Subscription Form Modal */}
      <SubscriptionFormModal
        isOpen={isNewSubModalOpen}
        onClose={() => setIsNewSubModalOpen(false)}
      />

    </div>
  );
};

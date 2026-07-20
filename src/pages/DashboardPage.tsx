import React, { useMemo } from "react";
import { useStore } from "../hooks/useStore";
import { formatDateDisplay, getDaysRemaining } from "../utils/date";
import { StatusBadge } from "../components/UIComponents";
import { 
  Layers, 
  KeyRound, 
  Users, 
  CheckCircle2, 
  UserCheck, 
  UserMinus, 
  AlertTriangle,
  Clock,
  Unlock,
  ShieldCheck,
  ChevronRight
} from "lucide-react";

interface DashboardPageProps {
  setCurrentPage: (page: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ setCurrentPage }) => {
  const { stats, accounts, subscriptions } = useStore();

  // Danh sách tài khoản AI hết hạn trong 30 ngày
  const warningAccounts = useMemo(() => {
    return accounts
      .filter((acc) => acc.expiryStatus === "warning" || acc.expiryStatus === "expired")
      .sort((a, b) => getDaysRemaining(a.expiryDate) - getDaysRemaining(b.expiryDate));
  }, [accounts]);

  // Danh sách khách hàng (Subscription active) hết hạn trong 30 ngày
  const warningSubscriptions = useMemo(() => {
    return subscriptions
      .filter((sub) => sub.status === "active" && sub.expiryStatus === "warning")
      .sort((a, b) => getDaysRemaining(a.expiryDate) - getDaysRemaining(b.expiryDate));
  }, [subscriptions]);

  // Tài khoản đã cấp đủ 5 khách
  const fullAccounts = useMemo(() => {
    return accounts.filter((acc) => acc.slotStatus === "full");
  }, [accounts]);

  // Tài khoản còn vị trí trống (chỉ lấy tài khoản active)
  const availableAccounts = useMemo(() => {
    return accounts.filter((acc) => acc.status === "active" && acc.slotStatus !== "full");
  }, [accounts]);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* =======================================================================
          METRICS GRID
          ======================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        
        {/* Metric 1: Tổng số sản phẩm */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xs hover:shadow-md transition duration-200">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Sản phẩm AI
              </span>
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {stats.totalProducts}
              </p>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Layers className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Metric 2: Tổng số tài khoản gốc */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xs hover:shadow-md transition duration-200">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tài khoản AI gốc
              </span>
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {stats.totalAIAccounts}
              </p>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <KeyRound className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Metric 3: Tổng số khách hàng */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xs hover:shadow-md transition duration-200">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Khách hàng
              </span>
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {stats.totalCustomers}
              </p>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Metric 4: Đăng ký đang active */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xs hover:shadow-md transition duration-200">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Đăng ký hoạt động
              </span>
              <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {stats.activeSubscriptions}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Metric 5: Slots đang dùng */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xs hover:shadow-md transition duration-200">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Vị trí đã cấp
              </span>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {stats.totalUsedSlots} <span className="text-xs font-medium text-gray-400">slots</span>
              </p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <UserCheck className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Metric 6: Slots còn trống */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xs hover:shadow-md transition duration-200">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Vị trí còn trống
              </span>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {stats.totalAvailableSlots} <span className="text-xs font-medium text-gray-400">slots</span>
              </p>
            </div>
            <div className="p-3 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 rounded-xl">
              <Unlock className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Metric 7: Tài khoản gốc đầy 5/5 */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xs hover:shadow-md transition duration-200">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tài khoản AI đầy (5/5)
              </span>
              <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-500">
                {stats.fullAccountsCount}
              </p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-500 rounded-xl">
              <UserMinus className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Metric 8: Tài khoản / Khách sắp hết hạn */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xs hover:shadow-md transition duration-200">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Sắp hết hạn (&lt;30 ngày)
              </span>
              <div className="flex gap-4 items-baseline">
                <span className="text-2xl font-extrabold text-yellow-600 dark:text-yellow-500" title="Tài khoản gốc">
                  {stats.warningAccountsCount} <span className="text-[10px] font-normal text-gray-400">TK</span>
                </span>
                <span className="text-2xl font-extrabold text-orange-600 dark:text-orange-500" title="Khách hàng">
                  {stats.warningCustomersCount} <span className="text-[10px] font-normal text-gray-400">KH</span>
                </span>
              </div>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-500 rounded-xl">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </div>

      </div>

      {/* =======================================================================
          ALERT PANELS (DANH SÁCH CẦN CHÚ Ý)
          ======================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* CỘT TRÁI - PHẦN 1: CẢNH BÁO HẾT HẠN GẤP */}
        <div className="space-y-6">
          
          {/* 1.1. Tài khoản gốc sắp hết hạn */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-lg">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Tài khoản gốc sắp hoặc đã hết hạn ({warningAccounts.length})
                </h3>
              </div>
              <button 
                onClick={() => setCurrentPage("accounts")}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                Chi tiết <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {warningAccounts.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-3 text-center bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                Không có tài khoản nào sắp hết hạn.
              </p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-64 overflow-y-auto pr-1 space-y-2">
                {warningAccounts.map((acc) => {
                  const days = getDaysRemaining(acc.expiryDate);
                  return (
                    <div key={acc.id} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0">
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {acc.accountName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {acc.loginEmail || "Không có email"} — <span className="font-medium text-indigo-600 dark:text-indigo-400">{acc.productName}</span>
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <StatusBadge status={acc.expiryStatus} />
                        <p className={`text-xs font-semibold ${days < 0 ? "text-rose-600" : "text-amber-600"}`}>
                          {days < 0 ? `Đã hết hạn ${Math.abs(days)} ngày` : `Còn ${days} ngày`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 1.2. Khách hàng sắp hết hạn */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-500 rounded-lg">
                  <Clock className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Khách hàng sắp hết hạn trong 30 ngày ({warningSubscriptions.length})
                </h3>
              </div>
              <button 
                onClick={() => setCurrentPage("customers")}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                Chi tiết <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {warningSubscriptions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-3 text-center bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                Không có khách hàng nào sắp hết hạn.
              </p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-64 overflow-y-auto pr-1 space-y-2">
                {warningSubscriptions.map((sub) => {
                  const days = getDaysRemaining(sub.expiryDate);
                  return (
                    <div key={sub.id} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0">
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {sub.customerName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Gói: <span className="font-semibold text-gray-700 dark:text-gray-300">{sub.productName}</span> — Acc: {sub.accountName}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <StatusBadge status="warning" customText="Sắp hết hạn" />
                        <p className="text-xs font-semibold text-amber-600">
                          Còn {days} ngày (Hạn: {formatDateDisplay(sub.expiryDate)})
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* CỘT PHẢI - PHẦN 2: THỐNG KÊ SỨC CHỨA SLOTS */}
        <div className="space-y-6">
          
          {/* 2.1. Tài khoản AI gốc đã đầy chỗ (5/5) */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-500 rounded-lg">
                  <UserMinus className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Tài khoản AI đã cấp đủ 5 khách ({fullAccounts.length})
                </h3>
              </div>
              <button 
                onClick={() => setCurrentPage("accounts")}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                Xem tất cả <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {fullAccounts.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-3 text-center bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                Chưa có tài khoản nào đạt giới hạn 5/5 khách hàng active.
              </p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-64 overflow-y-auto pr-1 space-y-2">
                {fullAccounts.map((acc) => (
                  <div key={acc.id} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {acc.accountName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {acc.loginEmail || "Không email"} — SP: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{acc.productName}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-400">
                        Đầy chỗ (5/5)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2.2. Tài khoản AI còn vị trí trống */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Tài khoản còn vị trí trống sẵn sàng cấp ({availableAccounts.length})
                </h3>
              </div>
              <button 
                onClick={() => setCurrentPage("accounts")}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                Xem thêm <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {availableAccounts.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-3 text-center bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                Không có tài khoản trống nào. Vui lòng thêm tài khoản AI gốc mới!
              </p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-64 overflow-y-auto pr-1 space-y-2">
                {availableAccounts.map((acc) => (
                  <div key={acc.id} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {acc.accountName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {acc.loginEmail || "Không email"} — SP: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{acc.productName}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/50 text-sky-700 dark:text-sky-400">
                        Còn trống {acc.availableSlots}/5 chỗ
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

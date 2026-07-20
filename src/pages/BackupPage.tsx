import React, { useState, useRef } from "react";
import { useStore } from "../hooks/useStore";
import { ConfirmDialog } from "../components/UIComponents";
import { 
  Download, 
  Upload, 
  Trash2, 
  RefreshCw, 
  FileSpreadsheet, 
  FileJson,
  ShieldAlert,
  Cloud,
  CloudOff,
  Settings,
  LogOut
} from "lucide-react";

export const BackupPage: React.FC = () => {
  const { 
    accounts, 
    subscriptions, 
    exportJson, 
    importJson, 
    resetDatabase, 
    purgeDatabase,
    showToast,
    googleUser,
    googleClientId,
    isSyncing,
    setGoogleClientId,
    loginGoogle,
    logoutGoogle,
    backupToGoogleDrive,
    restoreFromGoogleDrive,
    syncToGoogleSheets
  } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // States confirm dialogs
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isPurgeConfirmOpen, setIsPurgeConfirmOpen] = useState(false);
  const [importPendingContent, setImportPendingContent] = useState<string | null>(null);

  // ==========================================
  // XỬ LÝ JSON BACKUP
  // ==========================================

  // Xuất JSON
  const handleExportJSON = async () => {
    const dataStr = await exportJson();
    if (!dataStr) return;

    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().split("T")[0];
    
    link.href = url;
    link.download = `AI_Account_Hub_Backup_${today}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Chọn file JSON để import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        // Parse nháp để kiểm tra tính hợp lệ trước khi hỏi
        const parsed = JSON.parse(content);
        if (!parsed.products || !parsed.accounts || !parsed.customers || !parsed.subscriptions) {
          showToast("Cấu trúc file backup JSON không hợp lệ (thiếu các bảng cốt lõi).", "error");
          return;
        }
        
        // Lưu nội dung chờ xác nhận ghi đè
        setImportPendingContent(content);
      } catch (err) {
        showToast("File không đúng định dạng JSON hợp lệ.", "error");
      }
    };

    reader.readAsText(file);
    // Reset input để có thể chọn lại cùng file
    e.target.value = "";
  };

  const triggerSelectFile = () => {
    fileInputRef.current?.click();
  };

  // Xác nhận import ghi đè dữ liệu
  const handleConfirmImport = async () => {
    if (importPendingContent) {
      const success = await importJson(importPendingContent);
      if (success) {
        setImportPendingContent(null);
      }
    }
  };

  // ==========================================
  // XỬ LÝ XUẤT FILE CSV
  // ==========================================

  // Hàm chuyển đổi mảng thành CSV string (hỗ trợ Unicode tiếng Việt cho Excel)
  const convertToCSV = (headers: string[], rows: string[][]): string => {
    // Thêm BOM (Byte Order Mark) để Excel nhận diện UTF-8 có dấu tiếng Việt
    const BOM = "\uFEFF";
    const csvContent = rows
      .map((row) =>
        row
          .map((val) => {
            // Bao bọc trong dấu ngoặc kép và escape dấu ngoặc kép cũ
            const cleanVal = val ? val.replace(/"/g, '""') : "";
            return `"${cleanVal}"`;
          })
          .join(",")
      )
      .join("\n");
    return BOM + headers.join(",") + "\n" + csvContent;
  };

  const downloadCSVFile = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 1. Xuất CSV danh sách tài khoản AI gốc
  const handleExportAccountsCSV = () => {
    const headers = [
      "Tên tài khoản",
      "Email đăng nhập",
      "Sản phẩm AI",
      "Ngày mua gốc",
      "Thời hạn (tháng)",
      "Ngày hết hạn",
      "Số slot đã dùng",
      "Số slot trống",
      "Trạng thái hoạt động",
      "Ghi chú",
    ];

    const rows = accounts.map((acc) => [
      acc.accountName,
      acc.loginEmail || "",
      acc.productName,
      acc.purchaseDate,
      String(acc.durationMonths),
      acc.expiryDate,
      String(acc.usedSlots),
      String(acc.availableSlots),
      acc.status === "active" ? "Đang hoạt động" : acc.status === "expired" ? "Đã hết hạn" : "Ngừng hoạt động",
      acc.note || "",
    ]);

    const csvData = convertToCSV(headers, rows);
    const today = new Date().toISOString().split("T")[0];
    downloadCSVFile(`Danh_Sach_Tai_Khoan_AI_Goc_${today}.csv`, csvData);
    showToast("Xuất file CSV tài khoản thành công", "success");
  };

  // 2. Xuất CSV danh sách khách hàng và đăng ký active
  const handleExportCustomersCSV = () => {
    const headers = [
      "Họ tên khách hàng",
      "Email liên hệ",
      "Số điện thoại",
      "Sản phẩm AI sử dụng",
      "Tài khoản gốc cấp phát",
      "Ngày bắt đầu",
      "Thời hạn (tháng)",
      "Ngày hết hạn khách",
      "Trạng thái đăng ký",
      "Ghi chú đăng ký",
    ];

    const rows = subscriptions.map((sub) => [
      sub.customerName,
      sub.customerEmail || "",
      sub.customerPhone || "",
      sub.productName,
      sub.accountName,
      sub.registrationDate,
      String(sub.durationMonths),
      sub.expiryDate,
      sub.status === "active" ? "Đang hoạt động" : sub.status === "expired" ? "Đã hết hạn" : "Đã hủy",
      sub.note || "",
    ]);

    const csvData = convertToCSV(headers, rows);
    const today = new Date().toISOString().split("T")[0];
    downloadCSVFile(`Danh_Sach_Phan_Bo_Khach_Hang_AI_${today}.csv`, csvData);
    showToast("Xuất file CSV khách hàng thành công", "success");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in text-xs">
      
      {/* 1. SECTION SAO LƯU FILE JSON */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-2xs space-y-6">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileJson className="h-5 w-5 text-indigo-500" />
            Sao lưu và Khôi phục dữ liệu thô (JSON)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Sử dụng định dạng JSON để backup toàn bộ dữ liệu (bao gồm cả sản phẩm, tài khoản, khách hàng và lịch sử) hoặc chuyển sang trình duyệt khác.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card Export */}
          <div className="p-5 bg-slate-50 dark:bg-gray-850/40 rounded-2xl border border-gray-150 dark:border-gray-800/80 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Xuất tệp sao lưu</h4>
              <p className="text-gray-500 leading-relaxed text-xs">
                Tải xuống toàn bộ cơ sở dữ liệu hiện tại dưới dạng một file <b>.json</b>. Bạn có thể cất giữ file này làm điểm khôi phục an toàn.
              </p>
            </div>
            <button
              onClick={handleExportJSON}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition duration-200 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Tải file sao lưu JSON
            </button>
          </div>

          {/* Card Import */}
          <div className="p-5 bg-slate-50 dark:bg-gray-850/40 rounded-2xl border border-gray-150 dark:border-gray-800/80 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Khôi phục từ tệp tin</h4>
              <p className="text-gray-500 leading-relaxed text-xs">
                Chọn file backup <b>.json</b> đã tải xuống trước đó để khôi phục lại cơ sở dữ liệu. Dữ liệu hiện tại trên trình duyệt sẽ bị thay thế hoàn toàn.
              </p>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={triggerSelectFile}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl border border-gray-250 dark:border-gray-700 shadow-sm transition duration-200 cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              Khôi phục từ file JSON
            </button>
          </div>
        </div>
      </div>

      {/* 2. SECTION ĐỒNG BỘ ĐÁM MÂY (GOOGLE CLOUD SYNC) */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-2xs space-y-6">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Cloud className="h-5 w-5 text-indigo-500" />
            Đồng bộ hóa Đám mây (Google Drive & Sheets)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Kết nối ứng dụng với tài khoản Google Drive cá nhân để tự động sao lưu dữ liệu và đồng bộ hóa danh sách trực tuyến lên Google Sheets.
          </p>
        </div>

        <div className="p-5 bg-slate-50 dark:bg-gray-850/40 rounded-2xl border border-gray-150 dark:border-gray-800/80 space-y-5">
          {/* Cấu hình Client ID */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Settings className="h-3.5 w-3.5 text-gray-400" />
                Google Client ID
              </label>
              {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-900/30">
                  Cấu hình tự động (.env)
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={googleClientId}
                onChange={(e) => setGoogleClientId(e.target.value)}
                disabled={!!import.meta.env.VITE_GOOGLE_CLIENT_ID}
                placeholder="Nhập Google Client ID của bạn (ví dụ: xxxx.apps.googleusercontent.com)"
                className={`flex-1 px-4 py-2 text-xs border rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 ${
                  import.meta.env.VITE_GOOGLE_CLIENT_ID 
                    ? "bg-slate-100 dark:bg-gray-800/60 text-gray-500 border-gray-200 dark:border-gray-750 cursor-not-allowed" 
                    : "bg-white dark:bg-gray-800 border-gray-250 dark:border-gray-700 text-gray-700 dark:text-gray-200"
                }`}
              />
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              * Để bảo mật tuyệt đối, bạn hãy tự tạo Client ID miễn phí trên <b>Google Cloud Console</b>. 
              <a 
                href="https://console.cloud.google.com/" 
                target="_blank" 
                rel="noreferrer" 
                className="text-indigo-500 hover:underline ml-1 font-medium"
              >
                Nhấp vào đây để mở Google Cloud Console
              </a>. Các scopes yêu cầu bao gồm <b>drive.file</b> và <b>spreadsheets</b>.
            </p>
          </div>

          <hr className="border-gray-150 dark:border-gray-800/60" />

          {/* Trạng thái kết nối Google */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {googleUser ? (
                <>
                  {googleUser.picture ? (
                    <img src={googleUser.picture} alt="Avatar" className="w-9 h-9 rounded-full border border-indigo-250" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                      {googleUser.email.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h5 className="font-semibold text-gray-800 dark:text-gray-200 text-xs">Đã kết nối tài khoản Google</h5>
                    <p className="text-gray-400 text-[10px]">{googleUser.email}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center">
                    <CloudOff className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-800 dark:text-gray-200 text-xs">Chưa kết nối đám mây</h5>
                    <p className="text-gray-400 text-[10px]">Đăng nhập Google để kích hoạt sao lưu trực tuyến.</p>
                  </div>
                </>
              )}
            </div>

            <div>
              {googleUser ? (
                <button
                  onClick={logoutGoogle}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-850 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-750 transition cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Đăng xuất tài khoản
                </button>
              ) : (
                <button
                  onClick={loginGoogle}
                  disabled={isSyncing || !googleClientId}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-750 disabled:bg-indigo-400 text-white text-xs font-semibold rounded-xl shadow-md transition cursor-pointer"
                >
                  <Cloud className="h-3.5 w-3.5 animate-pulse" />
                  Kết nối tài khoản Google
                </button>
              )}
            </div>
          </div>

          {/* Các nút hành động Cloud Sync khi đã đăng nhập */}
          {googleUser && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <button
                onClick={backupToGoogleDrive}
                disabled={isSyncing}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                {isSyncing ? "Đang đồng bộ..." : "Sao lưu lên Google Drive"}
              </button>

              <button
                onClick={restoreFromGoogleDrive}
                disabled={isSyncing}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl border border-gray-250 dark:border-gray-700 shadow-xs transition cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Khôi phục từ Drive
              </button>

              <button
                onClick={syncToGoogleSheets}
                disabled={isSyncing}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Đồng bộ sang Google Sheets
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. SECTION SAO LƯU FILE CSV */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-2xs space-y-6">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
            Xuất báo cáo định dạng bảng (CSV)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Xuất dữ liệu thành tệp CSV tương thích tốt với Microsoft Excel và Google Sheets (UTF-8 tiếng Việt chuẩn không lỗi font) phục vụ việc báo cáo hoặc in ấn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Export Accounts CSV */}
          <div className="p-4 bg-emerald-50/10 dark:bg-emerald-950/5 rounded-2xl border border-emerald-100/55 dark:border-emerald-900/10 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">Danh sách Tài khoản gốc</h4>
              <p className="text-gray-400 text-[10px]">Tải xuống danh sách tài khoản AI thô kèm slots sử dụng.</p>
            </div>
            <button
              onClick={handleExportAccountsCSV}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition duration-200 cursor-pointer"
              title="Tải file CSV tài khoản gốc"
            >
              <Download className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Export Customers CSV */}
          <div className="p-4 bg-emerald-50/10 dark:bg-emerald-950/5 rounded-2xl border border-emerald-100/55 dark:border-emerald-900/10 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">Hồ sơ Cấp phát khách hàng</h4>
              <p className="text-gray-400 text-[10px]">Tải danh sách phân bổ khách hàng, email và thời hạn dùng.</p>
            </div>
            <button
              onClick={handleExportCustomersCSV}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition duration-200 cursor-pointer"
              title="Tải file CSV khách hàng & đăng ký"
            >
              <Download className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. SECTION CÀI ĐẶT HỆ THỐNG / VÙNG NGUY HIỂM */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-rose-100 dark:border-rose-950/30 p-6 shadow-2xs space-y-6">
        <div>
          <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Danger Zone — Vận hành Hệ thống
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Các thao tác làm thay đổi lớn hoặc xóa vĩnh viễn cơ sở dữ liệu trên trình duyệt. Vui lòng cẩn thận.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {/* Reset Demo Database */}
          <div className="p-5 border border-dashed border-gray-250 dark:border-gray-800 rounded-2xl flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <h4 className="font-semibold text-gray-800 dark:text-gray-250">Nạp dữ liệu mẫu ban đầu</h4>
              <p className="text-gray-500 leading-relaxed text-[11px]">
                Ghi đè cơ sở dữ liệu hiện tại bằng **bộ dữ liệu mẫu demo** (gồm 5 sản phẩm AI, 4 tài khoản gốc và 8 khách hàng) để dùng thử và kiểm thử nhanh các tính năng.
              </p>
            </div>
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-750 transition cursor-pointer"
            >
              <RefreshCw className="h-4 w-4 text-indigo-500 animate-spin-reverse" />
              Nạp dữ liệu mẫu (Reset to Demo)
            </button>
          </div>

          {/* Purge All Database */}
          <div className="p-5 border border-rose-100 dark:border-rose-950/20 bg-rose-50/15 dark:bg-rose-950/5 rounded-2xl flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <h4 className="font-semibold text-rose-700 dark:text-rose-400">Xóa sạch toàn bộ dữ liệu</h4>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-[11px]">
                Xóa bỏ hoàn toàn cơ sở dữ liệu trên trình duyệt này. Thích hợp khi bạn muốn bắt đầu vận hành hệ thống với dữ liệu thật mới tinh của riêng bạn.
              </p>
            </div>
            <button
              onClick={() => setIsPurgeConfirmOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-md transition cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Xóa sạch dữ liệu (Purge Database)
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Dialogs */}
      {/* 1. Xác nhận import JSON */}
      <ConfirmDialog
        isOpen={importPendingContent !== null}
        title="Xác nhận phục hồi cơ sở dữ liệu?"
        message="Hành động này sẽ ghi đè hoàn toàn cơ sở dữ liệu hiện tại bằng nội dung từ file backup JSON. Mọi thông tin hiện có sẽ bị mất và thay thế. Bạn có chắc chắn muốn tiếp tục?"
        confirmText="Xác nhận ghi đè"
        cancelText="Hủy bỏ"
        type="danger"
        onConfirm={handleConfirmImport}
        onCancel={() => setImportPendingContent(null)}
      />

      {/* 2. Xác nhận reset demo */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="Xác nhận tải lại dữ liệu mẫu?"
        message="Hành động này sẽ xóa sạch dữ liệu hiện tại và thay thế bằng 5 sản phẩm AI, 4 tài khoản gốc và 8 khách hàng mẫu mặc định của hệ thống. Bạn có đồng ý?"
        confirmText="Tải dữ liệu mẫu"
        cancelText="Bỏ qua"
        type="warning"
        onConfirm={async () => {
          await resetDatabase();
          setIsResetConfirmOpen(false);
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      {/* 3. Xác nhận xóa sạch */}
      <ConfirmDialog
        isOpen={isPurgeConfirmOpen}
        title="⚠️ XẢY RA MẤT DỮ LIỆU: Xác nhận xóa sạch?"
        message="CẢNH BÁO NGUY HIỂM: Toàn bộ danh sách sản phẩm, tài khoản gốc và khách hàng hiện tại sẽ bị xóa sạch hoàn toàn khỏi bộ nhớ trình duyệt và KHÔNG THỂ KHÔI PHỤC. Hãy chắc chắn bạn đã tải file sao lưu JSON trước khi thực hiện. Bạn có đồng ý xóa sạch?"
        confirmText="Xác nhận xóa sạch"
        cancelText="Hủy bỏ"
        type="danger"
        onConfirm={async () => {
          await purgeDatabase();
          setIsPurgeConfirmOpen(false);
        }}
        onCancel={() => setIsPurgeConfirmOpen(false)}
      />

    </div>
  );
};

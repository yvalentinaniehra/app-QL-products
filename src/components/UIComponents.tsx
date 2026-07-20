import React, { useEffect } from "react";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";
import type { SlotStatus, ExpiryStatus } from "../types";

// ============================================================================
// 1. BADGES (NHÃN TRẠNG THÁI)
// ============================================================================

interface StatusBadgeProps {
  status: "active" | "expired" | "disabled" | "cancelled" | SlotStatus | ExpiryStatus;
  customText?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, customText }) => {
  let bgClass = "";
  let textClass = "";
  let label = customText || "";

  switch (status) {
    // Trạng thái hoạt động chung / Kích hoạt
    case "active":
      bgClass = "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50";
      textClass = "text-emerald-700 dark:text-emerald-400";
      label = label || "Đang hoạt động";
      break;

    // Hết hạn
    case "expired":
      bgClass = "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50";
      textClass = "text-rose-700 dark:text-rose-400";
      label = label || "Đã hết hạn";
      break;

    // Vô hiệu hóa
    case "disabled":
      bgClass = "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700";
      textClass = "text-gray-600 dark:text-gray-400";
      label = label || "Ngừng hoạt động";
      break;

    // Đã hủy (Subscription)
    case "cancelled":
      bgClass = "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700";
      textClass = "text-gray-500 dark:text-gray-400 font-normal";
      label = label || "Đã hủy";
      break;

    // Trạng thái sức chứa slots: Trống
    case "empty":
      bgClass = "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800/50";
      textClass = "text-sky-700 dark:text-sky-400";
      label = label || "Trống";
      break;

    // Trạng thái sức chứa slots: Còn chỗ
    case "available":
      bgClass = "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50";
      textClass = "text-blue-700 dark:text-blue-400";
      label = label || "Còn chỗ";
      break;

    // Trạng thái sức chứa slots: Đã đầy
    case "full":
      bgClass = "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50";
      textClass = "text-amber-700 dark:text-amber-400";
      label = label || "Đã đầy";
      break;

    // Cảnh báo thời hạn: Sắp hết hạn
    case "warning":
      bgClass = "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800/50";
      textClass = "text-yellow-700 dark:text-yellow-500";
      label = label || "Sắp hết hạn";
      break;

    case "normal":
      bgClass = "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50";
      textClass = "text-emerald-700 dark:text-emerald-400";
      label = label || "An toàn";
      break;

    default:
      bgClass = "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700";
      textClass = "text-gray-700 dark:text-gray-300";
      label = label || String(status);
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${bgClass} ${textClass}`}>
      {label}
    </span>
  );
};

// ============================================================================
// 2. PROGRESS BAR (TIẾN TRÌNH SỨC CHỨA SLOTS)
// ============================================================================

interface SlotProgressBarProps {
  used: number;
  max: number;
}

export const SlotProgressBar: React.FC<SlotProgressBarProps> = ({ used, max }) => {
  const percentage = Math.min(100, (used / max) * 100);
  
  let barColor = "bg-blue-500 dark:bg-blue-600";
  let textColor = "text-blue-700 dark:text-blue-400";
  
  if (used === max) {
    barColor = "bg-rose-500 dark:bg-rose-600";
    textColor = "text-rose-700 dark:text-rose-400 font-semibold";
  } else if (used >= 3) {
    barColor = "bg-amber-500 dark:bg-amber-600";
    textColor = "text-amber-700 dark:text-amber-400";
  } else if (used === 0) {
    barColor = "bg-slate-200 dark:bg-slate-700";
    textColor = "text-gray-500 dark:text-gray-400";
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1 text-xs">
        <span className="text-gray-500 dark:text-gray-400">Đã dùng</span>
        <span className={textColor}>{used}/{max} chỗ</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-300 ${barColor}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// ============================================================================
// 3. TOAST NOTIFICATION (THÔNG BÁO NỔI)
// ============================================================================

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  let icon = <Info className="h-5 w-5 text-blue-500" />;
  let borderClass = "border-blue-200 dark:border-blue-800";
  let bgClass = "bg-white dark:bg-gray-900";

  switch (type) {
    case "success":
      icon = <CheckCircle className="h-5 w-5 text-emerald-500" />;
      borderClass = "border-emerald-100 dark:border-emerald-900/50 shadow-emerald-100/10";
      break;
    case "error":
      icon = <XCircle className="h-5 w-5 text-rose-500" />;
      borderClass = "border-rose-100 dark:border-rose-900/50 shadow-rose-100/10";
      break;
    case "warning":
      icon = <AlertTriangle className="h-5 w-5 text-amber-500" />;
      borderClass = "border-amber-100 dark:border-amber-900/50 shadow-amber-100/10";
      break;
  }

  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center p-4 max-w-sm rounded-xl border shadow-xl animate-fade-in ${bgClass} ${borderClass}`}>
      <div className="flex-shrink-0 mr-3">{icon}</div>
      <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mr-8">{message}</div>
      <button 
        onClick={onClose}
        className="ml-auto bg-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg transition"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// ============================================================================
// 4. CONFIRM DIALOG (HỘP THOẠI XÁC NHẬN)
// ============================================================================

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  type = "info",
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  let btnColor = "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500";
  let iconBg = "bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400";
  let icon = <Info className="h-6 w-6" />;

  if (type === "danger") {
    btnColor = "bg-rose-600 hover:bg-rose-700 focus:ring-rose-500";
    iconBg = "bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400";
    icon = <AlertTriangle className="h-6 w-6" />;
  } else if (type === "warning") {
    btnColor = "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500";
    iconBg = "bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400";
    icon = <AlertTriangle className="h-6 w-6" />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs">
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 animate-fade-in">
        <div className="flex items-start">
          <div className={`flex-shrink-0 p-3 rounded-xl ${iconBg} mr-4`}>
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {message}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition duration-200"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-xl shadow-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${btnColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

import { addMonths, format, parseISO, isValid, differenceInDays, startOfDay } from "date-fns";

/**
 * Tính ngày hết hạn dựa trên ngày bắt đầu và số tháng thời hạn.
 * Nếu không truyền durationMonths, mặc định là 12.
 * @param startDate Ngày bắt đầu định dạng yyyy-MM-dd
 * @param durationMonths Số tháng thời hạn (1, 6, 12)
 * @returns Ngày hết hạn định dạng yyyy-MM-dd
 */
export function calculateExpiryDate(startDate: string, durationMonths?: number): string {
  const months = durationMonths ?? 12;
  if (!startDate) return "";
  const date = parseISO(startDate);
  if (!isValid(date)) return "";
  const expiryDate = addMonths(date, months);
  return format(expiryDate, "yyyy-MM-dd");
}

/**
 * Định dạng ngày từ yyyy-MM-dd sang dd/MM/yyyy để hiển thị giao diện.
 */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "-";
  const date = parseISO(dateStr);
  if (!isValid(date)) return dateStr;
  return format(date, "dd/MM/yyyy");
}

/**
 * Lấy số ngày còn lại đến ngày hết hạn.
 */
export function getDaysRemaining(expiryDateStr: string): number {
  if (!expiryDateStr) return 0;
  const expiryDate = parseISO(expiryDateStr);
  if (!isValid(expiryDate)) return 0;
  
  const today = startOfDay(new Date());
  const expiry = startOfDay(expiryDate);
  
  return differenceInDays(expiry, today);
}

/**
 * Xác định trạng thái thời hạn của tài khoản hoặc khách hàng.
 * - Đã hết hạn (expired): Ngày hết hạn nhỏ hơn ngày hiện tại (days <= -1).
 * - Sắp hết hạn (warning): Còn từ 0 đến 30 ngày.
 * - Bình thường (normal): Còn từ 31 ngày trở lên.
 */
export function getExpiryStatus(expiryDateStr: string): "normal" | "warning" | "expired" {
  if (!expiryDateStr) return "normal";
  const days = getDaysRemaining(expiryDateStr);
  
  if (days < 0) {
    return "expired";
  } else if (days <= 30) {
    return "warning";
  }
  return "normal";
}

import { z } from "zod";

// Định nghĩa regex cho số điện thoại (chấp nhận +, số, khoảng trắng, gạch ngang, ngoặc đơn)
const phoneRegex = /^[+]?[0-9\s\-()]{9,15}$/;

export const productSchema = z.object({
  name: z.string().min(2, "Tên sản phẩm phải có ít nhất 2 ký tự").max(100, "Tên sản phẩm quá dài"),
  description: z.string().max(500, "Mô tả sản phẩm tối đa 500 ký tự").optional(),
  isActive: z.boolean(),
});

export const aiAccountSchema = z.object({
  productId: z.string().min(1, "Vui lòng chọn sản phẩm AI"),
  accountName: z.string().min(3, "Tên nhận diện tài khoản phải có ít nhất 3 ký tự").max(100, "Tên nhận diện quá dài"),
  loginEmail: z
    .string()
    .email("Email đăng nhập không đúng định dạng")
    .or(z.literal(""))
    .optional(),
  note: z.string().max(500, "Ghi chú tối đa 500 ký tự").optional(),
  purchaseDate: z.string().min(1, "Vui lòng chọn ngày mua"),
  durationMonths: z.custom<1 | 6 | 12>(
    (val) => val === 1 || val === 6 || val === 12,
    "Thời hạn tài khoản chỉ chấp nhận gói 1, 6 hoặc 12 tháng"
  ),
  status: z.enum(["active", "expired", "disabled"]),
});

export const customerSchema = z
  .object({
    name: z.string().min(2, "Tên khách hàng phải có ít nhất 2 ký tự").max(100, "Tên khách hàng quá dài"),
    email: z
      .string()
      .email("Email không đúng định dạng")
      .or(z.literal(""))
      .optional(),
    phone: z
      .string()
      .refine((val) => val === "" || phoneRegex.test(val), {
        message: "Số điện thoại không hợp lệ (chỉ chứa số, khoảng trắng, +, -, và từ 9-15 số)",
      })
      .or(z.literal(""))
      .optional(),
    note: z.string().max(500, "Ghi chú tối đa 500 ký tự").optional(),
  })
  .refine((data) => (data.email && data.email !== "") || (data.phone && data.phone !== ""), {
    message: "Vui lòng nhập ít nhất một thông tin liên hệ (Email hoặc Số điện thoại)",
    path: ["email"], // Hiển thị lỗi tại trường email hoặc hiển thị lỗi chung
  });

export const subscriptionSchema = z.object({
  customerId: z.string().min(1, "Vui lòng chọn khách hàng"),
  aiAccountId: z.string().min(1, "Vui lòng chọn tài khoản AI"),
  registrationDate: z.string().min(1, "Vui lòng chọn ngày đăng ký"),
  durationMonths: z.custom<1 | 6 | 12>(
    (val) => val === 1 || val === 6 || val === 12,
    "Thời hạn đăng ký chỉ chấp nhận gói 1, 6 hoặc 12 tháng"
  ),
  status: z.enum(["active", "expired", "cancelled"]),
  note: z.string().max(500, "Ghi chú tối đa 500 ký tự").optional(),
});

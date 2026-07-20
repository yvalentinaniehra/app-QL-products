import React, { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { customerSchema } from "../schemas/validation";
import { useStore } from "../hooks/useStore";
import { calculateExpiryDate, formatDateDisplay } from "../utils/date";
import { X, User, Mail, Phone, Calendar, Info, ShieldAlert, Sparkles, Check } from "lucide-react";

interface SubscriptionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Nếu sửa subscription
  subscriptionId?: string;
}

// Kiểu dữ liệu cho form kết hợp (Khách hàng + Đăng ký)
type CombinedFormValues = {
  customerType: "existing" | "new";
  customerId: string; // Cho existing customer
  // Cho new customer
  newCustomerName: string;
  newCustomerEmail: string;
  newCustomerPhone: string;
  newCustomerNote: string;
  
  // Subscription info
  productId: string; // Dùng để lọc tài khoản AI
  aiAccountId: string;
  registrationDate: string;
  durationMonths: 1 | 6 | 12;
  note: string;
};

const todayStr = new Date().toISOString().split("T")[0];

export const SubscriptionFormModal: React.FC<SubscriptionFormModalProps> = ({
  isOpen,
  onClose,
  subscriptionId,
}) => {
  const {
    products,
    accounts,
    customers,
    subscriptions,
    addCustomer,
    addSubscription,
    updateSubscription,
    showToast,
  } = useStore();

  const isEditMode = !!subscriptionId;
  const editingSub = useMemo(() => {
    if (!subscriptionId) return null;
    return subscriptions.find((sub) => sub.id === subscriptionId) || null;
  }, [subscriptionId, subscriptions]);

  const activeProducts = useMemo(() => products.filter((p) => p.isActive), [products]);

  // Cấu hình react-hook-form
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CombinedFormValues>({
    defaultValues: {
      customerType: "existing",
      customerId: "",
      newCustomerName: "",
      newCustomerEmail: "",
      newCustomerPhone: "",
      newCustomerNote: "",
      productId: "",
      aiAccountId: "",
      registrationDate: todayStr,
      durationMonths: 12, // Mặc định 12 tháng
      note: "",
    },
  });

  const watchCustomerType = watch("customerType");
  const watchProductId = watch("productId");
  const watchAiAccountId = watch("aiAccountId");
  const watchRegistrationDate = watch("registrationDate");
  const watchDurationMonths = watch("durationMonths");

  // Reset form khi đóng/mở hoặc chuyển mode
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && editingSub) {
        // Tìm tài khoản AI để lấy productId
        const acc = accounts.find((a) => a.id === editingSub.aiAccountId);
        reset({
          customerType: "existing",
          customerId: editingSub.customerId,
          productId: acc?.productId || "",
          aiAccountId: editingSub.aiAccountId,
          registrationDate: editingSub.registrationDate,
          durationMonths: editingSub.durationMonths,
          note: editingSub.note || "",
        });
      } else {
        reset({
          customerType: "existing",
          customerId: "",
          newCustomerName: "",
          newCustomerEmail: "",
          newCustomerPhone: "",
          newCustomerNote: "",
          productId: activeProducts[0]?.id || "",
          aiAccountId: "",
          registrationDate: todayStr,
          durationMonths: 12,
          note: "",
        });
      }
    }
  }, [isOpen, isEditMode, editingSub, reset, activeProducts, accounts]);

  // Tự động tính ngày hết hạn của khách hàng
  const computedExpiryDate = useMemo(() => {
    return calculateExpiryDate(watchRegistrationDate, watchDurationMonths);
  }, [watchRegistrationDate, watchDurationMonths]);

  // Lọc tài khoản AI hợp lệ cho sản phẩm đã chọn
  const filteredAccounts = useMemo(() => {
    if (!watchProductId) return [];
    
    return accounts.filter((acc) => {
      // Khi đang SỬA một đăng ký, cho phép hiển thị tài khoản hiện tại của đăng ký đó
      if (isEditMode && editingSub && acc.id === editingSub.aiAccountId) {
        return true;
      }
      
      // Các điều kiện tài khoản hợp lệ để đăng ký mới:
      // 1. Phải trùng sản phẩm AI đã chọn
      // 2. Trạng thái tài khoản phải hoạt động (active)
      // 3. Sức chứa còn trống (< 5 slot active)
      return (
        acc.productId === watchProductId &&
        acc.status === "active" &&
        acc.usedSlots < acc.maxSlots
      );
    });
  }, [watchProductId, accounts, isEditMode, editingSub]);

  // Thông tin tài khoản AI đang được chọn
  const selectedAccount = useMemo(() => {
    if (!watchAiAccountId) return null;
    return accounts.find((acc) => acc.id === watchAiAccountId) || null;
  }, [watchAiAccountId, accounts]);

  // Ràng buộc nghiệp vụ: kiểm tra hạn dùng khách <= hạn dùng tài khoản AI
  const isExpiryValid = useMemo(() => {
    if (!selectedAccount || !computedExpiryDate) return true;
    return computedExpiryDate <= selectedAccount.expiryDate;
  }, [selectedAccount, computedExpiryDate]);

  // Reset tài khoản AI khi đổi sản phẩm AI
  const handleProductChange = (productId: string) => {
    setValue("productId", productId);
    setValue("aiAccountId", "");
  };

  // Submit form
  const onSubmit = async (values: CombinedFormValues) => {
    try {
      let finalCustomerId = values.customerId;

      // 1. Nếu thêm khách hàng mới, validate và tạo khách hàng trước
      if (values.customerType === "new") {
        const customerData = {
          name: values.newCustomerName,
          email: values.newCustomerEmail,
          phone: values.newCustomerPhone,
          note: values.newCustomerNote,
        };

        // Validate thủ công bằng Zod schema của customer
        const result = customerSchema.safeParse(customerData);
        if (!result.success) {
          // Lấy lỗi đầu tiên
          const errorMsg = result.error.issues[0]?.message || "Thông tin khách hàng mới không hợp lệ";
          showToast(errorMsg, "error");
          return;
        }

        // Tạo khách hàng mới
        const createdCustomer = await addCustomer(customerData);
        if (createdCustomer) {
          finalCustomerId = createdCustomer.id;
        } else {
          return; // Thất bại, toast đã được show trong useStore
        }
      }

      if (!finalCustomerId) {
        showToast("Vui lòng chọn hoặc nhập khách hàng", "error");
        return;
      }

      // 2. Validate ràng buộc hết hạn trước khi gọi API
      if (selectedAccount && computedExpiryDate > selectedAccount.expiryDate) {
        showToast(`Không thể lưu: Ngày hết hạn của khách (${formatDateDisplay(computedExpiryDate)}) không được vượt quá ngày hết hạn của tài khoản AI gốc (${formatDateDisplay(selectedAccount.expiryDate)}).`, "error");
        return;
      }

      const subscriptionData = {
        customerId: finalCustomerId,
        aiAccountId: values.aiAccountId,
        registrationDate: values.registrationDate,
        durationMonths: values.durationMonths,
        status: "active" as const,
        note: values.note,
      };

      let success = false;
      if (isEditMode && subscriptionId) {
        success = await updateSubscription(subscriptionId, subscriptionData);
      } else {
        success = await addSubscription(subscriptionData);
      }

      if (success) {
        onClose();
      }
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 my-8 animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {isEditMode ? "Sửa phân bổ tài khoản" : "Cấp tài khoản AI cho khách"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* CỘT TRÁI: THÔNG TIN KHÁCH HÀNG */}
            <div className="space-y-5">
              <div className="border-b border-gray-100 dark:border-gray-800 pb-2">
                <h3 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  1. Thông tin khách hàng
                </h3>
              </div>

              {!isEditMode && (
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setValue("customerType", "existing")}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition duration-200 ${
                      watchCustomerType === "existing"
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs"
                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    Chọn khách hàng sẵn có
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("customerType", "new")}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition duration-200 ${
                      watchCustomerType === "new"
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs"
                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    Tạo khách hàng mới
                  </button>
                </div>
              )}

              {watchCustomerType === "existing" ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Chọn khách hàng <span className="text-rose-500">*</span>
                    </label>
                    <select
                      {...register("customerId")}
                      disabled={isEditMode}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 transition"
                    >
                      <option value="">-- Chọn khách hàng --</option>
                      {customers.map((cust) => (
                        <option key={cust.id} value={cust.id}>
                          {cust.name} {cust.email ? `(${cust.email})` : ""} {cust.phone ? `- ${cust.phone}` : ""}
                        </option>
                      ))}
                    </select>
                    {errors.customerId && (
                      <p className="text-xs text-rose-500 mt-1">{errors.customerId.message}</p>
                    )}
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-950/20 border border-gray-100 dark:border-gray-800/80 rounded-xl text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Info className="h-3.5 w-3.5" />
                      <span>Thông tin hướng dẫn:</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Nếu không tìm thấy khách hàng trong danh sách, hãy chọn tab <b>Tạo khách hàng mới</b> để thêm khách hàng trực tiếp mà không cần đóng form.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Tên khách hàng <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <User className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="Nguyễn Văn A"
                        {...register("newCustomerName")}
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Địa chỉ Email
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <Mail className="h-4 w-4" />
                      </span>
                      <input
                        type="email"
                        placeholder="khachhang@gmail.com"
                        {...register("newCustomerEmail")}
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Số điện thoại
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <Phone className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="0901234567"
                        {...register("newCustomerPhone")}
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 transition"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                      Nên nhập ít nhất Email hoặc Số điện thoại để dễ liên lạc sau này.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Ghi chú khách hàng
                    </label>
                    <textarea
                      placeholder="Thông tin thêm..."
                      rows={2}
                      {...register("newCustomerNote")}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 transition"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* CỘT PHẢI: THÔNG TIN PHÂN BỔ TÀI KHOẢN */}
            <div className="space-y-5">
              <div className="border-b border-gray-100 dark:border-gray-800 pb-2">
                <h3 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  2. Cấu hình dịch vụ cấp phát
                </h3>
              </div>

              {/* Chọn sản phẩm */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Sản phẩm AI <span className="text-rose-500">*</span>
                </label>
                <select
                  value={watchProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 transition"
                >
                  <option value="">-- Chọn sản phẩm AI --</option>
                  {activeProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chọn tài khoản AI gốc */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Tài khoản AI gốc còn chỗ <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register("aiAccountId")}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 transition"
                >
                  <option value="">-- Chọn tài khoản gốc --</option>
                  {filteredAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountName} {acc.loginEmail ? `(${acc.loginEmail})` : ""} — Còn {acc.availableSlots}/5 chỗ — Hạn: {formatDateDisplay(acc.expiryDate)}
                    </option>
                  ))}
                </select>
                {errors.aiAccountId && (
                  <p className="text-xs text-rose-500 mt-1">{errors.aiAccountId.message}</p>
                )}
                {watchProductId && filteredAccounts.length === 0 && (
                  <p className="text-xs text-amber-500 mt-1.5 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Không có tài khoản còn chỗ cho sản phẩm này.
                  </p>
                )}
              </div>

              {/* Thiết lập thời hạn */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Ngày đăng ký <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <Calendar className="h-4 w-4" />
                    </span>
                    <input
                      type="date"
                      {...register("registrationDate")}
                      className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Thời hạn đăng ký <span className="text-rose-500">*</span>
                  </label>
                  <Controller
                    name="durationMonths"
                    control={control}
                    render={({ field }) => (
                      <select
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 transition"
                      >
                        <option value={1}>1 tháng</option>
                        <option value={6}>6 tháng</option>
                        <option value={12}>12 tháng (mặc định)</option>
                      </select>
                    )}
                  />
                </div>
              </div>

              {/* Hiển thị ngày hết hạn và cảnh báo nghiệp vụ */}
              <div className="p-4 bg-gray-50 dark:bg-gray-950/20 border border-gray-100 dark:border-gray-800/80 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Ngày hết hạn dự kiến:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                    {formatDateDisplay(computedExpiryDate)}
                  </span>
                </div>

                {selectedAccount && (
                  <div className="border-t border-gray-200/50 dark:border-gray-800 pt-2 space-y-1.5">
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span>Tài khoản gốc hết hạn:</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {formatDateDisplay(selectedAccount.expiryDate)}
                      </span>
                    </div>

                    {!isExpiryValid ? (
                      <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-lg flex items-start gap-2 text-rose-700 dark:text-rose-400 text-xs mt-2">
                        <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">Lỗi hạn dùng vượt quá!</p>
                          <p className="mt-0.5">Ngày hết hạn khách ({formatDateDisplay(computedExpiryDate)}) lớn hơn hạn tài khoản gốc ({formatDateDisplay(selectedAccount.expiryDate)}).</p>
                          <p className="mt-1 font-medium text-[11px] underline">Vui lòng chọn thời hạn ngắn hơn hoặc đổi tài khoản gốc khác.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-lg flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs">
                        <Check className="h-4 w-4 flex-shrink-0" />
                        <span>Hạn dùng hợp lệ (nằm trong hạn sử dụng của tài khoản gốc).</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Ghi chú subscription */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Ghi chú cấp phát
                </label>
                <textarea
                  placeholder="Ghi chú thêm về đăng ký này..."
                  rows={2}
                  {...register("note")}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 transition"
                />
              </div>

            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition duration-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isExpiryValid || !watchAiAccountId}
              className={`px-5 py-2 text-sm font-medium text-white rounded-xl shadow-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isSubmitting || !isExpiryValid || !watchAiAccountId
                  ? "bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed shadow-none"
                  : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 shadow-indigo-200/50 dark:shadow-none"
              }`}
            >
              {isSubmitting ? "Đang xử lý..." : isEditMode ? "Cập nhật" : "Cấp tài khoản"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

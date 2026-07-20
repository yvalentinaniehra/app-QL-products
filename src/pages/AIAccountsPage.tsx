import React, { useState, useMemo } from "react";
import { useStore } from "../hooks/useStore";
import type { AIAccountWithSlots } from "../types";
import { StatusBadge, SlotProgressBar, ConfirmDialog } from "../components/UIComponents";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  Search, 
  Filter, 
  Mail, 
  Sparkles, 
  X, 
  UserMinus, 
  UserCheck,
  KeyRound
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { aiAccountSchema } from "../schemas/validation";
import { formatDateDisplay, calculateExpiryDate } from "../utils/date";
import { z } from "zod";

type AccountFormValues = z.infer<typeof aiAccountSchema>;

const todayStr = new Date().toISOString().split("T")[0];

export const AIAccountsPage: React.FC = () => {
  const { 
    accounts, 
    products, 
    subscriptions, 
    addAccount, 
    updateAccount, 
    deleteAccount,
    cancelSubscription,
  } = useStore();

  // States bộ lọc & tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProduct, setFilterProduct] = useState("");
  const [filterCapacity, setFilterCapacity] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // States điều khiển Modal Thêm/Sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AIAccountWithSlots | null>(null);

  // States điều khiển Modal Chi tiết tài khoản
  const [detailedAccount, setDetailedAccount] = useState<AIAccountWithSlots | null>(null);

  // States điều khiển ConfirmDialog Xóa
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);
  const [isCascadeDelete, setIsCascadeDelete] = useState(false);

  // Active products để hiển thị trong select option
  const activeProducts = useMemo(() => products.filter((p) => p.isActive), [products]);

  // Form setup
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(aiAccountSchema),
    defaultValues: {
      productId: "",
      accountName: "",
      loginEmail: "",
      note: "",
      purchaseDate: todayStr,
      durationMonths: 12,
      status: "active",
    },
  });

  const watchPurchaseDate = watch("purchaseDate");
  const watchDurationMonths = watch("durationMonths");

  // Tính toán ngày hết hạn tự động cho Form hiển thị
  const computedExpiryDate = useMemo(() => {
    return calculateExpiryDate(watchPurchaseDate, watchDurationMonths);
  }, [watchPurchaseDate, watchDurationMonths]);

  // Lọc và Tìm kiếm tài khoản AI
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      // 1. Tìm kiếm theo tên tài khoản, email đăng nhập hoặc tên sản phẩm
      const searchMatch =
        acc.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.loginEmail && acc.loginEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
        acc.productName.toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Lọc theo sản phẩm
      const productMatch = !filterProduct || acc.productId === filterProduct;

      // 3. Lọc theo sức chứa
      let capacityMatch = true;
      if (filterCapacity === "empty") capacityMatch = acc.slotStatus === "empty";
      else if (filterCapacity === "available") capacityMatch = acc.slotStatus === "available";
      else if (filterCapacity === "full") capacityMatch = acc.slotStatus === "full";

      // 4. Lọc theo trạng thái
      let statusMatch = true;
      if (filterStatus === "active") statusMatch = acc.status === "active";
      else if (filterStatus === "disabled") statusMatch = acc.status === "disabled";
      else if (filterStatus === "warning") statusMatch = acc.expiryStatus === "warning";
      else if (filterStatus === "expired") statusMatch = acc.expiryStatus === "expired";

      return searchMatch && productMatch && capacityMatch && statusMatch;
    });
  }, [accounts, searchTerm, filterProduct, filterCapacity, filterStatus]);

  // Khách hàng đang hoạt động trên tài khoản đang xem chi tiết
  const activeCustomersForDetailedAccount = useMemo(() => {
    if (!detailedAccount) return [];
    return subscriptions.filter(
      (sub) => sub.aiAccountId === detailedAccount.id && sub.status === "active"
    );
  }, [detailedAccount, subscriptions]);

  // Mở modal thêm tài khoản
  const handleOpenAddModal = () => {
    setEditingAccount(null);
    reset({
      productId: activeProducts[0]?.id || "",
      accountName: "",
      loginEmail: "",
      note: "",
      purchaseDate: todayStr,
      durationMonths: 12,
      status: "active",
    });
    setIsModalOpen(true);
  };

  // Mở modal sửa tài khoản
  const handleOpenEditModal = (e: React.MouseEvent, acc: AIAccountWithSlots) => {
    e.stopPropagation(); // tránh trigger mở xem chi tiết dòng
    setEditingAccount(acc);
    reset({
      productId: acc.productId,
      accountName: acc.accountName,
      loginEmail: acc.loginEmail || "",
      note: acc.note || "",
      purchaseDate: acc.purchaseDate,
      durationMonths: acc.durationMonths,
      status: acc.status,
    });
    setIsModalOpen(true);
  };

  // Submit Form tạo/sửa
  const onSubmit = async (data: AccountFormValues) => {
    let success = false;
    if (editingAccount) {
      success = await updateAccount(editingAccount.id, data);
    } else {
      success = await addAccount(data);
    }
    if (success) {
      setIsModalOpen(false);
      // Cập nhật lại view chi tiết nếu đang mở tài khoản đó
      if (detailedAccount && detailedAccount.id === editingAccount?.id) {
        const freshAcc = accounts.find((a) => a.id === detailedAccount.id);
        if (freshAcc) setDetailedAccount(freshAcc);
      }
    }
  };

  // Click vào dòng để mở chi tiết tài khoản
  const handleRowClick = (acc: AIAccountWithSlots) => {
    setDetailedAccount(acc);
  };

  // Xóa tài khoản
  const handleOpenDeleteDialog = (e: React.MouseEvent, acc: AIAccountWithSlots) => {
    e.stopPropagation();
    setDeletingAccountId(acc.id);
    // Kiểm tra xem có khách đang sử dụng không để hiện cảnh báo tương ứng
    setIsCascadeDelete(acc.usedSlots > 0);
  };

  const handleConfirmDelete = async () => {
    if (deletingAccountId) {
      const success = await deleteAccount(deletingAccountId, isCascadeDelete);
      if (success) {
        setDeletingAccountId(null);
        // Nếu đang mở xem chi tiết chính tài khoản đó, đóng chi tiết lại
        if (detailedAccount?.id === deletingAccountId) {
          setDetailedAccount(null);
        }
      }
    }
  };

  // Hủy đăng ký nhanh cho khách trong Drawer chi tiết
  const handleCancelSubQuick = async (subId: string) => {
    const success = await cancelSubscription(subId);
    if (success && detailedAccount) {
      // Refresh dữ liệu chi tiết
      const freshAcc = accounts.find((a) => a.id === detailedAccount.id);
      if (freshAcc) setDetailedAccount(freshAcc);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xs">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Danh sách Tài khoản AI gốc
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Mỗi tài khoản gốc có tối đa 5 khách hàng sử dụng. Chỉ cấp phát tài khoản đang hoạt động và còn chỗ trống.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition duration-200 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Thêm tài khoản gốc
        </button>
      </div>

      {/* Tìm kiếm & Bộ lọc */}
      <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
          <Filter className="h-4.5 w-4.5 text-indigo-500" />
          <span>Bộ lọc & Tìm kiếm</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Ô tìm kiếm */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Tìm tên, email tài khoản..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Lọc sản phẩm */}
          <select
            value={filterProduct}
            onChange={(e) => setFilterProduct(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          >
            <option value="">Tất cả sản phẩm AI</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Lọc sức chứa */}
          <select
            value={filterCapacity}
            onChange={(e) => setFilterCapacity(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          >
            <option value="">Mọi sức chứa</option>
            <option value="empty">Trống (0/5 khách)</option>
            <option value="available">Còn chỗ trống (1-4 khách)</option>
            <option value="full">Đầy chỗ (5/5 khách)</option>
          </select>

          {/* Lọc thời hạn & trạng thái */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          >
            <option value="">Mọi trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="warning">Sắp hết hạn (&lt;30 ngày)</option>
            <option value="expired">Đã hết hạn</option>
            <option value="disabled">Đã ngừng hoạt động</option>
          </select>
        </div>
      </div>

      {/* Main Content Area: Danh sách + Chi tiết */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* BẢNG DANH SÁCH TÀI KHOẢN (2/3 chiều rộng) */}
        <div className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xs overflow-hidden transition-all duration-350 ${
          detailedAccount ? "xl:col-span-2" : "xl:col-span-3"
        }`}>
          {filteredAccounts.length === 0 ? (
            <div className="p-12 text-center text-gray-500 space-y-3">
              <KeyRound className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700" />
              <p className="font-medium text-sm">Không tìm thấy tài khoản AI nào phù hợp.</p>
              <p className="text-xs text-gray-400">Thay đổi bộ lọc hoặc thêm tài khoản gốc mới.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/70 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800/80 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-4">Tài khoản & Email</th>
                    <th className="px-5 py-4">Sản phẩm AI</th>
                    <th className="px-5 py-4 hidden md:table-cell">Mua & Hết hạn</th>
                    <th className="px-5 py-4 w-44">Sức chứa slots</th>
                    <th className="px-5 py-4 text-center">Trạng thái</th>
                    <th className="px-5 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80 text-sm">
                  {filteredAccounts.map((acc) => {
                    const isSelected = detailedAccount?.id === acc.id;
                    return (
                      <tr
                        key={acc.id}
                        onClick={() => handleRowClick(acc)}
                        className={`cursor-pointer transition duration-150 ${
                          isSelected 
                            ? "bg-indigo-50/30 dark:bg-indigo-950/15 hover:bg-indigo-50/40" 
                            : "hover:bg-slate-50/50 dark:hover:bg-gray-850/30"
                        }`}
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900 dark:text-white leading-tight">
                            {acc.accountName}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {acc.loginEmail || "Không có email"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {acc.productName}
                          </span>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell text-xs space-y-1">
                          <p className="text-gray-500 dark:text-gray-400">
                            Mua: {formatDateDisplay(acc.purchaseDate)}
                          </p>
                          <p className="font-semibold text-gray-700 dark:text-gray-300">
                            Hạn: {formatDateDisplay(acc.expiryDate)}
                          </p>
                        </td>
                        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                          <SlotProgressBar used={acc.usedSlots} max={acc.maxSlots} />
                        </td>
                        <td className="px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col gap-1 items-center">
                            <StatusBadge status={acc.status} />
                            {acc.status === "active" && acc.expiryStatus !== "normal" && (
                              <StatusBadge status={acc.expiryStatus} />
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Chi tiết button */}
                            <button
                              onClick={() => handleRowClick(acc)}
                              className="p-1.5 text-gray-500 hover:text-indigo-600 border border-gray-200 dark:border-gray-700 hover:border-indigo-200 rounded-lg transition"
                              title="Xem chi tiết & danh sách khách hàng"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            
                            {/* Sửa button */}
                            <button
                              onClick={(e) => handleOpenEditModal(e, acc)}
                              className="p-1.5 text-gray-500 hover:text-indigo-600 border border-gray-200 dark:border-gray-700 hover:border-indigo-200 rounded-lg transition"
                              title="Sửa tài khoản"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>

                            {/* Xóa button */}
                            <button
                              onClick={(e) => handleOpenDeleteDialog(e, acc)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 border border-gray-200 dark:border-gray-700 hover:border-rose-200 rounded-lg transition"
                              title="Xóa tài khoản"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* DRAWER CHI TIẾT TÀI KHOẢN & KHÁCH HÀNG LIÊN KẾT (1/3 chiều rộng) */}
        {detailedAccount && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-lg overflow-hidden animate-fade-in xl:col-span-1 space-y-6">
            
            {/* Header Drawer */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
              <div>
                <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">
                  Chi tiết tài khoản
                </span>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px]">
                  {detailedAccount.accountName}
                </h4>
              </div>
              <button
                onClick={() => setDetailedAccount(null)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-800"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Thông tin tài khoản */}
            <div className="px-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <p className="text-gray-400 mb-1">Sản phẩm AI</p>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{detailedAccount.productName}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Đăng nhập</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200 truncate" title={detailedAccount.loginEmail}>
                    {detailedAccount.loginEmail || "Không có email"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <p className="text-gray-400 mb-1">Ngày mua gốc</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{formatDateDisplay(detailedAccount.purchaseDate)}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Hạn dùng tài khoản</p>
                  <p className="font-semibold text-gray-950 dark:text-white">{formatDateDisplay(detailedAccount.expiryDate)}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-400 mb-1">Ghi chú tài khoản gốc</p>
                <p className="bg-gray-50 dark:bg-gray-850 p-2.5 rounded-xl border border-gray-200/40 dark:border-gray-800 text-gray-600 dark:text-gray-400 leading-relaxed">
                  {detailedAccount.note || "Không có ghi chú"}
                </p>
              </div>

              {/* Sức chứa Progress */}
              <div className="pt-2">
                <SlotProgressBar used={detailedAccount.usedSlots} max={detailedAccount.maxSlots} />
              </div>
            </div>

            {/* Danh sách khách hàng liên kết */}
            <div className="px-5 pb-5 space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 pb-2">
                <UserCheck className="h-4 w-4 text-indigo-500" />
                <span>Khách hàng đang dùng ({activeCustomersForDetailedAccount.length})</span>
              </div>

              {activeCustomersForDetailedAccount.length === 0 ? (
                <div className="p-6 text-center text-gray-400 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                  <p className="text-xs font-medium">Tài khoản này chưa có khách hàng sử dụng.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {activeCustomersForDetailedAccount.map((sub) => (
                    <div 
                      key={sub.id} 
                      className="p-3 bg-slate-50 dark:bg-gray-850/30 rounded-xl border border-gray-200/40 dark:border-gray-800/50 flex justify-between items-start gap-2"
                    >
                      <div className="space-y-1 text-xs">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {sub.customerName}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400">
                          Đăng ký: {formatDateDisplay(sub.registrationDate)}
                        </p>
                        <p className="font-medium text-indigo-600 dark:text-indigo-400">
                          Hết hạn: {formatDateDisplay(sub.expiryDate)}
                        </p>
                      </div>
                      
                      {/* Hủy đăng ký nhanh */}
                      <button
                        onClick={() => handleCancelSubQuick(sub.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition"
                        title="Hủy cấp phát slot này"
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* =======================================================================
          ADD/EDIT ACCOUNT MODAL FORM
          ======================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-lg overflow-hidden animate-fade-in">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <h4 className="text-base font-bold text-gray-900 dark:text-white">
                  {editingAccount ? "Sửa tài khoản AI gốc" : "Thêm tài khoản AI gốc mới"}
                </h4>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Modal */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                {/* Chọn sản phẩm */}
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Sản phẩm AI <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register("productId")}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 transition"
                  >
                    <option value="">-- Chọn sản phẩm --</option>
                    {activeProducts.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  {errors.productId && (
                    <p className="text-[10px] text-rose-500 mt-1">{errors.productId.message}</p>
                  )}
                </div>

                {/* Tên tài khoản */}
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Tên nhận diện <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Claude Share 01..."
                    {...register("accountName")}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 transition"
                  />
                  {errors.accountName && (
                    <p className="text-[10px] text-rose-500 mt-1">{errors.accountName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Email đăng nhập tài khoản gốc
                </label>
                <input
                  type="email"
                  placeholder="email@login.com"
                  {...register("loginEmail")}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 transition"
                />
                {errors.loginEmail && (
                  <p className="text-[10px] text-rose-500 mt-1">{errors.loginEmail.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Ngày mua */}
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Ngày mua gốc <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register("purchaseDate")}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 transition"
                  />
                  {errors.purchaseDate && (
                    <p className="text-[10px] text-rose-500 mt-1">{errors.purchaseDate.message}</p>
                  )}
                </div>

                {/* Thời hạn mua */}
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Thời hạn sử dụng <span className="text-rose-500">*</span>
                  </label>
                  <Controller
                    name="durationMonths"
                    control={control}
                    render={({ field }) => (
                      <select
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 transition"
                      >
                        <option value={1}>1 tháng</option>
                        <option value={6}>6 tháng</option>
                        <option value={12}>12 tháng</option>
                      </select>
                    )}
                  />
                </div>
              </div>

              {/* Tự động tính Expiry Date */}
              <div className="p-3 bg-gray-50 dark:bg-gray-950/20 border border-gray-150 dark:border-gray-800 rounded-xl flex justify-between items-center">
                <span className="text-gray-500 font-medium">Ngày hết hạn dự kiến:</span>
                <span className="font-bold text-gray-800 dark:text-white text-sm">
                  {formatDateDisplay(computedExpiryDate)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Trạng thái hoạt động */}
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Trạng thái kích hoạt <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register("status")}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 transition"
                  >
                    <option value="active">Đang hoạt động</option>
                    <option value="disabled">Ngừng hoạt động (Tắt)</option>
                    <option value="expired">Đã hết hạn</option>
                  </select>
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Ghi chú thêm
                </label>
                <textarea
                  placeholder="Ghi chú về mật khẩu, thông tin khuyến mãi hoặc cấu hình..."
                  rows={2}
                  {...register("note")}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 transition"
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition"
                >
                  {editingAccount ? "Cập nhật" : "Tạo tài khoản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Account Dialog */}
      <ConfirmDialog
        isOpen={deletingAccountId !== null}
        title={isCascadeDelete ? "Cảnh báo: Tài khoản đang có khách sử dụng!" : "Xác nhận xóa tài khoản"}
        message={
          isCascadeDelete
            ? "Tài khoản AI này hiện đang được cấp phát cho một hoặc nhiều khách hàng. Nếu bạn đồng ý xóa, TOÀN BỘ các đăng ký đang hoạt động liên quan sẽ tự động bị HỦY (cancelled). Bạn có đồng ý tiếp tục?"
            : "Bạn có chắc chắn muốn xóa tài khoản AI gốc này? Thao tác này không thể hoàn tác."
        }
        confirmText={isCascadeDelete ? "Đồng ý, hủy & xóa" : "Xóa tài khoản"}
        cancelText="Hủy bỏ"
        type={isCascadeDelete ? "danger" : "warning"}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingAccountId(null)}
      />

    </div>
  );
};

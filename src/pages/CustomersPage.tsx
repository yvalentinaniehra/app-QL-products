import React, { useState, useMemo } from "react";
import { useStore } from "../hooks/useStore";
import type { SubscriptionDetail, Customer } from "../types";
import { StatusBadge, ConfirmDialog } from "../components/UIComponents";
import { 
  Search, 
  Mail, 
  Phone, 
  Sparkles, 
  X, 
  Edit2, 
  Trash2, 
  UserMinus, 
  History, 
  Info,
  Eye,
  UserPlus,
  Users
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema } from "../schemas/validation";
import { formatDateDisplay, calculateExpiryDate } from "../utils/date";
import { z } from "zod";

type CustomerFormValues = z.infer<typeof customerSchema>;

export const CustomersPage: React.FC = () => {
  const { 
    subscriptions, 
    customers, 
    products, 
    accounts,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    updateSubscription,
    cancelSubscription,
    deleteSubscription,
  } = useStore();

  // Tab State: "subs" (đăng ký) hoặc "profiles" (hồ sơ khách hàng)
  const [activeTab, setActiveTab] = useState<"subs" | "profiles">("subs");

  // States lọc & tìm kiếm (dành cho Tab Subscriptions)
  const [subSearch, setSubSearch] = useState("");
  const [subFilterStatus, setSubFilterStatus] = useState("");
  const [subFilterProduct, setSubFilterProduct] = useState("");

  // States lọc & tìm kiếm (dành cho Tab Profiles)
  const [profileSearch, setProfileSearch] = useState("");

  // States điều khiển Modal Khách hàng (Thêm/Sửa)
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // States điều khiển Modal Sửa đăng ký (Chỉ sửa hạn dùng hoặc đổi acc)
  const [isEditSubModalOpen, setIsEditSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubscriptionDetail | null>(null);
  const [editSubAccId, setEditSubAccId] = useState("");
  const [editSubRegDate, setEditSubRegDate] = useState("");
  const [editSubDuration, setEditSubDuration] = useState<1 | 6 | 12>(12);
  const [editSubNote, setEditSubNote] = useState("");

  // States điều khiển Drawer Chi tiết khách hàng (bao gồm Lịch sử đăng ký)
  const [detailedCustomer, setDetailedCustomer] = useState<Customer | null>(null);

  // States điều khiển ConfirmDialog
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);
  const [deletingSubId, setDeletingSubId] = useState<string | null>(null);
  const [cancellingSubId, setCancellingSubId] = useState<string | null>(null);

  // Form setup cho Customer
  const {
    register: registerCust,
    handleSubmit: handleSubmitCust,
    reset: resetCust,
    formState: { errors: errorsCust },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      note: "",
    },
  });

  // ==========================================
  // LỌC DỮ LIỆU TABS
  // ==========================================

  // Lọc Tab Đăng ký (Subscriptions)
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      const searchMatch =
        sub.customerName.toLowerCase().includes(subSearch.toLowerCase()) ||
        (sub.customerEmail && sub.customerEmail.toLowerCase().includes(subSearch.toLowerCase())) ||
        (sub.customerPhone && sub.customerPhone.includes(subSearch)) ||
        sub.accountName.toLowerCase().includes(subSearch.toLowerCase());

      const productMatch = !subFilterProduct || sub.productId === subFilterProduct;

      let statusMatch = true;
      if (subFilterStatus === "active") statusMatch = sub.status === "active";
      else if (subFilterStatus === "expired") statusMatch = sub.status === "expired";
      else if (subFilterStatus === "cancelled") statusMatch = sub.status === "cancelled";
      else if (subFilterStatus === "warning") statusMatch = sub.status === "active" && sub.expiryStatus === "warning";

      return searchMatch && productMatch && statusMatch;
    });
  }, [subscriptions, subSearch, subFilterProduct, subFilterStatus]);

  // Lọc Tab Hồ sơ Khách hàng
  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      return (
        cust.name.toLowerCase().includes(profileSearch.toLowerCase()) ||
        (cust.email && cust.email.toLowerCase().includes(profileSearch.toLowerCase())) ||
        (cust.phone && cust.phone.includes(profileSearch))
      );
    });
  }, [customers, profileSearch]);

  // Lịch sử đăng ký của khách hàng đang được xem chi tiết
  const detailedCustomerHistory = useMemo(() => {
    if (!detailedCustomer) return [];
    return subscriptions.filter((sub) => sub.customerId === detailedCustomer.id);
  }, [detailedCustomer, subscriptions]);

  // ==========================================
  // ACTIONS XỬ LÝ KHÁCH HÀNG (CUSTOMER)
  // ==========================================

  const handleOpenAddCustModal = () => {
    setEditingCustomer(null);
    resetCust({ name: "", email: "", phone: "", note: "" });
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditCustModal = (e: React.MouseEvent, cust: Customer) => {
    e.stopPropagation();
    setEditingCustomer(cust);
    resetCust({
      name: cust.name,
      email: cust.email || "",
      phone: cust.phone || "",
      note: cust.note || "",
    });
    setIsCustomerModalOpen(true);
  };

  const onSubmitCustomer = async (data: CustomerFormValues) => {
    let success = false;
    if (editingCustomer) {
      success = await updateCustomer(editingCustomer.id, data);
    } else {
      const newCust = await addCustomer(data);
      success = !!newCust;
    }
    if (success) {
      setIsCustomerModalOpen(false);
      if (detailedCustomer && detailedCustomer.id === editingCustomer?.id) {
        const freshCust = customers.find((c) => c.id === detailedCustomer.id);
        if (freshCust) setDetailedCustomer(freshCust);
      }
    }
  };

  const handleOpenDeleteCustDialog = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingCustomerId(id);
  };

  const handleConfirmDeleteCustomer = async () => {
    if (deletingCustomerId) {
      const success = await deleteCustomer(deletingCustomerId);
      if (success) {
        setDeletingCustomerId(null);
        if (detailedCustomer?.id === deletingCustomerId) setDetailedCustomer(null);
      }
    }
  };

  // ==========================================
  // ACTIONS XỬ LÝ ĐĂNG KÝ (SUBSCRIPTION)
  // ==========================================

  const handleOpenCancelSubDialog = (id: string) => {
    setCancellingSubId(id);
  };

  const handleConfirmCancelSub = async () => {
    if (cancellingSubId) {
      const success = await cancelSubscription(cancellingSubId);
      if (success) {
        setCancellingSubId(null);
      }
    }
  };

  const handleOpenDeleteSubDialog = (id: string) => {
    setDeletingSubId(id);
  };

  const handleConfirmDeleteSub = async () => {
    if (deletingSubId) {
      const success = await deleteSubscription(deletingSubId);
      if (success) {
        setDeletingSubId(null);
      }
    }
  };

  // Mở form sửa đăng ký
  const handleOpenEditSubModal = (sub: SubscriptionDetail) => {
    setEditingSub(sub);
    setEditSubAccId(sub.aiAccountId);
    setEditSubRegDate(sub.registrationDate);
    setEditSubDuration(sub.durationMonths);
    setEditSubNote(sub.note || "");
    setIsEditSubModalOpen(true);
  };

  // Lọc tài khoản AI hợp lệ khi đang sửa đăng ký
  const editSubAvailableAccounts = useMemo(() => {
    if (!editingSub) return [];
    return accounts.filter((acc) => {
      // Cho phép chọn tài khoản hiện tại của đăng ký
      if (acc.id === editingSub.aiAccountId) return true;
      // Hoặc các tài khoản thuộc cùng sản phẩm, active, và còn chỗ trống
      return (
        acc.productId === editingSub.productId &&
        acc.status === "active" &&
        acc.usedSlots < acc.maxSlots
      );
    });
  }, [editingSub, accounts]);

  const selectedEditAccount = useMemo(() => {
    return accounts.find((a) => a.id === editSubAccId) || null;
  }, [editSubAccId, accounts]);

  const computedEditExpiryDate = useMemo(() => {
    return calculateExpiryDate(editSubRegDate, editSubDuration);
  }, [editSubRegDate, editSubDuration]);

  const isEditSubExpiryValid = useMemo(() => {
    if (!selectedEditAccount || !computedEditExpiryDate) return true;
    return computedEditExpiryDate <= selectedEditAccount.expiryDate;
  }, [selectedEditAccount, computedEditExpiryDate]);

  const handleSaveEditSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub || !isEditSubExpiryValid) return;

    const success = await updateSubscription(editingSub.id, {
      aiAccountId: editSubAccId,
      registrationDate: editSubRegDate,
      durationMonths: editSubDuration,
      note: editSubNote,
    });

    if (success) {
      setIsEditSubModalOpen(false);
      setEditingSub(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xs">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Quản lý Khách hàng & Cấp phát
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Theo dõi thời hạn sử dụng của từng khách hàng và quản lý thông tin liên hệ.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOpenAddCustModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 text-sm font-semibold rounded-xl border border-indigo-200/50 dark:border-indigo-900/30 transition duration-200 cursor-pointer"
          >
            <UserPlus className="h-4.5 w-4.5" />
            Tạo hồ sơ khách
          </button>
        </div>
      </div>

      {/* Tabs Selection */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab("subs")}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition duration-200 ${
            activeTab === "subs"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          Đăng ký dịch vụ ({subscriptions.filter(s => s.status === "active").length} hoạt động)
        </button>
        <button
          onClick={() => setActiveTab("profiles")}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition duration-200 ${
            activeTab === "profiles"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          Hồ sơ khách hàng ({customers.length})
        </button>
      </div>

      {/* TAB 1: ĐĂNG KÝ DỊCH VỤ */}
      {activeTab === "subs" && (
        <div className="space-y-6">
          {/* Lọc & Tìm kiếm */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Tìm khách hàng, email..."
                value={subSearch}
                onChange={(e) => setSubSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <select
              value={subFilterProduct}
              onChange={(e) => setSubFilterProduct(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="">Tất cả sản phẩm AI</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select
              value={subFilterStatus}
              onChange={(e) => setSubFilterStatus(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="">Mọi trạng thái đăng ký</option>
              <option value="active">Đang hoạt động</option>
              <option value="warning">Sắp hết hạn (&lt;30 ngày)</option>
              <option value="expired">Đã hết hạn</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          {/* Bảng Đăng ký */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xs overflow-hidden">
            {filteredSubscriptions.length === 0 ? (
              <div className="p-12 text-center text-gray-500 space-y-3">
                <History className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700" />
                <p className="font-medium text-sm">Không tìm thấy đăng ký nào phù hợp.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/70 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800/80 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="px-5 py-4">Khách hàng</th>
                      <th className="px-5 py-4">Sản phẩm AI</th>
                      <th className="px-5 py-4 hidden md:table-cell">Tài khoản cấp gốc</th>
                      <th className="px-5 py-4 text-center">Đăng ký & Hết hạn</th>
                      <th className="px-5 py-4 text-center">Trạng thái</th>
                      <th className="px-5 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80 text-xs">
                    {filteredSubscriptions.map((sub) => (
                      <tr 
                        key={sub.id} 
                        className="hover:bg-slate-50/50 dark:hover:bg-gray-850/30 transition duration-150"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900 dark:text-white leading-tight">
                            {sub.customerName}
                          </p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 space-y-0.5">
                            {sub.customerEmail && <span className="block">{sub.customerEmail}</span>}
                            {sub.customerPhone && <span className="block">{sub.customerPhone}</span>}
                          </p>
                        </td>
                        <td className="px-5 py-4 font-semibold text-gray-800 dark:text-gray-200">
                          {sub.productName}
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          <p className="font-medium text-gray-700 dark:text-gray-300">
                            {sub.accountName}
                          </p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500">
                            {sub.loginEmail || "Không có email"}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-center space-y-0.5">
                          <p className="text-gray-500">{formatDateDisplay(sub.registrationDate)} ({sub.durationMonths} th)</p>
                          <p className="font-semibold text-gray-800 dark:text-gray-200">
                            Hạn: {formatDateDisplay(sub.expiryDate)}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex flex-col gap-1 items-center">
                            <StatusBadge status={sub.status} />
                            {sub.status === "active" && sub.expiryStatus !== "normal" && (
                              <StatusBadge status={sub.expiryStatus} />
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Nút sửa đăng ký */}
                            <button
                              onClick={() => handleOpenEditSubModal(sub)}
                              className="p-1.5 text-gray-500 hover:text-indigo-600 border border-gray-200 dark:border-gray-700 hover:border-indigo-200 rounded-lg transition"
                              title="Sửa đăng ký"
                            >
                              <Edit2 className="h-4.5 w-4.5" />
                            </button>

                            {/* Nút Hủy đăng ký */}
                            {sub.status === "active" && (
                              <button
                                onClick={() => handleOpenCancelSubDialog(sub.id)}
                                className="p-1.5 text-gray-400 hover:text-rose-600 border border-gray-200 dark:border-gray-700 hover:border-rose-200 rounded-lg transition"
                                title="Hủy đăng ký"
                              >
                                <UserMinus className="h-4.5 w-4.5" />
                              </button>
                            )}

                            {/* Nút Xóa hẳn để dọn rác */}
                            {sub.status !== "active" && (
                              <button
                                onClick={() => handleOpenDeleteSubDialog(sub.id)}
                                className="p-1.5 text-gray-400 hover:text-rose-600 border border-gray-200 dark:border-gray-700 hover:border-rose-200 rounded-lg transition"
                                title="Xóa bản ghi đăng ký"
                              >
                                <Trash2 className="h-4.5 w-4.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: HỒ SƠ KHÁCH HÀNG (PROFILES) */}
      {activeTab === "profiles" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* Bảng hồ sơ khách (2/3 width) */}
          <div className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xs overflow-hidden transition-all duration-300 ${
            detailedCustomer ? "xl:col-span-2" : "xl:col-span-3"
          }`}>
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center gap-4">
              <div className="relative w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Tìm tên, email, sđt khách..."
                  value={profileSearch}
                  onChange={(e) => setProfileSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="p-12 text-center text-gray-500 space-y-3">
                <Users className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700" />
                <p className="font-medium text-sm">Không tìm thấy hồ sơ khách hàng nào.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/70 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800/80 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="px-5 py-4">Tên khách hàng</th>
                      <th className="px-5 py-4">Email</th>
                      <th className="px-5 py-4">Số điện thoại</th>
                      <th className="px-5 py-4 hidden md:table-cell">Ghi chú</th>
                      <th className="px-5 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80 text-xs">
                    {filteredCustomers.map((cust) => {
                      const isSelected = detailedCustomer?.id === cust.id;
                      return (
                        <tr
                          key={cust.id}
                          onClick={() => setDetailedCustomer(cust)}
                          className={`cursor-pointer transition duration-150 ${
                            isSelected 
                              ? "bg-indigo-50/30 dark:bg-indigo-950/15" 
                              : "hover:bg-slate-50/50 dark:hover:bg-gray-850/30"
                          }`}
                        >
                          <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white">
                            {cust.name}
                          </td>
                          <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                            {cust.email || "-"}
                          </td>
                          <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                            {cust.phone || "-"}
                          </td>
                          <td className="px-5 py-4 text-gray-500 dark:text-gray-400 hidden md:table-cell max-w-xs truncate">
                            {cust.note || "-"}
                          </td>
                          <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Xem lịch sử */}
                              <button
                                onClick={() => setDetailedCustomer(cust)}
                                className="p-1.5 text-gray-500 hover:text-indigo-600 border border-gray-200 dark:border-gray-700 hover:border-indigo-200 rounded-lg transition"
                                title="Xem lịch sử đăng ký dịch vụ"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              {/* Sửa thông tin */}
                              <button
                                onClick={(e) => handleOpenEditCustModal(e, cust)}
                                className="p-1.5 text-gray-500 hover:text-indigo-600 border border-gray-200 dark:border-gray-700 hover:border-indigo-200 rounded-lg transition"
                                title="Sửa hồ sơ khách"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>

                              {/* Xóa hồ sơ */}
                              <button
                                onClick={(e) => handleOpenDeleteCustDialog(e, cust.id)}
                                className="p-1.5 text-gray-400 hover:text-rose-600 border border-gray-200 dark:border-gray-700 hover:border-rose-200 rounded-lg transition"
                                title="Xóa khách hàng"
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

          {/* DRAWER CHI TIẾT KHÁCH HÀNG & LỊCH SỬ SỬ DỤNG (1/3 width) */}
          {detailedCustomer && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-lg overflow-hidden animate-fade-in xl:col-span-1 space-y-6">
              {/* Header Drawer */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                <div>
                  <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">
                    Hồ sơ chi tiết
                  </span>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px]">
                    {detailedCustomer.name}
                  </h4>
                </div>
                <button
                  onClick={() => setDetailedCustomer(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-800"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Thông tin hồ sơ */}
              <div className="px-5 space-y-3">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>Email: {detailedCustomer.email || "Chưa cung cấp"}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>SĐT: {detailedCustomer.phone || "Chưa cung cấp"}</span>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Ghi chú khách hàng</p>
                  <p className="bg-gray-50 dark:bg-gray-850 p-2.5 rounded-xl border border-gray-200/40 dark:border-gray-800 text-gray-600 dark:text-gray-400 leading-relaxed">
                    {detailedCustomer.note || "Không có ghi chú"}
                  </p>
                </div>
              </div>

              {/* Lịch sử sử dụng dịch vụ */}
              <div className="px-5 pb-5 space-y-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 pb-2">
                  <History className="h-4 w-4 text-indigo-500" />
                  <span>Lịch sử đăng ký dịch vụ ({detailedCustomerHistory.length})</span>
                </div>

                {detailedCustomerHistory.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                    <p className="text-xs font-medium">Khách hàng chưa đăng ký sản phẩm nào.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {detailedCustomerHistory.map((sub) => (
                      <div 
                        key={sub.id} 
                        className="p-3 bg-slate-50 dark:bg-gray-850/30 rounded-xl border border-gray-200/40 dark:border-gray-800 flex justify-between items-start gap-2"
                      >
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {sub.productName}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            Cấp từ: {sub.accountName}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            Hạn: {formatDateDisplay(sub.expiryDate)}
                          </p>
                        </div>
                        <div className="text-right space-y-2">
                          <StatusBadge status={sub.status} />
                          {sub.status === "active" && (
                            <button
                              onClick={() => handleOpenCancelSubDialog(sub.id)}
                              className="block ml-auto text-[10px] text-rose-600 hover:underline"
                            >
                              Hủy cấp
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =======================================================================
          MODAL THÊM/SỬA HỒ SƠ KHÁCH HÀNG (CUSTOMER CRUD)
          ======================================================================= */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md overflow-hidden animate-fade-in">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <h4 className="text-base font-bold text-gray-900 dark:text-white">
                  {editingCustomer ? "Sửa hồ sơ khách hàng" : "Tạo hồ sơ khách hàng mới"}
                </h4>
              </div>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Modal */}
            <form onSubmit={handleSubmitCust(onSubmitCustomer)} className="p-5 space-y-4">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Họ và tên khách <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <UserPlus className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    {...registerCust("name")}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 transition"
                  />
                </div>
                {errorsCust.name && (
                  <p className="text-[10px] text-rose-500 mt-1">{errorsCust.name.message}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    placeholder="email@domain.com"
                    {...registerCust("email")}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 transition"
                  />
                </div>
                {errorsCust.email && (
                  <p className="text-[10px] text-rose-500 mt-1">{errorsCust.email.message}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Số điện thoại liên lạc
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Phone className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="0901234567"
                    {...registerCust("phone")}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 transition"
                  />
                </div>
                {errorsCust.phone && (
                  <p className="text-[10px] text-rose-500 mt-1">{errorsCust.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Ghi chú khách hàng
                </label>
                <textarea
                  placeholder="Ghi chú thêm về yêu cầu đặc biệt hoặc thông tin cá nhân..."
                  rows={3}
                  {...registerCust("note")}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 transition"
                />
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-950/20 border border-gray-150 dark:border-gray-800 rounded-xl flex items-start gap-2">
                <Info className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  Hệ thống yêu cầu nhập tối thiểu Họ tên và **ít nhất một thông tin liên hệ** (Email hoặc Số điện thoại) để liên lạc sau này.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition"
                >
                  {editingCustomer ? "Cập nhật" : "Tạo hồ sơ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL SỬA ĐĂNG KÝ (SUBSCRIPTION EDIT)
          ======================================================================= */}
      {isEditSubModalOpen && editingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md overflow-hidden animate-fade-in">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <div>
                <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Sửa đăng ký</span>
                <h4 className="text-base font-bold text-gray-900 dark:text-white">
                  {editingSub.customerName}
                </h4>
              </div>
              <button
                onClick={() => setIsEditSubModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Modal */}
            <form onSubmit={handleSaveEditSub} className="p-5 space-y-4">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Sản phẩm AI: <span className="font-bold text-indigo-600 dark:text-indigo-400">{editingSub.productName}</span>
                </label>
              </div>

              {/* Đổi tài khoản gốc */}
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Tài khoản AI gốc cấp phát <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editSubAccId}
                  onChange={(e) => setEditSubAccId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                >
                  {editSubAvailableAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountName} {acc.loginEmail ? `(${acc.loginEmail})` : ""} — Còn {acc.availableSlots}/5 chỗ — Hạn: {formatDateDisplay(acc.expiryDate)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Ngày đăng ký */}
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Ngày đăng ký <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={editSubRegDate}
                    onChange={(e) => setEditSubRegDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>

                {/* Thời hạn */}
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Thời hạn đăng ký <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editSubDuration}
                    onChange={(e) => setEditSubDuration(Number(e.target.value) as 1 | 6 | 12)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  >
                    <option value={1}>1 tháng</option>
                    <option value={6}>6 tháng</option>
                    <option value={12}>12 tháng</option>
                  </select>
                </div>
              </div>

              {/* Hạn dùng và Check cảnh báo */}
              <div className="p-3 bg-gray-50 dark:bg-gray-950/20 border border-gray-150 dark:border-gray-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Hạn dùng khách hàng mới:</span>
                  <span className="font-bold text-gray-800 dark:text-white">
                    {formatDateDisplay(computedEditExpiryDate)}
                  </span>
                </div>

                {selectedEditAccount && (
                  <div className="border-t border-gray-200 dark:border-gray-850 pt-2 text-[10px]">
                    <div className="flex justify-between text-gray-400">
                      <span>Tài khoản gốc hết hạn:</span>
                      <span className="font-semibold text-gray-600 dark:text-gray-300">{formatDateDisplay(selectedEditAccount.expiryDate)}</span>
                    </div>

                    {!isEditSubExpiryValid && (
                      <p className="text-rose-500 font-semibold mt-1">
                        ⚠️ Lỗi: Hạn dùng của khách vượt quá ngày hết hạn tài khoản gốc! Không thể lưu.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Ghi chú cấp phát
                </label>
                <textarea
                  placeholder="Ghi chú thêm về đăng ký..."
                  rows={2}
                  value={editSubNote}
                  onChange={(e) => setEditSubNote(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsEditSubModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!isEditSubExpiryValid}
                  className={`px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-md transition ${
                    !isEditSubExpiryValid ? "bg-gray-300 dark:bg-gray-800 cursor-not-allowed shadow-none" : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Cancel Subscription Dialog */}
      <ConfirmDialog
        isOpen={cancellingSubId !== null}
        title="Xác nhận hủy đăng ký"
        message="Bạn có chắc chắn muốn hủy đăng ký sử dụng tài khoản AI này của khách hàng? Slot trống trên tài khoản gốc sẽ được giải phóng ngay lập tức."
        confirmText="Hủy đăng ký"
        cancelText="Bỏ qua"
        type="warning"
        onConfirm={handleConfirmCancelSub}
        onCancel={() => setCancellingSubId(null)}
      />

      {/* Confirm Delete Subscription Dialog */}
      <ConfirmDialog
        isOpen={deletingSubId !== null}
        title="Xác nhận xóa đăng ký"
        message="Bạn có chắc chắn muốn xóa vĩnh viễn bản ghi đăng ký này khỏi lịch sử hệ thống? Thao tác này không thể phục hồi."
        confirmText="Xóa vĩnh viễn"
        cancelText="Hủy bỏ"
        type="danger"
        onConfirm={handleConfirmDeleteSub}
        onCancel={() => setDeletingSubId(null)}
      />

      {/* Confirm Delete Customer Dialog */}
      <ConfirmDialog
        isOpen={deletingCustomerId !== null}
        title="Xác nhận xóa hồ sơ khách hàng"
        message="Bạn có chắc chắn muốn xóa hồ sơ khách hàng này cùng toàn bộ lịch sử đăng ký của họ? Hành động này không thể hoàn tác và chỉ có thể thực hiện nếu khách hàng không có đăng ký hoạt động nào."
        confirmText="Xóa khách hàng"
        cancelText="Hủy bỏ"
        type="danger"
        onConfirm={handleConfirmDeleteCustomer}
        onCancel={() => setDeletingCustomerId(null)}
      />

    </div>
  );
};

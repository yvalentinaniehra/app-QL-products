import React, { useState } from "react";
import { useStore } from "../hooks/useStore";
import type { Product } from "../types";
import { StatusBadge, ConfirmDialog } from "../components/UIComponents";
import { Plus, Edit2, Trash2, Power, PowerOff, Sparkles, X, Layers } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema } from "../schemas/validation";
import { z } from "zod";

type ProductFormValues = z.infer<typeof productSchema>;

export const ProductsPage: React.FC = () => {
  const { products, accounts, addProduct, updateProduct, deleteProduct } = useStore();
  
  // States điều khiển Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // States điều khiển ConfirmDialog
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  });

  // Mở modal thêm sản phẩm mới
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    reset({
      name: "",
      description: "",
      isActive: true,
    });
    setIsModalOpen(true);
  };

  // Mở modal sửa sản phẩm
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    reset({
      name: product.name,
      description: product.description || "",
      isActive: product.isActive,
    });
    setIsModalOpen(true);
  };

  // Submit Form
  const onSubmit = async (data: ProductFormValues) => {
    let success = false;
    if (editingProduct) {
      success = await updateProduct(editingProduct.id, data);
    } else {
      success = await addProduct(data);
    }
    if (success) {
      setIsModalOpen(false);
    }
  };

  // Toggle nhanh trạng thái hoạt động của sản phẩm
  const handleToggleActive = async (product: Product) => {
    await updateProduct(product.id, { isActive: !product.isActive });
  };

  // Mở hội thoại xác nhận xóa
  const handleOpenDeleteDialog = (id: string) => {
    setDeletingProductId(id);
  };

  // Thực thi xóa sản phẩm
  const handleConfirmDelete = async () => {
    if (deletingProductId) {
      const success = await deleteProduct(deletingProductId);
      if (success) {
        setDeletingProductId(null);
      }
    }
  };

  // Đếm số tài khoản AI liên kết với từng sản phẩm
  const getAccountCountForProduct = (productId: string) => {
    return accounts.filter((acc) => acc.productId === productId).length;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xs">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Danh sách Sản phẩm AI
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Quản lý các loại dịch vụ AI cung cấp cho khách hàng (ví dụ: ChatGPT, Claude, Gemini).
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition duration-200 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Thêm sản phẩm
        </button>
      </div>

      {/* Danh sách Sản phẩm */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xs overflow-hidden">
        {products.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-3">
            <Layers className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700" />
            <p className="font-medium text-sm">Chưa có sản phẩm AI nào.</p>
            <p className="text-xs text-gray-400">Hãy nhấn nút "Thêm sản phẩm" ở góc phải để bắt đầu.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800/80 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Tên sản phẩm</th>
                  <th className="px-6 py-4 hidden md:table-cell">Mô tả</th>
                  <th className="px-6 py-4 text-center">Số tài khoản liên kết</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80 text-sm">
                {products.map((product) => {
                  const accountCount = getAccountCountForProduct(product.id);
                  return (
                    <tr 
                      key={product.id} 
                      className="hover:bg-slate-50/50 dark:hover:bg-gray-850/30 transition duration-150"
                    >
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 hidden md:table-cell max-w-xs truncate">
                        {product.description || "-"}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300 font-medium">
                        {accountCount} tài khoản
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={product.isActive ? "active" : "disabled"} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Toggle Active status */}
                          <button
                            onClick={() => handleToggleActive(product)}
                            className={`p-1.5 rounded-lg border transition ${
                              product.isActive
                                ? "border-gray-200 dark:border-gray-700 text-gray-400 hover:text-amber-500 hover:border-amber-200"
                                : "border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100"
                            }`}
                            title={product.isActive ? "Tạm ngừng cung cấp" : "Kích hoạt lại sản phẩm"}
                          >
                            {product.isActive ? <PowerOff className="h-4.5 w-4.5" /> : <Power className="h-4.5 w-4.5" />}
                          </button>
                          
                          {/* Edit button */}
                          <button
                            onClick={() => handleOpenEditModal(product)}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 border border-gray-200 dark:border-gray-700 hover:border-indigo-200 rounded-lg transition"
                            title="Sửa thông tin"
                          >
                            <Edit2 className="h-4.5 w-4.5" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => handleOpenDeleteDialog(product.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 border border-gray-200 dark:border-gray-700 hover:border-rose-200 rounded-lg transition"
                            title="Xóa sản phẩm"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
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

      {/* =======================================================================
          ADD/EDIT FORM MODAL
          ======================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-lg overflow-hidden animate-fade-in">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg animate-pulse">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <h4 className="text-base font-bold text-gray-900 dark:text-white">
                  {editingProduct ? "Sửa sản phẩm AI" : "Thêm sản phẩm AI mới"}
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
            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Tên sản phẩm AI <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: ChatGPT Plus, Claude Pro..."
                  {...register("name")}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 transition"
                />
                {errors.name && (
                  <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Mô tả chi tiết
                </label>
                <textarea
                  placeholder="Mô tả công dụng, tính năng hoặc lưu ý sử dụng..."
                  rows={3}
                  {...register("description")}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 transition"
                />
                {errors.description && (
                  <p className="text-xs text-rose-500 mt-1">{errors.description.message}</p>
                )}
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  {...register("isActive")}
                  className="h-4.5 w-4.5 rounded-lg border-gray-300 dark:border-gray-700 text-indigo-600 focus:ring-indigo-500"
                />
                <label 
                  htmlFor="isActive" 
                  className="text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  Cho phép kích hoạt và sử dụng ngay lập tức
                </label>
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
                  {editingProduct ? "Cập nhật" : "Tạo sản phẩm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deletingProductId !== null}
        title="Xác nhận xóa sản phẩm"
        message="Bạn có chắc chắn muốn xóa sản phẩm AI này? Thao tác này không thể hoàn tác và chỉ có thể thực hiện nếu sản phẩm chưa được liên kết với bất kỳ tài khoản gốc nào."
        confirmText="Xóa sản phẩm"
        cancelText="Hủy bỏ"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingProductId(null)}
      />

    </div>
  );
};

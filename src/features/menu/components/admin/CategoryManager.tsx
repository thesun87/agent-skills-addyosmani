"use client";

import { useState } from "react";
import type { AdminCategoryItem } from "@/features/menu/admin-actions/categories";
import {
  createCategoryAction,
  updateCategoryAction,
  reorderCategoryAction,
  deleteCategoryAction,
} from "@/features/menu/admin-actions/categories";

interface CategoryManagerProps {
  initialCategories: AdminCategoryItem[];
}

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [categories, setCategories] = useState<AdminCategoryItem[]>(initialCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategoryItem | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formSortOrder, setFormSortOrder] = useState(1);
  const [formIsVisible, setFormIsVisible] = useState(true);

  // Loading & error
  const [isPending, setIsPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Toast alert
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "danger" } | null>(null);

  // Blocked delete alert modal
  const [deleteBlockedCat, setDeleteBlockedCat] = useState<{ name: string; count: number } | null>(null);

  const showToast = (text: string, type: "success" | "danger" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormName("");
    const nextSort = categories.length > 0 ? Math.max(...categories.map((c) => c.sortOrder)) + 1 : 1;
    setFormSortOrder(nextSort);
    setFormIsVisible(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: AdminCategoryItem) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSortOrder(cat.sortOrder);
    setFormIsVisible(cat.isVisible);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Tên danh mục không được để trống.");
      return;
    }

    try {
      setIsPending(true);
      setFormError(null);

      if (editingCategory) {
        const res = await updateCategoryAction(editingCategory.id, {
          name: formName.trim(),
          sortOrder: formSortOrder,
          isVisible: formIsVisible,
        });

        const updatedCat = res.category;
        if (!res.success || !updatedCat) {
          setFormError(res.error || "Không thể cập nhật danh mục.");
          return;
        }

        setCategories((prev) =>
          prev
            .map((c) => (c.id === editingCategory.id ? updatedCat : c))
            .sort((a, b) => a.sortOrder - b.sortOrder)
        );
        showToast("Đã lưu danh mục!", "success");
      } else {
        const res = await createCategoryAction({
          name: formName.trim(),
          sortOrder: formSortOrder,
          isVisible: formIsVisible,
        });

        const createdCat = res.category;
        if (!res.success || !createdCat) {
          setFormError(res.error || "Không thể tạo danh mục.");
          return;
        }

        setCategories((prev) => [...prev, createdCat].sort((a, b) => a.sortOrder - b.sortOrder));
        showToast("Đã tạo danh mục mới!", "success");
      }

      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    } finally {
      setIsPending(false);
    }
  };

  const handleReorder = async (id: string, direction: "up" | "down") => {
    try {
      setIsPending(true);
      const res = await reorderCategoryAction(id, direction);
      if (res.success) {
        // Reorder locally
        const idx = categories.findIndex((c) => c.id === id);
        if (idx !== -1) {
          const targetIdx = direction === "up" ? idx - 1 : idx + 1;
          if (targetIdx >= 0 && targetIdx < categories.length) {
            const nextList = [...categories];
            const temp = nextList[idx];
            nextList[idx] = nextList[targetIdx];
            nextList[targetIdx] = temp;
            // update sortOrders
            const tempSort = nextList[idx].sortOrder;
            nextList[idx] = { ...nextList[idx], sortOrder: nextList[targetIdx].sortOrder };
            nextList[targetIdx] = { ...nextList[targetIdx], sortOrder: tempSort };
            setCategories(nextList);
          }
        }
        showToast("Đã cập nhật thứ tự hiển thị danh mục!");
      }
    } catch {
      showToast("Lỗi khi đổi thứ tự danh mục.", "danger");
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    if (!editingCategory) return;

    if (editingCategory._count.products > 0) {
      setDeleteBlockedCat({
        name: editingCategory.name,
        count: editingCategory._count.products,
      });
      return;
    }

    try {
      setIsPending(true);
      const res = await deleteCategoryAction(editingCategory.id);
      if (!res.success) {
        setFormError(res.error || "Xoá danh mục thất bại.");
        return;
      }

      setCategories((prev) => prev.filter((c) => c.id !== editingCategory.id));
      showToast(`Đã xoá danh mục "${editingCategory.name}".`, "danger");
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Xoá danh mục thất bại.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl w-full mx-auto" id="section-categories">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all ${
            toastMessage.type === "danger"
              ? "bg-red-50 text-red-800 border-red-200"
              : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}
        >
          <span>{toastMessage.type === "danger" ? "⚠️" : "✅"}</span>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Table Card */}
      <div className="detail-card bg-surface-card rounded-xl border border-border p-5 md:p-6 shadow-sm">
        <div className="detail-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border-light">
          <div>
            <h2 className="font-display text-xl font-bold text-text">Quản lý danh mục món</h2>
            <p className="detail-meta-text text-sm text-text-muted mt-1">
              Thêm danh mục, đổi thứ tự hiển thị và quản lý ẩn/hiện
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="btn-primary-sm inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
          >
            ➕ Thêm danh mục
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-4">
          <table className="items-table w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-text-muted bg-surface/50">
                <th className="py-3 px-3 w-16">Thứ tự</th>
                <th className="py-3 px-3">Tên danh mục</th>
                <th className="py-3 px-3 w-28">Số món</th>
                <th className="py-3 px-3 w-36">Trạng thái</th>
                <th className="py-3 px-3 text-right">Sắp xếp & Thao tác</th>
              </tr>
            </thead>
            <tbody id="categories-table-body" className="divide-y divide-border-light">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-muted">
                    Chưa có danh mục nào. Bấm &quot;Thêm danh mục&quot; để tạo mới.
                  </td>
                </tr>
              ) : (
                categories.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-surface/30 transition-colors">
                    <td className="py-3.5 px-3 font-semibold text-text-muted">
                      #{cat.sortOrder}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-text">
                      {cat.name}
                    </td>
                    <td className="py-3.5 px-3 text-text-muted">
                      {cat._count.products} món
                    </td>
                    <td className="py-3.5 px-3">
                      {cat.isVisible ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Đang hiển thị
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200">
                          Đã ẩn
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          title="Lên"
                          disabled={idx === 0 || isPending}
                          onClick={() => handleReorder(cat.id, "up")}
                          className="btn-icon p-1.5 rounded hover:bg-surface border border-border text-xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          ⬆️
                        </button>
                        <button
                          type="button"
                          title="Xuống"
                          disabled={idx === categories.length - 1 || isPending}
                          onClick={() => handleReorder(cat.id, "down")}
                          className="btn-icon p-1.5 rounded hover:bg-surface border border-border text-xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          ⬇️
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(cat)}
                          className="btn-secondary-sm ml-1.5 px-3 py-1.5 rounded-lg border border-border bg-white hover:bg-surface text-xs font-semibold text-text shadow-xs cursor-pointer transition-colors"
                        >
                          ✏️ Sửa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 3: Thêm & Sửa Danh mục */}
      {isModalOpen && (
        <div
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          id="category-modal"
        >
          <div className="modal-box w-full max-w-[440px] rounded-xl bg-white shadow-2xl overflow-hidden border border-border flex flex-col">
            <div className="modal-header flex items-center justify-between px-5 py-4 border-b border-border bg-surface/50">
              <span className="modal-title font-bold text-base text-text" id="category-modal-title">
                {editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
              </span>
              <button
                type="button"
                onClick={closeModal}
                className="modal-close text-text-muted hover:text-text text-xl font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body p-5 flex flex-col gap-4">
                <input type="hidden" id="cat-edit-id" value={editingCategory?.id || ""} />

                {formError && (
                  <div className="p-3 text-xs rounded-lg bg-red-50 border border-red-200 text-red-700">
                    {formError}
                  </div>
                )}

                <div className="form-group flex flex-col gap-1.5">
                  <label className="form-label text-xs font-semibold text-text" htmlFor="cat-name">
                    Tên danh mục
                  </label>
                  <input
                    type="text"
                    className="form-input px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    id="cat-name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="VD: Cà phê pha máy, Đá xay..."
                    required
                  />
                </div>

                <div className="form-group flex flex-col gap-1.5">
                  <label className="form-label text-xs font-semibold text-text" htmlFor="cat-sort">
                    Thứ tự hiển thị trên menu
                  </label>
                  <input
                    type="number"
                    className="form-input px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    id="cat-sort"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(parseInt(e.target.value, 10) || 1)}
                    min={1}
                    required
                  />
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    id="cat-visible"
                    checked={formIsVisible}
                    onChange={(e) => setFormIsVisible(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                  <label htmlFor="cat-visible" className="text-xs font-medium text-text cursor-pointer">
                    Hiển thị danh mục này trên thực đơn khách hàng
                  </label>
                </div>
              </div>

              <div className="modal-footer flex items-center justify-between px-5 py-4 border-t border-border bg-surface/30">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-ghost px-4 py-2 rounded-lg hover:bg-surface text-sm font-medium text-text-muted hover:text-text transition-colors cursor-pointer"
                >
                  Huỷ
                </button>
                <div className="flex items-center gap-2">
                  {editingCategory && (
                    <button
                      type="button"
                      id="btn-delete-cat"
                      disabled={isPending}
                      onClick={handleDelete}
                      className="btn-cancel-action px-3.5 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      🗑️ Xoá
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isPending}
                    className="btn-primary-sm px-4.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isPending ? "Đang lưu..." : "Lưu danh mục"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Blocked Delete Alert Modal */}
      {deleteBlockedCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-[420px] rounded-xl bg-white shadow-2xl overflow-hidden border border-border p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-red-600">
              <span className="text-2xl">⚠️</span>
              <h3 className="font-bold text-base text-text">Không thể xoá danh mục</h3>
            </div>
            <p className="text-sm text-text-muted leading-relaxed">
              Không thể xoá danh mục &quot;{deleteBlockedCat.name}&quot; vì vẫn còn {deleteBlockedCat.count} món thuộc danh mục này theo quy tắc SPEC.
            </p>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setDeleteBlockedCat(null)}
                className="px-4 py-2 rounded-lg bg-surface hover:bg-border text-sm font-semibold text-text cursor-pointer transition-colors"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import type { AdminProductItem } from "@/features/menu/admin-actions/products";
import type { AdminCategoryItem } from "@/features/menu/admin-actions/categories";
import type { AdminOptionGroupItem } from "@/features/menu/admin-actions/option-groups";
import {
  createProductAction,
  updateProductAction,
  toggleProductAvailabilityAction,
  archiveProductAction,
} from "@/features/menu/admin-actions/products";
import { formatVnd } from "@/lib/money";

interface ProductManagerProps {
  initialProducts: AdminProductItem[];
  categories: AdminCategoryItem[];
  optionGroups: AdminOptionGroupItem[];
}

export function ProductManager({
  initialProducts,
  categories,
  optionGroups,
}: ProductManagerProps) {
  const [products, setProducts] = useState<AdminProductItem[]>(
    initialProducts.filter((p) => !p.isArchived)
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProductItem | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formCategoryId, setFormCategoryId] = useState(categories[0]?.id || "");
  const [formPrice, setFormPrice] = useState<number>(30000);
  const [formDescription, setFormDescription] = useState("");
  const [formSelectedGroupIds, setFormSelectedGroupIds] = useState<string[]>([]);
  const [formIsAvailable, setFormIsAvailable] = useState(true);

  // Loading & error
  const [isPending, setIsPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "danger" } | null>(null);

  const showToast = (text: string, type: "success" | "danger" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormCategoryId(categories[0]?.id || "");
    setFormPrice(35000);
    setFormDescription("");
    setFormSelectedGroupIds([]);
    setFormIsAvailable(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: AdminProductItem) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCategoryId(p.categoryId);
    setFormPrice(p.basePrice);
    setFormDescription(p.description || "");
    setFormSelectedGroupIds(p.optionGroups.map((g) => g.id));
    setFormIsAvailable(p.isAvailable);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormError(null);
  };

  const handleToggleGroup = (groupId: string) => {
    setFormSelectedGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleToggleAvailability = async (product: AdminProductItem) => {
    const nextVal = !product.isAvailable;
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, isAvailable: nextVal } : p))
    );

    try {
      const res = await toggleProductAvailabilityAction(product.id, nextVal);
      if (!res.success) {
        // Revert
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, isAvailable: !nextVal } : p))
        );
        showToast(res.error || "Không thể cập nhật trạng thái.", "danger");
      } else {
        showToast(
          nextVal
            ? `Món "${product.name}" đã được mở bán lại.`
            : `Món "${product.name}" đã chuyển sang trạng thái tạm hết hàng.`
        );
      }
    } catch {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isAvailable: !nextVal } : p))
      );
      showToast("Lỗi khi cập nhật trạng thái.", "danger");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Tên món không được để trống.");
      return;
    }
    if (!formCategoryId) {
      setFormError("Vui lòng chọn danh mục.");
      return;
    }
    if (formPrice < 0) {
      setFormError("Giá niêm yết phải ≥ 0.");
      return;
    }

    try {
      setIsPending(true);
      setFormError(null);

      if (editingProduct) {
        const res = await updateProductAction(editingProduct.id, {
          name: formName.trim(),
          categoryId: formCategoryId,
          basePrice: formPrice,
          description: formDescription.trim(),
          isAvailable: formIsAvailable,
          optionGroupIds: formSelectedGroupIds,
        });

        const updated = res.product;
        if (!res.success || !updated) {
          setFormError(res.error || "Không thể cập nhật món.");
          return;
        }

        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? updated : p)));
        showToast("Đã lưu món ăn!", "success");
      } else {
        const res = await createProductAction({
          name: formName.trim(),
          categoryId: formCategoryId,
          basePrice: formPrice,
          description: formDescription.trim(),
          isAvailable: formIsAvailable,
          optionGroupIds: formSelectedGroupIds,
        });

        const created = res.product;
        if (!res.success || !created) {
          setFormError(res.error || "Không thể tạo món mới.");
          return;
        }

        setProducts((prev) => [...prev, created]);
        showToast("Đã thêm món mới vào thực đơn!", "success");
      }

      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    } finally {
      setIsPending(false);
    }
  };

  const handleArchive = async () => {
    if (!editingProduct) return;

    try {
      setIsPending(true);
      const res = await archiveProductAction(editingProduct.id);
      if (!res.success) {
        setFormError(res.error || "Không thể lưu trữ món.");
        return;
      }

      setProducts((prev) => prev.filter((p) => p.id !== editingProduct.id));
      showToast(
        `Đã lưu trữ món "${editingProduct.name}". Món sẽ không còn hiển thị trên thực đơn khách.`,
        "danger"
      );
      closeModal();
    } catch {
      setFormError("Lỗi khi lưu trữ món.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl w-full mx-auto" id="section-menu">
      {/* Toast Alert */}
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
            <h2 className="font-display text-xl font-bold text-text">
              Quản lý thực đơn đồ uống &amp; bánh
            </h2>
            <p className="detail-meta-text text-sm text-text-muted mt-1">
              Bật/tắt hết hàng một chạm và tuỳ chỉnh giá, tuỳ chọn món
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="btn-primary-sm inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
          >
            ➕ Thêm món mới
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-4">
          <table className="items-table w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-text-muted bg-surface/50">
                <th className="py-3 px-3">Tên món</th>
                <th className="py-3 px-3">Danh mục</th>
                <th className="py-3 px-3">Giá niêm yết</th>
                <th className="py-3 px-3">Nhóm tuỳ chọn</th>
                <th className="py-3 px-3">Trạng thái bán</th>
                <th className="py-3 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody id="menu-table-body" className="divide-y divide-border-light">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-muted">
                    Chưa có món nào. Bấm &quot;Thêm món mới&quot; để bổ sung vào thực đơn.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-surface/30 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-text">{p.name}</div>
                      {p.description && (
                        <div className="text-xs text-text-muted line-clamp-1 mt-0.5">
                          {p.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-text-muted font-medium">
                      {p.category.name}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-text">
                      {formatVnd(p.basePrice)}
                    </td>
                    <td className="py-3.5 px-3">
                      {p.optionGroups.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {p.optionGroups.map((g) => (
                            <span
                              key={g.id}
                              className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface text-text-muted border border-border"
                            >
                              {g.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-text-muted/60">Không có</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <label className="switch inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={p.isAvailable}
                          onChange={() => handleToggleAvailability(p)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 relative"></div>
                        <span
                          className={`text-xs font-semibold ${
                            p.isAvailable ? "text-emerald-700" : "text-stone-500"
                          }`}
                        >
                          {p.isAvailable ? "Còn hàng" : "Hết hàng"}
                        </span>
                      </label>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEditModal(p)}
                        className="btn-secondary-sm px-3 py-1.5 rounded-lg border border-border bg-white hover:bg-surface text-xs font-semibold text-text shadow-xs cursor-pointer transition-colors"
                      >
                        ✏️ Sửa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Thêm & Sửa Món */}
      {isModalOpen && (
        <div
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          id="product-modal"
        >
          <div className="modal-box w-full max-w-[540px] rounded-xl bg-white shadow-2xl overflow-hidden border border-border flex flex-col max-h-[92vh]">
            <div className="modal-header flex items-center justify-between px-5 py-4 border-b border-border bg-surface/50">
              <span className="modal-title font-bold text-base text-text" id="product-modal-title">
                {editingProduct ? "Chỉnh sửa món" : "Thêm món mới vào thực đơn"}
              </span>
              <button
                type="button"
                onClick={closeModal}
                className="modal-close text-text-muted hover:text-text text-xl font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col overflow-hidden">
              <div className="modal-body p-5 flex flex-col gap-4 overflow-y-auto">
                <input type="hidden" id="prod-edit-id" value={editingProduct?.id || ""} />

                {formError && (
                  <div className="p-3 text-xs rounded-lg bg-red-50 border border-red-200 text-red-700">
                    {formError}
                  </div>
                )}

                <div className="form-group flex flex-col gap-1.5">
                  <label className="form-label text-xs font-semibold text-text" htmlFor="prod-name">
                    Tên món đồ uống / thức ăn
                  </label>
                  <input
                    type="text"
                    className="form-input px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    id="prod-name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="VD: Cà phê kem béo"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-group flex flex-col gap-1.5">
                    <label className="form-label text-xs font-semibold text-text" htmlFor="prod-category">
                      Danh mục
                    </label>
                    <select
                      className="form-input px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      id="prod-category"
                      value={formCategoryId}
                      onChange={(e) => setFormCategoryId(e.target.value)}
                      required
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group flex flex-col gap-1.5">
                    <label className="form-label text-xs font-semibold text-text" htmlFor="prod-price">
                      Giá niêm yết (VND)
                    </label>
                    <input
                      type="number"
                      className="form-input px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      id="prod-price"
                      value={formPrice}
                      onChange={(e) => setFormPrice(parseInt(e.target.value, 10) || 0)}
                      step={1000}
                      min={0}
                      required
                    />
                  </div>
                </div>

                <div className="form-group flex flex-col gap-1.5">
                  <label className="form-label text-xs font-semibold text-text" htmlFor="prod-desc">
                    Mô tả món
                  </label>
                  <textarea
                    className="form-input px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    id="prod-desc"
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Mô tả hương vị, nguyên liệu đặc trưng..."
                  />
                </div>

                {/* Shared option groups checklist */}
                <div className="options-builder-box p-3.5 rounded-xl bg-surface/40 border border-border flex flex-col gap-2">
                  <div className="flex justify-between items-center gap-2">
                    <strong className="text-xs text-text">
                      Nhóm tuỳ chọn áp dụng
                      <span id="prod-groups-selected-count" className="ml-2 font-normal text-text-muted">
                        ({formSelectedGroupIds.length} nhóm đã chọn)
                      </span>
                    </strong>
                    <Link
                      href="/admin/tuy-chon"
                      target="_blank"
                      className="text-xs text-primary hover:underline font-semibold"
                    >
                      ⚙️ Quản lý thư viện nhóm →
                    </Link>
                  </div>
                  <span className="text-[11.5px] text-text-muted">
                    Tick để gắn nhóm dùng chung vào món. Bỏ tick chỉ gỡ khỏi món này, không xoá nhóm.
                  </span>

                  <div className="check-list flex flex-col gap-2 mt-1.5 max-h-48 overflow-y-auto" id="product-groups-checklist">
                    {optionGroups.length === 0 ? (
                      <span className="text-xs text-text-muted italic">
                        Chưa có nhóm tuỳ chọn nào trong thư viện.
                      </span>
                    ) : (
                      optionGroups.map((grp) => {
                        const isChecked = formSelectedGroupIds.includes(grp.id);
                        return (
                          <label
                            key={grp.id}
                            className={`flex items-start gap-2.5 p-2 rounded-lg border transition-colors cursor-pointer ${
                              isChecked
                                ? "bg-primary/5 border-primary/30"
                                : "bg-white border-border/80 hover:bg-surface/50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleGroup(grp.id)}
                              className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                            />
                            <div className="flex-1 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-text">{grp.name}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface border border-border text-text-muted">
                                  {grp.isRequired ? "Bắt buộc" : "Tuỳ chọn"}
                                </span>
                              </div>
                              <div className="text-[11px] text-text-muted mt-0.5 line-clamp-1">
                                {grp.options.map((o) => `${o.name} (${o.priceDelta > 0 ? `+${formatVnd(o.priceDelta)}` : "+0đ"})`).join(", ")}
                              </div>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Available switch */}
                <div className="flex items-center gap-2.5 mt-1">
                  <label className="switch inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id="prod-available"
                      checked={formIsAvailable}
                      onChange={(e) => setFormIsAvailable(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 relative"></div>
                    <span className="text-xs font-semibold text-text">
                      Còn hàng (Mở bán ngay)
                    </span>
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
                  {editingProduct && (
                    <button
                      type="button"
                      id="btn-archive-prod"
                      disabled={isPending}
                      onClick={handleArchive}
                      className="btn-cancel-action px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-semibold cursor-pointer disabled:opacity-50"
                    >
                      📦 Lưu trữ món
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isPending}
                    className="btn-primary-sm px-4.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isPending ? "Đang lưu..." : "Lưu món ăn"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

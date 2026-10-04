"use client";

import { useState } from "react";
import type { AdminOptionGroupItem, OptionItemInput } from "@/features/menu/admin-actions/option-groups";
import {
  createOptionGroupAction,
  updateOptionGroupAction,
  deleteOptionGroupAction,
} from "@/features/menu/admin-actions/option-groups";
import { formatVnd } from "@/lib/money";

interface OptionGroupManagerProps {
  initialGroups: AdminOptionGroupItem[];
}

export function OptionGroupManager({ initialGroups }: OptionGroupManagerProps) {
  const [groups, setGroups] = useState<AdminOptionGroupItem[]>(initialGroups);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AdminOptionGroupItem | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formIsRequired, setFormIsRequired] = useState(false);
  const [formMaxSelect, setFormMaxSelect] = useState(1);
  const [formOptions, setFormOptions] = useState<OptionItemInput[]>([
    { name: "", priceDelta: 0 },
  ]);

  const [isPending, setIsPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete modal state
  const [deletingGroup, setDeletingGroup] = useState<AdminOptionGroupItem | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "danger" } | null>(null);

  const showToast = (text: string, type: "success" | "danger" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const openCreateModal = () => {
    setEditingGroup(null);
    setFormName("");
    setFormIsRequired(false);
    setFormMaxSelect(1);
    setFormOptions([
      { name: "", priceDelta: 0 },
      { name: "", priceDelta: 0 },
    ]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (grp: AdminOptionGroupItem) => {
    setEditingGroup(grp);
    setFormName(grp.name);
    setFormIsRequired(grp.isRequired);
    setFormMaxSelect(grp.maxSelect);
    setFormOptions(
      grp.options.map((o) => ({
        id: o.id,
        name: o.name,
        priceDelta: o.priceDelta,
        sortOrder: o.sortOrder,
      }))
    );
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGroup(null);
    setFormError(null);
  };

  const addOptionRow = () => {
    setFormOptions((prev) => [...prev, { name: "", priceDelta: 0 }]);
  };

  const removeOptionRow = (index: number) => {
    if (formOptions.length <= 1) {
      setFormError("Nhóm tuỳ chọn phải có ít nhất 1 tuỳ chọn.");
      return;
    }
    setFormOptions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleOptionChange = (index: number, field: "name" | "priceDelta", value: string | number) => {
    setFormOptions((prev) =>
      prev.map((opt, idx) => {
        if (idx !== index) return opt;
        return {
          ...opt,
          [field]: field === "priceDelta" ? (typeof value === "number" ? value : parseInt(value, 10) || 0) : value,
        };
      })
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Tên nhóm tuỳ chọn không được để trống.");
      return;
    }

    const validOptions = formOptions.map((opt, idx) => ({
      ...opt,
      name: opt.name.trim(),
      sortOrder: idx + 1,
    }));

    if (validOptions.length === 0 || validOptions.some((o) => !o.name)) {
      setFormError("Vui lòng nhập tên cho tất cả các tuỳ chọn.");
      return;
    }

    if (formMaxSelect > validOptions.length) {
      setFormError(`Chọn tối đa ${formMaxSelect} nhưng nhóm chỉ có ${validOptions.length} tuỳ chọn.`);
      return;
    }

    try {
      setIsPending(true);
      setFormError(null);

      if (editingGroup) {
        const res = await updateOptionGroupAction(editingGroup.id, {
          name: formName.trim(),
          isRequired: formIsRequired,
          maxSelect: formMaxSelect,
          options: validOptions,
        });

        const updated = res.group;
        if (!res.success || !updated) {
          setFormError(res.error || "Không thể cập nhật nhóm tuỳ chọn.");
          return;
        }

        setGroups((prev) => prev.map((g) => (g.id === editingGroup.id ? updated : g)));
        showToast("Đã lưu nhóm tuỳ chọn!", "success");
      } else {
        const res = await createOptionGroupAction({
          name: formName.trim(),
          isRequired: formIsRequired,
          maxSelect: formMaxSelect,
          options: validOptions,
        });

        const created = res.group;
        if (!res.success || !created) {
          setFormError(res.error || "Không thể tạo nhóm tuỳ chọn.");
          return;
        }

        setGroups((prev) => [...prev, created]);
        showToast("Đã tạo nhóm tuỳ chọn mới!", "success");
      }

      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    } finally {
      setIsPending(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingGroup) return;

    try {
      setIsPending(true);
      const res = await deleteOptionGroupAction(deletingGroup.id);
      if (!res.success) {
        showToast(res.error || "Xoá nhóm thất bại.", "danger");
        return;
      }

      setGroups((prev) => prev.filter((g) => g.id !== deletingGroup.id));
      showToast(`Đã xoá nhóm "${deletingGroup.name}".`, "danger");
      setDeletingGroup(null);
    } catch {
      showToast("Lỗi khi xoá nhóm tuỳ chọn.", "danger");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl w-full mx-auto" id="section-options">
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

      {/* Main Container Card */}
      <div className="detail-card bg-surface-card rounded-xl border border-border p-5 md:p-6 shadow-sm">
        <div className="detail-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border-light">
          <div>
            <h2 className="font-display text-xl font-bold text-text">
              Thư viện nhóm tuỳ chọn dùng chung
            </h2>
            <p className="detail-meta-text text-sm text-text-muted mt-1">
              Mỗi nhóm (Size, Đường, Đá, Topping…) được tạo một lần và gắn vào nhiều món
            </p>
          </div>
          <button
            type="button"
            id="btn-create-opt-group"
            onClick={openCreateModal}
            className="btn-primary-sm inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
          >
            ➕ Thêm nhóm
          </button>
        </div>

        {/* Library Hint */}
        <div className="library-hint flex items-start gap-3 p-3.5 mt-4 rounded-lg bg-accent-light/60 border border-accent/20 text-xs text-text leading-relaxed">
          <span className="text-base flex-shrink-0">🎛️</span>
          <span>
            Quản lý danh mục các nhóm tuỳ chọn mẫu (Size, Đường, Đá, Topping…). Việc gán nhóm tuỳ chọn nào cho món nào được thực hiện trực tiếp trong phần{" "}
            <strong>Quản lý thực đơn (Món)</strong>.
          </span>
        </div>

        {/* Option Groups Cards List */}
        <div className="opt-group-container grid grid-cols-1 md:grid-cols-2 gap-4 mt-5" id="opt-group-list-container">
          {groups.length === 0 ? (
            <div className="col-span-full text-center py-10 text-text-muted text-sm">
              Thư viện chưa có nhóm tuỳ chọn nào. Bấm &quot;Thêm nhóm&quot; để tạo nhóm mẫu (Size, Đường, Đá, Topping...).
            </div>
          ) : (
            groups.map((grp) => (
              <div
                key={grp.id}
                className="bg-white rounded-xl border border-border p-4.5 shadow-xs flex flex-col justify-between gap-3 hover:border-primary/40 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-text">{grp.name}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {grp.isRequired ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                            Bắt buộc
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-stone-100 text-stone-600 border border-stone-200">
                            Không bắt buộc
                          </span>
                        )}
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {grp.maxSelect === 1 ? "Đơn chọn (1 lựa chọn)" : `Chọn tối đa ${grp.maxSelect} loại`}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface text-text-muted border border-border">
                          {grp._count.products} món đang dùng
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(grp)}
                        className="px-2.5 py-1 rounded bg-surface hover:bg-border text-xs font-semibold text-text cursor-pointer transition-colors"
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingGroup(grp)}
                        className="px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 text-xs font-semibold text-red-700 border border-red-200 cursor-pointer transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Options Table */}
                  <div className="mt-3.5 border-t border-border-light pt-2">
                    <table className="w-full text-xs">
                      <tbody>
                        {grp.options.map((opt) => (
                          <tr key={opt.id} className="border-b border-dashed border-border-light/80 last:border-0">
                            <td className="py-1.5 text-text font-medium">{opt.name}</td>
                            <td className="py-1.5 text-right font-semibold text-text-muted">
                              {opt.priceDelta > 0 ? `+${formatVnd(opt.priceDelta)}` : "+0đ"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal 2: Thêm & Sửa Nhóm Tuỳ Chọn */}
      {isModalOpen && (
        <div
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          id="option-group-modal"
        >
          <div className="modal-box w-full max-w-[500px] rounded-xl bg-white shadow-2xl overflow-hidden border border-border flex flex-col max-h-[90vh]">
            <div className="modal-header flex items-center justify-between px-5 py-4 border-b border-border bg-surface/50">
              <span className="modal-title font-bold text-base text-text" id="opt-group-modal-title">
                {editingGroup ? "Chỉnh sửa nhóm tuỳ chọn" : "Thêm nhóm tuỳ chọn mới"}
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
                <input type="hidden" id="opt-group-edit-id" value={editingGroup?.id || ""} />

                {formError && (
                  <div className="p-3 text-xs rounded-lg bg-red-50 border border-red-200 text-red-700">
                    {formError}
                  </div>
                )}

                <div className="form-group flex flex-col gap-1.5">
                  <label className="form-label text-xs font-semibold text-text" htmlFor="opt-group-name">
                    Tên nhóm tuỳ chọn (OptionGroup Name)
                  </label>
                  <input
                    type="text"
                    className="form-input px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    id="opt-group-name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="VD: Chọn Size, Mức đường, Topping..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <div className="form-group flex flex-col gap-1.5">
                    <label className="form-label text-xs font-semibold text-text" htmlFor="opt-group-max-select">
                      Quy tắc chọn (maxSelect)
                    </label>
                    <select
                      className="form-input px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      id="opt-group-max-select"
                      value={formMaxSelect}
                      onChange={(e) => setFormMaxSelect(parseInt(e.target.value, 10))}
                    >
                      <option value="1">Đơn chọn (1 lựa chọn - Radio)</option>
                      <option value="2">Chọn tối đa 2 loại (Checkbox)</option>
                      <option value="3">Chọn tối đa 3 loại (Checkbox)</option>
                      <option value="5">Chọn tối đa 5 loại (Checkbox)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 h-10">
                    <input
                      type="checkbox"
                      id="opt-group-required"
                      checked={formIsRequired}
                      onChange={(e) => setFormIsRequired(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                    />
                    <label htmlFor="opt-group-required" className="text-xs font-semibold text-text cursor-pointer">
                      Bắt buộc phải chọn (isRequired)
                    </label>
                  </div>
                </div>

                {/* Dynamic Options List */}
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex justify-between items-center">
                    <strong className="text-xs text-text">Danh sách tuỳ chọn (Options):</strong>
                    <button
                      type="button"
                      onClick={addOptionRow}
                      className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      + Thêm tuỳ chọn
                    </button>
                  </div>

                  <div className="flex flex-col gap-2" id="modal-option-rows-container">
                    {formOptions.map((opt, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          className="form-input flex-2 px-3 py-1.5 rounded-lg border border-border text-sm"
                          placeholder="Tên tuỳ chọn (VD: Size L)"
                          value={opt.name}
                          onChange={(e) => handleOptionChange(idx, "name", e.target.value)}
                          required
                        />
                        <input
                          type="number"
                          className="form-input flex-1 px-3 py-1.5 rounded-lg border border-border text-sm"
                          placeholder="Phụ thu VND"
                          value={opt.priceDelta}
                          min={0}
                          step={1000}
                          onChange={(e) => handleOptionChange(idx, "priceDelta", e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => removeOptionRow(idx)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded text-sm font-bold cursor-pointer"
                          aria-label="Xoá tuỳ chọn"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
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
                  {editingGroup && (
                    <button
                      type="button"
                      id="btn-delete-opt-group"
                      onClick={() => {
                        const target = editingGroup;
                        closeModal();
                        setDeletingGroup(target);
                      }}
                      className="btn-cancel-action px-3.5 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold cursor-pointer"
                    >
                      🗑️ Xoá nhóm
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isPending}
                    className="btn-primary-sm px-4.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isPending ? "Đang lưu..." : "Lưu nhóm tuỳ chọn"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2b: Xác nhận Xoá Nhóm Dùng Chung */}
      {deletingGroup && (
        <div
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          id="delete-group-modal"
        >
          <div className="modal-box w-full max-w-[440px] rounded-xl bg-white shadow-2xl overflow-hidden border border-border p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="font-bold text-base text-text">Xoá nhóm tuỳ chọn?</span>
              <button
                type="button"
                onClick={() => setDeletingGroup(null)}
                className="text-text-muted hover:text-text text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>
            <p className="text-sm text-text" id="delete-group-message">
              Bạn có chắc chắn muốn xoá nhóm tuỳ chọn <strong>&quot;{deletingGroup.name}&quot;</strong> không?
            </p>
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <span className="text-sm">ℹ️</span>
              <span>
                Toàn bộ tuỳ chọn trong nhóm sẽ bị xoá vĩnh viễn. Các món đang gán nhóm này sẽ tự động gỡ liên kết. Đơn hàng cũ không bị ảnh hưởng.
              </span>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingGroup(null)}
                className="px-4 py-2 rounded-lg hover:bg-surface text-xs font-semibold text-text cursor-pointer transition-colors"
              >
                Giữ lại
              </button>
              <button
                type="button"
                id="btn-confirm-delete-group"
                disabled={isPending}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors disabled:opacity-50"
              >
                {isPending ? "Đang xoá..." : "🗑️ Xoá nhóm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

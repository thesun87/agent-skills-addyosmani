"use client";

import { useState } from "react";
import type { ShopSettings } from "@/features/settings/schema";
import { updateShopSettingsAction } from "@/features/settings/actions";

interface SettingsManagerProps {
  initialSettings: ShopSettings;
}

const SUPPORTED_BANKS = [
  { code: "970436", name: "Vietcombank (Ngoại thương Việt Nam)" },
  { code: "970415", name: "VietinBank (Công thương Việt Nam)" },
  { code: "970418", name: "BIDV (Đầu tư và Phát triển)" },
  { code: "970407", name: "Techcombank (Kỹ thương)" },
  { code: "970422", name: "MB Bank (Quân đội)" },
];

export function SettingsManager({ initialSettings }: SettingsManagerProps) {
  // Form states
  const [shopName, setShopName] = useState(initialSettings.shopName);
  const [address, setAddress] = useState(initialSettings.address);
  const [phone, setPhone] = useState(initialSettings.phone);

  const [openTime, setOpenTime] = useState(initialSettings.openTime);
  const [closeTime, setCloseTime] = useState(initialSettings.closeTime);
  const [pickupInterval, setPickupInterval] = useState("15");
  const [autoLock, setAutoLock] = useState(true);

  const [shippingFee, setShippingFee] = useState<number>(initialSettings.shippingFee);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(
    initialSettings.freeShippingThreshold
  );
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState<number>(
    initialSettings.deliveryRadiusKm
  );

  const [bankBin, setBankBin] = useState(initialSettings.bankBin || "970436");
  const [bankAccountNo, setBankAccountNo] = useState(initialSettings.bankAccountNo);
  const [bankAccountName, setBankAccountName] = useState(initialSettings.bankAccountName);

  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "danger" } | null>(null);

  const showToast = (text: string, type: "success" | "danger" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shopName.trim() || !address.trim() || !phone.trim()) {
      setError("Vui lòng điền đầy đủ thông tin quán.");
      return;
    }

    if (closeTime <= openTime) {
      setError("Giờ đóng cửa phải sau giờ mở cửa.");
      return;
    }

    if (shippingFee < 0 || freeShippingThreshold < 0 || deliveryRadiusKm <= 0) {
      setError("Phí giao hàng và bán kính phải là số dương.");
      return;
    }

    try {
      setIsPending(true);
      setError(null);

      const res = await updateShopSettingsAction({
        shopName: shopName.trim(),
        address: address.trim(),
        phone: phone.trim(),
        openTime,
        closeTime,
        deliveryRadiusKm,
        shippingFee,
        freeShippingThreshold,
        bankBin,
        bankAccountNo: bankAccountNo.trim(),
        bankAccountName: bankAccountName.trim().toUpperCase(),
      });

      if (!res.success) {
        setError(res.error || "Lưu cài đặt thất bại.");
        showToast(res.error || "Lưu cài đặt thất bại.", "danger");
        return;
      }

      showToast("Đã lưu cài đặt quán thành công!", "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
      showToast("Lưu cài đặt thất bại.", "danger");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl w-full mx-auto" id="section-settings">
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

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 font-medium">
            {error}
          </div>
        )}

        <div className="settings-grid grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. Thông tin quán */}
          <div className="detail-card bg-surface-card rounded-xl border border-border p-5 shadow-sm">
            <h3 className="font-bold text-base mb-3 text-primary flex items-center gap-2">
              <span>☕</span>
              <span>Thông tin quán</span>
            </h3>
            <div className="flex flex-col gap-3.5">
              <div className="form-group flex flex-col gap-1.5">
                <label className="form-label text-xs font-semibold text-text" htmlFor="setting-shop-name">
                  Tên quán hiển thị
                </label>
                <input
                  type="text"
                  className="form-input px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  id="setting-shop-name"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group flex flex-col gap-1.5">
                <label className="form-label text-xs font-semibold text-text" htmlFor="setting-shop-address">
                  Địa chỉ quán
                </label>
                <input
                  type="text"
                  className="form-input px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  id="setting-shop-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <div className="form-group flex flex-col gap-1.5">
                <label className="form-label text-xs font-semibold text-text" htmlFor="setting-shop-phone">
                  Số điện thoại hotline quầy
                </label>
                <input
                  type="text"
                  className="form-input px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  id="setting-shop-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* 2. Giờ hoạt động & Đơn hàng */}
          <div className="detail-card bg-surface-card rounded-xl border border-border p-5 shadow-sm">
            <h3 className="font-bold text-base mb-3 text-accent flex items-center gap-2">
              <span>⏰</span>
              <span>Giờ hoạt động &amp; Đơn hàng</span>
            </h3>
            <div className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group flex flex-col gap-1.5">
                  <label className="form-label text-xs font-semibold text-text" htmlFor="setting-open-time">
                    Giờ mở cửa
                  </label>
                  <input
                    type="time"
                    className="form-input px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    id="setting-open-time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group flex flex-col gap-1.5">
                  <label className="form-label text-xs font-semibold text-text" htmlFor="setting-close-time">
                    Giờ đóng cửa
                  </label>
                  <input
                    type="time"
                    className="form-input px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    id="setting-close-time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group flex flex-col gap-1.5">
                <label className="form-label text-xs font-semibold text-text" htmlFor="setting-pickup-interval">
                  Khung giờ đặt trước (Pickup)
                </label>
                <select
                  className="form-input px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  id="setting-pickup-interval"
                  value={pickupInterval}
                  onChange={(e) => setPickupInterval(e.target.value)}
                >
                  <option value="15">Mỗi khung 15 phút (Khuyên dùng)</option>
                  <option value="30">Mỗi khung 30 phút</option>
                </select>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  id="setting-auto-lock"
                  checked={autoLock}
                  onChange={(e) => setAutoLock(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="setting-auto-lock" className="text-xs font-medium text-text cursor-pointer">
                  Tự động khoá nút đặt hàng ngoài giờ mở cửa ({openTime} – {closeTime})
                </label>
              </div>
            </div>
          </div>

          {/* 3. Phí ship & Bán kính giao */}
          <div className="detail-card bg-surface-card rounded-xl border border-border p-5 shadow-sm">
            <h3 className="font-bold text-base mb-3 text-emerald-700 flex items-center gap-2">
              <span>🛵</span>
              <span>Phí ship &amp; Bán kính giao</span>
            </h3>
            <div className="flex flex-col gap-3.5">
              <div className="form-group flex flex-col gap-1.5">
                <label className="form-label text-xs font-semibold text-text" htmlFor="setting-shipping-fee">
                  Phí ship cố định (VND)
                </label>
                <input
                  type="number"
                  className="form-input px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  id="setting-shipping-fee"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(parseInt(e.target.value, 10) || 0)}
                  step={1000}
                  min={0}
                  required
                />
              </div>

              <div className="form-group flex flex-col gap-1.5">
                <label className="form-label text-xs font-semibold text-text" htmlFor="setting-free-ship-threshold">
                  Ngưỡng miễn phí giao hàng (Free ship ≥)
                </label>
                <input
                  type="number"
                  className="form-input px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  id="setting-free-ship-threshold"
                  value={freeShippingThreshold}
                  onChange={(e) => setFreeShippingThreshold(parseInt(e.target.value, 10) || 0)}
                  step={10000}
                  min={0}
                  required
                />
              </div>

              <div className="form-group flex flex-col gap-1.5">
                <label className="form-label text-xs font-semibold text-text" htmlFor="setting-delivery-radius">
                  Bán kính phục vụ hiển thị (km)
                </label>
                <input
                  type="number"
                  className="form-input px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  id="setting-delivery-radius"
                  value={deliveryRadiusKm}
                  onChange={(e) => setDeliveryRadiusKm(parseFloat(e.target.value) || 1)}
                  step={0.5}
                  min={0.5}
                  required
                />
                <span className="text-[11px] text-text-muted mt-0.5">
                  Chỉ dùng để hiển thị ghi chú, không chặn khách đặt hàng ngoài vùng.
                </span>
              </div>
            </div>
          </div>

          {/* 4. Tài khoản nhận chuyển khoản VietQR */}
          <div className="detail-card bg-surface-card rounded-xl border border-border p-5 shadow-sm">
            <h3 className="font-bold text-base mb-3 text-blue-700 flex items-center gap-2">
              <span>💳</span>
              <span>Tài khoản VietQR đối soát</span>
            </h3>
            <div className="flex flex-col gap-3.5">
              <div className="form-group flex flex-col gap-1.5">
                <label className="form-label text-xs font-semibold text-text" htmlFor="setting-bank-code">
                  Ngân hàng
                </label>
                <select
                  className="form-input px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  id="setting-bank-code"
                  value={bankBin}
                  onChange={(e) => setBankBin(e.target.value)}
                >
                  {SUPPORTED_BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group flex flex-col gap-1.5">
                <label className="form-label text-xs font-semibold text-text" htmlFor="setting-bank-account-no">
                  Số tài khoản nhận tiền
                </label>
                <input
                  type="text"
                  className="form-input px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  id="setting-bank-account-no"
                  value={bankAccountNo}
                  onChange={(e) => setBankAccountNo(e.target.value)}
                  required
                />
              </div>

              <div className="form-group flex flex-col gap-1.5">
                <label className="form-label text-xs font-semibold text-text" htmlFor="setting-bank-account-name">
                  Tên chủ tài khoản (In hoa không dấu)
                </label>
                <input
                  type="text"
                  className="form-input px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary uppercase"
                  id="setting-bank-account-name"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="detail-card bg-surface-raised rounded-xl border border-border p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="text-xs text-text-muted">
            ⚠️ Mọi thay đổi về phí ship và giờ mở cửa sẽ áp dụng tức thì trên trang khách.
          </span>
          <button
            type="submit"
            disabled={isPending}
            className="btn-state-action btn-primary-action px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 self-end sm:self-auto"
          >
            {isPending ? "Đang lưu..." : "💾 Lưu Cài Đặt Quán"}
          </button>
        </div>
      </form>
    </div>
  );
}

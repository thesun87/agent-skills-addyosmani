"use client";

import React, { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatVnd } from "@/lib/money";
import type { MenuProduct } from "@/features/menu/queries";
import type { ShopSettings } from "@/features/settings/schema";
import { useCart } from "@/features/cart/CartContext";
import { deriveCart } from "@/features/cart/store";
import { placeOrder } from "../actions";
import { placeOrderSchema, type PlaceOrderInput } from "../schema";
import { ClosedBanner } from "@/features/settings/components/ClosedBanner";

export interface CheckoutFormProps {
  menuProducts: readonly MenuProduct[];
  settings: ShopSettings;
  isOpen: boolean;
  availablePickupSlots: string[];
}

export function CheckoutForm({
  menuProducts,
  settings,
  isOpen,
  availablePickupSlots,
}: CheckoutFormProps) {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const [isPending, startTransition] = useTransition();

  const [fulfillment, setFulfillment] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [pickupSlot, setPickupSlot] = useState(availablePickupSlots[0] ?? "");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "BANK_TRANSFER">("BANK_TRANSFER");
  const [note, setNote] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // Derive cart totals according to current fulfillment mode (AD7)
  const derived = useMemo(() => {
    return deriveCart(items, menuProducts, settings, fulfillment);
  }, [items, menuProducts, settings, fulfillment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setFieldErrors({});

    if (!isOpen) {
      setServerError(`Quán đang đóng cửa, mở lại lúc ${settings.openTime}`);
      return;
    }

    if (derived.availableLines.length === 0) {
      setServerError("Giỏ hàng của bạn đang trống hoặc không có món khả dụng.");
      return;
    }

    // Construct raw input for Zod validation
    const payload: Partial<PlaceOrderInput> = {
      fulfillment,
      customerName,
      customerPhone,
      paymentMethod,
      deliveryAddress: fulfillment === "DELIVERY" ? deliveryAddress : undefined,
      pickupAt:
        fulfillment === "PICKUP" ? pickupSlot || availablePickupSlots[0] || "earliest" : undefined,
      note: note.trim() || undefined,
      items: derived.availableLines.map((line) => ({
        productId: line.productId,
        optionIds: line.selectedOptions.map((o) => o.id),
        quantity: line.quantity,
        note: line.note ?? "",
      })),
    };

    const parsed = placeOrderSchema.safeParse(payload);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors(errors as Record<string, string[]>);
      return;
    }

    startTransition(async () => {
      try {
        const result = await placeOrder(payload);
        if (!result.success) {
          setServerError(result.message ?? "Không thể đặt hàng, vui lòng thử lại.");
          return;
        }

        clearCart();
        router.push(`/don-hang/${result.data.code}`);
      } catch {
        setServerError("Đã xảy ra lỗi kết nối. Vui lòng kiểm tra lại mạng.");
      }
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/gio-hang"
          className="text-text-muted hover:text-text inline-flex items-center gap-1.5 text-xs font-semibold"
        >
          ← Quay lại giỏ hàng
        </Link>
      </div>

      {!isOpen && (
        <div className="mb-6">
          <ClosedBanner openTime={settings.openTime} />
        </div>
      )}

      {serverError && (
        <div
          role="alert"
          className="border-danger/30 bg-danger-bg text-danger mb-6 flex items-center justify-between rounded-2xl border p-4 text-sm font-semibold"
        >
          <span>⚠️ {serverError}</span>
          <button
            type="button"
            onClick={() => setServerError(null)}
            className="text-text-muted hover:text-text ml-2"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Main form section */}
        <div className="space-y-6 lg:col-span-7">
          {/* Fulfillment mode tabs */}
          <div className="border-border/80 bg-surface-raised rounded-2xl border p-2 shadow-xs">
            <div className="grid grid-cols-2 gap-2" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={fulfillment === "DELIVERY"}
                onClick={() => setFulfillment("DELIVERY")}
                className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all ${
                  fulfillment === "DELIVERY"
                    ? "bg-primary text-white shadow-xs"
                    : "text-text hover:bg-black/5"
                }`}
              >
                <span>🛵</span>
                <span>Giao tận nơi</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={fulfillment === "PICKUP"}
                onClick={() => setFulfillment("PICKUP")}
                className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all ${
                  fulfillment === "PICKUP"
                    ? "bg-primary text-white shadow-xs"
                    : "text-text hover:bg-black/5"
                }`}
              >
                <span>🏪</span>
                <span>Lấy tại quán</span>
              </button>
            </div>
          </div>

          {/* Customer info card */}
          <div className="border-border/80 bg-surface-raised rounded-2xl border p-5 shadow-xs sm:p-6">
            <h2 className="font-display text-text mb-4 text-base font-bold">
              Thông tin người nhận
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="customerName" className="text-text mb-1.5 block text-xs font-bold">
                  Họ và tên <span className="text-danger">*</span>
                </label>
                <input
                  id="customerName"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn Tuấn"
                  className={`bg-surface text-text placeholder:text-text-muted/60 w-full rounded-xl border px-3.5 py-2.5 text-sm focus:bg-white focus:outline-hidden ${
                    fieldErrors.customerName
                      ? "border-danger focus:border-danger"
                      : "border-border/80 focus:border-primary"
                  }`}
                />
                {fieldErrors.customerName && (
                  <p className="text-danger mt-1 text-xs font-medium">
                    {fieldErrors.customerName[0]}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="customerPhone" className="text-text mb-1.5 block text-xs font-bold">
                  Số điện thoại <span className="text-danger">*</span>
                </label>
                <input
                  id="customerPhone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Ví dụ: 0987654321"
                  className={`bg-surface text-text placeholder:text-text-muted/60 w-full rounded-xl border px-3.5 py-2.5 text-sm focus:bg-white focus:outline-hidden ${
                    fieldErrors.customerPhone
                      ? "border-danger focus:border-danger"
                      : "border-border/80 focus:border-primary"
                  }`}
                />
                {fieldErrors.customerPhone && (
                  <p className="text-danger mt-1 text-xs font-medium">
                    {fieldErrors.customerPhone[0]}
                  </p>
                )}
              </div>

              {fulfillment === "DELIVERY" ? (
                <div>
                  <label
                    htmlFor="deliveryAddress"
                    className="text-text mb-1.5 block text-xs font-bold"
                  >
                    Địa chỉ giao hàng <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="deliveryAddress"
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                    className={`bg-surface text-text placeholder:text-text-muted/60 w-full rounded-xl border px-3.5 py-2.5 text-sm focus:bg-white focus:outline-hidden ${
                      fieldErrors.deliveryAddress
                        ? "border-danger focus:border-danger"
                        : "border-border/80 focus:border-primary"
                    }`}
                  />
                  {fieldErrors.deliveryAddress && (
                    <p className="text-danger mt-1 text-xs font-medium">
                      {fieldErrors.deliveryAddress[0]}
                    </p>
                  )}
                  <p className="text-text-muted mt-1.5 flex items-center gap-1 text-xs">
                    <span>🛵</span>
                    <span>
                      Giao trong bán kính {settings.deliveryRadiusKm} km — ngoài vùng quán sẽ gọi
                      xác nhận.
                    </span>
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <div>
                    <label
                      htmlFor="pickupSlot"
                      className="text-text mb-1.5 block text-xs font-bold"
                    >
                      Giờ lấy món <span className="text-danger">*</span>
                    </label>
                    <select
                      id="pickupSlot"
                      value={pickupSlot}
                      onChange={(e) => setPickupSlot(e.target.value)}
                      className="border-border/80 bg-surface text-text focus:border-primary w-full rounded-xl border px-3.5 py-2.5 text-sm focus:bg-white focus:outline-hidden"
                    >
                      {availablePickupSlots.length > 0 ? (
                        availablePickupSlots.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot} hôm nay
                          </option>
                        ))
                      ) : (
                        <option value="earliest">Càng sớm càng tốt (~15-20 phút)</option>
                      )}
                    </select>
                  </div>
                  <div className="border-border/70 bg-surface text-text-muted rounded-xl border p-3 text-xs">
                    <p className="text-text font-bold">📍 Địa chỉ nhận món:</p>
                    <p className="mt-0.5">{settings.address}</p>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="orderNote" className="text-text mb-1.5 block text-xs font-bold">
                  Ghi chú đơn hàng (tuỳ chọn)
                </label>
                <input
                  id="orderNote"
                  type="text"
                  maxLength={200}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chú thêm cho quán (ví dụ: giao trước 11h, chuông cửa hỏng...)"
                  className="border-border/80 bg-surface text-text placeholder:text-text-muted/60 focus:border-primary w-full rounded-xl border px-3.5 py-2.5 text-sm focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Payment method card */}
          <div className="border-border/80 bg-surface-raised rounded-2xl border p-5 shadow-xs sm:p-6">
            <h2 className="font-display text-text mb-4 text-base font-bold">
              Phương thức thanh toán
            </h2>

            <div className="space-y-3">
              <label
                className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-all ${
                  paymentMethod === "BANK_TRANSFER"
                    ? "border-primary bg-primary/5"
                    : "border-border/80 bg-surface hover:bg-black/5"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="BANK_TRANSFER"
                  checked={paymentMethod === "BANK_TRANSFER"}
                  onChange={() => setPaymentMethod("BANK_TRANSFER")}
                  className="text-primary accent-primary mt-1 h-4 w-4"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-text text-sm font-bold">Chuyển khoản VietQR</span>
                    <span className="bg-accent/20 text-text rounded-full px-2 py-0.5 text-[10px] font-bold">
                      Khuyên dùng
                    </span>
                  </div>
                  <p className="text-text-muted mt-1 text-xs">
                    Mã QR ngân hàng tự điền đúng số tiền và mã đơn. Quét bằng mọi ứng dụng ngân
                    hàng.
                  </p>
                </div>
              </label>

              <label
                className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-all ${
                  paymentMethod === "COD"
                    ? "border-primary bg-primary/5"
                    : "border-border/80 bg-surface hover:bg-black/5"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                  className="text-primary accent-primary mt-1 h-4 w-4"
                />
                <div className="flex-1">
                  <span className="text-text text-sm font-bold">
                    {fulfillment === "DELIVERY"
                      ? "Tiền mặt khi nhận hàng (COD)"
                      : "Trả tiền tại quầy"}
                  </span>
                  <p className="text-text-muted mt-1 text-xs">
                    {fulfillment === "DELIVERY"
                      ? "Giao hàng tận nơi rồi thanh toán bằng tiền mặt cho shipper."
                      : "Thanh toán bằng tiền mặt hoặc quẹt thẻ khi đến lấy nước."}
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Order Summary Column */}
        <div className="lg:col-span-5">
          <div className="border-border/80 bg-surface-raised sticky top-24 rounded-2xl border p-5 shadow-xs sm:p-6">
            <h2 className="font-display text-text mb-4 text-base font-bold">
              Tóm tắt đơn hàng ({derived.totalItemCount} món)
            </h2>

            {/* Item list */}
            <div className="divide-border/60 max-h-64 divide-y overflow-y-auto pr-1">
              {derived.availableLines.map((line) => (
                <div
                  key={line.id}
                  className="flex justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-text text-sm font-bold">
                      <span className="text-primary mr-1.5">{line.quantity}×</span>
                      {line.productName}
                    </p>
                    {line.selectedOptions.length > 0 && (
                      <p className="text-text-muted mt-0.5 text-xs">
                        {line.selectedOptions.map((o) => o.name).join(", ")}
                      </p>
                    )}
                  </div>
                  <span className="text-text font-semibold whitespace-nowrap">
                    {formatVnd(line.lineTotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="border-border/70 mt-5 space-y-2 border-t pt-4 text-sm">
              <div className="text-text-muted flex justify-between">
                <span>Tạm tính</span>
                <span className="text-text font-semibold">{formatVnd(derived.subtotal)}</span>
              </div>

              <div className="text-text-muted flex justify-between">
                <span>Phí giao hàng</span>
                <span>
                  {fulfillment === "PICKUP" ? (
                    <span className="text-support font-semibold">0đ (Lấy tại quán)</span>
                  ) : derived.shippingFee === 0 ? (
                    <span className="text-support font-semibold">0đ (Miễn phí)</span>
                  ) : (
                    <span className="text-text font-semibold">
                      {formatVnd(derived.shippingFee)}
                    </span>
                  )}
                </span>
              </div>

              {fulfillment === "DELIVERY" && derived.amountNeededForFreeShipping > 0 && (
                <p className="text-text-muted text-xs">
                  Thêm{" "}
                  <strong className="text-primary font-bold">
                    {formatVnd(derived.amountNeededForFreeShipping)}
                  </strong>{" "}
                  để được freeship.
                </p>
              )}
            </div>

            <div className="border-border/60 text-text mt-4 flex justify-between border-t pt-3 text-lg font-bold">
              <span>Tổng thanh toán</span>
              <span className="text-primary">{formatVnd(derived.total)}</span>
            </div>

            <button
              type="submit"
              disabled={!isOpen || derived.availableLines.length === 0 || isPending}
              className="bg-primary hover:bg-primary-hover disabled:bg-border disabled:text-text-muted mt-6 flex h-12 w-full items-center justify-center rounded-full text-sm font-bold text-white shadow-xs transition-all active:scale-98 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <span>Đang xử lý đơn hàng...</span>
              ) : !isOpen ? (
                <span>Quán đang đóng cửa</span>
              ) : derived.availableLines.length === 0 ? (
                <span>Giỏ hàng đang trống</span>
              ) : (
                <span>Đặt hàng ngay • {formatVnd(derived.total)}</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

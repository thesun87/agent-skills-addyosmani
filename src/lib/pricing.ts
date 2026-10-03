// Pure pricing rules shared by the cart (display) and placeOrder (source of truth). Amounts are integer VND.

export type FulfillmentType = "DELIVERY" | "PICKUP";

export type PricedLine = Readonly<{ unitPrice: number; quantity: number }>;

export type ShippingSettings = Readonly<{ shippingFee: number; freeShippingThreshold: number }>;

export type OrderTotals = Readonly<{ subtotal: number; shippingFee: number; total: number }>;

export function calculateUnitPrice(
  basePrice: number,
  optionPriceDeltas: readonly number[],
): number {
  return optionPriceDeltas.reduce((sum, delta) => sum + delta, basePrice);
}

export function calculateTotals(
  lines: readonly PricedLine[],
  fulfillment: FulfillmentType,
  settings: ShippingSettings,
): OrderTotals {
  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const isFreeShipping =
    fulfillment === "PICKUP" || subtotal === 0 || subtotal >= settings.freeShippingThreshold;
  const shippingFee = isFreeShipping ? 0 : settings.shippingFee;

  return { subtotal, shippingFee, total: subtotal + shippingFee };
}

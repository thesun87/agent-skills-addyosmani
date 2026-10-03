const VND_FORMAT = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });

/** Formats an integer VND amount for display, e.g. 29000 → "29.000đ". */
export function formatVnd(amount: number): string {
  if (!Number.isInteger(amount)) {
    throw new RangeError(`VND amounts must be integers, got ${amount}`);
  }
  return `${VND_FORMAT.format(amount)}đ`;
}

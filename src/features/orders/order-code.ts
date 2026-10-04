// Order code generator (pure function, AD1)
// Format: CF-YYMMDD-XXXX (e.g. CF-261004-9AB2)
// Date is formatted in Vietnam time (UTC+7, AD6)

const SHOP_OFFSET_MS = 7 * 60 * 60 * 1000;
const ALPHANUMERIC = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function generateOrderCode(date: Date = new Date()): string {
  const shopTime = new Date(date.getTime() + SHOP_OFFSET_MS);

  const yy = String(shopTime.getUTCFullYear()).slice(-2);
  const mm = String(shopTime.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(shopTime.getUTCDate()).padStart(2, "0");

  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(Math.random() * ALPHANUMERIC.length);
    randomPart += ALPHANUMERIC[idx];
  }

  return `CF-${yy}${mm}${dd}-${randomPart}`;
}

export function isValidOrderCode(code: string): boolean {
  return /^CF-\d{6}-[A-Z0-9]{4}$/.test(code);
}

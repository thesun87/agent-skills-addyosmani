// VietQR URL generator (AD1, pure function)
// Generates standard static QR image link from img.vietqr.io

export interface VietQrParams {
  bankBin: string;
  accountNo: string;
  amount: number;
  orderCode: string;
}

export function generateVietQrUrl({ bankBin, accountNo, amount, orderCode }: VietQrParams): string {
  const cleanBin = bankBin.trim();
  const cleanAccount = accountNo.trim();
  const safeAddInfo = encodeURIComponent(orderCode.trim());

  return `https://img.vietqr.io/image/${cleanBin}-${cleanAccount}-compact2.png?amount=${Math.round(
    amount,
  )}&addInfo=${safeAddInfo}`;
}

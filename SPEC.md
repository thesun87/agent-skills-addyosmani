# Spec: Tuấn Linh Coffee — Website đặt món online

> Trạng thái: **APPROVED** · Ngày: 2026-10-03

## Giả định (cần xác nhận)

1. Một quán, một chi nhánh, giao diện tiếng Việt, giá VND (số nguyên, không có phần thập phân).
2. Món đồ uống có **tuỳ chọn**: size (có cộng giá), mức đường, mức đá, topping (có cộng giá). Món ăn kèm (bánh…) không có tuỳ chọn.
3. Khách đặt **không cần tài khoản**; tra cứu đơn bằng mã đơn + số điện thoại.
4. Chuyển khoản dùng **VietQR tĩnh theo đơn** (số tiền + nội dung = mã đơn); nhân viên **đối soát thủ công** rồi bấm "Đã thanh toán". Không tích hợp ngân hàng/webhook ở v1.
5. Quán tự giao hoặc gọi shipper ngoài; hệ thống **không** tích hợp Grab/Ahamove ở v1.
6. Chỉ nhận đơn trong giờ mở cửa (admin cấu hình). Ngoài giờ, trang menu vẫn xem được nhưng nút đặt bị khoá.
7. Admin chỉ có một vai trò (chủ quán/nhân viên dùng chung quyền); vài tài khoản admin được seed sẵn.
8. Trình duyệt hiện đại, ưu tiên **mobile-first** (phần lớn khách đặt từ điện thoại).

**Phạm vi:** Yêu cầu xoay quanh một luồng duy nhất (menu → giỏ → đặt đơn → quán xử lý đơn), các phần dùng chung domain `Order`/`Product` nên viết thành **một spec**, không tách capability map.

## Objective

Cho phép khách của quán **Tuấn Linh Coffee** xem menu, đặt đồ uống/đồ ăn online để **giao tận nơi** hoặc **đặt trước lấy tại quán**, thanh toán **COD** hoặc **chuyển khoản QR**. Chủ quán quản lý menu và xử lý đơn trên trang admin, nhận cảnh báo âm thanh khi có đơn mới.

**Người dùng:**
- **Khách hàng** — đặt món nhanh trên điện thoại, không muốn đăng ký.
- **Chủ quán / nhân viên** — cập nhật menu, hết hàng; nhận và xử lý đơn trên tablet/laptop tại quầy.

### User stories & tiêu chí chấp nhận

**Khách hàng**

| # | Story | Tiêu chí chấp nhận |
|---|---|---|
| C1 | Xem menu theo danh mục | Hiển thị món theo danh mục, ảnh, giá, mô tả; món hết hàng hiển thị mờ và không thêm vào giỏ được |
| C2 | Chọn tuỳ chọn món | Chọn size/đường/đá/topping; giá cập nhật ngay; tuỳ chọn bắt buộc phải chọn mới thêm được |
| C3 | Quản lý giỏ hàng | Thêm/sửa số lượng/xoá; giỏ lưu trong `localStorage`, còn sau khi tải lại trang; cùng món + cùng tuỳ chọn thì gộp dòng |
| C4 | Chọn hình thức nhận | **Giao hàng**: bắt buộc tên, SĐT, địa chỉ; hiển thị ghi chú "Giao trong bán kính X km — ngoài vùng quán sẽ gọi xác nhận" (X do admin cấu hình, không chặn đơn). **Lấy tại quán**: bắt buộc tên, SĐT, giờ lấy (khung 15 phút, sớm nhất = now + 15 phút, trong giờ mở cửa) |
| C5 | Phí giao hàng | Phí cố định (mặc định 15.000đ), **miễn phí** khi tạm tính ≥ ngưỡng (mặc định 150.000đ); pickup không có phí; cả hai giá trị admin cấu hình được |
| C6 | Thanh toán | Chọn COD (giao hàng) / trả tại quầy (pickup) hoặc chuyển khoản. Chọn chuyển khoản → trang xác nhận hiển thị mã VietQR với đúng số tiền và nội dung = mã đơn |
| C7 | Đặt đơn | Server **tính lại toàn bộ giá** từ DB (không tin giá client gửi); món hết hàng/ngừng bán giữa chừng → báo lỗi rõ ràng, không tạo đơn |
| C8 | Xác nhận & theo dõi | Sau khi đặt nhận mã đơn dạng `CF-YYMMDD-XXXX`; trang `/don-hang/[code]` hiển thị trạng thái, chỉ xem được khi nhập đúng SĐT; trạng thái tự làm mới mỗi 15 giây |
| C9 | Ngoài giờ | Ngoài giờ mở cửa: banner "Quán đang đóng cửa, mở lại lúc HH:mm", nút đặt bị khoá, API từ chối tạo đơn |

**Admin**

| # | Story | Tiêu chí chấp nhận |
|---|---|---|
| A1 | Đăng nhập | Email + mật khẩu (bcrypt); mọi route `/admin/**` và API admin yêu cầu phiên hợp lệ; khoá 15 phút sau 5 lần sai |
| A2 | Quản lý danh mục | CRUD danh mục, sắp xếp thứ tự hiển thị |
| A3 | Quản lý món | CRUD món (tên, mô tả, giá, ảnh, danh mục, nhóm tuỳ chọn); bật/tắt **hết hàng** bằng một chạm; ẩn món thay vì xoá cứng nếu món đã có trong đơn |
| A4 | Danh sách đơn | Lọc theo trạng thái/ngày/hình thức; đơn mới nổi bật; tự làm mới ≤ 10 giây; **phát âm báo** khi có đơn mới (sau khi nhân viên bấm "Bật âm báo" một lần để vượt chính sách autoplay) |
| A5 | Xử lý đơn | Chuyển trạng thái theo máy trạng thái bên dưới; không cho nhảy trạng thái sai; huỷ đơn bắt buộc nhập lý do |
| A6 | Đối soát chuyển khoản | Bấm "Đã nhận tiền" → `paymentStatus = PAID`, lưu thời điểm và admin xác nhận |
| A7 | Cài đặt quán | Tên, địa chỉ, SĐT, giờ mở cửa theo thứ, bán kính giao hàng (km, chỉ để hiển thị), phí ship, ngưỡng free ship, thông tin tài khoản nhận VietQR (bank BIN, số TK, tên TK) |

### Máy trạng thái đơn

```
PENDING ──► CONFIRMED ──► PREPARING ──► READY_FOR_PICKUP ──► COMPLETED   (pickup)
                                    └─► DELIVERING ───────► COMPLETED   (delivery)
PENDING | CONFIRMED | PREPARING ──► CANCELLED (bắt buộc lý do)
```

- Mọi đơn mới đều ở `PENDING`; nhân viên **phải bấm xác nhận** (`CONFIRMED`) trước khi pha. Không tự động xác nhận.
- `paymentStatus`: `UNPAID` → `PAID` (độc lập với trạng thái đơn). Đơn chuyển khoản chưa trả **không tự huỷ**; nhân viên tự quyết.

### Ngoài phạm vi v1

Tài khoản khách, tích điểm, voucher/khuyến mãi, cổng thanh toán (VNPay/MoMo), tích hợp đơn vị vận chuyển, phí ship theo khoảng cách, nhiều chi nhánh, đa ngôn ngữ, báo cáo doanh thu, phân quyền nhân viên, gọi món tại bàn bằng QR, thông báo Zalo/Telegram/email.

## Thương hiệu & nội dung

### Màu chủ đạo — theo mệnh Hỏa

Ngũ hành: **Hỏa** hợp màu bản mệnh (đỏ, cam, hồng, tím) và màu tương sinh **Mộc sinh Hỏa** (xanh lá). Nên tránh màu **Thủy khắc Hỏa** (đen, xanh dương đậm) làm màu chính. Vì vậy chữ dùng nâu cà phê đậm thay cho đen. Nâu thuộc Thổ (Hỏa sinh Thổ) nên dùng được, và hợp chất cà phê.

| Token | Màu | Hex | Vai trò |
|---|---|---|---|
| `--color-primary` | Đỏ son | `#B8322A` | Màu thương hiệu: nút chính, logo, giá |
| `--color-primary-hover` | Đỏ son đậm | `#962720` | Hover/active của nút chính |
| `--color-accent` | Cam hổ phách | `#E8892B` | Badge "Mới", highlight, ngọn lửa trong logo |
| `--color-support` | Xanh lá trà | `#4E7A47` | Trạng thái thành công, "Còn hàng", lá trang trí (Mộc sinh Hỏa) |
| `--color-surface` | Kem sữa | `#FBF5EC` | Nền trang |
| `--color-surface-raised` | Trắng ngà | `#FFFDF9` | Nền thẻ món, sheet |
| `--color-text` | Nâu espresso | `#3A2620` | Chữ chính (thay cho đen) |
| `--color-text-muted` | Nâu sữa | `#7A5E52` | Chữ phụ, mô tả |

- Độ tương phản đã đo, tất cả đạt **WCAG AA** (≥ 4.5:1): chữ/nền 13.1 · chữ phụ/nền 5.5 · chữ trắng trên đỏ son 6.0 · đỏ son trên nền 5.5 · chữ nâu trên cam 5.4 · chữ trắng trên xanh lá 5.0 · xanh lá trên nền 4.6.
- Cam `#E8892B` không dùng làm màu chữ trên nền sáng (tương phản thấp). Chỉ dùng cho nền badge kèm chữ nâu đậm.
- v1 chỉ có giao diện sáng. Dark mode nằm ngoài phạm vi.

### Logo (tự thiết kế)

- **Ý tưởng:** ly cà phê có làn khói bốc lên uốn thành **ngọn lửa** (đúng mệnh Hỏa), thêm một chiếc lá nhỏ bên cạnh (Mộc sinh Hỏa). Chữ **TUẤN LINH** dùng font serif, bên dưới là "COFFEE" giãn chữ.
- **Biến thể:** logo đầy đủ (biểu tượng + chữ), biểu tượng riêng (favicon/app icon), bản một màu (in tem ly, hoá đơn).
- **Định dạng:** SVG vẽ tay bằng code, chữ chuyển thành path khi chốt để không phụ thuộc font.
- Bản nháp nằm ở `docs/brand/logo-draft.svg` để chủ quán duyệt. Sau khi chốt sẽ chép sang `public/brand/`.

### Menu mẫu & ảnh món

Seed sẵn menu kiểu quán cafe Việt phổ biến, giá tham khảo mặt bằng chung. Admin sửa được sau:

| Danh mục | Món (giá size M) |
|---|---|
| Cà phê Việt | Cà phê đen đá 25.000đ · Cà phê sữa đá 29.000đ · Bạc xỉu 32.000đ · Cà phê muối 35.000đ · Cà phê cốt dừa 39.000đ |
| Cà phê Ý | Espresso 35.000đ · Americano 39.000đ · Cappuccino 45.000đ · Latte 45.000đ |
| Trà | Trà đào cam sả 39.000đ · Trà vải 39.000đ · Trà sen vàng 42.000đ · Trà sữa trân châu 39.000đ |
| Đá xay & Matcha | Matcha latte 45.000đ · Cookie đá xay 49.000đ · Chocolate đá xay 49.000đ |
| Nước ép & Sinh tố | Nước cam 39.000đ · Sinh tố bơ 45.000đ |
| Bánh | Croissant 29.000đ · Bánh mì que 15.000đ · Tiramisu 39.000đ |

- Tuỳ chọn chuẩn cho đồ uống: Size M / L (+6.000đ). Đường 0–30–50–70–100%. Đá: ít / vừa / nhiều / để riêng. Topping: trân châu, thạch, kem cheese (+8.000đ).
- **Ảnh món:** **không** lấy ảnh tuỳ tiện trên mạng (vi phạm bản quyền). v1 dùng ảnh có giấy phép thương mại miễn phí từ **Unsplash/Pexels**, ghi nguồn trong `prisma/seed-images/CREDITS.md`, nén WebP ≤ 150KB, tỉ lệ 1:1. Nên thay bằng ảnh chụp thật của quán trước khi ra mắt.

## Tech Stack

| Lớp | Lựa chọn |
|---|---|
| Framework | Next.js 15 (App Router, Server Components, Server Actions / Route Handlers) |
| Ngôn ngữ | TypeScript 5 (`strict: true`) |
| DB / ORM | PostgreSQL 16 + Prisma 6 |
| Validation | Zod (dùng chung schema cho form client và server) |
| Auth admin | Auth.js v5 (Credentials provider) + bcrypt |
| UI | Tailwind CSS 4 |
| Lưu ảnh | Supabase Storage (bucket public `product-images`; upload chỉ qua API admin) |
| Môi trường local | Supabase CLI (`supabase start`) — chạy Postgres + Storage trên Docker, không cần tài khoản cloud khi dev |
| Font | Be Vietnam Pro (UI, hỗ trợ tiếng Việt tốt) + Lora (tiêu đề), qua `next/font/google` |
| VietQR | Ảnh QR từ `https://img.vietqr.io/image/{bankBin}-{accountNo}-compact2.png?amount=..&addInfo=..` |
| Test | Vitest + Testing Library, Playwright |
| Hosting | Vercel (app) + Supabase (Postgres + Storage). **Chưa có tài khoản/domain** → v1 phát triển hoàn toàn local; thiết lập cloud + domain là task cuối, làm cùng chủ quán |
| Package manager | pnpm 9, Node 22 LTS |

## Commands

```bash
pnpm install                         # cài dependency
pnpm dev                             # dev server http://localhost:3000
pnpm build                           # build production
pnpm start                           # chạy bản build
pnpm lint                            # ESLint
pnpm lint --fix                      # ESLint tự sửa
pnpm typecheck                       # tsc --noEmit
pnpm format                          # prettier --write .
pnpm test                            # Vitest (unit + integration)
pnpm test -- --coverage              # kèm báo cáo coverage
pnpm test:e2e                        # Playwright
pnpm db:migrate                      # prisma migrate dev
pnpm db:seed                         # seed danh mục, món mẫu, admin mặc định
pnpm db:studio                       # prisma studio
pnpm supabase start                  # Postgres + Storage local (cần Docker Desktop)
pnpm supabase stop                   # tắt stack local
```

## Project Structure

```
src/
├── app/
│   ├── (shop)/                      → Trang khách
│   │   ├── page.tsx                 → Menu
│   │   ├── gio-hang/page.tsx        → Giỏ hàng
│   │   ├── thanh-toan/page.tsx      → Checkout
│   │   └── don-hang/[code]/page.tsx → Theo dõi đơn
│   ├── admin/                       → Trang quản trị (bảo vệ bởi middleware)
│   │   ├── dang-nhap/
│   │   ├── don-hang/
│   │   ├── mon/
│   │   ├── danh-muc/
│   │   └── cai-dat/
│   └── api/                         → Route handlers (polling đơn, upload ảnh, auth)
├── features/                        → Tổ chức theo domain
│   ├── menu/                        → components, queries, schema
│   ├── cart/                        → cart store (localStorage), pricing hiển thị
│   ├── checkout/                    → form, server action placeOrder
│   ├── orders/                      → state machine, repository, admin actions
│   └── settings/                    → giờ mở cửa, phí ship, VietQR
├── lib/
│   ├── db.ts                        → Prisma client singleton
│   ├── money.ts                     → định dạng VND
│   ├── pricing.ts                   → tính tạm tính / phí ship / tổng (pure)
│   ├── opening-hours.ts             → kiểm tra giờ mở cửa (pure, timezone Asia/Ho_Chi_Minh)
│   ├── vietqr.ts                    → build URL VietQR
│   └── rate-limit.ts
├── components/ui/                   → Button, Input, Sheet… dùng chung
└── middleware.ts                    → chặn /admin/**
prisma/
├── schema.prisma
├── migrations/
├── seed.ts
└── seed-images/                     → ảnh món mẫu (giấy phép miễn phí), upload lên Storage khi seed
public/brand/                        → logo.svg, logo-mark.svg, favicon, ảnh OG
supabase/                            → config Supabase CLI
docs/brand/                          → bản nháp logo + bảng màu để duyệt
tests/
├── unit/                            → mirror src/lib, src/features
└── integration/                     → server actions + Postgres test DB
e2e/                                 → Playwright specs
docs/adr/                            → quyết định kiến trúc
```

## Code Style

- TypeScript strict, không `any`; kiểu suy ra từ Zod (`z.infer`).
- Tiền tệ luôn là **số nguyên VND** (`number`, không float math); chỉ định dạng ở lớp hiển thị.
- Hàm nghiệp vụ (`pricing`, `opening-hours`, `order state machine`) là **hàm thuần**, không truy cập DB → dễ test.
- Không mutate: trả object mới.
- Đặt tên: component `PascalCase`, hàm/biến `camelCase`, file `kebab-case.ts`, route URL tiếng Việt không dấu (`/gio-hang`).
- Code và comment bằng tiếng Anh; **chuỗi hiển thị cho người dùng bằng tiếng Việt**.
- Lỗi nghiệp vụ trả về kiểu `Result`, không throw ra UI.
- Prettier mặc định, ESLint `next/core-web-vitals` + `@typescript-eslint/strict`.

```ts
// src/lib/pricing.ts
import type { ShopSettings } from "@/features/settings/schema";

export type PricedLine = Readonly<{ unitPrice: number; quantity: number }>;
export type FulfillmentType = "DELIVERY" | "PICKUP";

export type OrderTotals = Readonly<{
  subtotal: number;
  shippingFee: number;
  total: number;
}>;

export function calculateTotals(
  lines: readonly PricedLine[],
  fulfillment: FulfillmentType,
  settings: Pick<ShopSettings, "shippingFee" | "freeShippingThreshold">,
): OrderTotals {
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const shippingFee =
    fulfillment === "PICKUP" || subtotal >= settings.freeShippingThreshold
      ? 0
      : settings.shippingFee;

  return { subtotal, shippingFee, total: subtotal + shippingFee };
}
```

```ts
// src/features/checkout/actions.ts
"use server";

export async function placeOrder(input: unknown): Promise<Result<{ code: string }>> {
  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) return err("INVALID_INPUT", parsed.error.flatten());

  if (!isOpenNow(await getSettings(), new Date())) return err("SHOP_CLOSED");

  // Prices are re-derived from the DB; client-sent prices are ignored.
  return orderRepository.createFromCart(parsed.data);
}
```

## Mô hình dữ liệu (tóm tắt)

- `Category(id, name, sortOrder, isVisible)`
- `Product(id, categoryId, name, description, basePrice, imageUrl, isAvailable, isArchived)`
- `OptionGroup(id, productId, name, isRequired, maxSelect)` → `Option(id, groupId, name, priceDelta)`
- `Order(id, code, customerName, phone, address?, note?, fulfillmentType, pickupAt?, paymentMethod, paymentStatus, status, subtotal, shippingFee, total, cancelReason?, paidAt?, paidById?, createdAt)`
- `OrderItem(id, orderId, productId, productName, unitPrice, quantity, optionsSnapshot JSON)` — **snapshot** tên/giá tại thời điểm đặt
- `OrderStatusHistory(id, orderId, from, to, adminId?, at)`
- `ShopSettings` (một bản ghi): giờ mở cửa theo thứ, phí ship, ngưỡng free ship, thông tin VietQR
- `AdminUser(id, email, passwordHash, failedAttempts, lockedUntil?)`

## Testing Strategy

| Cấp | Công cụ | Phạm vi | Vị trí |
|---|---|---|---|
| Unit | Vitest | `pricing`, `opening-hours`, order state machine, Zod schema, `vietqr`, cart reducer, sinh mã đơn | `tests/unit/` |
| Integration | Vitest + Postgres test (docker) | `placeOrder` (tính lại giá, món hết hàng, ngoài giờ), chuyển trạng thái đơn, xác nhận thanh toán, auth admin/lockout | `tests/integration/` |
| E2E | Playwright (viewport mobile 375 + desktop 1280) | (1) Đặt giao hàng COD; (2) Đặt pickup + chuyển khoản → thấy QR; (3) Admin nhận đơn → chuyển trạng thái → khách thấy cập nhật; (4) Admin tắt món → khách không thêm được | `e2e/` |

- **TDD**: viết test trước cho logic nghiệp vụ.
- Coverage tối thiểu **80%** (lines/branches) cho `src/lib` và `src/features`; CI fail nếu thấp hơn.
- Kiểm tra a11y cơ bản bằng `@axe-core/playwright` trên menu, checkout, admin đơn hàng.

## Boundaries

**Always**
- Validate mọi input bằng Zod ở server, kể cả khi đã validate ở client.
- Tính giá/phí ship/tổng ở server từ DB; lưu snapshot giá vào `OrderItem`.
- Kiểm tra phiên admin ở mọi server action/route admin (không chỉ dựa vào middleware).
- Chạy `pnpm lint && pnpm typecheck && pnpm test` trước khi commit.
- Đọc secrets từ biến môi trường; có `.env.example`.
- Rate limit API tạo đơn (VD: 5 đơn / 10 phút / IP) và đăng nhập admin.
- Xử lý thời gian theo `Asia/Ho_Chi_Minh`.

**Ask first**
- Thay đổi schema DB / migration ngoài những gì spec mô tả.
- Thêm dependency mới ngoài Tech Stack.
- Tích hợp dịch vụ bên thứ ba (thanh toán, vận chuyển, SMS, Zalo).
- Đổi máy trạng thái đơn hoặc quy tắc tính phí.
- Thay đổi cấu hình CI/deploy.

**Never**
- Commit secrets, `.env`, mật khẩu admin mặc định thật.
- Tin giá/tổng tiền gửi từ client.
- Xoá cứng món/đơn đã phát sinh giao dịch.
- Lộ thông tin đơn (SĐT, địa chỉ) khi chưa xác minh SĐT trên trang tra cứu.
- Xoá hoặc skip test đang fail mà không được đồng ý.
- Lưu số thẻ/thông tin ngân hàng của khách.

## Success Criteria

1. Khách hoàn tất đặt đơn giao hàng COD trên mobile trong **≤ 4 bước** (menu → tuỳ chọn → giỏ → checkout) — kiểm bằng E2E.
2. Tổng tiền trong DB luôn bằng kết quả `calculateTotals` với giá DB, kể cả khi client gửi giá giả — kiểm bằng integration test.
3. Đơn mới xuất hiện trên admin trong **≤ 10 giây** kèm âm báo.
4. Khách thấy trạng thái đơn cập nhật trong **≤ 15 giây** sau khi admin đổi.
5. Mã VietQR đúng chuẩn: unit test kiểm URL (bank BIN, STK, số tiền, `addInfo` = mã đơn); kiểm sandbox bằng cách quét trong app ngân hàng thấy đúng số tiền + nội dung rồi **huỷ, không chuyển tiền thật**.
6. Ngoài giờ mở cửa: không tạo được đơn qua UI lẫn gọi trực tiếp API.
7. Trang menu: **LCP < 2.5s**, **CLS < 0.1** trên Lighthouse mobile; không cuộn ngang ở 320px.
8. Coverage ≥ 80%; `pnpm build`, lint, typecheck, toàn bộ test đều xanh.

## Quyết định đã chốt (vòng 1)

| # | Câu hỏi | Quyết định |
|---|---|---|
| 1 | Lưu ảnh món | Supabase Storage |
| 2 | Phạm vi giao hàng | Chỉ hiển thị ghi chú bán kính X km, ngoài vùng thì nhân viên gọi xác nhận, không chặn đơn |
| 3 | Xác nhận đơn | Nhân viên phải xác nhận thủ công (PENDING → CONFIRMED) |
| 4 | Tự huỷ đơn chuyển khoản chưa trả | Không |
| 5 | Thương hiệu | Tên **Tuấn Linh Coffee**; màu theo mệnh Hỏa; logo tự thiết kế; ảnh mẫu Unsplash/Pexels (xem phần Thương hiệu) |
| 6 | Domain & hosting | Chưa có → dev local bằng Supabase CLI; deploy là task cuối |

## Open Questions

1. ~~Bảng màu & logo~~ → đã duyệt (2026-10-03).
2. ~~Thông tin VietQR~~ → v1 chỉ kiểm sandbox (xem Success Criteria #5); tài khoản thật nhập trong admin khi deploy.
3. ~~Giờ mở cửa & bán kính~~ → chốt mặc định khi seed: 07:00–22:00 hằng ngày, bán kính 5 km.
4. **Domain (khi deploy):** gợi ý `tuanlinhcoffee.vn` hoặc `.com`; chủ quán tự mua và đứng tên.

# Tasks: Tuấn Linh Coffee

> Spec: [SPEC.md](../SPEC.md) · Plan: [plan.md](plan.md)
> Definition of Done mọi task: test viết trước (TDD) · `pnpm lint && pnpm typecheck && pnpm test` xanh · không secrets trong code · chuỗi UI tiếng Việt · **giao diện bám sát prototype đã duyệt (`docs/design/customer-prototype.html` & `docs/design/admin-prototype.html`)**.

---

## Phase 1 — Foundation

### - [x] T1: Scaffold dự án + design tokens + công cụ chất lượng

**Description:** Khởi tạo Next.js 15 (App Router, TS strict, Tailwind 4, pnpm). Cấu hình design tokens màu mệnh Hỏa và font Be Vietnam Pro + Lora. Thiết lập ESLint, Prettier, Vitest (coverage v8, ngưỡng 80%), Playwright (mobile 375 + desktop 1280). Trang chủ tạm hiển thị "Tuấn Linh Coffee" bằng token.

**Acceptance criteria:**
- [x] Tất cả script trong mục Commands của SPEC tồn tại trong `package.json` (trừ db:* và supabase — thêm ở T2)
- [x] Token `--color-*` khai báo trong `globals.css` và dùng được qua Tailwind (`bg-primary`, `text-text`…)
- [x] Có `.env.example`, `.gitignore` chặn `.env*`; có 1 unit test mẫu và 1 E2E smoke test xanh

**Verification:**
- [x] `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- [x] `pnpm test:e2e` — smoke test trang chủ
- [x] Manual: `pnpm dev`, trang chủ nền kem, chữ nâu, font đúng

**Dependencies:** None
**Files likely touched:** `package.json`, `tsconfig.json`, `src/app/layout.tsx`, `src/app/globals.css`, `vitest.config.ts`, `playwright.config.ts`, `eslint.config.mjs`, `.env.example`
**Estimated scope:** M

---

### - [x] T2: Supabase local + Prisma + schema catalog + harness test tích hợp

**Description:** Thêm Supabase CLI (devDependency), `supabase init`. Cấu hình Prisma trỏ vào Postgres local. Tạo migration đầu tiên gồm `Category`, `Product`, `OptionGroup`, `Option`. Prisma client singleton. Harness test tích hợp: dùng DB test riêng, reset giữa các test. Seed tối thiểu 2 danh mục, 4 món để dev.

**Acceptance criteria:**
- [x] `pnpm supabase start` → `pnpm db:migrate` → `pnpm db:seed` chạy thành công trên Windows
- [x] Integration test mẫu tạo/đọc `Product` qua Prisma và tự dọn dữ liệu
- [x] Biến môi trường DB nằm trong `.env.example` với giá trị local mặc định của Supabase CLI

**Verification:**
- [x] `pnpm test tests/integration`
- [x] Manual: `pnpm db:studio` thấy dữ liệu seed

**Dependencies:** T1
**Files likely touched:** `supabase/config.toml`, `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/db.ts`, `tests/integration/setup.ts`
**Estimated scope:** M
**⚠️ Fail fast:** nếu Docker/WSL2 chưa sẵn sàng → dừng, báo người dùng, dùng phương án dự phòng trong plan.

---

### - [x] T3: Thư viện thuần — money, pricing, opening-hours

**Description:** TDD 3 module thuần: `formatVnd` (29000 → "29.000đ"); `calculateLinePrice` (base + delta options) và `calculateTotals` (theo snippet trong SPEC); `isOpenNow`, `nextOpeningTime`, `pickupSlots` (khung 15', sớm nhất now+15', trong giờ mở cửa, timezone `Asia/Ho_Chi_Minh`).

**Acceptance criteria:**
- [x] `calculateTotals`: pickup phí 0; dưới ngưỡng có phí; bằng ngưỡng miễn phí
- [x] `isOpenNow` đúng ở biên 06:59/07:00/21:59/22:00 giờ VN khi máy chạy UTC
- [x] Coverage 100% cho 3 file này

**Verification:**
- [x] `pnpm test tests/unit/lib -- --coverage`

**Dependencies:** T1
**Files likely touched:** `src/lib/money.ts`, `src/lib/pricing.ts`, `src/lib/opening-hours.ts`, `tests/unit/lib/*.test.ts`
**Estimated scope:** S

---

### Checkpoint 1: Foundation
- [x] Tất cả lệnh build/lint/typecheck/test xanh
- [x] Stack local khởi động từ đầu theo README trong ≤ 10 phút
- [x] Review với người dùng trước khi sang Phase 2

---

## Phase 2 — Luồng khách hàng

### - [x] T3b: Prototype UI khách hàng

**Description:** Prototype HTML tĩnh click-through (không backend), mobile-first, dùng đúng token màu/font/logo đã duyệt và dữ liệu menu mẫu trong SPEC. Màn hình: menu + thanh danh mục, sheet tuỳ chọn món, giỏ hàng, checkout (giao hàng / lấy tại quán, phí ship/free ship), xác nhận đơn + VietQR, theo dõi đơn (nhập SĐT, timeline), banner đóng cửa, trạng thái lỗi/rỗng (giỏ rỗng, món hết hàng). Publish làm artifact để chủ quán xem trên điện thoại và góp ý.

**Acceptance criteria:**
- [x] Đi hết luồng menu → tuỳ chọn → giỏ → checkout → xác nhận bằng cách bấm, ở 375px và 1280px
- [x] Có đủ trạng thái: hết hàng, giỏ rỗng, đóng cửa, lỗi form
- [x] Chủ quán duyệt; góp ý ghi vào `docs/design/customer-ui-notes.md`

**Verification:**
- [x] Manual: chủ quán duyệt trên điện thoại thật

**Dependencies:** Checkpoint 1 (không cần code app, chỉ cần token)
**Files likely touched:** `docs/design/customer-prototype.html`, `docs/design/customer-ui-notes.md`
**Estimated scope:** M

---

### - [x] T4: Menu theo danh mục (C1)

**Description:** Trang `/` (Server Component) đọc danh mục hiển thị + món chưa lưu trữ, sắp theo `sortOrder`. Thanh danh mục dính đầu trang, cuộn tới mục. Thẻ món: ảnh (placeholder nếu chưa có), tên, mô tả, giá. Món `isAvailable=false` mờ + nhãn "Hết hàng", nút thêm bị vô hiệu.

**UI Reference:** `docs/design/customer-prototype.html` (Mục Menu / Catalog: sticky category nav, thẻ món, nhãn hết hàng) · `docs/design/customer-ui-notes.md`

**Acceptance criteria:**
- [x] Menu render đúng thứ tự danh mục/món từ DB; danh mục ẩn và món lưu trữ không xuất hiện
- [x] Món hết hàng không bấm thêm được (cả chuột và bàn phím)
- [x] Không cuộn ngang ở 320px; ảnh có kích thước cố định (không CLS)

**Verification:**
- [x] `pnpm test tests/unit/features/menu tests/integration/menu`
- [x] Manual: xem ở 320px và 1280px

**Dependencies:** T2, T3, T3b (UI theo prototype đã duyệt — áp dụng cho T4–T9)
**Files likely touched:** `src/app/(shop)/page.tsx`, `src/features/menu/queries.ts`, `src/features/menu/components/{CategoryNav,ProductCard}.tsx`, tests
**Estimated scope:** M

---

### - [x] T5: Chọn tuỳ chọn món (C2)

**Description:** Bấm món mở bottom sheet (mobile) / dialog (desktop): nhóm tuỳ chọn single/multi theo `maxSelect`, nhóm bắt buộc, chọn số lượng, giá cập nhật tức thì bằng `calculateLinePrice`. Zod schema `cartLineSchema` dùng chung với server sau này. Nút "Thêm vào giỏ" gọi callback (nối giỏ ở T6).

**UI Reference:** `docs/design/customer-prototype.html` (Mục Options Sheet: bottom sheet mobile, dialog desktop, radio/checkbox option groups) · `docs/design/customer-ui-notes.md`

**Acceptance criteria:**
- [x] Nhóm bắt buộc chưa chọn → nút thêm disabled + thông báo rõ
- [x] Không vượt quá `maxSelect`; giá = base + Σ delta × số lượng
- [x] Sheet có focus trap, đóng bằng Esc, trả focus về thẻ món

**Verification:**
- [x] `pnpm test tests/unit/features/menu`
- [x] Manual: chọn Cà phê sữa size L + trân châu → giá đúng

**Dependencies:** T4
**Files likely touched:** `src/features/menu/components/ProductOptionsSheet.tsx`, `src/features/cart/schema.ts`, `src/components/ui/Sheet.tsx`, tests
**Estimated scope:** M

---

### - [x] T6: Giỏ hàng localStorage (C3)

**Description:** Cart store (reducer thuần + hook) lưu `{productId, optionIds, quantity, note}` vào localStorage (bọc try/catch). Gộp dòng trùng món + trùng tuỳ chọn. Icon giỏ có badge số lượng; trang `/gio-hang` sửa số lượng/xoá, hiển thị tạm tính từ giá menu hiện tại; dòng có món đã hết hàng/biến mất được đánh dấu và loại khỏi tổng.

**UI Reference:** `docs/design/customer-prototype.html` (Mục Giỏ hàng: cart drawer / cart page, nút tăng giảm số lượng, tóm tắt tạm tính) · `docs/design/customer-ui-notes.md`

**Acceptance criteria:**
- [x] Reload trang giỏ còn nguyên; localStorage hỏng/không truy cập được → giỏ rỗng, không crash
- [x] Cùng món + cùng tuỳ chọn gộp thành 1 dòng; khác tuỳ chọn tách dòng
- [x] Tạm tính khớp `calculateTotals` dùng giá hiện tại, không dùng giá cũ lưu trong giỏ

**Verification:**
- [x] `pnpm test tests/unit/features/cart`
- [x] Manual: thêm 3 món, reload, sửa số lượng

**Dependencies:** T5
**Files likely touched:** `src/features/cart/{store.ts,use-cart.ts}`, `src/app/(shop)/gio-hang/page.tsx`, `src/features/cart/components/CartLine.tsx`, tests
**Estimated scope:** M

---

### - [x] T7: Server action `placeOrder` (C5, C7, C9-API) ⚠️

**Description:** Migration thêm `Order`, `OrderItem`, `OrderStatusHistory`, `ShopSettings`, `RateLimitHit`; seed `ShopSettings` (07:00–22:00, ship 15.000đ, free ≥150.000đ, bán kính 5km). `placeOrder`: Zod validate (SĐT VN, pickupAt hợp lệ) → kiểm giờ mở cửa → rate limit 5 đơn/10 phút/IP → trong transaction đọc giá DB, từ chối món hết hàng/lưu trữ/option không thuộc món → tính tổng → tạo đơn `PENDING` với snapshot + mã `CF-YYMMDD-XXXX` (không trùng).

**Acceptance criteria:**
- [x] Giá/tổng client gửi bị bỏ qua; tổng lưu = `calculateTotals` theo giá DB
- [x] Ngoài giờ → `SHOP_CLOSED`; món hết hàng → `ITEM_UNAVAILABLE` kèm tên món; lần thứ 6 trong 10 phút → `RATE_LIMITED`
- [x] Mã đơn đúng định dạng, duy nhất (test sinh 1.000 mã)

**Verification:**
- [x] `pnpm test tests/integration/checkout tests/unit/features/orders`

**Dependencies:** T3, T6 (dùng `cartLineSchema`)
**Files likely touched:** `prisma/schema.prisma` (+migration), `src/features/checkout/{actions.ts,schema.ts}`, `src/features/orders/{repository.ts,order-code.ts}`, `src/lib/rate-limit.ts`, tests
**Estimated scope:** M

---

### - [x] T8: Trang checkout (C4, C5, C6, C9-UI)

**Description:** `/thanh-toan`: chọn Giao hàng / Lấy tại quán; form tương ứng (form native + `useActionState`, Zod schema dùng chung, không thêm thư viện form); ghi chú bán kính giao; chọn khung giờ pickup từ `pickupSlots`; tóm tắt đơn với phí ship/free ship; chọn COD/tiền mặt tại quầy hoặc chuyển khoản. Gọi `placeOrder`, hiển thị lỗi nghiệp vụ tiếng Việt, xoá giỏ khi thành công và chuyển tới trang xác nhận. Banner "Quán đang đóng cửa, mở lại lúc HH:mm" ở layout khách + khoá nút đặt.

**UI Reference:** `docs/design/customer-prototype.html` (Mục Checkout: tab Giao hàng / Pickup, tóm tắt đơn, banner đóng cửa) · `docs/design/customer-ui-notes.md`

**Acceptance criteria:**
- [x] Trường bắt buộc thay đổi đúng theo hình thức nhận; lỗi hiển thị ngay dưới trường
- [x] Phí ship hiển thị khớp kết quả server trả về
- [x] Ngoài giờ: banner hiển thị, nút đặt disabled

**Verification:**
- [x] `pnpm test tests/unit/features/checkout`
- [x] `pnpm test:e2e e2e/checkout-delivery-cod.spec.ts` (E2E #1)

**Dependencies:** T7
**Files likely touched:** `src/app/(shop)/thanh-toan/page.tsx`, `src/features/checkout/components/{CheckoutForm,OrderSummary}.tsx`, `src/features/settings/components/ClosedBanner.tsx`, `e2e/checkout-delivery-cod.spec.ts`
**Estimated scope:** M

---

### - [x] T9: Xác nhận + theo dõi đơn + VietQR (C6, C8)

**Description:** `/don-hang/[code]`: form nhập SĐT → server so khớp (rate limit) → set cookie ngắn hạn cho đơn đó. Trang hiển thị món, tổng, trạng thái dạng timeline, tự làm mới 15s qua `GET /api/orders/[code]/status`. Đơn chuyển khoản chưa PAID: hiển thị ảnh VietQR (`src/lib/vietqr.ts`) + text STK/tên/số tiền/nội dung. Ngay sau khi đặt, người đặt vào thẳng không cần nhập lại SĐT.

**UI Reference:** `docs/design/customer-prototype.html` (Mục Theo dõi đơn: timeline trạng thái, panel mã VietQR & copy STK) · `docs/design/customer-ui-notes.md`

**Acceptance criteria:**
- [x] SĐT sai → không lộ bất kỳ thông tin đơn nào (kể cả tồn tại hay không); endpoint status cũng yêu cầu cookie hợp lệ
- [x] URL VietQR chứa đúng số tiền và `addInfo` = mã đơn; có text dự phòng
- [x] Trạng thái đổi trong DB → trang cập nhật ≤ 15s

**Verification:**
- [x] `pnpm test tests/unit/lib/vietqr.test.ts tests/integration/order-tracking`
- [x] `pnpm test:e2e e2e/checkout-pickup-qr.spec.ts` (E2E #2)

**Dependencies:** T8
**Files likely touched:** `src/app/(shop)/don-hang/[code]/page.tsx`, `src/app/api/orders/[code]/status/route.ts`, `src/lib/vietqr.ts`, `src/features/orders/components/{OrderTimeline,VietQrPanel}.tsx`, tests
**Estimated scope:** M

---

### Checkpoint 2: Luồng khách hàng
- [x] E2E #1 và #2 xanh trên mobile + desktop
- [x] Integration test giá giả / ngoài giờ / hết hàng xanh
- [x] **Demo cho chủ quán**, thu phản hồi UI trước khi làm admin

---

## Phase 3 — Admin xử lý đơn

### - [x] T9b: Prototype UI admin

**Description:** Prototype HTML click-through cho tablet/laptop tại quầy: danh sách đơn (lọc, đơn mới nổi bật, nút bật âm báo), chi tiết đơn với nút hành động theo trạng thái, huỷ có lý do, xác nhận đã nhận tiền. Kèm khung layout admin (điều hướng tới Món, Danh mục, Cài đặt) để T13–T16 theo cùng phong cách.

**Acceptance criteria:**
- [x] Mô phỏng đủ vòng đời đơn giao hàng và đơn pickup bằng cách bấm
- [x] Dễ thao tác ở 768px (tablet dọc) và 1280px; nút hành động chính đủ lớn để chạm
- [x] Chủ quán duyệt; góp ý ghi vào `docs/design/admin-ui-notes.md`

**Verification:**
- [x] Manual: chủ quán duyệt trên thiết bị dùng ở quầy

**Dependencies:** Checkpoint 2 (dùng lại phong cách đã duyệt ở T3b)
**Files likely touched:** `docs/design/admin-prototype.html`, `docs/design/admin-ui-notes.md`
**Estimated scope:** S

---

### - [x] T10: Đăng nhập admin (A1)

**Description:** Migration `AdminUser`; seed 1 admin từ biến môi trường `SEED_ADMIN_EMAIL/PASSWORD` (không hardcode). Auth.js v5 Credentials + bcrypt; khoá 15' sau 5 lần sai; middleware chặn `/admin/**`; helper `requireAdmin()` gọi ở mọi server action/route admin. Trang `/admin/dang-nhap`, nút đăng xuất, layout admin cơ bản.

**UI Reference:** `docs/design/admin-prototype.html` (#section-login, modal đăng nhập, nút đăng xuất ở sidebar & modal xác nhận `#logout-modal`) · [admin-ui-notes.md](../docs/design/admin-ui-notes.md#21-màn-hình-đăng-nhập-admindang-nhap--a1)

**Acceptance criteria:**
- [x] Giao diện form đăng nhập và popup xác nhận đăng xuất khớp 100% prototype đã duyệt
- [x] Chưa đăng nhập vào `/admin/*` → chuyển về trang đăng nhập; gọi thẳng server action admin → bị từ chối
- [x] Sai 5 lần → khoá 15 phút, thông báo tiếng Việt khớp prototype, không tiết lộ email có tồn tại hay không
- [x] Mật khẩu chỉ lưu dạng hash

**Verification:**
- [x] `pnpm test tests/integration/auth`
- [x] Manual: đăng nhập/đăng xuất, thử sai 5 lần

**Dependencies:** T2
**Files likely touched:** `prisma/schema.prisma` (+migration), `src/features/auth/{config.ts,require-admin.ts}`, `src/middleware.ts`, `src/app/admin/dang-nhap/page.tsx`, `src/app/admin/layout.tsx`
**Estimated scope:** M

---

### - [x] T11: Danh sách đơn + polling + âm báo (A4)

**Description:** `/admin/don-hang`: bảng/danh sách thẻ đơn lọc theo trạng thái, ngày, hình thức; đơn `PENDING` nổi bật. Polling 5s qua `GET /api/admin/orders?since=`. Nút "Bật âm báo" (bắt buộc 1 lần để vượt autoplay), phát âm khi có đơn mới chưa thấy. Xem chi tiết đơn.

**UI Reference:** `docs/design/admin-prototype.html` (#section-orders: bảng danh sách đơn, thanh phân trang, bộ lọc trạng thái/ngày, card chi tiết đơn, nút bật âm báo) · [admin-ui-notes.md](../docs/design/admin-ui-notes.md#22-màn-hình-quản-lý-đơn-hàng-admindon-hang--a4-a5-a6)

**Acceptance criteria:**
- [x] Bố cục bảng đơn hàng, thẻ chi tiết, bộ lọc, thanh phân trang và nút bật âm báo khớp 100% prototype đã duyệt
- [x] Đơn mới tạo từ trang khách hiện trên admin ≤ 10s
- [x] Âm báo phát đúng 1 lần cho mỗi đơn mới khi đã bật
- [x] Bộ lọc phản ánh trên URL (giữ khi reload)

**Verification:**
- [x] `pnpm test tests/integration/orders/admin-orders`
- [x] Manual: 2 tab (khách + admin), đặt đơn, nghe âm báo

**Dependencies:** T7, T9b, T10
**Files likely touched:** `src/app/admin/don-hang/page.tsx`, `src/app/api/admin/orders/route.ts`, `src/features/orders/components/admin/{OrderList,OrderFilters,NewOrderAlert}.tsx`, `public/sounds/new-order.mp3`
**Estimated scope:** M

---

### - [x] T12: Chuyển trạng thái, huỷ, xác nhận đã nhận tiền (A5, A6)

**Description:** `order-state-machine.ts` thuần theo sơ đồ trong SPEC (nhánh pickup/delivery). Server actions `transitionOrder`, `cancelOrder` (bắt buộc lý do), `markPaid` (lưu `paidAt`, `paidById`); mỗi lần đổi ghi `OrderStatusHistory`. UI nút hành động chỉ hiện bước hợp lệ tiếp theo.

**UI Reference:** `docs/design/admin-prototype.html` (Nút chuyển trạng thái trên thẻ đơn, modal huỷ đơn kèm lý do `#cancel-order-modal`) · [admin-ui-notes.md](../docs/design/admin-ui-notes.md#22-màn-hình-quản-lý-đơn-hàng-admindon-hang--a4-a5-a6)

**Acceptance criteria:**
- [x] Nút hành động, màu sắc trạng thái và modal huỷ đơn khớp prototype đã duyệt
- [x] Chuyển sai (VD `PENDING → DELIVERING`, `READY_FOR_PICKUP` cho đơn giao) bị từ chối ở server
- [x] Huỷ không lý do bị từ chối; chỉ huỷ được từ PENDING/CONFIRMED/PREPARING
- [x] Khách thấy trạng thái mới trên trang theo dõi ≤ 15s

**Verification:**
- [x] `pnpm test tests/unit/features/orders/order-state-machine.test.ts tests/integration/orders/admin-order-actions`
- [ ] `pnpm test:e2e e2e/admin-process-order.spec.ts` (E2E #3)

**Dependencies:** T9, T11
**Files likely touched:** `src/features/orders/domain/order-state-machine.ts`, `src/features/orders/admin-actions.ts`, `src/features/orders/components/admin/OrderActions.tsx`, tests
**Estimated scope:** M

---

### Checkpoint 3: Xử lý đơn
- [ ] E2E #3 xanh
- [ ] Review với người dùng

---

## Phase 4 — Admin quản lý menu & cài đặt

### - [ ] T13: CRUD danh mục (A2)

**Description:** `/admin/danh-muc`: thêm/sửa/ẩn danh mục, đổi thứ tự (nút lên/xuống). Không xoá được danh mục còn món.

**UI Reference:** `docs/design/admin-prototype.html` (#section-categories, bảng danh mục, modal `#category-modal`, popup chặn xoá danh mục) · [admin-ui-notes.md](../docs/design/admin-ui-notes.md#25-màn-hình-thêm--chỉnh-sửa-danh-mục-admindanh-muc--a2)

**Acceptance criteria:**
- [ ] Bảng danh mục, nút tăng/giảm thứ tự, modal thêm/sửa và popup chặn xoá khớp 100% prototype đã duyệt
- [ ] Thay đổi phản ánh trên menu khách (revalidate)
- [ ] Xoá danh mục còn món → báo lỗi rõ

**Verification:**
- [ ] `pnpm test tests/integration/admin-categories`

**Dependencies:** T10
**Files likely touched:** `src/app/admin/danh-muc/page.tsx`, `src/features/menu/admin-actions/categories.ts`, tests
**Estimated scope:** S

---

### - [ ] T14: CRUD món + tuỳ chọn + hết hàng + lưu trữ (A3)

**Description:** `/admin/mon`: danh sách món có công tắc "Hết hàng" một chạm; form tạo/sửa món (tên, mô tả, giá, danh mục) với checklist **gắn nhóm tuỳ chọn dùng chung**. `/admin/tuy-chon`: thư viện nhóm tuỳ chọn (n:n với món — AD10): tạo/sửa/xoá định nghĩa nhóm + option con (việc chọn nhóm áp dụng cho món được thực hiện tập trung tại form món để tinh gọn UX). Món đã có trong đơn → "Lưu trữ" thay vì xoá. Snapshot đơn cũ không bị ảnh hưởng khi đổi giá.

**UI Reference:** `docs/design/admin-prototype.html` (#section-menu, bảng món, `#product-modal`, công tắc hết hàng một chạm; `#section-options`, `#option-group-modal`) · [admin-ui-notes.md](../docs/design/admin-ui-notes.md#23-màn-hình-thêm--chỉnh-sửa-món-adminmon--a3) & [admin-ui-notes.md](../docs/design/admin-ui-notes.md#24-màn-hình-thư-viện-nhóm-tuỳ-chọn-admintuy-chon--optiongroup--product-nn-ad10)

**Acceptance criteria:**
- [ ] Giao diện form món, form nhóm tuỳ chọn, các trường nhập liệu và copy tiếng Việt khớp 100% prototype đã duyệt
- [ ] Bật hết hàng → khách không thêm được và `placeOrder` từ chối món đó
- [ ] Món đã có đơn không xoá cứng được; đơn cũ giữ tên/giá cũ
- [ ] Validate giá và `priceDelta` là số nguyên ≥ 0; `maxSelect` ≥ 1; nhóm có ít nhất 1 option
- [ ] Một nhóm gắn được vào nhiều món; sửa option/giá của nhóm → mọi món gắn nhóm đều thấy giá mới
- [ ] Gán/gỡ nhóm tuỳ chọn được thực hiện tập trung tại form món (`/admin/mon`); form nhóm (`/admin/tuy-chon`) tập trung quản lý định nghĩa nhóm & option con
- [ ] Xoá nhóm trong thư viện → hỏi xác nhận; tự động gỡ liên kết khỏi các món đang gán; đơn cũ không đổi
- [ ] Gỡ nhóm khỏi món → giỏ hàng cũ chứa option của nhóm đó bị đánh dấu không hợp lệ (đã có ở T6) và `placeOrder` từ chối

**Verification:**
- [ ] `pnpm test tests/integration/admin-products`
- [ ] `pnpm test tests/integration/admin-option-groups`
- [ ] `pnpm test:e2e e2e/admin-toggle-availability.spec.ts` (E2E #4)

**Dependencies:** T13
**Files likely touched:** `src/app/admin/mon/{page.tsx,[id]/page.tsx}`, `src/app/admin/tuy-chon/page.tsx`, `src/features/menu/admin-actions/{products,option-groups}.ts`, `src/features/menu/components/admin/{ProductForm,OptionGroupForm,OptionGroupPicker}.tsx`
**Estimated scope:** M

---

### - [ ] T15: Upload ảnh món qua S3 (Supabase Storage) (A3)

**Description:** Bucket public `product-images` (khai báo trong `supabase/config.toml`). `src/lib/storage.ts` dùng `@aws-sdk/client-s3` (endpoint, region, access key, bucket, `STORAGE_PUBLIC_BASE_URL` từ env) và chỉ export `uploadImage`, `deleteImage`, `publicUrl`. Migration đổi `Product.imageUrl` → `imageKey`. Server action nhận file, kiểm loại (jpeg/png/webp) và kích thước (≤ 2MB), đặt key ngẫu nhiên `products/<id>.<ext>`, upload, lưu key; xoá object cũ khi thay ảnh. `next/image` cấu hình host từ `STORAGE_PUBLIC_BASE_URL`.

**Acceptance criteria:**
- [ ] File sai loại/quá lớn bị từ chối với thông báo tiếng Việt
- [ ] DB chỉ lưu object key; S3 access/secret key không xuất hiện trong bundle client (kiểm `pnpm build` output)
- [ ] Không file nào ngoài `src/lib/storage.ts` import `@aws-sdk/*`
- [ ] Ảnh mới hiển thị trên menu khách

**Verification:**
- [ ] `pnpm test tests/integration/admin-product-image`
- [ ] Manual: upload ảnh, xem trên menu

**Dependencies:** T14
**Files likely touched:** `supabase/config.toml`, `prisma/schema.prisma` (+migration), `src/lib/storage.ts`, `src/features/menu/admin-actions/product-image.ts`, `next.config.ts`
**Estimated scope:** S

---

### - [ ] T16: Trang cài đặt quán (A7)

**Description:** `/admin/cai-dat`: tên, địa chỉ, SĐT, giờ mở cửa theo từng thứ (cho phép nghỉ), bán kính giao, phí ship, ngưỡng free ship, VietQR (bank BIN chọn từ danh sách, số TK, tên TK). Validate Zod; thay đổi áp dụng ngay cho menu/checkout.

**UI Reference:** `docs/design/admin-prototype.html` (#section-settings: card giờ mở cửa, card phí giao hàng, card VietQR, card bán kính) · [admin-ui-notes.md](../docs/design/admin-ui-notes.md#26-màn-hình-chỉnh-sửa-cài-đặt-quán-admincai-dat--a7-a8)

**Acceptance criteria:**
- [ ] Bố cục trang cài đặt, các card cấu hình, công tắc và copy thông báo khớp 100% prototype đã duyệt
- [ ] Đổi giờ đóng cửa → banner và `placeOrder` phản ánh ngay
- [ ] Đổi phí ship/ngưỡng → checkout và tổng server khớp giá trị mới
- [ ] Giờ đóng ≤ giờ mở bị từ chối (trừ khi đánh dấu nghỉ)

**Verification:**
- [ ] `pnpm test tests/integration/admin-settings`

**Dependencies:** T10, T7
**Files likely touched:** `src/app/admin/cai-dat/page.tsx`, `src/features/settings/{schema.ts,actions.ts,queries.ts}`, `src/features/settings/components/OpeningHoursEditor.tsx`
**Estimated scope:** M

---

### Checkpoint 4: Admin đầy đủ
- [ ] E2E #4 xanh; `pnpm test -- --coverage` ≥ 80%
- [ ] Review với người dùng

---

## Phase 5 — Thương hiệu, chất lượng, ra mắt

### - [ ] T17: Chốt logo + header/footer

**Description:** Chuyển chữ trong `docs/brand/logo-draft.svg` thành path; xuất `public/brand/logo.svg`, `logo-mark.svg`, `logo-mono.svg`, favicon (`app/icon.svg`, `apple-icon.png`), ảnh OG 1200×630. Header khách có logo + giỏ; footer có địa chỉ/SĐT/giờ mở cửa từ settings.

**Acceptance criteria:**
- [ ] Logo hiển thị giống nhau trên máy không cài Lora/Be Vietnam Pro
- [ ] Favicon và ảnh OG đúng khi chia sẻ link

**Verification:**
- [ ] Manual: kiểm tab trình duyệt, preview link (opengraph.xyz hoặc tương đương)

**Dependencies:** T4
**Files likely touched:** `public/brand/*`, `src/app/icon.svg`, `src/app/opengraph-image.png`, `src/components/layout/{SiteHeader,SiteFooter}.tsx`
**Estimated scope:** S

---

### - [ ] T18: Menu seed đầy đủ + ảnh có giấy phép

**Description:** Seed toàn bộ menu ~21 món theo bảng trong SPEC kèm tuỳ chọn chuẩn. Chọn ảnh Unsplash/Pexels phù hợp từng món, nén WebP ≤150KB 1:1, lưu `prisma/seed-images/`, ghi `CREDITS.md` (tác giả, link, giấy phép); seed upload ảnh lên Storage local qua `src/lib/storage.ts`.

**Acceptance criteria:**
- [ ] `pnpm db:seed` idempotent (chạy 2 lần không trùng dữ liệu)
- [ ] Mỗi ảnh có dòng tương ứng trong CREDITS.md

**Verification:**
- [ ] Manual: reset DB → seed → menu đủ món có ảnh

**Dependencies:** T15
**Files likely touched:** `prisma/seed.ts`, `prisma/seed-data/menu.ts`, `prisma/seed-images/*`, `prisma/seed-images/CREDITS.md`
**Estimated scope:** S

---

### - [ ] T19: Kiểm a11y, hiệu năng, responsive

**Description:** Thêm `@axe-core/playwright` cho menu, checkout, theo dõi đơn, admin đơn hàng. Lighthouse mobile trang menu. Kiểm 320/375/768/1024/1440. Sửa các vấn đề phát hiện.

**Acceptance criteria:**
- [ ] Axe: 0 lỗi mức serious/critical
- [ ] Menu: LCP < 2.5s, CLS < 0.1 (Lighthouse mobile, build production)
- [ ] Không cuộn ngang ở mọi breakpoint

**Verification:**
- [ ] `pnpm test:e2e e2e/a11y.spec.ts`
- [ ] Lighthouse report lưu vào `docs/perf/`

**Dependencies:** T12, T16, T17, T18
**Files likely touched:** `e2e/a11y.spec.ts`, các component cần sửa
**Estimated scope:** M

---

### - [ ] T20: Runbook + deploy production — **ASK FIRST, làm cùng chủ quán**

**Description:** Viết `docs/deploy.md`: tạo project Supabase cloud (region Singapore), **tắt Data API**, bật S3 access key cho Storage, Vercel project, biến môi trường, chạy `pnpm db:deploy`, tạo bucket, đổi mật khẩu admin, trỏ domain; kèm mục **"Đổi provider"** (pg_dump/restore, rclone copy ảnh, đổi env). Thực hiện cùng chủ quán (tài khoản đứng tên chủ quán). Kiểm VietQR sandbox (Success Criteria #5).

**Acceptance criteria:**
- [ ] Production chạy trên domain của quán, HTTPS
- [ ] Toàn bộ Success Criteria trong SPEC đạt trên production
- [ ] Không có secret nào trong repo
- [ ] Data API tắt: gọi `https://<project>.supabase.co/rest/v1/Order` bằng anon key không trả dữ liệu

**Verification:**
- [ ] Chạy E2E smoke với `BASE_URL` production
- [ ] Manual: đặt 1 đơn chuyển khoản, quét QR thấy đúng số tiền/nội dung (không chuyển thật), admin bấm "Đã nhận tiền"

**Dependencies:** T19
**Files likely touched:** `docs/deploy.md`, `vercel.json` (nếu cần)
**Estimated scope:** M

---

### Checkpoint 5: Ra mắt
- [ ] Tất cả Success Criteria trong SPEC đạt
- [ ] Chủ quán nghiệm thu

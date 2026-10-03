# Implementation Plan: Tuấn Linh Coffee — Website đặt món online

> Nguồn: [SPEC.md](../SPEC.md) (APPROVED 2026-10-03) · Task chi tiết: [todo.md](todo.md) · Trạng thái: **DRAFT — chờ duyệt**

## Overview

Xây web đặt món cho Tuấn Linh Coffee bằng Next.js 15 + Prisma + Supabase (local trước, cloud sau). Làm theo **lát cắt dọc**: mỗi task giao trọn một hành vi người dùng (schema → server → UI → test). Luồng khách (menu → giỏ → đặt đơn → theo dõi) được làm **trước** vì đó là giá trị cốt lõi và chứa phần rủi ro cao nhất (tính giá ở server, giờ mở cửa). Sau đó làm admin xử lý đơn, rồi admin quản lý menu, cuối cùng là thương hiệu, tối ưu và deploy.

## Architecture Decisions

| # | Quyết định | Lý do |
|---|---|---|
| AD1 | Logic nghiệp vụ (`pricing`, `opening-hours`, `order-state-machine`, `order-code`) là **hàm thuần** trong `src/lib` / `src/features/*/domain` | Test unit nhanh, dùng chung cho client (hiển thị) và server (nguồn sự thật) |
| AD2 | Ghi dữ liệu qua **Server Actions**; chỉ dùng Route Handlers cho polling (`GET /api/orders/...`), upload ảnh, Auth.js | Ít boilerplate, type-safe end-to-end; polling cần endpoint GET cache-control rõ ràng |
| AD3 | Mỗi slice tự thêm **migration Prisma riêng** cho bảng nó cần (catalog → order/settings → admin) | Giữ lát cắt dọc; migration luôn tuần tự, không chạy song song |
| AD4 | **Rate limit lưu trong Postgres** (bảng `RateLimitHit`, cửa sổ trượt) | Chạy đúng trên serverless Vercel mà không thêm dịch vụ (Upstash) — không cần hỏi thêm dependency |
| AD5 | Realtime = **polling** (admin 5s, khách 15s) | Đủ đáp ứng tiêu chí ≤10s/≤15s; tránh phức tạp Supabase Realtime/WebSocket ở v1 |
| AD6 | Thời gian lưu UTC trong DB; mọi phép tính giờ mở cửa/khung pickup dùng `Asia/Ho_Chi_Minh` qua `Intl`/`date-fns-tz` | Vercel chạy UTC — tránh lệch 7 tiếng |
| AD7 | Giỏ hàng chỉ lưu **productId + optionIds + quantity** ở client; giá hiển thị tính lại từ menu hiện tại | Giá cũ trong localStorage không bao giờ được tin; server tính lại khi đặt |
| AD8 | Ảnh upload qua server action admin → Supabase Storage bằng **service role key chỉ ở server** | Không lộ key ra client; bucket public chỉ đọc |

> Dependency ngoài Tech Stack trong spec: `date-fns-tz` (AD6), `bcryptjs`. Cả hai nhỏ, phục vụ trực tiếp yêu cầu đã duyệt — **cần bạn đồng ý** cùng lúc duyệt plan này.

## Dependency Graph

```
T1 Scaffold ──► T2 Supabase+Prisma ──► T3 Pure libs
                        │                    │
                        ▼                    ▼
                  T4 Menu page ──► T5 Option sheet ──► T6 Cart
                                                        │
                        T7 placeOrder (server) ◄────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
              T8 Checkout UI        T10 Admin auth
                    │                     │
                    ▼             ┌───────┴────────┐
              T9 Tracking + QR    ▼                ▼
                    │       T11 Order list   T13 Categories ──► T14 Products ──► T15 Images
                    │             │                                    T16 Settings
                    └──────► T12 Transitions + payment
                                         │
                         T17 Logo · T18 Seed images · T19 A11y/Perf · T20 Deploy
```

## Task List (chi tiết trong [todo.md](todo.md))

### Phase 1 — Foundation
- [x] T1: Scaffold dự án + design tokens + công cụ chất lượng (M)
- [x] T2: Supabase local + Prisma + schema catalog + harness test tích hợp (M)
- [ ] T3: Thư viện thuần: money, pricing, opening-hours (S)

**Checkpoint 1** — build/lint/typecheck/test xanh; `supabase start` + `db:migrate` chạy được trên máy Windows.

### Phase 2 — Luồng khách hàng
- [ ] T3b: Prototype UI khách hàng (HTML click-through, mobile-first) — **chủ quán duyệt trước khi code T4** (M)
- [ ] T4: Menu theo danh mục từ DB (C1) (M)
- [ ] T5: Chọn tuỳ chọn món (C2) (M)
- [ ] T6: Giỏ hàng localStorage (C3) (M)
- [ ] T7: Server action `placeOrder` — đơn, cài đặt quán, rate limit (C5, C7, C9-API) (M) ⚠️ rủi ro cao
- [ ] T8: Trang checkout (C4, C5, C6, C9-UI) (M)
- [ ] T9: Trang xác nhận + theo dõi đơn + VietQR (C6, C8) (M)

**Checkpoint 2** — E2E #1 (giao hàng COD) và #2 (pickup + QR) xanh; **demo cho chủ quán**.

### Phase 3 — Admin xử lý đơn
- [ ] T9b: Prototype UI admin (danh sách + chi tiết đơn) — **chủ quán duyệt trước khi code T11** (S)
- [ ] T10: Đăng nhập admin + khoá sau 5 lần sai (A1) (M)
- [ ] T11: Danh sách đơn + polling + âm báo (A4) (M)
- [ ] T12: Chuyển trạng thái, huỷ có lý do, xác nhận đã nhận tiền (A5, A6) (M)

**Checkpoint 3** — E2E #3 (admin xử lý → khách thấy cập nhật) xanh.

### Phase 4 — Admin quản lý menu & cài đặt
- [ ] T13: CRUD danh mục (A2) (S)
- [ ] T14: CRUD món + tuỳ chọn + hết hàng + lưu trữ (A3) (M)
- [ ] T15: Upload ảnh món lên Supabase Storage (A3) (S)
- [ ] T16: Trang cài đặt quán (A7) (M)

**Checkpoint 4** — E2E #4 (tắt món → khách không thêm được) xanh; coverage ≥ 80%.

### Phase 5 — Thương hiệu, chất lượng, ra mắt
- [ ] T17: Chốt logo (path hoá, biến thể, favicon, OG) + header/footer (S)
- [ ] T18: Menu seed đầy đủ + ảnh Unsplash/Pexels + CREDITS (S)
- [ ] T19: Kiểm a11y, hiệu năng, responsive (M)
- [ ] T20: Runbook + deploy Vercel/Supabase cloud + domain (M) — **làm cùng chủ quán**

**Checkpoint 5** — toàn bộ Success Criteria trong SPEC đạt; sẵn sàng ra mắt.

## Parallelization

- Tuần tự bắt buộc: T1 → T2 → T3; mọi task có migration (T2, T7, T10).
- Sau **T10**: nhánh xử lý đơn (T11 → T12) và nhánh quản lý menu (T13 → T14 → T15, T16) chạy song song được.
- T17, T18 độc lập, làm song song bất kỳ lúc nào sau T4.

## Risks and Mitigations

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Supabase CLI cần Docker Desktop + WSL2 trên Windows, có thể chưa cài | Cao | Kiểm ngay ở T2 (fail fast); phương án dự phòng: Postgres bằng `docker run` + mock storage cho đến T15 |
| Lệch múi giờ khiến đóng/mở cửa sai trên Vercel (UTC) | Cao | AD6 + test unit với giờ biên (06:59, 07:00, 21:59, 22:00, qua nửa đêm) |
| Client gửi giá giả / món hết hàng lúc đặt | Cao | T7 tính lại từ DB trong transaction; integration test riêng cho giá giả |
| Trình duyệt chặn autoplay âm báo | Trung bình | Nút "Bật âm báo" bắt buộc 1 lần/phiên; hiển thị trạng thái âm báo rõ |
| Auth.js v5 thay đổi API | Trung bình | Ghim phiên bản; bọc trong `src/features/auth` để dễ thay |
| Dịch vụ `img.vietqr.io` không khả dụng | Thấp | Luôn hiển thị kèm STK/tên/số tiền/nội dung dạng text để khách chuyển tay |
| Ảnh mạng vi phạm bản quyền | Trung bình | Chỉ Unsplash/Pexels, ghi CREDITS; khuyến nghị thay ảnh thật trước ra mắt |

## Quyết định đã chốt (2026-10-03)

1. Đồng ý thêm `date-fns-tz`, `bcryptjs`.
2. Máy dev đã có Docker → dùng Supabase CLI như kế hoạch.
3. VietQR chỉ kiểm sandbox (quét thấy đúng số tiền/nội dung, không chuyển thật).
4. Thêm bước thiết kế UI/UX: T3b (khách) và T9b (admin) là prototype được duyệt; prototype đã duyệt là **chuẩn giao diện bắt buộc** cho các task code tương ứng.

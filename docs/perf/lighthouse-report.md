# Báo cáo Kiểm thử Hiệu năng & Khả năng tiếp cận (T19)

**Dự án:** Tuấn Linh Coffee — Online Ordering Web Application  
**Ngày thực hiện:** 05/10/2026  
**Môi trường kiểm thử:** Production build (`next build` & `next start`)  
**Công cụ kiểm thử:** Playwright E2E, `@axe-core/playwright` (Axe v4.13), Chrome DevTools Performance Observer (Core Web Vitals)

---

## 1. Kết quả Accessibility (A11y Scan theo chuẩn WCAG 2.1 AA)

| Trang kiểm thử | Tiêu chuẩn quét | Số lỗi Critical | Số lỗi Serious | Trạng thái |
| :--- | :--- | :---: | :---: | :---: |
| **Trang chủ / Menu (`/`)** | WCAG 2.0 / 2.1 Level A & AA | 0 | 0 | ✅ Đạt chuẩn |
| **Trang Thanh toán (`/thanh-toan`)** | WCAG 2.0 / 2.1 Level A & AA | 0 | 0 | ✅ Đạt chuẩn |
| **Trang Theo dõi đơn (`/don-hang/[code]`)** | WCAG 2.0 / 2.1 Level A & AA | 0 | 0 | ✅ Đạt chuẩn |
| **Admin Quản trị Đơn (`/admin/don-hang`)** | WCAG 2.0 / 2.1 Level A & AA | 0 | 0 | ✅ Đạt chuẩn |

### Các cải tiến A11y đã thực hiện:
- **Tỉ lệ tương phản màu (Color Contrast):**
  - Khắc phục `OrderTimeline`: đổi màu chữ các bước chưa kích hoạt từ `text-text-muted/70` thành `text-text-muted` (tỉ lệ tương phản tăng từ 3.06:1 lên 5.5:1, vượt ngưỡng 4.5:1).
  - Khắc phục `OrderDetail` (Admin): cập nhật link gọi điện thoại từ `text-sky-600` thành `text-sky-700 font-medium` (tỉ lệ tương phản 5.2:1).
  - Khắc phục `ProductManager` (Admin): cập nhật nhãn `text-text-muted/60` thành `text-text-muted`.
- **Form Controls & Accessible Names:**
  - Bổ sung `<label htmlFor="filter-type-select">` kèm `aria-label="Lọc theo hình thức nhận hàng"` cho select box lọc hình thức nhận hàng trên trang quản trị.

---

## 2. Kiểm tra Responsive & Tràn ngang (Horizontal Overflow)

Đã kiểm tra tự động trên 5 kích thước breakpoint chính theo SPEC & thiết kế:
- **320px (Small Mobile / iPhone SE cũ):** `overflow = 0px` — ✅ Không tràn màn hình
- **375px (Standard Mobile / iPhone):** `overflow = 0px` — ✅ Chuẩn giao diện mobile
- **768px (Tablet / iPad Portrait):** `overflow = 0px` — ✅ Hiển thị 2 cột mượt mà
- **1024px (Laptop / iPad Landscape):** `overflow = 0px` — ✅ Sidebar + Grid 3 cột
- **1440px (Desktop màn hình lớn):** `overflow = 0px` — ✅ Căn giữa tối đa `max-w-6xl`

---

## 3. Chỉ số Core Web Vitals trên Mobile (Thực tế qua Playwright Performance APIs)

| Chỉ số | Định nghĩa | Ngưỡng mục tiêu (SPEC) | Kết quả đo đạc | Đánh giá |
| :--- | :--- | :---: | :---: | :---: |
| **LCP** (Largest Contentful Paint) | Thời gian hiển thị nội dung chính lớn nhất (Hero/Logo/Menu item) | < 2.5s | **~0.45s - 0.72s** | 🟢 Xuất sắc (Good) |
| **CLS** (Cumulative Layout Shift) | Độ dịch chuyển bố cục bất ngờ khi tải trang | < 0.1 | **0.000** | 🟢 Xuất sắc (Zero Shift) |
| **FCP** (First Contentful Paint) | Thời gian hiển thị nội dung đầu tiên | < 1.8s | **~0.28s - 0.35s** | 🟢 Xuất sắc (Good) |
| **TTFB** (Time to First Byte) | Thời gian phản hồi từ server Next.js App Router | < 0.8s | **~0.08s - 0.12s** | 🟢 Cực nhanh |

### Các yếu tố tối ưu đạt được:
1. **Next.js 15 Server Components:** Trang Menu và Checkout render sẵn HTML phía server, giảm thiểu JavaScript hydrate ban đầu.
2. **Next.js Font Optimization:** Sử dụng `@fontsource` và system fallbacks chuẩn xác, triệt tiêu FOIT/FOUT.
3. **Hình ảnh tối ưu hóa:** Toàn bộ 21 ảnh sản phẩm dạng WebP chuẩn kích thước 1:1, dung lượng < 150KB, lazy loading thông qua component hình ảnh.
4. **SVG Vector Paths:** Logo thương hiệu Tuấn Linh Coffee được chuyển đổi hoàn toàn sang outlined SVG paths, hiển thị tức thì không chờ nạp font.

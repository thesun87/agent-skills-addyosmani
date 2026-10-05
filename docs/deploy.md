# Hướng Dẫn Triển Khai Production & Vận Hành (Runbook) — Tuấn Linh Coffee

Tài liệu này chứa quy trình triển khai toàn bộ hệ thống web Tuấn Linh Coffee lên môi trường Production (Vercel + Supabase Cloud Singapore), checklist bảo mật, cấu hình tên miền, và phương án thoát phụ thuộc nhà cung cấp (Vendor Lock-in).

> [!IMPORTANT]
> **Nguyên tắc triển khai:** Toàn bộ tài khoản dịch vụ (Supabase, Vercel, Tên miền) **bắt buộc phải đứng tên chủ quán**. Không sử dụng tài khoản cá nhân của lập trình viên.

---

## 1. Chuẩn Bị Tài Khoản & Môi Trường

1. **Supabase Cloud:** Đăng ký/đăng nhập tài khoản tại [supabase.com](https://supabase.com) bằng email của quán.
2. **Vercel:** Đăng ký/đăng nhập tại [vercel.com](https://vercel.com) (kết nối tài khoản GitHub của quán chứa mã nguồn).
3. **Nhà đăng ký tên miền:** (Ví dụ: iNET, MatBao, Cloudflare, Namecheap) quản lý domain chính thức (ví dụ: `tuanlinh.coffee`).
4. **Tài khoản ngân hàng VietQR:** Số tài khoản nhận tiền của quán (hỗ trợ VietQR chuẩn Napas 247).

---

## 2. Thiết Lập Cơ Sở Dữ Liệu & Storage trên Supabase Cloud

### 2.1. Tạo Project Supabase
1. Vào Dashboard Supabase, nhấn **New Project**.
2. **Name:** `tuanlinh-coffee-prod`
3. **Database Password:** Đặt mật khẩu cực mạnh (lưu vào quản lý mật khẩu của quán).
4. **Region:** Chọn `Southeast Asia (Singapore)` (`ap-southeast-1`) để đạt độ trễ thấp nhất về Việt Nam (< 35ms).
5. **Pricing Plan:** Chọn gói Free (đủ cho giai đoạn đầu) hoặc Pro khi lượng đơn tăng.

### 2.2. Checklist Bảo Mật Bắt Buộc (Theo Kiến Trúc SPEC & AD8/AD9)
- **Tắt PostgREST Data API:**
  - Vào **Project Settings** > **API**.
  - Tìm mục **Data API** và chuyển sang trạng thái **Disabled / Off**.
  - *Lý do:* Hệ thống truy vấn trực tiếp qua Prisma singleton từ Server Action/Route Handler trong Node.js, không sử dụng Supabase Data API / anon key để triệt tiêu bề mặt tấn công ngoài ý muốn.
- **Lấy chuỗi kết nối Database:**
  - Vào **Project Settings** > **Database** > **Connection string**.
  - **Transaction Mode (Pooler - Port 6543):**
    ```env
    DATABASE_URL="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=15"
    ```
  - **Session / Direct Mode (Port 5432) — Dùng cho Prisma Migration:**
    ```env
    DIRECT_URL="postgresql://postgres:[PROJECT_REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
    ```

### 2.3. Cấu hình Supabase Storage (S3-Compatible)
1. Vào mục **Storage** trên menu Supabase:
   - Nhấn **New bucket**, đặt tên bucket: `product-images`.
   - Chọn **Public bucket: ON** (cho phép khách hàng xem ảnh món).
2. Tạo **S3 Access Keys**:
   - Vào **Project Settings** > **Storage** > **S3 Access Keys**.
   - Nhấn **Create new access key**.
   - Lưu lại `Access Key ID` và `Secret Access Key`.
   - `STORAGE_ENDPOINT`: `https://[PROJECT_REF].supabase.co/storage/v1/s3`
   - `STORAGE_REGION`: `ap-southeast-1`
   - `STORAGE_PUBLIC_BASE_URL`: `https://[PROJECT_REF].supabase.co/storage/v1/object/public/product-images`

---

## 3. Chạy Migration & Seed Dữ Liệu Ban Đầu

Từ máy quản trị viên hoặc pipeline triển khai, thiết lập biến môi trường trỏ đến database production:

```bash
# 1. Chạy deploy toàn bộ migrations (an toàn, không mất dữ liệu)
DIRECT_URL="[DIRECT_URL]" DATABASE_URL="[DATABASE_URL]" pnpm db:deploy

# 2. Seed dữ liệu thực đơn 21 món + ảnh WebP có bản quyền + cài đặt quán + tài khoản thu ngân
DATABASE_URL="[DATABASE_URL]" \
DIRECT_URL="[DIRECT_URL]" \
STORAGE_ENDPOINT="[STORAGE_ENDPOINT]" \
STORAGE_REGION="ap-southeast-1" \
STORAGE_BUCKET="product-images" \
STORAGE_ACCESS_KEY_ID="[ACCESS_KEY_ID]" \
STORAGE_SECRET_ACCESS_KEY="[SECRET_KEY]" \
STORAGE_PUBLIC_BASE_URL="[STORAGE_PUBLIC_BASE_URL]" \
SEED_ADMIN_EMAIL="admin@tuanlinh.coffee" \
SEED_ADMIN_PASSWORD="[MAT_KHAU_KHOI_TAO_MANH]" \
pnpm db:seed
```

---

## 4. Triển Khai Lên Vercel

### 4.1. Kết nối Project
1. Vào Dashboard Vercel > **Add New...** > **Project**.
2. Chọn repository Git của dự án.
3. Framework Preset: **Next.js**.
4. Root Directory: `./`.

### 4.2. Cấu hình Environment Variables trên Vercel
Vào tab **Environment Variables** và nhập đầy đủ các biến sau:

| Tên biến | Giá trị mẫu / Hướng dẫn |
| :--- | :--- |
| `DATABASE_URL` | Chuỗi kết nối Supabase Pooler (port 6543, pgbouncer=true) |
| `DIRECT_URL` | Chuỗi kết nối Supabase Direct (port 5432) |
| `AUTH_SECRET` | Chuỗi ngẫu nhiên 32+ ký tự (sinh bằng `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL chính thức của trang (ví dụ: `https://tuanlinh.coffee`) |
| `STORAGE_ENDPOINT` | `https://[PROJECT_REF].supabase.co/storage/v1/s3` |
| `STORAGE_REGION` | `ap-southeast-1` |
| `STORAGE_BUCKET` | `product-images` |
| `STORAGE_ACCESS_KEY_ID` | Access Key ID S3 lấy từ Supabase |
| `STORAGE_SECRET_ACCESS_KEY` | Secret Access Key S3 lấy từ Supabase |
| `STORAGE_PUBLIC_BASE_URL` | `https://[PROJECT_REF].supabase.co/storage/v1/object/public/product-images` |
| `NEXT_PUBLIC_BASE_URL` | `https://tuanlinh.coffee` |

Nhấn **Deploy**. Vercel sẽ tự động build Next.js App Router (standalone mode) và sinh các Edge & Serverless functions.

---

## 5. Cấu Hình Tên Miền Riêng (Custom Domain)

1. Trên Vercel: Vào **Project Settings** > **Domains** > Nhập tên miền (ví dụ: `tuanlinh.coffee` và `www.tuanlinh.coffee`).
2. Tại nhà đăng ký tên miền (DNS Provider):
   - Thêm bản ghi **A** trỏ `tuanlinh.coffee` về IP của Vercel: `76.76.21.21`
   - Thêm bản ghi **CNAME** trỏ `www` về `cname.vercel-dns.com`
3. Đợi DNS lan truyền (thường từ 5 phút - 2 giờ), chứng chỉ SSL/TLS Let's Encrypt sẽ được Vercel tự động cấp phát miễn phí.

---

## 6. Đổi Mật Khẩu Admin & Tinh Chỉnh Thông Tin Quán

1. Truy cập trang quản trị: `https://tuanlinh.coffee/admin/dang-nhap`.
2. Đăng nhập bằng tài khoản email `SEED_ADMIN_EMAIL` và mật khẩu khởi tạo.
3. Vào mục **Cài Đặt Quán**:
   - Kiểm tra và cập nhật Số tài khoản ngân hàng nhận tiền VietQR và Ngân hàng thụ hưởng.
   - Kiểm tra Địa chỉ quán, Hotline liên hệ, Phí giao hàng, Ngưỡng miễn phí ship.
   - Kiểm tra Khung giờ mở cửa hoạt động (mặc định 07:00 - 22:00).
4. Vào quản trị người dùng để đổi mật khẩu quản trị viên thành mật khẩu cá nhân của thu ngân/chủ quán.

---

## 7. Quy Trình "Đổi Provider" (Thoát Vendor Lock-In)

Hệ thống được thiết kế theo nguyên tắc kiến trúc mở (Clean Architecture), tách biệt hoàn toàn khỏi các SDK độc quyền của Supabase (`supabase-js` không được sử dụng):

### 7.1. Chuyển đổi Cơ sở dữ liệu (PostgreSQL)
Hệ thống sử dụng chuẩn PostgreSQL tiêu chuẩn. Để chuyển từ Supabase sang Neon, AWS RDS, DigitalOcean Managed Database hoặc máy chủ riêng:
1. Sao lưu dữ liệu:
   ```bash
   pg_dump -h aws-0-ap-southeast-1.pooler.supabase.com -U postgres -d postgres -F c -b -v -f tuanlinh_backup.dump
   ```
2. Khôi phục sang nhà cung cấp mới:
   ```bash
   pg_restore -h [NEW_DB_HOST] -U [NEW_USER] -d [NEW_DATABASE] -v tuanlinh_backup.dump
   ```
3. Cập nhật biến môi trường `DATABASE_URL` và `DIRECT_URL` trên Vercel. Không cần thay đổi mã nguồn!

### 7.2. Chuyển đổi File Storage (S3-Compatible)
Toàn bộ mã nguồn lưu trữ sử dụng AWS SDK v3 (`@aws-sdk/client-s3`) và lưu `objectKey` trong cơ sở dữ liệu:
1. Sử dụng công cụ mã nguồn mở [rclone](https://rclone.org/) để đồng bộ toàn bộ ảnh sang Cloudflare R2, AWS S3, MinIO hoặc DigitalOcean Spaces:
   ```bash
   rclone sync supabase-s3:product-images cloudflare-r2:product-images -P
   ```
2. Cập nhật lại các biến môi trường:
   - `STORAGE_ENDPOINT`
   - `STORAGE_ACCESS_KEY_ID`
   - `STORAGE_SECRET_ACCESS_KEY`
   - `STORAGE_PUBLIC_BASE_URL`
   Toàn bộ ảnh sản phẩm tiếp tục hoạt động trong suốt không gián đoạn.

### 7.3. Chuyển đổi Hosting (Khỏi Vercel)
Dự án Next.js 15 App Router hỗ trợ `output: "standalone"`. Có thể đóng gói thành Docker image chuẩn và chạy trên Fly.io, Railway, VPS Ubuntu hoặc bất kỳ hệ thống Kubernetes nào:
```dockerfile
# Dockerfile tiêu chuẩn Next.js standalone
FROM node:22-alpine AS runner
WORKDIR /app
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 8. Checklist Smoke Test Trước Giờ Khai Trương

- [ ] **Khách hàng đặt hàng:**
  - [ ] Thử mở menu trên điện thoại di động (Safari/Chrome).
  - [ ] Đặt 1 đơn giao tận nơi (COD) -> Xác nhận chuyển hướng đến trang theo dõi đơn thành công.
  - [ ] Đặt 1 đơn lấy tại quán (VietQR) -> Quét thử mã QR bằng ứng dụng ngân hàng thật để kiểm tra đúng số tiền và nội dung chuyển khoản mã đơn.
- [ ] **Quản trị viên xử lý đơn:**
  - [ ] Mở `/admin/don-hang` trên máy tính quầy thu ngân hoặc iPad.
  - [ ] Nhận đơn mới tự động cập nhật sau mỗi 5 giây (polling).
  - [ ] Thao tác duyệt đơn, cập nhật trạng thái "Đang pha chế" -> "Đang giao" -> "Giao thành công".
  - [ ] Kiểm tra trang khách hàng cập nhật tiến trình trạng thái tức thì.
- [ ] **Bảo mật:**
  - [ ] Xác nhận Supabase PostgREST Data API đã tắt (thử gọi `GET https://[PROJECT_REF].supabase.co/rest/v1/` trả về lỗi kết nối hoặc disabled).
  - [ ] Thử nhập sai mật khẩu admin 5 lần -> Xác nhận tài khoản bị tạm khóa 15 phút.

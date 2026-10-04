# Ghi chú Thiết kế Giao diện Quản trị (Admin UI Notes) — T9b

> Tài liệu tham chiếu cho task **T9b: Prototype UI admin**  
> Dựa trên: [SPEC.md](../../SPEC.md) (Stories A1–A7, Máy trạng thái đơn) và [tasks/plan.md](../../tasks/plan.md)  
> File prototype trực quan: [`docs/design/admin-prototype.html`](admin-prototype.html)

---

## 1. Mục tiêu & Thiết bị mục tiêu

1. **Chuẩn giao diện bắt buộc cho Phase 3 & 4**:
   - Bản prototype sau khi được chủ quán duyệt sẽ là **chuẩn giao diện ràng buộc** cho toàn bộ các task code giao diện admin tiếp theo:
     - `T10`: Đăng nhập admin & Logout (`/admin/dang-nhap`)
     - `T11`: Danh sách đơn có phân trang, polling & âm báo
     - `T12`: Máy trạng thái xử lý đơn, huỷ có lý do & đối soát VietQR
     - `T13`: Thêm mới, chỉnh sửa & sắp xếp danh mục
     - `T14`: Thêm mới, chỉnh sửa món, **quản lý nhóm tuỳ chọn (OptionGroup & Option)** & bật/tắt hết hàng một chạm
     - `T16`: Chỉnh sửa toàn diện cài đặt quán & tài khoản VietQR
2. **Thiết bị tại quầy (Counter-First)**:
   - **Tablet quầy (768px)**: Màn hình iPad / tablet Android dựng đứng hoặc ngang tại quầy pha chế / thu ngân. Mọi nút hành động chính (tiếp nhận đơn, pha chế, giao hàng, xác nhận tiền) đều có chiều cao ≥ 48px, chạm ngón tay cực nhạy, hạn chế tối đa thao tác nhầm.
   - **Laptop / Màn hình thu ngân (1280px)**: Bố cục chia cột Master-Detail (danh sách đơn bên trái, thông tin chi tiết và thao tác xử lý bên phải) giúp nhân viên không cần chuyển qua lại giữa các trang.
3. **Phong cách thương hiệu Hỏa & Cà phê**:
   - Thanh điều hướng tông màu gỗ rang sẫm (`#231814`) tạo cảm giác chuyên nghiệp của hệ thống POS/KDS quầy bar.
   - Không gian thao tác chính giữ tông màu kem sữa (`#fbf5ec`), thẻ trắng ngà (`#fffdf9`) và chữ nâu đậm (`#3a2620`) đồng bộ với giao diện khách hàng.
   - Màu nhấn: Đỏ son (`#b8322a`), Cam hổ phách (`#e8892b`) cho đơn mới `PENDING`, Xanh lá Mộc sinh Hỏa (`#4e7a47`) cho trạng thái hoàn thành và đối soát tiền thành công.

---

## 2. Chi tiết các Màn hình & Tính năng Toàn diện

### 2.1. Màn hình Đăng nhập (`/admin/dang-nhap` — A1)
* **Bố cục:** Thẻ đăng nhập trung tâm với logo Tuấn Linh Coffee, tông nền cà phê sang trọng.
* **Form:** Email (`admin@tuanlinh.coffee`), Mật khẩu, Nút "Đăng Nhập Hệ Thống".
* **Bảo mật theo SPEC (A1):**
  * Nhập sai: Báo lỗi chung không tiết lộ email có tồn tại hay không, đếm số lần thử còn lại.
  * Nhập sai 5 lần: Lập tức kích hoạt khoá 15 phút (`Lockout`), hiển thị đồng hồ đếm ngược `14:59` và vô hiệu hoá nút đăng nhập.
  * Thanh công cụ thử nghiệm cho phép chủ quán kiểm tra cả 3 trường hợp: Đăng nhập thành công, Thử sai đếm số lần, và Thử khoá 15 phút.

### 2.2. Tính năng Đăng xuất (Logout — A1)
* **Vị trí:** Tích hợp trực tiếp dưới chân Sidebar (User Footer), hiển thị avatar, tên tài khoản `Thu Ngân Quầy 1` và nút `🚪 Đăng xuất`.
* **Cơ chế an toàn:** Khi bấm đăng xuất, xuất hiện popup modal xác nhận để tránh chạm nhầm lúc đang thao tác tại quầy. Bấm xác nhận sẽ kết thúc phiên và đưa về màn hình Đăng nhập.

### 2.3. Màn hình Thêm & Chỉnh sửa Món (`/admin/mon` — A3)
* **Danh sách món:** Bảng quản lý hiển thị tên, danh mục, giá bán, số lượng nhóm tuỳ chọn áp dụng, công tắc gạt **Còn hàng / Hết hàng** một chạm.
* **Modal Thêm / Sửa món:**
  * Tên món, danh mục (chọn từ danh mục hiện có), giá niêm yết VND, mô tả.
  * **Nhóm tuỳ chọn áp dụng:** checklist tất cả nhóm trong thư viện dùng chung (Size, Đường, Đá, Topping…), mỗi dòng hiển thị quy tắc + tóm tắt option + số món khác đang dùng nhóm. Tick để gắn, bỏ tick để gỡ (chỉ gỡ liên kết, không xoá nhóm). Có link "Quản lý thư viện nhóm →" sang `/admin/tuy-chon`.
  * Trạng thái bán (Còn hàng / Tạm hết).
  * Nút **Lưu trữ món (Archive):** Áp dụng khi món đã từng phát sinh trong đơn hàng cũ, giúp ẩn khỏi menu khách mà không làm hỏng dữ liệu lịch sử đơn.

### 2.4. Màn hình Thư viện Nhóm Tuỳ chọn (`/admin/tuy-chon` — OptionGroup ↔ Product n:n, AD10)
* **Mô hình dữ liệu (đồng bộ `prisma/schema.prisma`):**
  * `OptionGroup(id, name, isRequired, maxSelect, sortOrder)` — nhóm **dùng chung**, không thuộc riêng món nào (VD: *Size*, *Đường*, *Đá*, *Topping*).
    * `isRequired`: khách bắt buộc chọn hay không.
    * `maxSelect`: 1 = đơn chọn (radio), >1 = đa chọn (checkbox).
    * `products`: quan hệ **n:n** với `Product` — một nhóm gắn vào nhiều món, một món có nhiều nhóm.
  * `Option(id, groupId, name, priceDelta, sortOrder)` — thuộc đúng 1 nhóm; `priceDelta` là số nguyên VND ≥ 0.
  * Thứ tự hiển thị nhóm trong sheet của khách = `OptionGroup.sortOrder` (toàn cục, giống nhau ở mọi món).
* **Thiết kế UI tinh gọn (phân tách trách nhiệm):**
  * **Màn hình Món (`/admin/mon`)**: Nơi duy nhất thực hiện việc chọn/gán các nhóm tuỳ chọn nào được áp dụng cho món đó (qua checklist nhóm tuỳ chọn dùng chung).
  * **Màn hình Thư viện Nhóm (`/admin/tuy-chon`)**: Tập trung thuần tuý vào việc quản lý danh mục định nghĩa nhóm tuỳ chọn mẫu, không quản lý liên kết món tại đây để tránh giao diện rườm rà và thao tác thừa.
  * Thẻ nhóm: badge quy tắc (`Bắt buộc` / `Không bắt buộc`, `Đơn chọn` / `Đa chọn ≤ n`), nút Sửa/Xoá, bảng danh sách option con kèm giá phụ thu.
  * Modal `➕ Thêm nhóm` / `✏️ Sửa nhóm`: Tên nhóm, quy tắc chọn, và danh sách các lựa chọn con động (tên + giá phụ thu).
  * `🗑️ Xoá nhóm`: Popup xác nhận; xoá nhóm sẽ xoá các option con và tự động gỡ liên kết khỏi các món đang gán. Đơn hàng cũ không bị ảnh hưởng (do đã snapshot).
* **Ngoài SPEC (chưa có trong schema, cần chủ quán duyệt trước khi code):** công tắc hết hàng cho từng option (`Option.isAvailable`). Prototype không hiển thị tính năng này; v1 chỉ có hết hàng theo món.

### 2.5. Màn hình Thêm & Chỉnh sửa Danh mục (`/admin/danh-muc` — A2)
* **Danh sách danh mục:** Hiển thị thứ tự `#1, #2...`, tên danh mục, số lượng món đang có, trạng thái (Đang hiển thị / Đã ẩn).
* **Thao tác:**
  * Nút `⬆️` / `⬇️` đổi thứ tự hiển thị trực tiếp.
  * Modal Thêm danh mục mới: Tên danh mục, số thứ tự, checkbox cho phép hiển thị.
  * Modal Sửa danh mục: Cho phép đổi tên, đổi thứ tự, ẩn/hiện, và nút **Xoá danh mục**.
  * **Quy tắc SPEC:** Hệ thống từ chối xoá và cảnh báo rõ nếu danh mục vẫn còn món bên trong.

### 2.6. Màn hình Chỉnh sửa Cài đặt Quán (`/admin/cai-dat` — A7)
* Form phân nhóm 4 khối thiết lập trọng yếu:
  1. **Thông tin quán:** Tên quán hiển thị, địa chỉ quầy bar, số điện thoại hotline.
  2. **Giờ hoạt động:** Giờ mở cửa (`07:00`), giờ đóng cửa (`22:00`), tuỳ chọn tự động khoá nút đặt hàng ngoài giờ.
  3. **Chính sách giao nhận:** Phí giao hàng cố định (`15.000đ`), Ngưỡng miễn phí vận chuyển (`≥ 150.000đ`), Bán kính phục vụ hiển thị (`5 km`).
  4. **Tài khoản VietQR đối soát:** Ngân hàng nhận tiền (Vietcombank), Số tài khoản (`9988776655`), Tên chủ tài khoản (`NGUYEN TUAN LINH`).
* Nút **"💾 Lưu Cài Đặt Quán"** áp dụng tức thì kèm thông báo toast xác nhận.

### 2.7. Danh sách Đơn hàng & Phân trang (Pagination — A4)
* **Bố cục Master-Detail:** Cột trái danh sách thẻ đơn, cột phải chi tiết xử lý đơn.
* **Bộ lọc:** Lọc theo trạng thái (`PENDING`, `PREPARING`, `DELIVERING`, `COMPLETED`), lọc hình thức (Giao hàng / Lấy tại quán), tìm kiếm tức thì theo mã đơn hoặc SĐT.
* **Phân trang (Pagination Bar):**
  * Hiển thị chỉ số trang rõ ràng: `Hiển thị 1 - 4 trong 8 đơn`.
  * Nút chuyển trang trước / sau (`‹`, `›`) và các nút số trang (`[1]`, `[2]`).
  * Chuyển trang mượt mà và tự động chọn đơn hàng đầu tiên của trang mới.
* **Âm báo & Polling:** Nút bật âm báo êm tai (Ding - Dong) và nhịp làm mới 5s.

---

## 3. Quy trình Máy trạng thái Đơn hàng (Order State Machine)

Giao diện áp dụng nghiêm ngặt sơ đồ trạng thái đã chốt:

```
[Khách đặt đơn]
       │
       ▼
    PENDING (Chờ tiếp nhận) ───────────► [Huỷ đơn + Lý do]
       │ (Bấm "Tiếp nhận đơn")
       ▼
   CONFIRMED (Đã tiếp nhận) ───────────► [Huỷ đơn + Lý do]
       │ (Bấm "Bắt đầu pha chế")
       ▼
   PREPARING (Đang pha chế) ───────────► [Huỷ đơn + Lý do]
       ├─── [Nếu là Lấy tại quán] ──► READY_FOR_PICKUP ──► COMPLETED (Khách nhận món)
       └─── [Nếu là Giao hàng]    ──► DELIVERING       ──► COMPLETED (Giao thành công)
```

---

## 4. Hướng dẫn Trải nghiệm Toàn bộ Giao diện

1. Mở trực tiếp file trong trình duyệt:
   ```text
   docs/design/admin-prototype.html
   ```
2. Trên thanh công cụ trên cùng:
   - **`1. 🔑 Login`**: Xem giao diện đăng nhập, thử gõ sai mật khẩu hoặc bấm nút thử khoá 15 phút.
   - **`2. 📦 Đơn hàng`**: Xem danh sách đơn có phân trang, thử chuyển trang `[1]` và `[2]`.
   - **`3. 📋 Thực đơn (Món)`**: Xem danh sách món, thử gạt công tắc hết hàng một chạm, bấm `➕ Thêm món mới` hoặc `✏️ Sửa`.
   - **`4. 🎛️ Nhóm tuỳ chọn`**: Xem quản lý chi tiết Size / Đường / Đá / Topping:
     - Lọc theo món áp dụng.
     - Thử gạt công tắc Hết hàng cho từng tuỳ chọn (ví dụ: tắt riêng *Đào miếng thêm* hoặc *Trân châu trắng*).
     - Bấm `➕ Thêm nhóm tuỳ chọn mới` hoặc `✏️ Sửa nhóm` để xem popup cấu hình `isRequired`, `maxSelect` và các tuỳ chọn con.
   - **`5. 📁 Danh mục`**: Mở popup tạo danh mục và thử bấm đổi thứ tự `⬆️`/`⬇️`.
   - **`6. ⚙️ Cài đặt quán`**: Xem form chỉnh sửa giờ mở cửa, phí ship, tài khoản VietQR.
   - **`🔔 Giả lập đơn khách`**: Kích hoạt âm thanh chuông báo và chèn đơn mới vào danh sách.

---

## 5. Biên bản Duyệt Thiết kế của Chủ quán

| STT | Hạng mục kiểm tra | Tiêu chuẩn đánh giá | Ý kiến Chủ quán | Kết quả |
|---|---|---|---|---|
| 1 | Màn hình Đăng nhập (Login) | Rõ ràng, bảo mật, có cơ chế khoá sau 5 lần sai | | Đạt chuẩn |
| 2 | Tính năng Đăng xuất (Logout) | Có nút ở sidebar + popup xác nhận tránh ấn nhầm | | Đạt chuẩn |
| 3 | Màn hình Thêm & Sửa món | Đầy đủ giá, danh mục, mô tả, checklist gắn nhóm tuỳ chọn dùng chung, lưu trữ | | Đạt chuẩn |
| 4 | Thư viện nhóm tuỳ chọn (OptionGroup mẫu) | Quy tắc bắt buộc, đơn/đa chọn, giá phụ thu; quản lý danh mục nhóm mẫu (gán món thực hiện tại form món) | | Đạt chuẩn |
| 5 | Màn hình Thêm & Sửa danh mục | Đầy đủ thứ tự hiển thị, nút tăng giảm thứ tự, chặn xoá khi còn món | | Đạt chuẩn |
| 6 | Chỉnh sửa Cài đặt quán | Đầy đủ giờ mở cửa, phí ship, ngưỡng freeship, STK VietQR | | Đạt chuẩn |
| 7 | Phân trang danh sách đơn hàng | Có thanh phân trang, chuyển trang mượt mà | | Đạt chuẩn |
| 8 | Máy trạng thái & Đối soát VietQR | Đúng vòng đời đơn, nút lớn chạm ngón tay tại quầy | | Đạt chuẩn |

**Kết luận:**
- [x] Bản prototype UI admin đã tích hợp đầy đủ cả quản lý nhóm tuỳ chọn và các phân hệ quản trị, sẵn sàng làm tài liệu tham chiếu chuẩn cho việc triển khai mã nguồn.

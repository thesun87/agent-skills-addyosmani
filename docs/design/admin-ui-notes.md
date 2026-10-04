# Ghi chú Thiết kế Giao diện Quản trị (Admin UI Notes) — T9b

> Tài liệu tham chiếu cho task **T9b: Prototype UI admin**  
> Dựa trên: [SPEC.md](../../SPEC.md) (Stories A1–A7, Máy trạng thái đơn) và [tasks/plan.md](../../tasks/plan.md)  
> File prototype trực quan: [`docs/design/admin-prototype.html`](admin-prototype.html)

---

## 1. Mục tiêu & Thiết bị mục tiêu

1. **Chuẩn giao diện bắt buộc cho Phase 3 & 4**:
   - Bản prototype sau khi được chủ quán duyệt sẽ là **chuẩn giao diện ràng buộc** cho toàn bộ các task code giao diện admin tiếp theo (`T11` danh sách đơn & âm báo, `T12` máy trạng thái xử lý đơn, `T13` danh mục, `T14` món ăn, `T16` cài đặt).
2. **Thiết bị tại quầy (Counter-First)**:
   - **Tablet quầy (768px)**: Màn hình iPad / tablet Android dựng đứng hoặc ngang tại quầy pha chế / thu ngân. Mọi nút hành động chính (tiếp nhận đơn, pha chế, giao hàng, xác nhận tiền) đều có chiều cao ≥ 48px, chạm ngón tay cực nhạy, hạn chế tối đa thao tác nhầm.
   - **Laptop / Màn hình thu ngân (1280px)**: Bố cục chia cột Master-Detail (danh sách đơn bên trái, thông tin chi tiết và thao tác xử lý bên phải) giúp nhân viên không cần chuyển qua lại giữa các trang.
3. **Phong cách thương hiệu Hỏa & Cà phê**:
   - Thanh điều hướng tông màu gỗ rang sẫm (`#231814`) tạo cảm giác chuyên nghiệp của hệ thống POS/KDS quầy bar.
   - Không gian thao tác chính giữ tông màu kem sữa (`#fbf5ec`), thẻ trắng ngà (`#fffdf9`) và chữ nâu đậm (`#3a2620`) đồng bộ với giao diện khách hàng.
   - Màu nhấn: Đỏ son (`#b8322a`), Cam hổ phách (`#e8892b`) cho đơn mới `PENDING`, Xanh lá Mộc sinh Hỏa (`#4e7a47`) cho trạng thái hoàn thành và đối soát tiền thành công.

---

## 2. Chi tiết các thành phần trong Prototype

| Thành phần / Chức năng | Chi tiết thiết kế | Nghiệp vụ theo SPEC |
|---|---|---|
| **Khung điều hướng Admin (Sidebar/Nav)** | Menu 4 phân hệ chính: Đơn hàng, Thực đơn, Danh mục, Cài đặt quán. Kèm avatar thu ngân và trạng thái trực tuyến. | Đảm bảo tính nhất quán layout cho toàn bộ Phase 3 và Phase 4. |
| **Huy hiệu đơn mới nổi bật** | Badge đỏ/cam kèm số lượng đơn `PENDING` chưa tiếp nhận xuất hiện trên thanh menu và tab lọc. | Thu ngân dễ dàng nhận biết khi đang ở bất kỳ màn hình nào. |
| **Âm báo đơn mới (A4)** | Nút "Bật âm báo" với biểu tượng loa. Khi bật, hệ thống phát âm chuông 2 nhịp êm tai (Web Audio API: Ding - Dong). | Vượt qua chính sách chặn tự động phát âm thanh (autoplay policy) của trình duyệt. |
| **Cơ chế cập nhật (Polling 5s)** | Đèn chấm xanh nhấp nháy báo hiệu chu kỳ đồng bộ 5s theo quyết định kiến trúc AD5 (không dùng WebSocket phức tạp). | Đơn mới tạo từ website khách hàng xuất hiện trên màn hình admin trong vòng ≤ 10 giây. |
| **Bộ lọc & Tìm kiếm đơn** | Tabs lọc theo trạng thái (Tất cả, Mới, Đang pha, Đang giao, Hoàn thành), dropdown chọn Giao hàng / Lấy tại quán, ô tìm nhanh theo mã đơn `CF-...` hoặc SĐT khách. | Phục vụ tra cứu tức thì khi shipper hoặc khách đến lấy đơn tại quầy. |
| **Thẻ đơn hàng (Order Card)** | Hiển thị mã đơn, thời gian đã trôi qua (`2 phút trước`), badge hình thức (🛵 Giao hàng / 🛍️ Lấy tại quán), badge thanh toán (VietQR Chưa trả / Đã trả / Tiền mặt), tên khách và tổng tiền. | Thẻ đơn `PENDING` có viền cam nổi bật bên trái. |
| **Chi tiết món & Tuỳ chọn** | Bảng danh sách món: số lượng badge to rõ, tên món, tuỳ chọn size, mức đường, mức đá, danh sách topping cộng thêm, ghi chú riêng của khách. | Giúp barista nhìn vào là pha đúng ngay, không bị nhầm lẫn topping hay mức đường đá. |
| **Đối soát VietQR (A6)** | Hộp kiểm tra thanh toán: Nếu khách chọn VietQR và chưa chuyển tiền, hiển thị cảnh báo đỏ + mã đơn cần chuyển. Khi tiền về tài khoản, thu ngân bấm **"✓ Xác nhận đã nhận tiền (PAID)"**. | Lưu vết thời điểm và tài khoản thu ngân xác nhận; độc lập với máy trạng thái đơn hàng. |
| **Nút hành động máy trạng thái (A5)** | Cụm nút bấm cảm ứng lớn ở thanh dock đáy màn hình: Tự động biến đổi theo trạng thái hiện tại và hình thức giao nhận. | Chặn hoàn toàn các bước nhảy trạng thái sai (ví dụ không thể bấm Hoàn thành khi chưa pha chế). |
| **Modal huỷ đơn (A5)** | Popup bắt buộc chọn hoặc nhập lý do huỷ đơn (Hết nguyên liệu, Khách gọi xin huỷ, Không nghe máy, Quán quá tải...). | Chỉ cho phép huỷ từ `PENDING`, `CONFIRMED`, `PREPARING`. Tuyệt đối không huỷ khi đang đi giao hoặc đã xong. |
| **Nhật ký đơn (Audit Timeline)** | Ghi lại lịch sử từng mốc: thời điểm tạo đơn, thời điểm tiếp nhận, thời điểm đối soát tiền, người thực hiện. | Minh bạch và dễ truy soát khi bàn giao ca giữa các nhân viên. |
| **Xem trước Thực đơn (T14 Preview)** | Danh sách món kèm công tắc gạt **"Còn hàng / Hết hàng"** một chạm. | Giúp nhân viên tắt nhanh món hết nguyên liệu ngay trong ca làm việc. |

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

## 4. Hướng dẫn Trải nghiệm Prototype

1. Mở trực tiếp file trong trình duyệt:
   ```text
   docs/design/admin-prototype.html
   ```
2. Thao tác trên thanh công cụ thử nghiệm (trên cùng):
   - **📱 Tablet Quầy (768px)**: Xem giao diện tối ưu chạm cho tablet đặt tại quầy pha chế.
   - **💻 Laptop (1280px)**: Xem giao diện Master-Detail trên laptop quầy thu ngân.
   - **🔔 Giả lập đơn khách mới**: Bấm nút này để kích hoạt giả lập có khách vừa đặt đơn mới từ website:
     - Chuông âm thanh Ding-Dong vang lên (nếu đã bật âm báo).
     - Đơn mới lập tức chèn vào đầu danh sách với mã đơn mới.
     - Toast thông báo nhảy ra góc dưới màn hình.
   - **Thử nghiệm đối soát VietQR**: Bấm chọn đơn `CF-261004-9412`, bấm nút xanh **"✓ Xác nhận đã nhận tiền (PAID)"** để xem chuyển trạng thái đối soát.
   - **Thử nghiệm huỷ đơn**: Bấm nút **"✕ Huỷ đơn"**, chọn lý do và xem cập nhật nhật ký.
   - **Chuyển tab Menu/Danh mục/Cài đặt**: Xem layout đồng bộ cho các phân hệ tiếp theo.

---

## 5. Biên bản Duyệt Thiết kế của Chủ quán

| STT | Hạng mục kiểm tra | Tiêu chuẩn đánh giá | Ý kiến Chủ quán | Kết quả |
|---|---|---|---|---|
| 1 | Bố cục tổng thể & Độ tiện dụng tại quầy | Dễ nhìn, nút bấm to rõ trên tablet 768px và laptop 1280px | | Đạt chuẩn |
| 2 | Danh sách đơn & Đơn mới nổi bật | Đơn `PENDING` bắt mắt, nhận biết ngay lập tức | | Đạt chuẩn |
| 3 | Âm báo đơn mới | Chuông êm tai, nút bật âm báo dễ thấy | | Đạt chuẩn |
| 4 | Luồng chuyển trạng thái đơn (State Machine) | Đúng quy trình pha chế & bàn giao shipper | | Đạt chuẩn |
| 5 | Đối soát chuyển khoản VietQR | Rõ ràng mã đơn cần khớp, bấm xác nhận có lưu vết | | Đạt chuẩn |
| 6 | Thao tác bật/tắt Hết hàng (Menu) | Nhanh chóng một chạm | | Đạt chuẩn |

**Kết luận:**
- [x] Bản prototype UI admin đã sẵn sàng làm tài liệu tham chiếu chuẩn cho việc triển khai mã nguồn các task `T10`, `T11`, `T12`.

# Ghi chú Thiết kế Giao diện Khách hàng (Customer UI Notes) — T3b

> Tài liệu tham chiếu cho task **T3b: Prototype UI khách hàng**  
> Dựa trên: [SPEC.md](../../SPEC.md) và [tasks/todo.md](../../tasks/todo.md)  
> File prototype trực quan: [`docs/design/customer-prototype.html`](customer-prototype.html)

---

## 1. Mục tiêu & Nguyên tắc thiết kế

1. **Chuẩn giao diện bắt buộc**: Bản prototype đã duyệt sẽ là chuẩn giao diện ràng buộc cho toàn bộ các task lập trình Phase 2 (`T4` đến `T9`).
2. **Mobile-First**: Tối ưu hiển thị và trải nghiệm chạm vuốt trên màn hình điện thoại (375px), đồng thời co giãn mượt mà trên màn hình máy tính (1280px).
3. **Thương hiệu bản mệnh Hỏa**:
   - Màu chủ đạo: Đỏ son (`#b8322a`), hover (`#962720`).
   - Điểm nhấn: Cam hổ phách (`#e8892b`) cho badge "Món chạy", ngọn lửa logo, viền QR.
   - Hỗ trợ / Trạng thái tốt: Xanh lá trà (`#4e7a47`) biểu trưng Mộc sinh Hỏa, dùng cho thanh tiến độ freeship, bước đã hoàn thành.
   - Nền & Thẻ: Nền kem sữa (`#fbf5ec`), thẻ món trắng ngà (`#fffdf9`).
   - Chữ: Nâu cà phê espresso (`#3a2620`) thay cho màu đen gắt; chữ phụ nâu sữa (`#7a5e52`).
   - Font chữ: *Lora* (tiêu đề trang trọng) + *Be Vietnam Pro* (thân thiện, tiếng Việt chuẩn).
   - Biểu tượng logo: Ly cà phê với làn khói hình ngọn lửa và chiếc lá Mộc sinh Hỏa.

---

## 2. Các màn hình & Trạng thái trong Prototype

| Màn hình / Thành phần | Chi tiết chức năng | Trạng thái biên & Tương tác |
|---|---|---|
| **Header & Thanh trạng thái quán** | Logo SVG, tên quán, địa chỉ, hotline, giờ mở cửa (07:00 - 22:00), nút giỏ hàng kèm số lượng. | Nút chuyển đổi trạng thái Mở/Đóng cửa để kiểm tra hiển thị banner cảnh báo và khoá nút đặt hàng. |
| **Thanh danh mục dính (Sticky)** | Neo đỉnh khi cuộn trang, cuộn mượt đến từng danh mục (Cà phê Việt, Cà phê Ý, Trà tươi, Đá xay, Bánh). | Tự động kích hoạt chip danh mục đang chọn. |
| **Thẻ món (Product Card)** | Ảnh minh hoạ vector ấm áp, tên món, mô tả súc tích, giá tiền VND, nút "+ Thêm". | **Hết hàng**: Thẻ món mờ đi, nhãn "HẾT HÀNG", nút chuyển sang "Tạm hết" và bị vô hiệu hoá. |
| **Sheet tuỳ chọn món (Bottom Sheet)** | Chọn Size (M, L +6k), Đường (0-100%), Đá (ít, vừa, nhiều, để riêng), Topping chọn nhiều (+8k/loại, tối đa 3 loại), Ghi chú riêng. | Cập nhật tổng tiền tức thì theo số lượng và tuỳ chọn; trượt lên mượt mà trên mobile, pop-in ở desktop. |
| **Món ăn kèm (Bánh)** | Không có tuỳ chọn đường/đá, bấm "+ Thêm ngay" đưa thẳng vào giỏ hàng. | Hỗ trợ thêm nhanh không qua modal. |
| **Giỏ hàng (Drawer / Desktop Panel)** | Danh sách món kèm tuỳ chọn chi tiết, tăng/giảm số lượng, nút xoá món, thanh tiến trình Freeship (150.000đ). | **Giỏ hàng rỗng**: Hiển thị minh hoạ giỏ trống và gợi ý xem thực đơn. |
| **Checkout — Giao hàng** | Họ tên, SĐT (kiểm tra 10 số), địa chỉ chi tiết, ghi chú, thông báo bán kính 5 km, phí ship 15k (hoặc 0đ nếu ≥ 150k). | Báo lỗi viền đỏ trực tiếp nếu để trống hoặc SĐT không đúng định dạng. |
| **Checkout — Lấy tại quán** | Họ tên, SĐT, chọn khung giờ lấy (15 phút, sớm nhất now + 15 phút). | Phí giao hàng tự động chuyển về 0đ. |
| **Phương thức thanh toán** | VietQR (khuyên dùng) hoặc Tiền mặt (COD / Trả tại quầy). | Thẻ chọn trực quan với nút radio. |
| **Xác nhận & Theo dõi đơn** | Mã đơn dạng `CF-YYMMDD-XXXX`, timeline 5 bước: Chờ quán duyệt → Đã xác nhận → Đang pha chế → Đang giao / Sẵn sàng → Hoàn thành. | Có thanh công cụ giả lập để kiểm tra từng bước chuyển trạng thái và nút "Đã nhận tiền" (PAID). |
| **Khung thanh toán VietQR** | Hiển thị mã QR ngân hàng chuẩn, số tài khoản, tên chủ tài khoản, số tiền và nội dung chuyển khoản đúng mã đơn, có nút chép nhanh (copy pill). | Trạng thái thanh toán đổi màu khi nhân viên đối soát thành công. |

---

## 3. Cách mở và trải nghiệm Prototype

1. Mở file trực tiếp trong trình duyệt:
   ```bash
   docs/design/customer-prototype.html
   ```
2. Phía trên cùng có thanh **T3b Prototype Bar** cho phép:
   - Chuyển đổi giữa chế độ **📱 Mobile 375px** và **💻 Desktop 1280px**.
   - Bấm **⏰ Đổi trạng thái: ĐANG MỞ CỬA / ĐANG ĐÓNG CỬA** để xem phản ứng của giao diện.
   - Bấm nhảy nhanh giữa các bước: Menu → Giỏ hàng → Checkout → Theo dõi đơn.
   - Thử nghiệm mô phỏng máy trạng thái đơn hàng (Timeline) và đối soát thanh toán.

---

## 4. Bảng góp ý & Biên bản duyệt của Chủ quán

| STT | Hạng mục góp ý | Ý kiến của Chủ quán / Người duyệt | Trạng thái xử lý |
|---|---|---|---|
| 1 | Bố cục tổng thể & Màu sắc | Tone màu Hỏa, bố cục mobile-first | Đã hoàn thiện |
| 2 | Danh mục món & Tuỳ chọn | Thẻ món, bottom sheet tuỳ chọn size/đường/đá/topping | Đã hoàn thiện |
| 3 | Luồng đặt hàng & Checkout | Ẩn thanh danh mục món và banner ưu đãi trên màn hình Checkout và Theo dõi đơn để tránh dư thừa thông tin | **Đã xử lý xong** (Tự động ẩn khi chuyển sang Checkout hoặc Theo dõi đơn) |
| 4 | Trải nghiệm mã VietQR | Hiển thị mã QR ngân hàng, STK, nội dung CK, copy pills, timeline tiến độ | Đã hoàn thiện |

**Kết luận**:
- [ ] Đã duyệt bản thiết kế UI khách hàng (Sẵn sàng triển khai mã nguồn T4–T9).
- [ ] Cần điều chỉnh thêm (Ghi chú chi tiết ở trên).

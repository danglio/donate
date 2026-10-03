# HƯỚNG DẪN KẾT NỐI TỰ ĐỘNG BẢNG VÀNG VỚI NGÂN HÀNG VIETCOMBANK (SEPAY)

Chào bạn, hệ thống trên trang web của bạn đã được tích hợp sẵn **Bộ Đồng Bộ Thời Gian Thực (Real-time Payment Engine)**. 

Khi hoàn thành 3 bước đơn giản dưới đây (hoàn toàn **miễn phí 100%**, không cần thuê máy chủ), mỗi khi có người chuyển khoản thật vào STK Vietcombank `1070685881`:
1. Tiền về sẽ tự động ghi 1 dòng vào Google Sheet của bạn (lưu vĩnh viễn tên người gửi, số tiền, lời nhắn).
2. Tên người đó sẽ tự động nhảy lên đầu **BẢNG VÀNG** trên trang web cho tất cả mọi người cùng thấy!
3. Nếu người đó đang mở màn hình quét mã QR trên web, hệ thống sẽ **tự động phát hiện ngay lập tức**, bắn pháo hoa ăn mừng và chúc mừng mà không cần người đó phải bấm nút gì cả!

---

## 🚀 BƯỚC 1: TẠO GOOGLE SHEET & LẤY LINK WEB APP (2 PHÚT)

1. Mở trình duyệt và truy cập: **[https://sheets.new](https://sheets.new)** để tạo một trang tính Google mới.
   - Đặt tên file là: `Lịch Sử Donate Đăng Lio`.
2. Trên thanh menu, bấm **Tiện ích mở rộng** (Extensions) ➔ Chọn **Apps Script**.
3. Xóa hết code mẫu `function myFunction() {}` đang có, rồi copy toàn bộ nội dung trong file **[`google_apps_script.js`](file:///Users/admin/Documents/18.DONATE/google_apps_script.js)** dán vào đó.
4. Bấm biểu tượng 💾 **Lưu** (hoặc nhấn `Ctrl + S` / `Cmd + S`).
5. Ở góc trên bên phải, bấm nút **Triển khai** (Deploy) ➔ Chọn **Tùy chọn triển khai mới** (New deployment):
   - Bấm vào icon **Bánh răng** (Select type) ➔ Chọn **Ứng dụng web** (Web app).
   - **Mô tả**: `Sepay Donate Bridge`
   - **Thực thi dưới dạng** (Execute as): `Tôi (Me)`
   - **Ai có quyền truy cập** (Who has access): `Bất kỳ ai (Anyone)`  *(⚠️ Bước này bắt buộc chọn Anyone để web và SePay gửi dữ liệu được)*.
6. Bấm nút **Triển khai** (Deploy):
   - Google sẽ hiện bảng yêu cầu cấp quyền: Bấm **Ủy quyền truy cập** (Authorize access) ➔ Chọn tài khoản Gmail của bạn ➔ Bấm **Nâng cao** (Advanced) ➔ Bấm **Đi tới (không an toàn)** ➔ Bấm **Cho phép** (Allow).
7. Copy đường link tại mục **URL ứng dụng web** (Link có dạng: `https://script.google.com/macros/s/AKfycb.../exec`).

---

## ⚡ BƯỚC 2: KẾT NỐI VỚI SEPAY.VN (MIỄN PHÍ)

1. Truy cập **[https://sepay.vn](https://sepay.vn)** và đăng ký 1 tài khoản miễn phí.
2. Vào mục **Ngân hàng** ➔ Chọn **Thêm tài khoản**:
   - Chọn ngân hàng: **Vietcombank (VCB)**.
   - Nhập số tài khoản của bạn: `1070685881`.
   - Kết nối theo hướng dẫn của SePay (cài app SePay trên điện thoại để đọc biến động số dư hoặc liên kết Vietcombank).
3. Vào mục **Tích hợp Webhook** (Webhooks) trên menu SePay ➔ Bấm **+ Thêm Webhook**:
   - **Tài khoản**: Chọn tài khoản Vietcombank `1070685881`.
   - **URL Webhook**: Dán đường link Google Web App bạn vừa copy ở Bước 1 vào đây.
   - **Kiểu xác thực**: Không xác thực (None).
   - Bấm **Lưu Webhook**.

---

## 🌐 BƯỚC 3: DÁN LINK VÀO FILE `index.html` VÀ ĐẨY LÊN GITHUB

Mở file `index.html`, tìm đến dòng cấu hình `CONFIG`:

```javascript
const CONFIG = {
  bankCode: "VCB",
  bankName: "Vietcombank (VCB)",
  accountNumber: "1070685881",
  accountHolder: "NGUYEN HOANG HAI DANG",
  prefix: "CUUDANG",
  ...
  // Dán link Web App của bạn vào đây:
  syncEndpoint: "https://script.google.com/macros/s/AKfycb.../exec", 
};
```

Lưu file lại, sau đó commit và push lên GitHub là xong!

---

## 🎯 CƠ CHẾ HOẠT ĐỘNG HOÀN HẢO

* **Chống gian lận / troll**: Chỉ khi tiền thật nổi vào tài khoản Vietcombank của bạn, SePay mới kích hoạt ghi nhận.
* **Thời gian nhận diện**: Khoảng **1 - 3 giây** sau khi chuyển khoản.
* **Tự quản lý dữ liệu**: Bạn có thể mở Google Sheet ra bất kỳ lúc nào để xem tổng số tiền đã nhận, chỉnh sửa lời nhắn hoặc xóa các tin không phù hợp.

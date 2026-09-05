# HỒ SƠ CẬP NHẬT CHỨC NĂNG & TRANG CHÍNH SÁCH BẢO MẬT
**Hệ thống:** Quản lý & Đặt hàng Trà sữa (Milktea Store)  
**Thời gian cập nhật:** 04/09/2026  
**Thư mục lưu trữ dự án:** `d:\Doan_cosohethongthongtin`

---

## 1. DÁNH SÁCH CÁC CẬP NHẬT MỚI VÀ TỆP NGUỒN (SOURCE FILES)

### 🛡️ 1.1. Trang Chính sách & Quyền riêng tư (`/privacy` & `/terms`)
- **Tệp giao diện JSX:** [`frontend/src/pages/PrivacyPolicy/PrivacyPolicy.jsx`](file:///d:/Doan_cosohethongthongtin/frontend/src/pages/PrivacyPolicy/PrivacyPolicy.jsx)
- **Tệp kiểu dáng CSS:** [`frontend/src/pages/PrivacyPolicy/PrivacyPolicy.css`](file:///d:/Doan_cosohethongthongtin/frontend/src/pages/PrivacyPolicy/PrivacyPolicy.css)
- **Đường dẫn Route trong App:** [`frontend/src/App.jsx`](file:///d:/Doan_cosohethongthongtin/frontend/src/App.jsx) (Routes: `/privacy` và `/terms`)
- **Nội dung bao gồm:**
  - Chính sách bảo vệ dữ liệu cá nhân & thanh toán an toàn.
  - Điều khoản sử dụng dịch vụ đặt hàng & giao hàng.
  - Quy định hủy đơn, đổi trả và hoàn tiền.
  - Cam kết không chia sẻ dữ liệu cho bên thứ ba.
- **Liên kết hiển thị:** Xuyên suốt tại Header ([`Navbar.jsx`](file:///d:/Doan_cosohethongthongtin/frontend/src/components/Navbar.jsx)), Footer ([`Footer.jsx`](file:///d:/Doan_cosohethongthongtin/frontend/src/components/Footer.jsx)), Banner Trang chủ ([`Home.jsx`](file:///d:/Doan_cosohethongthongtin/frontend/src/pages/Home/Home.jsx)), và Menu Mobile.

---

### 💳 1.2. Thanh toán Chuyển khoản VietQR (MBBank)
- **Tệp cấu hình ngân hàng:** [`frontend/src/config/bankConfig.js`](file:///d:/Doan_cosohethongthongtin/frontend/src/config/bankConfig.js)
  - **Ngân hàng:** MBBank (`MB`)
  - **Số tài khoản:** `7149701450334`
  - **Chủ tài khoản:** `NGUYEN TUYET NHI`
- **Tệp Modal & Thẻ VietQR:** [`frontend/src/components/QRPaymentModal.jsx`](file:///d:/Doan_cosohethongthongtin/frontend/src/components/QRPaymentModal.jsx) & [`QRPaymentModal.css`](file:///d:/Doan_cosohethongthongtin/frontend/src/components/QRPaymentModal.css)
- **Tệp Checkout tích hợp inline:** [`frontend/src/pages/Checkout/Checkout.jsx`](file:///d:/Doan_cosohethongthongtin/frontend/src/pages/Checkout/Checkout.jsx) & [`Checkout.css`](file:///d:/Doan_cosohethongthongtin/frontend/src/pages/Checkout/Checkout.css)
- **Tính năng nổi bật:**
  - Mã QR VietQR tạo tự động theo cú pháp VietQR chính thức.
  - Đếm ngược thời gian thực 10 phút.
  - Nút bấm xác nhận *"Tôi đã chuyển khoản thành công"* cập nhật trạng thái đơn thành `Paid` (Thanh toán thành công).

---

### 🔒 1.3. Phân quyền Đặt hàng & Tra cứu Đơn hàng (Auth Security Rule)
- **Tệp Tra cứu đơn hàng:** [`frontend/src/pages/OrderTracking/OrderTracking.jsx`](file:///d:/Doan_cosohethongthongtin/frontend/src/pages/OrderTracking/OrderTracking.jsx)
- **Quy tắc phân quyền:**
  - **Khách chưa đăng nhập (Guest):** Cho phép xem menu, thêm vào giỏ hàng và **đặt hàng tự do** (COD/QR).
  - **Yêu cầu đăng nhập:** Khách chưa đăng nhập khi truy cập `/tracking` sẽ bị chặn và hiển thị màn hình thông báo yêu cầu Đăng nhập mới được tra cứu lịch sử / trạng thái đơn hàng.

---

### 📦 1.4. Xử lý Backend & CSDL (Order API)
- **Model Đơn hàng:** [`backend/src/models/Order.js`](file:///d:/Doan_cosohethongthongtin/backend/src/models/Order.js) (Thêm `paymentMethod`, `paymentStatus`).
- **Controller Đơn hàng:** [`backend/src/controllers/orderController.js`](file:///d:/Doan_cosohethongthongtin/backend/src/controllers/orderController.js) (Hỗ trợ tra cứu thông minh theo 9 số cuối SĐT hoặc mã đơn, cập nhật trạng thái thanh toán `confirmPayment`).
- **Routes API:** [`backend/src/routes/orderRoutes.js`](file:///d:/Doan_cosohethongthongtin/backend/src/routes/orderRoutes.js)

---

### 🎨 1.5. Sửa lỗi Giao diện (UI Fixes)
- **Modal tùy chỉnh sản phẩm:** [`frontend/src/components/ProductCustomizeModal.jsx`](file:///d:/Doan_cosohethongthongtin/frontend/src/components/ProductCustomizeModal.jsx) & [`ProductCustomizeModal.css`](file:///d:/Doan_cosohethongthongtin/frontend/src/components/ProductCustomizeModal.css) (Khắc phục lỗi nén tiêu đề và nút bấm bị co đứng).

---

## 2. HƯỚNG DẪN CHẠY HỆ THỐNG (RUN COMMANDS)

### Chạy Backend (Port 5000):
```bash
cd d:\Doan_cosohethongthongtin\backend
npm run dev
```

### Chạy Frontend (Port 5173):
```bash
cd d:\Doan_cosohethongthongtin\frontend
npm run dev
```

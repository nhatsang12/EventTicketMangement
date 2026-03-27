> Nền tảng đặt vé sự kiện trực tuyến hàng đầu Việt Nam. Khám phá và sở hữu vé cho những khoảnh khắc đáng nhớ.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

---
## DEMO Event Ticket https://event-ticket-mangement-8s3y.vercel.app/
The first time the page loads may be a bit slow. Thank you for your understanding.
## Repositories

| Repo | Description | Link |
|---|---|---|
| **event-ticketing-ui** | React frontend (repo này) | ← you are here |
| **event-ticketing-server** | Node.js REST API + Database | [View Server Repo](https://github.com/nhatsang12/BEserverEventTicketingPlatform) |---


## Screenshots

### Trang chủ
<img width="1919" height="914" alt="Image" src="https://github.com/user-attachments/assets/62207435-dc05-4b78-a7ea-8748bd83048e" />

### Đăng nhập / Đăng ký
<img width="1920" height="1429" alt="Image" src="https://github.com/user-attachments/assets/f952850c-675f-4e54-9e39-44bb24c239c1" />
<img width="1920" height="1464" alt="Image" src="https://github.com/user-attachments/assets/27d7a7d5-ee92-47d8-a48b-262c403d1819" />

### Chi tiết sự kiện & Đặt vé
<img width="1920" height="2304" alt="Image" src="https://github.com/user-attachments/assets/d5eea28d-f9d4-441f-bdd7-c8eb3caca130" />
<img width="1920" height="2078" alt="Image" src="https://github.com/user-attachments/assets/ee21af8f-05c0-489c-a58f-125af802815b" />

### Trang cá nhân người dùng
<img width="1920" height="1533" alt="Image" src="https://github.com/user-attachments/assets/f84cfa3d-85a7-47ab-a86f-3a6edfd41b6a" />
<img width="1920" height="1799" alt="Image" src="https://github.com/user-attachments/assets/62dd5d21-d548-4b6d-98a5-6387a372b8c9" />
<img width="1920" height="1899" alt="Image" src="https://github.com/user-attachments/assets/f2bdd244-a22a-48dc-94c8-eecb6d2d0c67" />

###  Admin Panel
Admin Dashboard
<img width="1920" height="1039" alt="Image" src="https://github.com/user-attachments/assets/23613c29-fcc9-421e-a22c-9c0d06cb2a42" />
Admin Statistics<img width="1920" height="1312" alt="Image" src="https://github.com/user-attachments/assets/8248908f-0d4c-4b71-84b8-14492c365804" />
Admin Checkin<img width="1920" height="1009" alt="Image" src="https://github.com/user-attachments/assets/a3720087-178a-429a-9521-1ab4717b7e6b" />
Admin Ticket Types
<img width="1920" height="869" alt="Image" src="https://github.com/user-attachments/assets/f41b87a6-abad-4067-8658-87e1d8eb52ac" />
Admin Users<img width="1920" height="1229" alt="Image" src="https://github.com/user-attachments/assets/115d8b4b-3d66-4927-accc-49975ade17f5" />
Admin Event<img width="1920" height="1120" alt="Image" src="https://github.com/user-attachments/assets/312814e6-a605-454d-b08a-dc37a27fb82e" />
---

## Tính năng

### Trang chủ
- Hero banner với CTA nổi bật
- Danh sách sự kiện nổi bật & sự kiện đề xuất
- Lọc theo danh mục (Âm nhạc, Thể thao, Nghệ thuật...)
- Danh sách nhà tổ chức nổi tiếng
- Đánh giá từ khách hàng (testimonials)
- Địa điểm phổ biến theo thành phố

### Xác thực
- Đăng nhập / Đăng ký tài khoản
- Đăng nhập nhanh với Google, Facebook, Apple
- Bảo mật JWT token

### Sự kiện
- Tìm kiếm theo tên, nghệ sĩ, địa điểm
- Lọc theo thành phố (TP.HCM, Hà Nội...)
- Trang chi tiết: banner, mô tả, ngày giờ, địa điểm
- Chọn loại vé (VIP, Early Bird...) và số lượng

### Đặt vé & Thanh toán (3 bước)
- **Bước 1 — Thông tin:** Xem giỏ hàng, nhập thông tin người đặt
- **Bước 2 — Thanh toán:** Chọn phương thức:
  - 💳 Thẻ tín dụng — Visa, Mastercard qua **Stripe**
  - 🏦 Chuyển khoản / VietQR qua **PayOS**
  - 📱 Ví MoMo qua **PayOS**
- **Bước 3 — Hoàn tất:** Xác nhận đơn hàng, nhận E-Ticket

### Trang cá nhân
- Thống kê: Đơn hàng, Vé đã mua, Tổng chi tiêu
- Hệ thống hạng thành viên: Member → Silver → Gold (tích điểm qua mỗi vé)
- Chỉnh sửa thông tin cá nhân
- **Lịch sử vé:** Xem E-Ticket với ID và trạng thái (Active / Hết hạn)
- **QR Check-in:** Hiển thị mã QR để quét vào cổng sự kiện
- Tab Vé gần đây & Bảo mật tài khoản

### API Integration (Server Repo)
- Authentication với JWT (login / register / logout)
- Fetch danh sách events và chi tiết từ REST API
- Tạo và quản lý orders qua API
- Payment flow kết nối Stripe & PayOS
- Admin dashboard lấy dữ liệu KPI từ server

---

## Admin Panel

### Dashboard
- KPI cards: Tổng doanh thu, Đơn hàng, Vé đã bán, Sự kiện có doanh thu
- Biểu đồ doanh thu theo từng sự kiện
- Danh sách đơn hàng gần đây

### Thống kê & Phân tích
- Lọc dữ liệu theo: 7 ngày / 30 ngày / 90 ngày / Tất cả
- Biểu đồ doanh thu theo ngày
- Hiệu suất theo sự kiện: doanh thu, vé bán, tỷ lệ tham gia
- Xuất báo cáo **CSV**

### Quản lý sự kiện
- Tạo / Sửa / Xóa sự kiện
- Thông tin: tên, mô tả, ngày, địa điểm, banner

### Quản lý loại vé
- Tạo nhiều loại vé cho mỗi sự kiện (VIP, Early Bird, Standard...)
- Theo dõi: số lượng, đã bán, còn lại, trạng thái Bật/Tắt
- Lọc theo sự kiện, trạng thái, sắp xếp theo giá

### Check-in
- Quét mã QR hoặc nhập ID vé thủ công để xác minh
- Thống kê real-time: Tổng vé / Đã check-in / Chờ vào / Vé hết hạn
- Tiến độ tham gia theo %
- Lịch sử vào cổng & Danh sách điểm danh có thể xuất file

### Quản lý Users
- Danh sách tất cả users với phân quyền (Admin / User)
- Tìm kiếm theo tên, email, username
- Tạo user mới / Sửa / Xóa
- Thống kê: Tổng users, Admins, Users thường, Mới trong 7 ngày

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **React.js** | UI framework |
| **React Router** | Client-side routing & Protected Routes |
| **Tailwind CSS** | Styling & responsive layout |
| **Lucide React** | Icon library |
| **Stripe** | Thanh toán thẻ tín dụng |
| **PayOS** | Thanh toán VietQR & MoMo |

---

## Role-Based Access

| Role | Quyền truy cập |
|---|---|
| **Guest** | Xem trang chủ, chi tiết sự kiện |
| **User** | Đặt vé, thanh toán, xem lịch sử, QR check-in cá nhân |
| **Admin** | Toàn bộ + quản lý sự kiện, loại vé, users, dashboard, check-in |

Protected Routes tự động redirect người dùng chưa đăng nhập về trang login.

---

### Environment Variables

Tạo file `.env` tại thư mục gốc:

```env
VITE_API_URL=http://localhost:3000
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

---
## Tác giả

**Tiêu Nhật Sang**
- nhatsang58@gmail.com
- GitHub: [@nhatsang12](https://github.com/nhatsang12)

---



# TicketHub - Event Ticket Management Platform
## Link Demo
https://event-ticket-mangement-8s3y.vercel.app

Nền tảng quản lý và đặt vé sự kiện trực tuyến, gồm:
- **Frontend** cho người dùng đặt vé.
- **Admin Panel** cho vận hành sự kiện, loại vé, check-in và thống kê.

## 1) Demo & Repository
- Frontend demo: `https://event-ticket-mangement-8s3y.vercel.app/`
- Frontend repo (repo hiện tại): `event-ticketing-ui`
- Backend repo: `https://github.com/nhatsang12/BEserverEventTicketingPlatform`

## 2) Tính năng chính

### Người dùng (Frontend)
- Tìm kiếm và lọc sự kiện theo tên, giá, ngày, thành phố, danh mục.
- Xem chi tiết sự kiện: thời gian, địa điểm, mô tả, hạng vé.
- Chọn số lượng vé theo từng loại, tính tổng tiền realtime.
- Thêm sự kiện yêu thích.
- Quy trình đặt vé: giỏ hàng -> thanh toán -> lịch sử vé.
- Trang cá nhân và danh sách vé đã mua.

### Quản trị (Admin)
- Quản lý sự kiện: tạo/sửa/xóa, cập nhật lịch và trạng thái.
- Quản lý loại vé: tạo/sửa/xóa, bật/tắt, thêm số lượng.
- Quản lý người dùng.
- Check-in vé tại cổng.
- Dashboard/Analytics theo dữ liệu đơn hàng.

## 3) Điểm nổi bật về nghiệp vụ
- Không cho tạo sự kiện sát giờ: `start >= now + 2 hours`.
- Thời gian kết thúc bắt buộc **lớn hơn** thời gian bắt đầu.
- Khi chỉnh sửa loại vé trong admin, map theo `_id` để tránh nhầm dữ liệu khi sort/filter/paginate.
- Event Detail chỉ hiển thị đúng vé thuộc event hiện tại (lọc theo `eventId`, loại vé không hợp lệ bị loại bỏ).
- Trong Admin Tickets:
  - Vé không còn event gốc được nhận diện rõ.
  - Ẩn mặc định vé dữ liệu lỗi.
  - Có nút dọn dữ liệu lỗi nhanh.

## 4) Tech Stack
- **Frontend**: React 19, Vite, React Router, Zustand, Axios, Tailwind CSS, Lucide React, react-hot-toast.
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT, Stripe, PayOS (ở repo server).
- **Deploy**: Vercel (frontend), Render (backend), MongoDB Atlas.

## 5) Cấu trúc thư mục frontend
```text
src/
  components/
    layout/
  pages/
    admin/
    auth/
  store/
  config/
  main.jsx
  App.jsx
```

## 6) Chạy local

### 6.1 Frontend (repo này)
```bash
npm install
npx vite --port 3000
```

Build production:
```bash
npm run build
npm run preview
```

### 6.2 Backend
- Clone và chạy backend ở repo server.
- Đảm bảo backend chạy tại `http://localhost:8000` (hoặc set đúng `VITE_API_URL`).

## 7) Environment Variables

Tạo file `.env` tại root frontend:
```env
VITE_API_URL=http://localhost:8000
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

Lưu ý:
- Ở production, `VITE_API_URL` là **bắt buộc**.
- Nếu thiếu `VITE_API_URL` ở môi trường non-local, app sẽ throw error theo cấu hình `src/config/api.js`.

## 8) Scripts hiện có trong package.json
```bash
npm run build
npm run preview
npm run db:seed:test
npm run db:images:unsplash
```

Ghi chú:
- Script `dev` hiện trỏ backend (`nodemon server.js`) theo cấu hình hiện tại package.
- Để chạy frontend local trong repo này, dùng `npx vite --port 3000`.

## 9) Quy trình deploy đề xuất

### Frontend (Vercel)
1. Import repo frontend vào Vercel.
2. Set env `VITE_API_URL` trỏ tới backend production.
3. Deploy.

### Backend (Render)
1. Set biến môi trường backend (Mongo URI, JWT, Stripe, PayOS, Cloudinary...).
2. Cấu hình CORS cho domain Vercel.
3. Deploy lại service sau khi đổi env.

### Database (MongoDB Atlas)
- Dùng `mongodump`/`mongorestore` để migrate dữ liệu từ local lên Atlas khi cần.

## 10) Checklist demo nhanh cho giảng viên
1. Admin tạo sự kiện mới + tạo loại vé.
2. Demo validation:
   - Start time phải cách hiện tại >= 2 giờ.
   - End time phải lớn hơn start time.
3. User tìm sự kiện qua filter/search.
4. User vào detail, chọn vé, checkout thành công.
5. User xem vé ở lịch sử.
6. Admin check-in và xem analytics cập nhật.

## 11) Tác giả
- **Tiêu Nhật Sang**
- Email: `nhatsang58@gmail.com`
- GitHub: `https://github.com/nhatsang12`


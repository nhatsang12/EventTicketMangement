# Tổng Hợp Các Thay Đổi Đã Làm (Frontend + Backend)

Ngày cập nhật: 24/03/2026

## 1) Vấn đề ban đầu

- Admin tạo 100 vé nhưng trang Event Ticket hiển thị còn 0 / hết vé.
- Gọi API thanh toán Stripe bị `400 Bad Request` ở `/api/payments/create-checkout-session`.
- Sau khi thanh toán MoMo/PayOS có trạng thái chờ xác nhận, chưa muốn giữ trạng thái này.
- Muốn tự hoàn vé cho các case:
  - Bấm đặt vé nhưng không thanh toán.
  - Vào cổng thanh toán rồi bấm hủy/quay lại web.
  - Thanh toán bị treo quá thời gian.

---

## 2) Những gì đã sửa ở Frontend

Project: `D:\TicketUi\EventTicketMangement`

### 2.1 Đồng bộ số lượng vé hiển thị đúng

- Chuẩn hóa cách đọc `quantity/sold/remaining` để tránh lệch dữ liệu.
- Khi tạo/sửa loại vé ở admin, gửi và cập nhật `remaining` nhất quán.
- Trang chi tiết sự kiện clamp số lượng vé theo `remaining` thực tế.

File chính:
- `src/pages/admin/AdminTickets.jsx`
- `src/pages/EventDetailPage.jsx`

### 2.2 Giảm lỗi 400 khi tạo phiên thanh toán Stripe/PayOS

- Thêm logic fallback payload/key khi gọi `create-checkout-session`.
- Chuẩn hóa cách lấy `orderId` từ nhiều dạng response.
- Chuẩn hóa cách lấy URL thanh toán từ response.
- Cải thiện parse lỗi API để hiển thị nguyên nhân rõ hơn.
- Bổ sung xử lý để backend trả message chi tiết hơn khi gặp lỗi 500 ở Stripe/PayOS.

File:
- `src/pages/CheckoutPage.jsx`

### 2.3 Bỏ trạng thái “chờ xác nhận” không cần thiết sau khi trả tiền

- Nếu callback thanh toán cho thấy thành công (`PAID` / code thành công), UI hiển thị đã thanh toán ngay.
- Trong lịch sử vé, nếu có vé được tạo thì ưu tiên hiển thị paid thay vì pending.

File:
- `src/pages/PaymentSuccessPage.jsx`
- `src/pages/TicketHistoryPage.jsx`

### 2.4 Worker dọn đơn pending ở frontend

- Tạo cơ chế local tracking đơn pending.
- Chạy cleanup định kỳ gọi API cancel order.
- Chính sách:
  - 30 giây cho case đặt vé rồi bỏ.
  - 15 phút cho case treo thanh toán.

File:
- `src/utils/pendingOrderTimeout.js`
- `src/hooks/usePendingOrderCleanup.js`
- `src/components/layout/Layout.jsx` (gắn hook chạy nền)
- `src/pages/CheckoutPage.jsx` (track/clear pending order)
- `src/pages/PaymentSuccessPage.jsx` (clear tracking khi thành công)

Lưu ý: frontend chỉ hỗ trợ “gọi hủy”, muốn chắc chắn hoàn vé cần backend có endpoint + job server.

### 2.5 Fallback khi user quay lại trang thất bại thanh toán

- Trang `payment-fail` đọc `order_id` từ query.
- Gọi backend `POST /api/payments/mark-cancelled` để ghi nhận user đã hủy ở cổng thanh toán.
- Hiển thị countdown 30 giây để user biết vé sẽ hoàn lại.

File:
- `src/pages/PaymentFail.jsx`

---

## 3) Những gì đã sửa ở Backend

Project: `D:\ServerTicket\BEserverEventTicketingPlatform`

### 3.1 Bổ sung metadata trạng thái thanh toán

- Thêm field `paymentInitiatedAt` vào `Order` để phân biệt:
  - Chưa vào cổng thanh toán (dùng mốc 30 giây).
  - Đã vào cổng thanh toán nhưng bị treo (dùng mốc 15 phút).
- Thêm field `paymentCancelledAt` để đánh dấu user đã hủy ở cổng thanh toán, dùng mốc 30 giây để hoàn vé.

File:
- `src/models/Order.js`

### 3.2 Bổ sung API hủy đơn pending để frontend gọi được

- Thêm route:
  - `POST /api/orders/cancel`
  - `POST /api/orders/:orderId/cancel`
- Có kiểm tra quyền: owner của order hoặc admin mới hủy được.

File:
- `src/routes/orderRoutes.js`
- `src/controllers/orderController.js` (`cancelPendingOrder`)

### 3.3 Làm an toàn trạng thái thanh toán để tránh race condition

- `fulfillOrder` chỉ cho phép chạy khi order còn `pending`.
- Nếu order đã `cancelled` thì không cho phát vé lại.
- `cancelOrder` xử lý idempotent theo `findOneAndUpdate` trạng thái pending -> cancelled trước, rồi mới trả vé.

File:
- `src/controllers/orderController.js`

### 3.4 Gắn mốc `paymentInitiatedAt` khi tạo link thanh toán

- Trong Stripe `createCheckoutSession`: kiểm tra order đang pending, set `paymentInitiatedAt`.
- Trong PayOS `createPayOSLink`: kiểm tra order đang pending, set `paymentInitiatedAt`.
- Khi tạo link thanh toán mới, reset `paymentCancelledAt` về `null` để tránh hủy nhầm ở lần retry.
- Truyền reason rõ ràng khi webhook hủy (`stripe_session_expired`, `payos_payment_failed`).
- Chuẩn hóa URL callback:
  - `success_url`/`returnUrl` luôn dùng `CLIENT_URL` đã normalize.
  - `cancel_url`/`cancelUrl` build từ domain request thực tế, tránh lỗi env thiếu gây `500`.
- Thêm check sớm:
  - Thiếu `orderId` -> trả `400`.
  - Thiếu `STRIPE_SECRET_KEY` -> trả `500` với message rõ ràng.
  - `totalAmount` không hợp lệ -> trả `400`.
- `cancel_url` của Stripe/PayOS trỏ về backend:
  - `GET /api/payments/cancel-return?order_id=...`
- Endpoint này sẽ:
  - Ghi nhận `paymentCancelledAt`.
  - Redirect user về `CLIENT_URL/payment-fail?...`.
- Thêm endpoint fallback:
  - `POST /api/payments/mark-cancelled`
  - Dùng khi user đã về `payment-fail` và cần xác nhận hủy lại lần nữa.

File:
- `src/controllers/paymentController.js`
- `src/routes/paymentRoutes.js`
- `src/models/Order.js`

### 3.5 Job server tự động hoàn vé

- Thêm worker chạy mỗi 10 giây:
  - Đơn pending chưa bắt đầu thanh toán quá 30 giây -> cancel.
  - Đơn pending đã hủy ở cổng thanh toán (`paymentCancelledAt`) quá 30 giây -> cancel.
  - Đơn pending treo trong cổng thanh toán quá 15 phút (không có tín hiệu hủy) -> cancel.
- Job chạy ở backend nên vẫn hoạt động kể cả user đóng tab/app.

File:
- `cronJobs.js`

---

## 4) Luồng mới sau khi sửa

1. User bấm đặt vé -> hệ thống lock số vé và tạo order `pending`.
2. Nếu user không đi thanh toán:
   - Sau ~30 giây backend tự cancel order -> trả vé về `remaining`.
3. Nếu user vào cổng thanh toán rồi bấm hủy/quay lại:
   - Backend ghi nhận `paymentCancelledAt` và sau ~30 giây tự cancel order -> trả vé.
4. Nếu user đã vào cổng thanh toán nhưng treo (không quay lại):
   - Sau ~15 phút backend tự cancel order -> trả vé.
5. Nếu thanh toán thành công:
   - Webhook/verify gọi `fulfillOrder`, tạo vé thật, chuyển `paid`.
6. Nếu phiên thanh toán hết hạn hoặc thất bại:
   - Webhook gọi cancel và trả vé ngay.

---

## 5) Việc cần làm để áp dụng trên môi trường thật

1. Deploy/restart backend mới ở Render (hoặc server chạy thật).
2. Deploy frontend bản đã sửa.
3. Set biến môi trường backend nếu chưa có:
   - `SERVER_URL=https://<domain-backend>`
   - `CLIENT_URL=https://<domain-frontend>`
4. Test 4 case:
   - Đặt vé xong dừng ở checkout > 30 giây.
   - Vào cổng thanh toán, bấm hủy/quay lại web, chờ ~30 giây.
   - Vào cổng thanh toán rồi treo > 15 phút.
   - Thanh toán thành công (kiểm tra order paid + vé được tạo).

---

## 6) Ghi chú

- Nếu vẫn thấy “chưa hoàn vé”, nguyên nhân thường là backend cũ chưa deploy hoặc instance chưa restart.
- Cần theo dõi log backend với các dòng:
  - `[CLEANUP] ...`
  - `Order ... cancelled (...)`
  để xác nhận job dọn pending đang chạy.
- Build frontend hiện có warning cũ ở `ForgotPasswordPage.jsx` không thuộc phần logic timeout/hoàn vé.

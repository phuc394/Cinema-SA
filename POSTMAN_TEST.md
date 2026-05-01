# 📮 Postman Test Guide - Cinema-SA

Hướng dẫn chi tiết để test hệ thống Cinema-SA bằng Postman

---

## 📋 Mục Lục

1. [Khởi Động Server](#phần-1-khởi-động-server)
2. [Flow Chính](#phần-2-flow-chính)
3. [Test Error](#phần-3-test-error)

---

# PHẦN 1: KHỞI ĐỘNG SERVER

## 1.1 Yêu Cầu

- Docker & Docker Compose được cài đặt
- Port 8080, 5000, 5001, 5002, 3306 trống (hoặc có thể thay đổi)

## 1.2 Khởi Động Hệ Thống

### Bước 1: Mở Terminal và chuyển đến thư mục project
```bash
cd d:\University\SoftwareArchitecture\Cinema-SA
```

### Bước 2: Khởi động tất cả services qua Docker Compose
```bash
docker compose -f microservices/docker-compose.yml up --build
```

### Bước 3: Chờ tất cả services khởi động thành công

Bạn sẽ thấy output tương tự:
```
✓ auth_service is running
✓ cinema_service is running
✓ order_service is running
✓ mysql is running
✓ api_gateway is running
```

### Bước 4: Kiểm tra services đang chạy

**Verify API Gateway Health**
```
GET http://localhost:8080/health
```

**Expected Response (HTTP 200)**:
```json
{
  "status": "ok",
  "services": {
    "auth": "http://localhost:5000",
    "cinema": "http://localhost:5001",
    "order": "http://localhost:5002"
  }
}
```

## 1.3 Dừng Services

```bash
docker compose -f microservices/docker-compose.yml down
```

---

# PHẦN 2: FLOW CHÍNH

## 2.1 Tổng Quan Flow

```
1. Xem danh sách phim (Public - không cần login)
   ↓
2. Xem chi tiết phim (Public - không cần login)
   ↓
3. Xem giờ chiếu (Public - không cần login)
   ↓
4. Đăng ký tài khoản (Public)
   ↓
5. Đăng nhập (Public)
   ↓
6. Lấy token (từ đăng nhập)
   ↓
7. Xem bản đồ ghế (Protected - cần token)
   ↓
8. Đặt vé (Protected - cần token)
   ↓
9. Xem lịch sử đặt vé (Protected - cần token)
   ↓
10. Hiển thị thành công & về menu
```

---

## 2.2 Bước 1: Xem Danh Sách Phim (Public - Không Đăng Nhập)

### Request
```
Method: GET
URL: http://localhost:8080/cinema/api/movies
Headers: None needed
```

### Postman Setup
1. Tạo request mới: `New → Request`
2. Name: `1. Get All Movies`
3. Method: `GET`
4. URL: `http://localhost:8080/cinema/api/movies`
5. Click `Send`

### Expected Response (HTTP 200)
```json
{
  "error": false,
  "movies": [
    {
      "id": 1,
      "title": "Avatar",
      "genre": "Sci-Fi",
      "poster_url": "...",
      "duration": 162,
      "release_date": "2022-12-16",
      "status": "now_showing"
    },
    {
      "id": 2,
      "title": "The Avengers",
      "genre": "Action",
      "poster_url": "...",
      "duration": 143,
      "release_date": "2012-05-04",
      "status": "now_showing"
    }
  ]
}
```

### Notes
- ✅ Không cần authentication
- ✅ Danh sách phim được trả về
- 💾 Ghi nhớ `movie_id` (ví dụ: 1) để dùng ở bước tiếp theo

---

## 2.3 Bước 2: Xem Chi Tiết Phim (Public)

### Request
```
Method: GET
URL: http://localhost:8080/cinema/api/movies/1
(Thay 1 bằng movie_id từ bước 1)
```

### Postman Setup
1. Tạo request mới: `New → Request`
2. Name: `2. Get Movie Details`
3. Method: `GET`
4. URL: `http://localhost:8080/cinema/api/movies/1`
5. Click `Send`

### Expected Response (HTTP 200)
```json
{
  "error": false,
  "movie": {
    "id": 1,
    "title": "Avatar",
    "genre": "Sci-Fi",
    "description": "A paraplegic Marine...",
    "poster_url": "...",
    "duration": 162,
    "release_date": "2022-12-16",
    "status": "now_showing"
  }
}
```

### Notes
- ✅ Chi tiết phim đầy đủ
- 💾 Ghi nhớ `movie_id` cho bước tiếp theo

---

## 2.4 Bước 3: Xem Giờ Chiếu (Public)

### Request
```
Method: GET
URL: http://localhost:8080/cinema/api/movies/1/showtimes?date=2025-01-15
(Thay 1 bằng movie_id, thay date nếu cần)
```

### Postman Setup
1. Tạo request mới: `New → Request`
2. Name: `3. Get Showtimes`
3. Method: `GET`
4. URL: `http://localhost:8080/cinema/api/movies/1/showtimes?date=2025-01-15`
5. Click `Send`

### Expected Response (HTTP 200)
```json
{
  "error": false,
  "showtimes": [
    {
      "showtime_id": 1,
      "movie_id": 1,
      "room_id": 1,
      "show_date": "2025-01-15",
      "start_time": "19:00:00",
      "end_time": "21:00:00"
    },
    {
      "showtime_id": 2,
      "movie_id": 1,
      "room_id": 2,
      "show_date": "2025-01-15",
      "start_time": "21:30:00",
      "end_time": "23:30:00"
    }
  ]
}
```

### Notes
- ✅ Danh sách giờ chiếu
- 💾 Ghi nhớ `showtime_id` (ví dụ: 1) cho bước xem ghế

---

## 2.5 Bước 4: Đăng Ký Tài Khoản (Public)

### Request
```
Method: POST
URL: http://localhost:8080/auth/api/auth/register
Content-Type: application/json

Body:
{
  "email": "user1@test.com",
  "password": "password123",
  "full_name": "John Doe",
  "phone_number": "01234567890"
}
```

### Postman Setup
1. Tạo request mới: `New → Request`
2. Name: `4. Register User`
3. Method: `POST`
4. URL: `http://localhost:8080/auth/api/auth/register`
5. Tab `Headers`: Thêm `Content-Type: application/json`
6. Tab `Body`: Chọn `raw` → `JSON`
7. Nhập body:
```json
{
  "email": "user1@test.com",
  "password": "password123",
  "full_name": "John Doe",
  "phone_number": "01234567890"
}
```
8. Click `Send`

### Expected Response (HTTP 201)
```json
{
  "error": false,
  "message": "User registered successfully",
  "user": {
    "user_id": 1,
    "email": "user1@test.com",
    "full_name": "John Doe",
    "phone_number": "01234567890",
    "created_at": "2025-01-15T10:30:00"
  }
}
```

### Validation Rules
- ✅ Email phải có ký tự `@`
- ✅ Password phải ≥ 6 ký tự + ≥ 1 số
- ✅ Phone phải 10 hoặc 11 chữ số
- ✅ Email không được trùng lặp

### Notes
- 💾 Ghi nhớ email & password cho bước đăng nhập
- ⚠️ Nếu email đã tồn tại, sẽ được lỗi (thử email khác hoặc skip bước này)

---

## 2.6 Bước 5: Đăng Nhập (Public)

### Request
```
Method: POST
URL: http://localhost:8080/auth/api/auth/login
Content-Type: application/json

Body:
{
  "email": "user1@test.com",
  "password": "password123"
}
```

### Postman Setup
1. Tạo request mới: `New → Request`
2. Name: `5. Login User`
3. Method: `POST`
4. URL: `http://localhost:8080/auth/api/auth/login`
5. Tab `Headers`: Thêm `Content-Type: application/json`
6. Tab `Body`: Chọn `raw` → `JSON`
7. Nhập body:
```json
{
  "email": "user1@test.com",
  "password": "password123"
}
```
8. Click `Send`

### Expected Response (HTTP 200)
```json
{
  "error": false,
  "message": "Login successful",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...(token dài)",
  "role": "USER",
  "user": {
    "user_id": 1,
    "email": "user1@test.com",
    "full_name": "John Doe",
    "phone_number": "01234567890"
  }
}
```

### Important ⚠️
- 💾 **GHI NHỚ TOKEN**: Copy toàn bộ giá trị từ `token` field
- Token này dùng cho tất cả các request tiếp theo (Protected)
- Token hết hạn sau 24 giờ

### Save Token to Postman Variable
Để dễ dàng sử dụng token ở các request tiếp theo:

1. Vào Tab `Tests`
2. Thêm code:
```javascript
var jsonData = pm.response.json();
pm.environment.set("auth_token", jsonData.token);
```
3. Postman sẽ tự động lưu token vào biến `auth_token`
4. Dùng `{{auth_token}}` trong request tiếp theo

---

## 2.7 Bước 6: Xem Bản Đồ Ghế (Protected - Cần Token)

### Request
```
Method: GET
URL: http://localhost:8080/cinema/api/showtimes/1/seats
(Thay 1 bằng showtime_id từ bước 3)

Headers:
Authorization: Bearer <TOKEN>
(Thay <TOKEN> bằng token từ bước đăng nhập)
```

### Postman Setup
1. Tạo request mới: `New → Request`
2. Name: `6. Get Seat Map`
3. Method: `GET`
4. URL: `http://localhost:8080/cinema/api/showtimes/1/seats`
5. Tab `Headers`: Thêm:
   - Key: `Authorization`
   - Value: `Bearer {{auth_token}}` (hoặc paste token từ bước 5)
6. Click `Send`

### Expected Response (HTTP 200)
```json
{
  "error": false,
  "showtime_id": 1,
  "movie_id": 1,
  "room": "Room A",
  "show_date": "2025-01-15",
  "start_time": "19:00:00",
  "end_time": "21:00:00",
  "seats": [
    {
      "seat_id": 1,
      "code": "A1",
      "row": "A",
      "column": 1,
      "type": "STANDARD",
      "price": 75000,
      "is_available": true
    },
    {
      "seat_id": 2,
      "code": "A2",
      "row": "A",
      "column": 2,
      "type": "STANDARD",
      "price": 75000,
      "is_available": true
    },
    {
      "seat_id": 3,
      "code": "A3",
      "row": "A",
      "column": 3,
      "type": "STANDARD",
      "price": 75000,
      "is_available": false
    },
    // ... more seats
    {
      "seat_id": 80,
      "code": "H8",
      "row": "H",
      "column": 8,
      "type": "VIP",
      "price": 90000,
      "is_available": true
    }
  ]
}
```

### Important Notes
- ✅ Yêu cầu token hợp lệ trong header `Authorization`
- ✅ Ghế với `is_available: true` có thể được đặt
- ✅ Ghế với `is_available: false` đã bị người khác booking hoặc bị khoá (5 phút)
- 💾 Ghi nhớ `seat_code` (ví dụ: A1, A2) mà bạn muốn đặt
- 🔒 **NEW**: Ghế chỉ được khoá khi thực sự đặt vé, không phải khi xem bản đồ ghế
- ⏰ Ghế được tự động giải khoá sau 5 phút nếu không hoàn thành đặt vé


## 2.8 Bước 7: Đặt Vé (Protected - Cần Token)

### Request
```
Method: POST
URL: http://localhost:8080/order/bookings
Content-Type: application/json

Headers:
Authorization: Bearer <TOKEN>

Body:
{
  "showtime_id": 1,
  "seat_codes": ["A1", "A2"]
}
```

### Postman Setup
1. Tạo request mới: `New → Request`
2. Name: `7. Create Booking`
3. Method: `POST`
4. URL: `http://localhost:8080/order/bookings`
5. Tab `Headers`: Thêm:
   - Key: `Authorization`
   - Value: `Bearer {{auth_token}}`
   - Key: `Content-Type`
   - Value: `application/json`
6. Tab `Body`: Chọn `raw` → `JSON`
7. Nhập body:
```json
{
  "showtime_id": 1,
  "seat_codes": ["A1", "A2"]
}
```
8. Click `Send`

### Expected Response (HTTP 201)
```json
{
  "error": false,
  "message": "Booking created successfully",
  "booking": {
    "booking_id": 1,
    "status": 1,
    "user_id": 1,
    "showtime_id": 1,
    "total_amount": 150000
  }
}
```

### Status Breakdown
- `status: 1` = Đặt vé thành công, không cần payment
- `total_amount` = Giá tiền tổng cộng (seat1_price + seat2_price + ...)
- **Ví dụ**: 2 ghế STANDARD = 75000 + 75000 = 150000

### Validation Rules
- ✅ Phải cung cấp `showtime_id`
- ✅ Phải cung cấp ít nhất 1 ghế trong `seat_codes`
- ✅ Ghế phải tồn tại & hợp lệ
- ✅ Ghế không được đặt lại (không được có booking trước)
- ✅ Ghế không được bị khoá bởi người khác (hoặc hết hạn khoá)
- ✅ Token phải hợp lệ
- 🔒 **NEW**: Hệ thống sẽ tự động khoá ghế khi bạn đặt vé
- ⏰ **NEW**: Ghế được giải khoá tự động nếu đặt vé thất bại

### Notes
- ✅ **THÀNH CÔNG!** - Booking đã được tạo
- ✅ Status = 1 (Confirmed, không cần payment)
- 💾 Ghi nhớ `booking_id` nếu muốn xem chi tiết sau
- 🏠 **Frontend**: Hiển thị "Đặt vé thành công!" → Redirect về trang chủ

---

## 2.9 Bước 8: Xem Lịch Sử Đặt Vé (Protected - Cần Token)

### Request
```
Method: GET
URL: http://localhost:8080/order/bookings/history

Headers:
Authorization: Bearer <TOKEN>
```

### Postman Setup
1. Tạo request mới: `New → Request`
2. Name: `8. Get Booking History`
3. Method: `GET`
4. URL: `http://localhost:8080/order/bookings/history`
5. Tab `Headers`: Thêm:
   - Key: `Authorization`
   - Value: `Bearer {{auth_token}}`
6. Click `Send`

### Expected Response (HTTP 200)
```json
{
  "error": false,
  "bookings": [
    {
      "booking_id": 1,
      "showtime_id": 1,
      "total_amount": 150000,
      "status": 1,
      "created_at": "2025-01-15T10:45:30"
    },
    {
      "booking_id": 2,
      "showtime_id": 2,
      "total_amount": 75000,
      "status": 1,
      "created_at": "2025-01-16T14:20:15"
    }
  ]
}
```

### Notes
- ✅ Lịch sử được sắp xếp theo thứ tự mới nhất trước (`booking_id DESC`)
- ✅ Chỉ hiển thị booking của user đang đăng nhập
- ✅ `status: 1` = Đặt vé thành công
- ✅ `created_at` = Thời gian tạo booking
- 🎯 Frontend có thể dùng để hiển thị trong "Lịch sử đặt vé" của user

### Flow Tóm Tắt
```
Xem phim (public) → Xem giờ chiếu (public) 
  → Đăng nhập/Đăng ký 
  → Xem ghế (có token) 
  → Đặt vé (có token, status=1) 
  → Xem lịch sử (có token)
```

---

## 2.10 Bước 9: Seat Locking Endpoints (Advanced - Optional)

**Note**: These endpoints are automatically called by the booking service, but can be used manually for testing.

### 2.10.1 Lock Specific Seats

### Request
```
Method: POST
URL: http://localhost:8080/cinema/showtimes/{showtime_id}/seats/lock
Content-Type: application/json

Headers:
Authorization: Bearer <TOKEN>

Body:
{
  "seat_codes": ["A1", "A2"]
}
```

### Expected Response (HTTP 200)
```json
{
  "error": false,
  "message": "Seats locked successfully"
}
```

### Error Response (HTTP 400)
```json
{
  "error": true,
  "message": "Seat A1 is locked by another user"
}
```

### 2.10.2 Release Seat Locks

### Request
```
Method: POST
URL: http://localhost:8080/cinema/showtimes/{showtime_id}/seats/release
Content-Type: application/json

Headers:
Authorization: Bearer <TOKEN>

Body:
{
  "seat_codes": ["A1", "A2"]
}
```

### Expected Response (HTTP 200)
```json
{
  "error": false,
  "message": "Seats released successfully"
}
```

---

# PHẦN 3: TEST ERROR

## 3.1 Tổng Quan Error Cases

Các tình huống lỗi để kiểm tra:
1. Xem ghế mà không đăng nhập
2. Đặt vé mà không đăng nhập
3. Token hết hạn/không hợp lệ
4. Booking ghế đã bị đặt
5. Email trùng lặp khi đăng ký
6. Password yếu (< 6 ký tự)
7. Email không hợp lệ (không có @)
8. Phone không hợp lệ (không 10-11 chữ số)
9. Tên phim không tồn tại
10. Ghế không tồn tại

---

## 3.2 Error Case 1: Xem Ghế Mà Không Đăng Nhập ❌

### Request
```
Method: GET
URL: http://localhost:8080/cinema/api/showtimes/1/seats

Headers: (EMPTY - Không có token)
```

### Postman Setup
1. Tạo request mới: `New → Request`
2. Name: `ERROR 1. Get Seats Without Login`
3. Method: `GET`
4. URL: `http://localhost:8080/cinema/api/showtimes/1/seats`
5. **Không thêm Header Authorization** ← Important!
6. Click `Send`

### Expected Response (HTTP 401)
```json
{
  "message": "Token is missing"
}
```

### ✅ Verification
- ❌ Status code = 401 Unauthorized
- ✅ Không thể xem ghế mà không đăng nhập

### Notes
- ✅ Hệ thống đúng cách yêu cầu authentication
- ✅ Bảo vệ dữ liệu ghế (pricing, availability)

---

## 3.3 Error Case 2: Đặt Vé Mà Không Đăng Nhập ❌

### Request
```
Method: POST
URL: http://localhost:8080/bookings
Content-Type: application/json

Headers: (EMPTY - Không có token)

Body:
{
  "showtime_id": 1,
  "seat_codes": ["A1"]
}
```

### Postman Setup
1. Tạo request mới: `New → Request`
2. Name: `ERROR 2. Book Seats Without Login`
3. Method: `POST`
4. URL: `http://localhost:8080/bookings`
5. Tab `Headers`: Chỉ thêm `Content-Type: application/json` (KHÔNG có Authorization)
6. Tab `Body`: 
```json
{
  "showtime_id": 1,
  "seat_codes": ["A1"]
}
```
7. Click `Send`

### Expected Response (HTTP 401)
```json
{
  "message": "Token is missing"
}
```

### ✅ Verification
- ❌ Status code = 401 Unauthorized
- ✅ Không thể đặt vé mà không đăng nhập
- ✅ Bảo vệ booking (chỉ user đã xác thực mới có thể đặt)

### Notes
- ✅ Hệ thống bắt buộc authentication trước booking
- ✅ Không bao giờ có anonymous booking

---

## 3.4 Error Case 3: Token Không Hợp Lệ ❌

### Request
```
Method: GET
URL: http://localhost:8080/cinema/api/showtimes/1/seats

Headers:
Authorization: Bearer invalid_token_here
```

### Postman Setup
1. Tạo request mới: `New → Request`
2. Name: `ERROR 3. Invalid Token`
3. Method: `GET`
4. URL: `http://localhost:8080/cinema/api/showtimes/1/seats`
5. Tab `Headers`: Thêm:
   - Key: `Authorization`
   - Value: `Bearer invalid_token_here` (hoặc bất kỳ string ngẫu nhiên)
6. Click `Send`

### Expected Response (HTTP 401)
```json
{
  "message": "Invalid token"
}
```

### ✅ Verification
- ❌ Status code = 401 Unauthorized
- ✅ Token không hợp lệ bị reject

---

## 3.5 Error Case 4: Email Trùng Lặp Khi Đăng Ký ❌

### Setup
Thực hiện bước 4 (Register) 2 lần với cùng email

### Request
```
Method: POST
URL: http://localhost:8080/auth/api/auth/register
Content-Type: application/json

Body (first time):
{
  "email": "duplicate@test.com",
  "password": "password123",
  "full_name": "Test User",
  "phone_number": "01234567890"
}

Body (second time - same email):
{
  "email": "duplicate@test.com",
  "password": "password123",
  "full_name": "Another User",
  "phone_number": "09876543210"
}
```

### Postman Setup - Register Lần 1
1. Name: `ERROR 4a. Register - First Time`
2. Method: `POST`
3. URL: `http://localhost:8080/auth/api/auth/register`
4. Body:
```json
{
  "email": "duplicate@test.com",
  "password": "password123",
  "full_name": "Test User",
  "phone_number": "01234567890"
}
```
5. Click `Send` → ✅ HTTP 201 Created

### Postman Setup - Register Lần 2 (Duplicate)
1. Name: `ERROR 4b. Register - Duplicate Email`
2. Method: `POST`
3. URL: `http://localhost:8080/auth/api/auth/register`
4. Body:
```json
{
  "email": "duplicate@test.com",
  "password": "password123",
  "full_name": "Another User",
  "phone_number": "09876543210"
}
```
5. Click `Send`

### Expected Response (HTTP 400)
```json
{
  "error": true,
  "message": "Email already exists"
}
```

### ✅ Verification
- ❌ Status code = 400 Bad Request
- ✅ Email trùng bị reject
- ✅ Bảo vệ dữ liệu user (unique email)

---

## 3.6 Error Case 5: Password Yếu (< 6 ký tự) ❌

### Request
```
Method: POST
URL: http://localhost:8080/auth/api/auth/register
Content-Type: application/json

Body:
{
  "email": "weakpass@test.com",
  "password": "abc",
  "full_name": "Test User",
  "phone_number": "01234567890"
}
```

### Postman Setup
1. Name: `ERROR 5. Weak Password`
2. Method: `POST`
3. URL: `http://localhost:8080/auth/api/auth/register`
4. Body:
```json
{
  "email": "weakpass@test.com",
  "password": "abc",
  "full_name": "Test User",
  "phone_number": "01234567890"
}
```
5. Click `Send`

### Expected Response (HTTP 400)
```json
{
  "error": true,
  "message": "Password must be at least 6 characters"
}
```

### ✅ Verification
- ❌ Status code = 400 Bad Request
- ✅ Password ngắn (< 6 ký tự) bị reject

### Password Rules
- ✅ Phải ≥ 6 ký tự
- ✅ Phải chứa ≥ 1 chữ số

### Test Scenarios
- `"abc"` → ❌ Quá ngắn + không có số
- `"abcdef"` → ❌ Không có số
- `"abc123"` → ✅ OK (6 ký tự + có số)
- `"password1"` → ✅ OK (9 ký tự + có số)

---

## 3.7 Error Case 6: Password Không Có Số ❌

### Request
```
Method: POST
URL: http://localhost:8080/auth/api/auth/register
Content-Type: application/json

Body:
{
  "email": "nodigit@test.com",
  "password": "abcdef",
  "full_name": "Test User",
  "phone_number": "01234567890"
}
```

### Postman Setup
1. Name: `ERROR 6. Password No Digit`
2. Method: `POST`
3. URL: `http://localhost:8080/auth/api/auth/register`
4. Body:
```json
{
  "email": "nodigit@test.com",
  "password": "abcdef",
  "full_name": "Test User",
  "phone_number": "01234567890"
}
```
5. Click `Send`

### Expected Response (HTTP 400)
```json
{
  "error": true,
  "message": "Password must contain at least one number"
}
```

### ✅ Verification
- ❌ Status code = 400 Bad Request
- ✅ Password không có số bị reject

---

## 3.8 Error Case 7: Email Không Hợp Lệ (Không Có @) ❌

### Request
```
Method: POST
URL: http://localhost:8080/auth/api/auth/register
Content-Type: application/json

Body:
{
  "email": "invalidemail",
  "password": "password123",
  "full_name": "Test User",
  "phone_number": "01234567890"
}
```

### Postman Setup
1. Name: `ERROR 7. Invalid Email Format`
2. Method: `POST`
3. URL: `http://localhost:8080/auth/api/auth/register`
4. Body:
```json
{
  "email": "invalidemail",
  "password": "password123",
  "full_name": "Test User",
  "phone_number": "01234567890"
}
```
5. Click `Send`

### Expected Response (HTTP 400)
```json
{
  "error": true,
  "message": "Email must contain @ symbol"
}
```

### ✅ Verification
- ❌ Status code = 400 Bad Request
- ✅ Email không có @ bị reject

### Email Validation Rules
- ✅ Phải có ký tự `@`
- ✅ Phải có format: `user@domain.ext`
- ❌ `invalidemail` → Không có @
- ❌ `@nodomain` → Không có user
- ❌ `user@` → Không có domain
- ✅ `user@test.com` → OK

---

## 3.9 Error Case 8: Phone Không Hợp Lệ (Không 10-11 Chữ Số) ❌

### Request A: Quá ít chữ số
```
Method: POST
URL: http://localhost:8080/auth/api/auth/register
Content-Type: application/json

Body:
{
  "email": "validuser@test.com",
  "password": "password123",
  "full_name": "Test User",
  "phone_number": "123456"
}
```

### Postman Setup A
1. Name: `ERROR 8a. Phone Too Short`
2. Method: `POST`
3. URL: `http://localhost:8080/auth/api/auth/register`
4. Body:
```json
{
  "email": "validuser@test.com",
  "password": "password123",
  "full_name": "Test User",
  "phone_number": "123456"
}
```
5. Click `Send`

### Expected Response (HTTP 400)
```json
{
  "error": true,
  "message": "Phone number must be 10 or 11 digits"
}
```

### Request B: Quá nhiều chữ số
```
Method: POST
URL: http://localhost:8080/auth/api/auth/register
Content-Type: application/json

Body:
{
  "email": "anotheruser@test.com",
  "password": "password123",
  "full_name": "Test User",
  "phone_number": "012345678901"
}
```

### Postman Setup B
1. Name: `ERROR 8b. Phone Too Long`
2. Method: `POST`
3. URL: `http://localhost:8080/auth/api/auth/register`
4. Body:
```json
{
  "email": "anotheruser@test.com",
  "password": "password123",
  "full_name": "Test User",
  "phone_number": "012345678901"
}
```
5. Click `Send`

### Expected Response (HTTP 400)
```json
{
  "error": true,
  "message": "Phone number must be 10 or 11 digits"
}
```

### ✅ Verification
- ❌ Status code = 400 Bad Request
- ✅ Phone số sai bị reject

### Phone Validation Rules
- ✅ Phải **chính xác** 10 hoặc 11 chữ số
- ✅ Chỉ chấp nhận chữ số (bỏ qua space/dấu gạch)
- ❌ `123456` → Quá ngắn (6 chữ số)
- ❌ `012345678901` → Quá dài (12 chữ số)
- ✅ `0123456789` → OK (10 chữ số)
- ✅ `01234567890` → OK (11 chữ số)
- ✅ `012 345 6789` → OK (10 chữ số, spaces bị bỏ qua)

---

## 3.10 Error Case 9: Movie Không Tồn Tại ❌

### Request
```
Method: GET
URL: http://localhost:8080/cinema/api/movies/999
(Movie ID 999 không tồn tại)
```

### Postman Setup
1. Name: `ERROR 9. Movie Not Found`
2. Method: `GET`
3. URL: `http://localhost:8080/cinema/api/movies/999`
4. Click `Send`

### Expected Response (HTTP 404)
```json
{
  "error": true,
  "message": "Movie not found"
}
```

### ✅ Verification
- ❌ Status code = 404 Not Found
- ✅ Movie không tồn tại bị reject

---

## 3.11 Error Case 10: Booking Ghế Đã Được Đặt ❌

### Setup Scenario

**Step 1**: User A đăng nhập & đặt vé ghế A1  
**Step 2**: User B đăng nhập & cố gắng đặt vé ghế A1 → ❌ Error

### Request
```
Method: POST
URL: http://localhost:8080/order/bookings
Content-Type: application/json

Headers:
Authorization: Bearer <USER_B_TOKEN>

Body:
{
  "showtime_id": 1,
  "seat_codes": ["A1"]
}
```

### Setup Steps

#### Step 1: User A Login & Book
```bash
1. Login User A (email: user_a@test.com)
   → Get token_A
   
2. POST /order/bookings
   Authorization: Bearer token_A
   Body: {"showtime_id": 1, "seat_codes": ["A1"]}
   → HTTP 201 ✅ Booking created
```

#### Step 2: User B Login & Try Book Same Seat
```bash
1. Login User B (email: user_b@test.com)
   → Get token_B
   
2. POST /order/bookings
   Authorization: Bearer token_B
   Body: {"showtime_id": 1, "seat_codes": ["A1"]}
   → HTTP 400 ❌ Error
```

### Postman Setup - User B Try Book
1. Name: `ERROR 10. Seat Already Booked`
2. Method: `POST`
3. URL: `http://localhost:8080/order/bookings`
4. Headers:
   - `Authorization: Bearer <USER_B_TOKEN>`
   - `Content-Type: application/json`
5. Body:
```json
{
  "showtime_id": 1,
  "seat_codes": ["A1"]
}
```
6. Click `Send`

### Expected Response (HTTP 400)
```json
{
  "error": true,
  "message": "Seats already booked: A1"
}
```

### ✅ Verification
- ❌ Status code = 400 Bad Request
- ✅ Ghế A1 đã bị đặt bị reject
- ✅ Không bao giờ có 2 user book cùng ghế

---

## 3.12 Error Case 11: Seat Lock (Đặt Cùng Ghế) ⏰

### Scenario
User A bắt đầu đặt vé ghế A1 → Ghế A1 bị khoá 5 phút  
User B cũng cố gắng đặt ghế A1 → Bị từ chối  

### Postman Setup

#### Step 1: User A Starts Booking (Locks Seat A1)
```bash
1. POST /order/bookings
   Authorization: Bearer token_A
   Body: {"showtime_id": 1, "seat_codes": ["A1"]}
   → Response: HTTP 201 (Booking successful)
   Note: Seat A1 is locked during the booking process
```

#### Step 2: User B Tries Same Seat (Immediately After)
```bash
1. POST /order/bookings
   Authorization: Bearer token_B
   Body: {"showtime_id": 1, "seat_codes": ["A1"]}
   → Response: HTTP 400
   Error: "Seats already booked: A1"
   Note: User B cannot book the same seat
```

#### Step 3: Manual Seat Lock Test (Optional)
```bash
1. Wait 5+ minutes
   
2. GET /cinema/api/showtimes/1/seats
   Authorization: Bearer token_A (User A's old lock expired)
   → Response: Seats are available again (or booked if User B completed booking)
```

### Notes
- ⏰ Lock expires after **exactly 5 minutes**
- 🔄 When user views seats, their old locks are replaced
- ✅ Prevents race conditions (2 users booking same seat)

---

# PHẦN 4: SUMMARY

## Quick Test Flow

### Happy Path### Success Cases
```
1. GET /cinema/movies                              (200 OK - public)
2. GET /cinema/movies/1                            (200 OK - public)
3. GET /cinema/movies/1/showtimes                  (200 OK - public)
4. POST /auth/api/auth/register                    (201 Created)
5. POST /auth/api/auth/login                       (200 OK + token)
6. GET /cinema/showtimes/1/seats                   (200 OK with token)
7. POST /order/bookings                            (201 Created with token)
8. GET /order/bookings/history                     (200 OK with token)
```

### Error Cases
```
1. GET /cinema/showtimes/1/seats (no token)               (401 Unauthorized)
2. POST /order/bookings (no token)                        (401 Unauthorized)
3. Register with duplicate email                            (400 Bad Request)
4. Register with weak password                              (400 Bad Request)
5. Register with invalid email (no @)                       (400 Bad Request)
6. Register with invalid phone (not 10-11 digits)          (400 Bad Request)
7. GET /cinema/movies/999                                  (404 Not Found)
8. POST /order/bookings with already booked seat           (400 Bad Request)
```

### New Seat Locking Endpoints (Optional)
```
9. POST /cinema/showtimes/1/seats/lock              (200 OK - lock specific seats)
10. POST /cinema/showtimes/1/seats/release           (200 OK - release seat locks)
```

---

## Environment Setup (Optional - Postman)

Để làm việc hiệu quả hơn với Postman, bạn có thể setup Environment:

1. Click `Environments` ở sidebar
2. Click `Create New Environment`
3. Name: `Cinema-SA`
4. Thêm variables:
```
BASE_URL = http://localhost:8080
AUTH_TOKEN = (để trống, sẽ được set sau login)
MOVIE_ID = 1
SHOWTIME_ID = 1
SEAT_CODES = ["A1", "A2"]
```

5. Sau khi login, update `AUTH_TOKEN`:
   - Vào request login → Tab `Tests`
   - Thêm script:
```javascript
var jsonData = pm.response.json();
pm.environment.set("AUTH_TOKEN", jsonData.token);
```

6. Dùng `{{BASE_URL}}`, `{{AUTH_TOKEN}}` trong requests

---

## Postman Collection Export

Để lưu tất cả requests, bạn có thể export collection:

1. Chọn Collection → Menu `...` → `Export`
2. Format: `JSON`
3. Lưu file `Cinema-SA.postman_collection.json`
4. Chia sẻ hoặc import lại khi cần

---

## Troubleshooting

### Issue 1: Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:8080
```
**Solution**: Kiểm tra Docker services có chạy không
```bash
docker ps
# Nếu không thấy services, run:
docker compose -f microservices/docker-compose.yml up --build
```

### Issue 2: Invalid Token
```
Error: Invalid token
```
**Solution**: Đăng nhập lại & copy token mới

### Issue 3: Email Already Exists
```
Error: Email already exists
```
**Solution**: Dùng email khác hoặc delete database
```bash
docker compose -f microservices/docker-compose.yml down -v
docker compose -f microservices/docker-compose.yml up --build
```

### Issue 4: Seat Already Booked
```
Error: Seats already booked
```
**Solution**: Chọn ghế khác hoặc reset database (liên minh Issue 3)

---

## Conclusion

Postman guide này cung cấp đầy đủ test cases cho hệ thống Cinema-SA:
- ✅ 8 Happy Path flows
- ✅ 11 Error case scenarios
- ✅ Chi tiết request/response cho mỗi endpoint
- ✅ Hướng dẫn setup & troubleshooting

**Ready to test!** 🚀

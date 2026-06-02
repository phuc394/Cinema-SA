# Hướng Dẫn Kiểm Thử Postman - Cinema-SA

Tài liệu này được cập nhật theo code hiện tại của dự án, bao gồm luồng chọn ghế, khóa ghế tạm thời, giải phóng ghế và đặt vé.

## 1. Khởi động hệ thống

### 1.1 Yêu cầu

- Đã cài Docker và Docker Compose
- Các cổng `8080`, `5000`, `5001`, `5002`, `3307`, `3308`, `3309` chưa bị chiếm

### 1.2 Chạy toàn bộ dịch vụ

Từ thư mục gốc của project, chạy:

```bash
docker compose -f microservices/docker-compose.yml up --build
```

Khi cần dừng:

```bash
docker compose -f microservices/docker-compose.yml down
```

Nếu muốn xóa luôn dữ liệu database để test lại từ đầu:

```bash
docker compose -f microservices/docker-compose.yml down -v
```

### 1.3 Kiểm tra API Gateway

```http
GET http://localhost:8080/health
```

Kỳ vọng nhận `HTTP 200`:

```json
{
  "status": "ok",
  "services": {
    "auth": "http://auth_service:5000",
    "cinema": "http://cinema_service:5000",
    "order": "http://order_service:5000"
  },
  "service_candidates": {
    "auth": [
      "http://auth_service:5000",
      "http://host.docker.internal:5000",
      "http://localhost:5000"
    ],
    "cinema": [
      "http://cinema_service:5000",
      "http://host.docker.internal:5001",
      "http://localhost:5001"
    ],
    "order": [
      "http://order_service:5000",
      "http://host.docker.internal:5002",
      "http://localhost:5002"
    ]
  }
}
```

## 2. Chuẩn bị môi trường Postman

Khuyến nghị tạo một environment tên `Cinema-SA` với các biến:

```text
BASE_URL=http://localhost:8080
AUTH_TOKEN=
MOVIE_ID=1
SHOWTIME_ID=1
BOOKING_ID=1
```

Sau khi đăng nhập, có thể lưu token tự động bằng script trong tab `Tests`:

```javascript
const json = pm.response.json();
pm.environment.set("AUTH_TOKEN", json.token);
```

## 3. Quy ước endpoint

Trong tài liệu này dùng các URL đúng với frontend hiện tại:

- Auth service: `{{BASE_URL}}/auth/api/auth/...`
- Cinema service: `{{BASE_URL}}/cinema/api/...`
- Order service: `{{BASE_URL}}/order/...`

## 4. Luồng kiểm thử chính

## 4.1 Lấy danh sách phim

```http
GET {{BASE_URL}}/cinema/api/movies
```

Request này là public, không cần token.

Kỳ vọng `HTTP 200`:

```json
[
  {
    "id": 1,
    "title": "Avatar",
    "genre": "Sci-Fi",
    "poster_url": "https://example.com/avatar.jpg",
    "duration": 162,
    "release_date": "2022-12-16",
    "status": "now_showing"
  }
]
```

Lưu ý:

- Endpoint này trả về trực tiếp một mảng, không bọc trong `error` hoặc `movies`
- Ghi nhớ `id` của phim để dùng ở bước tiếp theo

## 4.2 Lấy chi tiết phim

```http
GET {{BASE_URL}}/cinema/api/movies/{{MOVIE_ID}}
```

Kỳ vọng `HTTP 200`:

```json
{
  "error": false,
  "movie": {
    "id": 1,
    "title": "Avatar",
    "genre": "Sci-Fi",
    "description": "A paraplegic Marine...",
    "poster_url": "https://example.com/avatar.jpg",
    "duration": 162,
    "release_date": "2022-12-16",
    "status": "now_showing"
  }
}
```

## 4.3 Lấy danh sách suất chiếu

```http
GET {{BASE_URL}}/cinema/api/movies/{{MOVIE_ID}}/showtimes
```

Có thể lọc theo ngày:

```http
GET {{BASE_URL}}/cinema/api/movies/{{MOVIE_ID}}/showtimes?date=2026-05-20
```

Kỳ vọng `HTTP 200`:

```json
{
  "error": false,
  "showtimes": [
    {
      "showtime_id": 1,
      "movie_id": 1,
      "room_id": 1,
      "show_date": "2026-05-20",
      "start_time": "19:00:00",
      "end_time": "21:42:00"
    }
  ]
}
```

Lưu ý:

- Ghi nhớ `showtime_id`
- Nếu `date` sai định dạng, hệ thống trả `400` với message `date must be in YYYY-MM-DD format`

## 4.4 Đăng ký tài khoản

```http
POST {{BASE_URL}}/auth/api/auth/register
Content-Type: application/json
```

Body:

```json
{
  "full_name": "Nguyen Van A",
  "phone_number": "0912345678",
  "email": "user1@test.com",
  "password": "password123"
}
```

Kỳ vọng `HTTP 201`:

```json
{
  "error": false,
  "message": "User registered successfully",
  "user": {
    "user_id": 1,
    "full_name": "Nguyen Van A",
    "phone_number": "0912345678",
    "email": "user1@test.com",
    "created_at": "2026-05-20T08:30:00"
  }
}
```

Các rule validate hiện tại:

- Bắt buộc có `full_name`, `phone_number`, `email`, `password`
- Email phải chứa `@`
- Email phải đúng định dạng cơ bản
- Mật khẩu tối thiểu 6 ký tự
- Mật khẩu phải có ít nhất 1 chữ số
- Số điện thoại chỉ được chứa chữ số, độ dài 10 hoặc 11
- Email và số điện thoại không được trùng

## 4.5 Đăng nhập

```http
POST {{BASE_URL}}/auth/api/auth/login
Content-Type: application/json
```

Đăng nhập bằng email:

```json
{
  "email": "user1@test.com",
  "password": "password123"
}
```

Hoặc đăng nhập bằng số điện thoại:

```json
{
  "phone_number": "0912345678",
  "password": "password123"
}
```

Kỳ vọng `HTTP 200`:

```json
{
  "error": false,
  "message": "Login successful",
  "token": "eyJ...",
  "role": "USER",
  "user": {
    "user_id": 1,
    "full_name": "Nguyen Van A",
    "phone_number": "0912345678",
    "email": "user1@test.com"
  }
}
```

Lưu ý:

- Ghi nhớ token hoặc lưu vào biến `AUTH_TOKEN`
- Tất cả request protected phía dưới đều cần header:

```http
Authorization: Bearer {{AUTH_TOKEN}}
```

## 4.6 Xem sơ đồ ghế

```http
GET {{BASE_URL}}/cinema/api/showtimes/{{SHOWTIME_ID}}/seats
Authorization: Bearer {{AUTH_TOKEN}}
```

Kỳ vọng `HTTP 200`:

```json
{
  "error": false,
  "showtime_id": 1,
  "movie_id": 1,
  "room": "Room 1",
  "show_date": "2026-05-20",
  "start_time": "19:00:00",
  "end_time": "21:42:00",
  "seats": [
    {
      "seat_id": 1,
      "code": "A1",
      "row": "A",
      "column": 1,
      "type": "STANDARD",
      "price": 75000,
      "is_available": true,
      "is_locked": false,
      "locked_by_current_user": false,
      "lock_expires_at": null
    },
    {
      "seat_id": 2,
      "code": "A2",
      "row": "A",
      "column": 2,
      "type": "STANDARD",
      "price": 75000,
      "is_available": false,
      "is_locked": true,
      "locked_by_current_user": false,
      "lock_expires_at": "2026-05-20T08:40:00"
    }
  ]
}
```

Ý nghĩa các trường quan trọng:

- `is_available: true`: ghế hiện đang có thể chọn
- `is_locked: true`: ghế đang bị khóa tạm thời
- `locked_by_current_user: true`: ghế đang do chính user hiện tại giữ
- `lock_expires_at`: thời điểm khóa ghế hết hạn

## 4.7 Lấy danh sách ghế đã đặt thành công

```http
GET {{BASE_URL}}/order/bookings/showtimes/{{SHOWTIME_ID}}/reserved-seats
Authorization: Bearer {{AUTH_TOKEN}}
```

Kỳ vọng `HTTP 200`:

```json
{
  "error": false,
  "showtime_id": 1,
  "seat_codes": ["A1", "A2", "B5"]
}
```

Endpoint này được frontend dùng để tô đỏ các ghế đã đặt xong.

## 4.8 Khóa ghế tạm thời

```http
POST {{BASE_URL}}/cinema/api/showtimes/{{SHOWTIME_ID}}/seats/lock
Authorization: Bearer {{AUTH_TOKEN}}
Content-Type: application/json
```

Body:

```json
{
  "seat_codes": ["A3"]
}
```

Kỳ vọng `HTTP 200`:

```json
{
  "error": false,
  "message": "Seats locked successfully"
}
```

Lưu ý:

- Ghế được khóa trong 5 phút
- Nếu một ghế đang bị user khác giữ, hệ thống trả `400`
- Nếu muốn đổi ghế đã chọn, frontend hiện gọi lock lại với danh sách ghế mới

## 4.9 Giải phóng ghế đã khóa

```http
POST {{BASE_URL}}/cinema/api/showtimes/{{SHOWTIME_ID}}/seats/release
Authorization: Bearer {{AUTH_TOKEN}}
Content-Type: application/json
```

Body:

```json
{
  "seat_codes": ["A3"]
}
```

Kỳ vọng `HTTP 200`:

```json
{
  "error": false,
  "message": "Seats released successfully"
}
```

## 4.10 Đặt vé

```http
POST {{BASE_URL}}/order/bookings/create_booking
Authorization: Bearer {{AUTH_TOKEN}}
Content-Type: application/json
```

Body khuyến nghị:

```json
{
  "showtime_id": 1,
  "seat_codes": ["A3"]
}
```

Ngoài `seat_codes`, backend hiện cũng chấp nhận format:

```json
{
  "showtime_id": 1,
  "seats": [
    { "seat_code": "A3" },
    { "seat_code": "A4" }
  ]
}
```

Kỳ vọng `HTTP 201`:

```json
{
  "error": false,
  "message": "Booking created successfully",
  "booking": {
    "booking_id": 1,
    "status": 1,
    "user_id": 1,
    "showtime_id": 1,
    "total_amount": 75000.0
  }
}
```

Lưu ý quan trọng:

- Frontend hiện tại gọi endpoint `POST /order/bookings/create_booking`
- Endpoint cũ `POST /order/bookings` vẫn được hỗ trợ để tương thích
- Service order sẽ tự kiểm tra ghế hợp lệ
- Service order sẽ tự khóa ghế trước khi tạo booking
- Nếu booking thất bại, hệ thống sẽ tự giải phóng lock
- Nếu booking thành công, lock cũng được giải phóng sau khi tạo booking

## 4.11 Xem lịch sử đặt vé

```http
GET {{BASE_URL}}/order/bookings/history
Authorization: Bearer {{AUTH_TOKEN}}
```

Kỳ vọng `HTTP 200`:

```json
[
  {
    "booking_id": 1,
    "showtime_id": 1,
    "total_amount": 75000.0,
    "status": 1,
    "created_at": "2026-05-20T08:45:00"
  }
]
```

Lưu ý:

- Endpoint này trả về trực tiếp một mảng
- Chỉ hiển thị booking của user đang đăng nhập

## 4.12 Xem chi tiết một booking

```http
GET {{BASE_URL}}/order/bookings/{{BOOKING_ID}}
Authorization: Bearer {{AUTH_TOKEN}}
```

Kỳ vọng `HTTP 200`:

```json
{
  "error": false,
  "booking": {
    "booking_id": 1,
    "showtime_id": 1,
    "total_amount": 75000.0,
    "status": 1,
    "seats": [
      {
        "seat_code": "A3",
        "price": 75000.0
      }
    ]
  }
}
```

## 5. Luồng test khuyến nghị cho Seat Map mới

Đây là luồng sát nhất với frontend hiện tại:

1. `GET /cinema/api/movies`
2. `GET /cinema/api/movies/{{MOVIE_ID}}`
3. `GET /cinema/api/movies/{{MOVIE_ID}}/showtimes`
4. `POST /auth/api/auth/register`
5. `POST /auth/api/auth/login`
6. `GET /cinema/api/showtimes/{{SHOWTIME_ID}}/seats`
7. `GET /order/bookings/showtimes/{{SHOWTIME_ID}}/reserved-seats`
8. `POST /cinema/api/showtimes/{{SHOWTIME_ID}}/seats/lock`
9. `GET /cinema/api/showtimes/{{SHOWTIME_ID}}/seats`
10. `POST /order/bookings/create_booking`
11. `GET /order/bookings/history`
12. `GET /order/bookings/{{BOOKING_ID}}`

Nếu muốn kiểm tra timeout 5 phút:

1. Lock một ghế
2. Chờ hơn 5 phút
3. Gọi lại `GET /cinema/api/showtimes/{{SHOWTIME_ID}}/seats`
4. Xác nhận ghế không còn ở trạng thái lock

## 6. Các tình huống lỗi cần kiểm thử

## 6.1 Xem sơ đồ ghế khi chưa đăng nhập

```http
GET {{BASE_URL}}/cinema/api/showtimes/{{SHOWTIME_ID}}/seats
```

Không gửi header `Authorization`.

Kỳ vọng `HTTP 401`:

```json
{
  "message": "Token is missing"
}
```

## 6.2 Đặt vé khi chưa đăng nhập

```http
POST {{BASE_URL}}/order/bookings/create_booking
Content-Type: application/json
```

Body:

```json
{
  "showtime_id": 1,
  "seat_codes": ["A1"]
}
```

Kỳ vọng `HTTP 401`:

```json
{
  "message": "Token is missing"
}
```

## 6.3 Token không hợp lệ

```http
GET {{BASE_URL}}/cinema/api/showtimes/{{SHOWTIME_ID}}/seats
Authorization: Bearer invalid_token
```

Kỳ vọng `HTTP 401`:

```json
{
  "message": "Invalid token"
}
```

## 6.4 Email đã tồn tại

Gửi `POST {{BASE_URL}}/auth/api/auth/register` hai lần với cùng email.

Kỳ vọng lần sau nhận `HTTP 400`:

```json
{
  "error": true,
  "message": "Email already exists"
}
```

## 6.5 Số điện thoại đã tồn tại

Gửi `POST {{BASE_URL}}/auth/api/auth/register` hai lần với cùng `phone_number`.

Kỳ vọng `HTTP 400`:

```json
{
  "error": true,
  "message": "Phone number already exists"
}
```

## 6.6 Mật khẩu quá ngắn

Body:

```json
{
  "full_name": "Nguyen Van B",
  "phone_number": "0911111111",
  "email": "short@test.com",
  "password": "abc"
}
```

Kỳ vọng `HTTP 400`:

```json
{
  "error": true,
  "message": "Password must be at least 6 characters"
}
```

## 6.7 Mật khẩu không có chữ số

Body:

```json
{
  "full_name": "Nguyen Van C",
  "phone_number": "0922222222",
  "email": "nodigit@test.com",
  "password": "abcdef"
}
```

Kỳ vọng `HTTP 400`:

```json
{
  "error": true,
  "message": "Password must contain at least one number"
}
```

## 6.8 Email sai định dạng

Body:

```json
{
  "full_name": "Nguyen Van D",
  "phone_number": "0933333333",
  "email": "invalidemail",
  "password": "password123"
}
```

Kỳ vọng `HTTP 400`:

```json
{
  "error": true,
  "message": "Email must contain @ symbol"
}
```

Hoặc nếu có `@` nhưng format vẫn sai:

```json
{
  "error": true,
  "message": "Invalid email format"
}
```

## 6.9 Số điện thoại sai định dạng

Ví dụ body:

```json
{
  "full_name": "Nguyen Van E",
  "phone_number": "09A123",
  "email": "phone@test.com",
  "password": "password123"
}
```

Kỳ vọng `HTTP 400` với một trong các message:

```json
{
  "error": true,
  "message": "Phone number must contain only digits"
}
```

hoặc:

```json
{
  "error": true,
  "message": "Phone number must be 10 or 11 digits"
}
```

## 6.10 Phim không tồn tại

```http
GET {{BASE_URL}}/cinema/api/movies/999999
```

Kỳ vọng `HTTP 404`:

```json
{
  "error": true,
  "message": "Movie not found"
}
```

## 6.11 Suất chiếu không tồn tại

```http
GET {{BASE_URL}}/cinema/api/showtimes/999999/seats
Authorization: Bearer {{AUTH_TOKEN}}
```

Kỳ vọng `HTTP 404`:

```json
{
  "error": true,
  "message": "Showtime not found"
}
```

## 6.12 Khóa một ghế đang bị người khác giữ

Ví dụ:

- User A lock ghế `A5`
- User B tiếp tục gọi lock ghế `A5`

Kỳ vọng `HTTP 400`:

```json
{
  "error": true,
  "message": "Seat A5 is locked by another user"
}
```

## 6.13 Đặt lại ghế đã được đặt thành công

Sau khi User A đặt thành công ghế `A6`, User B gọi:

```http
POST {{BASE_URL}}/order/bookings/create_booking
Authorization: Bearer {{AUTH_TOKEN}}
Content-Type: application/json
```

Body:

```json
{
  "showtime_id": 1,
  "seat_codes": ["A6"]
}
```

Kỳ vọng `HTTP 400`:

```json
{
  "error": true,
  "message": "Seats already booked: A6"
}
```

## 7. Gợi ý cấu trúc collection Postman

Bạn có thể nhóm request theo các folder sau:

### 7.1 Hệ thống

- `GET /health`

### 7.2 Xác thực

- `POST /auth/api/auth/register`
- `POST /auth/api/auth/login`

### 7.3 Phim và suất chiếu

- `GET /cinema/api/movies`
- `GET /cinema/api/movies/{movie_id}`
- `GET /cinema/api/movies/{movie_id}/showtimes`

### 7.4 Ghế

- `GET /cinema/api/showtimes/{showtime_id}/seats`
- `GET /order/bookings/showtimes/{showtime_id}/reserved-seats`
- `POST /cinema/api/showtimes/{showtime_id}/seats/lock`
- `POST /cinema/api/showtimes/{showtime_id}/seats/release`

### 7.5 Đặt vé

- `POST /order/bookings/create_booking`
- `GET /order/bookings/history`
- `GET /order/bookings/{booking_id}`

## 8. Xử lý sự cố

## 8.1 Không kết nối được gateway

Nếu gặp lỗi như:

```text
connect ECONNREFUSED 127.0.0.1:8080
```

Hãy kiểm tra container:

```bash
docker ps
```

Nếu chưa chạy, khởi động lại:

```bash
docker compose -f microservices/docker-compose.yml up --build
```

## 8.2 Token hết hạn hoặc sai

Nếu nhận `Invalid token` hoặc `Token has expired`, hãy đăng nhập lại để lấy token mới.

## 8.3 Dữ liệu test bị trùng

Nếu test register bị trùng email hoặc số điện thoại quá nhiều, có thể:

- dùng email/số điện thoại mới
- hoặc reset toàn bộ dữ liệu:

```bash
docker compose -f microservices/docker-compose.yml down -v
docker compose -f microservices/docker-compose.yml up --build
```

## 8.4 Ghế đang bị khóa

Nếu một ghế đang bị khóa tạm thời:

- chờ hơn 5 phút để lock tự hết hạn
- hoặc dùng chính user đã khóa ghế gọi endpoint `release`

## 9. Tóm tắt nhanh

Luồng chuẩn để test tính năng Seat Map mới:

1. Đăng ký hoặc đăng nhập
2. Lấy `showtime_id`
3. Xem sơ đồ ghế
4. Xem danh sách ghế đã đặt
5. Lock ghế muốn chọn
6. Đặt vé
7. Kiểm tra lịch sử và chi tiết booking

Luồng này bám sát cách frontend hiện tại đang hoạt động.

## 10. Test stack C# qua Docker

Phần này dùng cho 2 folder mới:

- `microservices C#`
- `api_gateway C#`

Các endpoint frontend/Postman vẫn giữ nguyên như stack Python. Khác biệt chính là gateway C# chạy ở port `8081`.

### 10.1 Khởi động stack C#

Từ thư mục gốc project, chạy:

```bash
docker compose -f "microservices C#/docker-compose.yml" up --build
```

Khi cần dừng:

```bash
docker compose -f "microservices C#/docker-compose.yml" down
```

Nếu muốn reset database C# để test lại từ đầu:

```bash
docker compose -f "microservices C#/docker-compose.yml" down -v
docker compose -f "microservices C#/docker-compose.yml" up --build
```

### 10.2 Cổng của stack C#

- API Gateway C#: `http://localhost:8081`
- Auth service C#: `http://localhost:5100`
- Cinema service C#: `http://localhost:5101`
- Order service C#: `http://localhost:5102`
- Cinema DB C#: `3317`
- Order DB C#: `3318`
- Auth DB C#: `3319`

Stack Python vẫn dùng các cổng cũ:

- API Gateway Python: `http://localhost:8080`
- Auth service Python: `http://localhost:5000`
- Cinema service Python: `http://localhost:5001`
- Order service Python: `http://localhost:5002`

### 10.3 Environment Postman cho C#

Tạo environment mới tên `Cinema-SA C#` hoặc duplicate environment cũ, sau đó đổi:

```text
BASE_URL=http://localhost:8081
AUTH_TOKEN=
MOVIE_ID=1
SHOWTIME_ID=1
BOOKING_ID=1
```

Script lưu token trong tab `Tests` vẫn dùng như cũ:

```javascript
const json = pm.response.json();
pm.environment.set("AUTH_TOKEN", json.token);
```

### 10.4 Kiểm tra gateway C#

```http
GET http://localhost:8081/health
```

Kỳ vọng `HTTP 200`:

```json
{
  "status": "ok",
  "services": {
    "auth": "http://auth_service:5000",
    "cinema": "http://cinema_service:5000",
    "order": "http://order_service:5000"
  }
}
```

### 10.5 Chạy lại cùng bộ request

Dùng lại toàn bộ request trong các mục trên, chỉ cần đổi `BASE_URL` thành:

```text
http://localhost:8081
```

Các endpoint chính cần test với Docker C#:

1. `GET {{BASE_URL}}/health`
2. `GET {{BASE_URL}}/cinema/api/movies`
3. `GET {{BASE_URL}}/cinema/api/movies/{{MOVIE_ID}}`
4. `GET {{BASE_URL}}/cinema/api/movies/{{MOVIE_ID}}/showtimes`
5. `POST {{BASE_URL}}/auth/api/auth/register`
6. `POST {{BASE_URL}}/auth/api/auth/login`
7. `GET {{BASE_URL}}/cinema/api/showtimes/{{SHOWTIME_ID}}/seats`
8. `GET {{BASE_URL}}/order/bookings/showtimes/{{SHOWTIME_ID}}/reserved-seats`
9. `POST {{BASE_URL}}/cinema/api/showtimes/{{SHOWTIME_ID}}/seats/lock`
10. `POST {{BASE_URL}}/cinema/api/showtimes/{{SHOWTIME_ID}}/seats/release`
11. `POST {{BASE_URL}}/order/bookings/create_booking`
12. `GET {{BASE_URL}}/order/bookings/history`
13. `GET {{BASE_URL}}/order/bookings/{{BOOKING_ID}}`

### 10.6 Chạy frontend với server C#

Python gateway vẫn là mặc định:

```bash
cd frontend
npm run dev
```

Chạy rõ ràng với Python gateway:

```bash
cd frontend
npm run dev:python
```

Chạy với C# gateway:

```bash
cd frontend
npm run dev:csharp
```

Khi build production:

```bash
cd frontend
npm run build:python
npm run build:csharp
```

### 10.7 Lưu ý khi test song song Python và C#

- Python gateway dùng `8080`, C# gateway dùng `8081`, nên có thể chạy song song.
- Database volume của C# có suffix `_cs`, không dùng chung data với stack Python.
- Token của Python và C# không dùng chung. Khi đổi `BASE_URL`, hãy login lại để lấy `AUTH_TOKEN` mới.
- Nếu register bị trùng email hoặc số điện thoại, đổi email/phone mới hoặc reset volume C# bằng lệnh `down -v`.

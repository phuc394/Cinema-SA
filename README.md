# Cinema-SA

Cinema-SA là hệ thống đặt vé xem phim theo kiến trúc microservices. Ứng dụng cho phép người dùng xem danh sách phim đang chiếu, sắp chiếu, xem chi tiết phim, đăng ký/đăng nhập tài khoản, chọn suất chiếu, chọn ghế và đặt vé.

## Công nghệ sử dụng

- Frontend: React, Vite, React Router, Redux Toolkit, Material UI, Axios
- Backend: Python, Flask, Flask-SQLAlchemy
- API Gateway: Flask, Requests
- Database: MySQL 8.0
- Giao tiếp service: REST API, gRPC/Protocol Buffers
- Đóng gói và triển khai local: Docker, Docker Compose

## Cấu trúc project

```text
Cinema-SA/
|-- api_gateway/                 # Gateway định tuyến request đến các service
|-- frontend/                    # Ứng dụng React/Vite
`-- microservices/
    |-- auth_service/            # Đăng ký, đăng nhập, xác thực
    |-- cinema_service/          # Phim, lịch chiếu, thông tin rạp
    |-- order_service/           # Đặt vé, ghế, đơn hàng
    |-- docker-compose.yml       # Chạy full stack
    `-- Scripts.sql              # Script khởi tạo database
```

## Yêu cầu môi trường

- Docker và Docker Compose
- Node.js và npm
- Python 3.10+ và pip
- MySQL 8.0 nếu chạy backend thủ công không dùng Docker

## Cài đặt và chạy nhanh bằng Docker Compose

Từ thư mục gốc project:

```bash
docker compose -f microservices/docker-compose.yml up --build
```

Sau khi các container chạy xong:

- Frontend: `http://localhost:5173`
- API Gateway: `http://localhost:8080`
- Auth service: `http://localhost:5000`
- Cinema service: `http://localhost:5001`
- Order service: `http://localhost:5002`
- MySQL auth DB: `localhost:3309`
- MySQL cinema DB: `localhost:3307`
- MySQL order DB: `localhost:3308`

Kiểm tra gateway:

```bash
curl http://localhost:8080/health
```

Dừng hệ thống:

```bash
docker compose -f microservices/docker-compose.yml down
```

## Cài đặt backend thủ công

Backend gồm API Gateway và 3 microservice. Nếu chạy thủ công, cần chuẩn bị MySQL và tạo các database `auth_db`, `cinema_db`, `order_db` trước.

### 1. Cài đặt và chạy Auth service

```bash
cd microservices/auth_service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
$env:DATABASE_URL="mysql+pymysql://auth_user:auth_password@localhost:3306/auth_db"
python manage.py
```

Service chạy tại `http://localhost:5000`.

### 2. Cài đặt và chạy Cinema service

Mở terminal mới:

```bash
cd microservices/cinema_service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
$env:DATABASE_URL="mysql+pymysql://auth_user:auth_password@localhost:3306/cinema_db"
python manage.py
```

Service chạy tại `http://localhost:5000`. Khi chạy cùng lúc với các service khác trên máy local, hãy đổi port trong `manage.py` hoặc ưu tiên chạy bằng Docker Compose để tránh trùng port.

### 3. Cài đặt và chạy Order service

Mở terminal mới:

```bash
cd microservices/order_service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
$env:DATABASE_URL="mysql+pymysql://auth_user:auth_password@localhost:3306/order_db"
$env:CINEMA_SERVICE_URL="http://localhost:5001/api"
python manage.py
```

Service chạy tại `http://localhost:5000`. Tương tự Cinema service, nên đổi port nếu chạy nhiều service thủ công cùng lúc.

### 4. Cài đặt và chạy API Gateway

Mở terminal mới:

```bash
cd api_gateway
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
$env:AUTH_SERVICE_URL="http://localhost:5000"
$env:CINEMA_SERVICE_URL="http://localhost:5001"
$env:ORDER_SERVICE_URL="http://localhost:5002"
$env:PORT="8080"
python app.py
```

Gateway chạy tại `http://localhost:8080` và định tuyến:

- `/auth/*` đến Auth service
- `/cinema/*` đến Cinema service
- `/order/*` đến Order service

## Cài đặt frontend

Từ thư mục gốc project:

```bash
cd frontend
npm install
npm run dev
```

Frontend mặc định gọi API qua `http://localhost:8080`. Nếu cần cấu hình URL gateway khác, tạo file `.env` trong thư mục `frontend`:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Build production:

```bash
npm run build
```

Xem bản build:

```bash
npm run preview
```

## Tạo lại gRPC stubs

Từ thư mục `microservices`:

```bash
pip install grpcio grpcio-tools
python generate_grpc_stubs.py
```

File sinh ra nằm trong các thư mục:

- `auth_service/project/grpc/`
- `cinema_service/project/grpc/`
- `order_service/project/grpc/`

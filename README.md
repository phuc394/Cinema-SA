# Tổng quan Đồ án Cinema-SA

Cinema-SA là một phần mềm quản lý hệ thống đặt vé xem phim. Hệ thống cho phép khách hàng xem những bộ phim đang chiếu và sắp chiếu. Khi đặt vé thì yêu cầu phải đăng nhập.

## Công nghệ sử dụng

- Frontend: React
- Backend: Flask
- Database: MySQL

## gRPC contracts and stub generation

Unary `.proto` files:

- `auth_service/proto/auth.proto`
- `cinema_service/proto/cinema.proto`
- `order_service/proto/order.proto`

Streaming RPC added:

- `OrderService.StreamOrderStatus` (server streaming) in `order_service/proto/order.proto`

Generate Python stubs for all 3 services:

```bash
pip install grpcio grpcio-tools
python generate_grpc_stubs.py
```

Generated files are placed into each service at:

- `*/project/grpc/*_pb2.py`
- `*/project/grpc/*_pb2_grpc.py`

# API Gateway (Flask)

Simple Flask API gateway for routing to:
- Auth service
- Cinema service
- Order service

## Routes

- `/auth/*` -> `AUTH_SERVICE_URL`
- `/cinema/*` -> `CINEMA_SERVICE_URL`
- `/order/*` -> `ORDER_SERVICE_URL`
- `/health` -> Gateway health response

## Environment variables

- `AUTH_SERVICE_URL` (default: `http://localhost:5000`)
- `CINEMA_SERVICE_URL` (default: `http://localhost:5001`)
- `ORDER_SERVICE_URL` (default: `http://localhost:5002`)
- `PORT` (default: `8080`)

## Run locally

```bash
cd api_gateway
pip install -r requirements.txt
python app.py
```

## Example

- `GET http://localhost:8080/auth/health`
- `GET http://localhost:8080/cinema/health`
- `GET http://localhost:8080/order/health`

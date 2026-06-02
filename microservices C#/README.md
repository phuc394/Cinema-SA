# Cinema-SA Microservices (C#)

ASP.NET Core version of the existing Python microservices structure.

## Services

- `auth_service`: user registration, login, profile, password changes.
- `cinema_service`: movies, showtimes, seat maps, temporary seat locks.
- `order_service`: booking creation, history, booking details, reserved seats.

## Run

```bash
docker compose -f "microservices C#/docker-compose.yml" up --build
```

The API gateway C# project is included from `../api_gateway C#` and exposed on port `8081`.

## Local Ports

- Auth service: `5100`
- Cinema service: `5101`
- Order service: `5102`
- API Gateway C#: `8081`


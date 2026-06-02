# API Gateway (C#)

ASP.NET Core version of the existing Flask gateway.

## Routes

- `/auth/*` -> `AUTH_SERVICE_URL` with upstream prefix `/api/auth`
- `/cinema/*` -> `CINEMA_SERVICE_URL` with upstream prefix `/api`
- `/order/*` -> `ORDER_SERVICE_URL`
- `/health` -> gateway health response

## Run locally

```bash
cd "api_gateway C#"
dotnet run
```

## Run with C# microservices

```bash
docker compose -f "microservices C#/docker-compose.yml" up --build
```

Gateway port in the C# compose file is `8081`.


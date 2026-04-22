# Auth Service

Auth microservice for the Cinema-SA project.

## Run locally

From this folder:

```bash
pip install -r requirements.txt
python manage.py runserver
```

From repository root:

```bash
cd microservices/auth_service
pip install -r requirements.txt
python manage.py runserver
```

Default local URL:

```bash
http://127.0.0.1:5000/
```

Swagger UI:

```bash
http://127.0.0.1:5000/ui/
```

## Docker

Build and run this service image from `microservices/auth_service`:

```bash
docker build -t auth_service -f Dockerfile .
docker run -d -p 5000:5000 auth_service
```

Run the full stack from repository root:

```bash
docker compose -f microservices/docker-compose.yml up --build
```

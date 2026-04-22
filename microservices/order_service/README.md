# Order Service

Order microservice for the Cinema-SA project.

## Run locally

From this folder:

```bash
pip install -r requirements.txt
python manage.py runserver
```

From repository root:

```bash
cd microservices/order_service
pip install -r requirements.txt
python manage.py runserver
```

Default local URL:

```bash
http://127.0.0.1:5002/
```

Swagger UI:

```bash
http://127.0.0.1:5002/ui/
```

## Docker

Build and run this service image from `microservices/order_service`:

```bash
docker build -t order_service -f Dockerfile .
docker run -d -p 5002:5000 order_service
```

Run the full stack from repository root:

```bash
docker compose -f microservices/docker-compose.yml up --build
```

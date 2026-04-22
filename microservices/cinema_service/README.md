# Cinema Service

Cinema microservice for the Cinema-SA project.

## Run locally

From this folder:

```bash
pip install -r requirements.txt
python manage.py runserver
```

From repository root:

```bash
cd microservices/cinema_service
pip install -r requirements.txt
python manage.py runserver
```

Default local URL:

```bash
http://127.0.0.1:5001/
```

Swagger UI:

```bash
http://127.0.0.1:5001/ui/
```

## Docker

Build and run this service image from `microservices/cinema_service`:

```bash
docker build -t cinema_service -f Dockerfile .
docker run -d -p 5001:5000 cinema_service
```

Run the full stack from repository root:

```bash
docker compose -f microservices/docker-compose.yml up --build
```

# project/config/settings.py

import os

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")

    # DB
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://root:123456789@localhost/order_db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # API KEY (giao tiếp service)
    API_KEY = os.getenv("API_KEY", "my-api-key")

    # CINEMA SERVICE (gRPC hoặc HTTP)
    CINEMA_SERVICE_URL = os.getenv("CINEMA_SERVICE_URL", "http://cinema-service:5001")

    # TIMEOUT (optional)
    REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", 5))
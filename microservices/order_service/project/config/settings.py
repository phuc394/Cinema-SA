# project/config/settings.py

import os

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "cinema-sa-dev-secret")
    JWT_EXPIRES_IN_HOURS = int(os.getenv("JWT_EXPIRES_IN_HOURS", "24"))

    # DB
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://root:123456789@localhost/order_db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # API KEY (giao tiếp service)
    API_KEY = os.getenv("API_KEY", "my-api-key")

    # CINEMA SERVICE (gRPC hoặc HTTP)
    CINEMA_SERVICE_URL = os.getenv("CINEMA_SERVICE_URL", "http://localhost:5001/api")

    # TIMEOUT (optional)
    REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", 5))

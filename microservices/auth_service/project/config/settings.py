import os


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "gjr39dkjn344_!67#")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://auth_user:123456@127.0.0.1:3306/auth_db",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_EXPIRES_IN_HOURS = int(os.getenv("JWT_EXPIRES_IN_HOURS", 24))
    AUTH_DEFAULT_ROLE = os.getenv("AUTH_DEFAULT_ROLE", "USER")

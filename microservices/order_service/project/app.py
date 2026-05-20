import os
import logging
import time

from flask import Flask
import pymysql
from sqlalchemy.engine.url import make_url

from project.config.settings import Config
from project.models.init_db import db
from project.routes.booking_routes import booking_bp

logger = logging.getLogger(__name__)

def _wait_for_mysql(database_url: str, include_database: bool = True, attempts: int = 30, delay: float = 2.0) -> None:
    url = make_url(database_url)

    if not url.drivername.startswith("mysql"):
        return

    for attempt in range(1, attempts + 1):
        connect_kwargs = {
            "host": url.host or "localhost",
            "port": url.port or 3306,
            "user": url.username,
            "password": url.password,
            "charset": "utf8mb4",
            "connect_timeout": 5,
        }
        if include_database and url.database:
            connect_kwargs["database"] = url.database

        try:
            connection = pymysql.connect(**connect_kwargs)
            connection.close()
            return
        except pymysql.MySQLError as exc:
            if attempt == attempts:
                raise
            logger.warning(
                "Database not ready yet for order service (%s/%s): %s. Retrying in %.1fs",
                attempt,
                attempts,
                exc,
                delay,
            )
            time.sleep(delay)


def _ensure_mysql_database(database_url: str) -> None:
    url = make_url(database_url)
    if not url.drivername.startswith("mysql") or not url.database:
        return

    _wait_for_mysql(database_url, include_database=False)

    connection = pymysql.connect(
        host=url.host or "localhost",
        port=url.port or 3306,
        user=url.username,
        password=url.password,
        charset="utf8mb4",
        autocommit=True,
        connect_timeout=5,
    )
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{url.database}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
    finally:
        connection.close()


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL",
        Config.SQLALCHEMY_DATABASE_URI
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    _ensure_mysql_database(app.config["SQLALCHEMY_DATABASE_URI"])

    db.init_app(app)
    app.register_blueprint(booking_bp)

    @app.route("/", methods=["GET"])
    def index() -> tuple[str, int]:
        return "Order service is running", 200

    with app.app_context():
        _wait_for_mysql(app.config["SQLALCHEMY_DATABASE_URI"])
        db.create_all()

    return app

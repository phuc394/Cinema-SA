import os
import logging
import time

from flask import Flask
import pymysql
from sqlalchemy.engine.url import make_url

from project.middleware.cors_middleware import init_cors
from project.models.init_db import db
from project.routes.movie_routes import movie_bp

logger = logging.getLogger(__name__)


def _wait_for_database(database_url: str, attempts: int = 30, delay: float = 2.0) -> None:
    url = make_url(database_url)

    for attempt in range(1, attempts + 1):
        try:
            connection = pymysql.connect(
                host=url.host or "localhost",
                port=url.port or 3306,
                user=url.username,
                password=url.password,
                database=url.database,
                charset="utf8mb4",
                connect_timeout=5,
            )
            connection.close()
            return
        except pymysql.MySQLError as exc:
            if attempt == attempts:
                raise
            logger.warning(
                "Database not ready yet for cinema service (%s/%s): %s. Retrying in %.1fs",
                attempt,
                attempts,
                exc,
                delay,
            )
            time.sleep(delay)


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "cinema-sa-dev-secret")
    app.config["JWT_EXPIRES_IN_HOURS"] = int(os.getenv("JWT_EXPIRES_IN_HOURS", "24"))
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://auth_user:auth_password@127.0.0.1:3306/cinema_db",
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    init_cors(app)
    db.init_app(app)
    app.register_blueprint(movie_bp, url_prefix="/api")

    @app.route("/", methods=["GET"])
    def index() -> tuple[dict, int]:
        return {"message": "Cinema service is running"}, 200

    with app.app_context():
        _wait_for_database(app.config["SQLALCHEMY_DATABASE_URI"])
        db.create_all()

    return app

import logging
import time

from flask import Flask
import pymysql
from sqlalchemy.engine.url import make_url

from project.config.settings import Config
from project.models.init_db import db

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
                "Database not ready yet for auth service (%s/%s): %s. Retrying in %.1fs",
                attempt,
                attempts,
                exc,
                delay,
            )
            time.sleep(delay)


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)

    @app.route("/", methods=["GET"])
    def index() -> tuple[dict, int]:
        return {"message": "Auth service is running"}, 200

    with app.app_context():
        _wait_for_database(app.config["SQLALCHEMY_DATABASE_URI"])
        db.create_all()

    return app

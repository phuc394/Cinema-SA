import os

from flask import Flask
import pymysql
from sqlalchemy.engine.url import make_url

from project.config.settings import Config
from project.models.init_db import db
from project.routes.booking_routes import booking_bp



def _ensure_mysql_database(database_url: str) -> None:
    url = make_url(database_url)
    if not url.drivername.startswith("mysql") or not url.database:
        return

    connection = pymysql.connect(
        host=url.host or "localhost",
        port=url.port or 3306,
        user=url.username,
        password=url.password,
        charset="utf8mb4",
        autocommit=True,
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
        db.create_all()

    return app
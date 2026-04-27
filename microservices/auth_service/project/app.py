from flask import Flask

from project.config.settings import Config
from project.models.init_db import db


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)

    @app.route("/", methods=["GET"])
    def index() -> tuple[dict, int]:
        return {"message": "Auth service is running"}, 200

    with app.app_context():
        db.create_all()

    return app

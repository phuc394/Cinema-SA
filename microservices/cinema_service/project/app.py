import os

from flask import Flask

from project.middleware.cors_middleware import init_cors
from project.models.init_db import db
from project.routes.movie_routes import movie_bp


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
        db.create_all()

    return app

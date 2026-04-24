from flask_sqlalchemy import SQLAlchemy


class AuthSQLAlchemy(SQLAlchemy):
    def init_app(self, app):
        super().init_app(app)

        from project.routes.auth_routes import auth_bp

        if auth_bp.name not in app.blueprints:
            app.register_blueprint(auth_bp)


db = AuthSQLAlchemy()

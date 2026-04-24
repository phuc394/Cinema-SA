import logging
import logging.config

from flask import Flask
from pyms.flask.app import Microservice
from project.models.init_db import db
from .routes.movie_routes import movie_bp
from project.middleware.cors_middleware import init_cors
from project.config.config_loader import load_config


class MyMicroservice(Microservice):
    def init_libs(self) -> None:

        # 1. Nạp cấu hình từ YAML
        conf = load_config()
        self.application.config['SQLALCHEMY_DATABASE_URI'] = conf.get('pyms', {}).get('services', {}).get('database', {}).get('uri')

        #2 khởi tạo Database
        db.init_app(self.application)

        #kích hoạt CORS cho react
        init_cors(self.application)

        # đăng ký Routes
        self.application.register_blueprint(movie_bp, url_prefix='/api')
        with self.application.test_request_context():
            db.create_all()

    def init_logger(self) -> None:
        if not self.application.config["DEBUG"]:
            super().init_logger()
        else:
            level = "DEBUG"
            LOGGING = {
                'version': 1,
                'disable_existing_loggers': False,
                'handlers': {
                    'console': {
                        'level': level,
                        'class': 'logging.StreamHandler',
                    },
                },
                'loggers': {
                    '': {
                        'handlers': ['console'],
                        'level': level,
                        'propagate': True,
                    },
                    'anyconfig': {
                        'handlers': ['console'],
                        'level': "WARNING",
                        'propagate': True,
                    },
                    'pyms': {
                        'handlers': ['console'],
                        'level': "WARNING",
                        'propagate': True,
                    },
                    'root': {
                        'handlers': ['console'],
                        'level': level,
                        'propagate': True,
                    },
                }
            }

            logging.config.dictConfig(LOGGING)


def create_app():
    app = Flask(__name__)
    
    # Cấu hình DB (Như chỉnh lại cho đúng thông tin MySQL nhé)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:password@localhost/cinema_db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    
    # Đăng ký Routes
    app.register_blueprint(movie_bp, url_prefix='/api')

    ms = MyMicroservice(path=__file__)

    return ms.create_app()

from flask_cors import CORS

def init_cors(app):
    # Cho phép React (thường chạy ở port 3000) gọi vào Flask (port 5001)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
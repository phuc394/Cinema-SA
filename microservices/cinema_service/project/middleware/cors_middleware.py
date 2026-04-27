from flask import Flask, Response, request


def init_cors(app: Flask) -> None:
    @app.after_request
    def add_cors_headers(response: Response) -> Response:
        if request.path.startswith("/api/"):
            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        return response

import os
from typing import Dict

import requests
from flask import Flask, Response, jsonify, request


app = Flask(__name__)

SERVICE_MAP: Dict[str, str] = {
    "auth": os.getenv("AUTH_SERVICE_URL", "http://localhost:5000"),
    "cinema": os.getenv("CINEMA_SERVICE_URL", "http://localhost:5001"),
    "order": os.getenv("ORDER_SERVICE_URL", "http://localhost:5002"),
}


def _build_target_url(service_name: str, path: str) -> str:
    base_url = SERVICE_MAP[service_name].rstrip("/")
    if not path:
        return base_url
    return f"{base_url}/{path}"


def _forward_request(service_name: str, path: str = "") -> Response:
    target_url = _build_target_url(service_name, path)

    headers = {
        key: value
        for key, value in request.headers.items()
        if key.lower() not in {"host", "content-length"}
    }

    upstream_response = requests.request(
        method=request.method,
        url=target_url,
        headers=headers,
        params=request.args,
        data=request.get_data(),
        cookies=request.cookies,
        allow_redirects=False,
        timeout=10,
    )

    response_headers = [
        (key, value)
        for key, value in upstream_response.headers.items()
        if key.lower() not in {"content-encoding", "content-length", "transfer-encoding", "connection"}
    ]

    return Response(
        upstream_response.content,
        status=upstream_response.status_code,
        headers=response_headers,
    )


@app.route("/health", methods=["GET"])
def health_check() -> Response:
    return jsonify({"status": "ok", "services": SERVICE_MAP})


@app.route("/auth", defaults={"path": ""}, methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
@app.route("/auth/<path:path>", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
def auth_proxy(path: str) -> Response:
    return _forward_request("auth", path)


@app.route("/cinema", defaults={"path": ""}, methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
@app.route("/cinema/<path:path>", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
def cinema_proxy(path: str) -> Response:
    return _forward_request("cinema", path)


@app.route("/order", defaults={"path": ""}, methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
@app.route("/order/<path:path>", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
def order_proxy(path: str) -> Response:
    return _forward_request("order", path)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "8080")), debug=True)

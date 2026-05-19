import os
from typing import Dict, List

import requests
from flask import Flask, Response, jsonify, request


app = Flask(__name__)

CORS_ALLOW_ORIGIN = os.getenv("CORS_ALLOW_ORIGIN", "*")
CORS_ALLOW_HEADERS = "Authorization, Content-Type"
CORS_ALLOW_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS"

SERVICE_MAP: Dict[str, str] = {
    "auth": os.getenv("AUTH_SERVICE_URL", "http://localhost:5000"),
    "cinema": os.getenv("CINEMA_SERVICE_URL", "http://localhost:5001"),
    "order": os.getenv("ORDER_SERVICE_URL", "http://localhost:5002"),
}

SERVICE_FALLBACK_MAP: Dict[str, List[str]] = {
    "auth": ["http://host.docker.internal:5000", "http://localhost:5000"],
    "cinema": ["http://host.docker.internal:5001", "http://localhost:5001"],
    "order": ["http://host.docker.internal:5002", "http://localhost:5002"],
}

SERVICE_PREFIX_MAP: Dict[str, str] = {
    "auth": "api/auth",
    "cinema": "api",
    "order": "",
}


def _get_service_urls(service_name: str) -> List[str]:
    configured_urls = [url.strip() for url in SERVICE_MAP[service_name].split(",") if url.strip()]
    candidate_urls = configured_urls + SERVICE_FALLBACK_MAP[service_name]
    deduplicated_urls: List[str] = []

    for url in candidate_urls:
        if url not in deduplicated_urls:
            deduplicated_urls.append(url)

    return deduplicated_urls


def _build_target_url(service_name: str, base_url: str, path: str) -> str:
    base_url = base_url.rstrip("/")
    prefix = SERVICE_PREFIX_MAP[service_name].strip("/")
    normalized_path = path.strip("/")

    if prefix and normalized_path == prefix:
        normalized_path = ""
    elif prefix and normalized_path.startswith(f"{prefix}/"):
        normalized_path = normalized_path[len(prefix) + 1 :]

    url_parts = [base_url]
    if prefix:
        url_parts.append(prefix)
    if normalized_path:
        url_parts.append(normalized_path)

    return "/".join(url_parts)


def _forward_request(service_name: str, path: str = "") -> Response:
    if request.method == "OPTIONS":
        return Response(status=204)

    headers = {
        key: value
        for key, value in request.headers.items()
        if key.lower() not in {"host", "content-length"}
    }

    last_error: requests.RequestException | None = None
    attempted_urls: List[str] = []

    for base_url in _get_service_urls(service_name):
        target_url = _build_target_url(service_name, base_url, path)
        attempted_urls.append(target_url)

        try:
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
        except requests.RequestException as exc:
            last_error = exc
            app.logger.warning("Failed to reach %s via %s: %s", service_name, target_url, exc)
            continue

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

    return (
        jsonify(
            {
                "error": True,
                "message": f"Unable to reach {service_name} service",
                "attempted_urls": attempted_urls,
                "details": str(last_error) if last_error else None,
            }
        ),
        502,
    )


@app.after_request
def add_cors_headers(response: Response) -> Response:
    response.headers["Access-Control-Allow-Origin"] = CORS_ALLOW_ORIGIN
    response.headers["Access-Control-Allow-Headers"] = CORS_ALLOW_HEADERS
    response.headers["Access-Control-Allow-Methods"] = CORS_ALLOW_METHODS
    return response


@app.route("/health", methods=["GET"])
def health_check() -> Response:
    return jsonify(
        {
            "status": "ok",
            "services": SERVICE_MAP,
            "service_candidates": {
                service_name: _get_service_urls(service_name) for service_name in SERVICE_MAP
            },
        }
    )


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

from functools import wraps

from flask import current_app, g, jsonify, request
from itsdangerous import URLSafeTimedSerializer
from itsdangerous.exc import BadSignature, SignatureExpired


def _token_serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"], salt="auth-token")


def _decode_access_token(token: str) -> dict:
    max_age = int(current_app.config.get("JWT_EXPIRES_IN_HOURS", 24)) * 3600
    return _token_serializer().loads(token, max_age=max_age)


def token_required(func):
    @wraps(func)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        token = ""

        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()

        if not token:
            return jsonify({"message": "Token is missing"}), 401

        try:
            payload = _decode_access_token(token)
        except SignatureExpired:
            return jsonify({"message": "Token has expired"}), 401
        except BadSignature:
            return jsonify({"message": "Invalid token"}), 401

        g.current_user_id = payload.get("sub")
        g.current_role = payload.get("role", "USER")
        return func(*args, **kwargs)

    return decorated

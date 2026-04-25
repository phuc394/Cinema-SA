from functools import wraps

from flask import g, jsonify, request
from itsdangerous.exc import BadSignature, SignatureExpired

from project.services.auth_service import decode_access_token, is_token_revoked


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        token = ""

        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()

        if not token:
            return jsonify({"message": "Token is missing"}), 401

        try:
            payload = decode_access_token(token)
            jti = payload.get("jti")
            if jti and is_token_revoked(jti):
                return jsonify({"message": "Token has been invalidated"}), 401

            g.current_user_id = payload.get("sub")
            g.current_role = payload.get("role", "USER")
            g.current_token = token
        except SignatureExpired:
            return jsonify({"message": "Token has expired"}), 401
        except BadSignature:
            return jsonify({"message": "Invalid token"}), 401

        return f(*args, **kwargs)

    return decorated
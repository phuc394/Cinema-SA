from flask import request, jsonify
from project.config.settings import Config

def require_api_key():
    api_key = request.headers.get("X-API-Key")

    if api_key != Config.API_KEY:
        return jsonify({"message": "Unauthorized"}), 401

    return None
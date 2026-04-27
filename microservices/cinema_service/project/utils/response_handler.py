from flask import jsonify


def error_response(message: str, status_code: int) -> tuple:
    """Standardized error response format"""
    return jsonify({"error": True, "message": message}), status_code


def success_response(data: dict = None, status_code: int = 200, message: str = None) -> tuple:
    """Standardized success response format"""
    response = {"error": False}
    if message:
        response["message"] = message
    if data:
        response.update(data)
    return jsonify(response), status_code

from flask import g, jsonify, request

from project.middleware.auth_middleware import token_required
from project.services.auth_service import (
    change_password,
    get_profile,
    login_user,
    logout_user,
    register_user,
    update_profile,
)


def register_controller():
    data = request.get_json() or {}
    try:
        user = register_user(data)
        return jsonify(
            {
                "user_id": user.user_id,
                "full_name": user.full_name,
                "phone_number": user.phone_number,
                "email": user.email,
                "created_at": user.created_at.isoformat() if user.created_at else None,
            }
        ), 201
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400


def login_controller():
    data = request.get_json() or {}
    try:
        user, role, token = login_user(data)
        return jsonify(
            {
                "token": token,
                "role": role,
                "user": {
                    "user_id": user.user_id,
                    "full_name": user.full_name,
                    "phone_number": user.phone_number,
                    "email": user.email,
                },
            }
        ), 200
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400
    except PermissionError as exc:
        return jsonify({"message": str(exc)}), 401


@token_required
def logout_controller():
    try:
        logout_user(g.current_token)
        return jsonify({"message": "Logged out successfully"}), 200
    except Exception:
        return jsonify({"message": "Unable to logout"}), 400


@token_required
def get_profile_controller():
    user = get_profile(g.current_user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    return jsonify(
        {
            "user_id": user.user_id,
            "full_name": user.full_name,
            "phone_number": user.phone_number,
            "email": user.email,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        }
    ), 200


@token_required
def update_profile_controller():
    data = request.get_json() or {}
    try:
        user = update_profile(g.current_user_id, data)
        if not user:
            return jsonify({"message": "User not found"}), 404

        return jsonify(
            {
                "message": "Profile updated successfully",
                "user": {
                    "user_id": user.user_id,
                    "full_name": user.full_name,
                    "phone_number": user.phone_number,
                    "email": user.email,
                    "updated_at": user.updated_at.isoformat() if user.updated_at else None,
                },
            }
        ), 200
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400


@token_required
def change_password_controller():
    if g.current_role not in {"USER", "ADMIN"}:
        return jsonify({"message": "Forbidden"}), 403

    data = request.get_json() or {}
    try:
        user = change_password(g.current_user_id, data)
        if not user:
            return jsonify({"message": "User not found"}), 404

        return jsonify({"message": "Password changed successfully"}), 200
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400
    except PermissionError as exc:
        return jsonify({"message": str(exc)}), 401
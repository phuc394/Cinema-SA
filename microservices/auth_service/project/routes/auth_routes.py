from flask import Blueprint

from project.controllers.auth_controller import (
    change_password_controller,
    get_profile_controller,
    login_controller,
    logout_controller,
    register_controller,
    update_profile_controller,
)


auth_bp = Blueprint("auth_bp", __name__, url_prefix="/api/auth")

auth_bp.route("/register", methods=["POST"])(register_controller)
auth_bp.route("/login", methods=["POST"])(login_controller)
auth_bp.route("/logout", methods=["POST"])(logout_controller)
auth_bp.route("/profile", methods=["GET"])(get_profile_controller)
auth_bp.route("/profile", methods=["PUT"])(update_profile_controller)
auth_bp.route("/profile/password", methods=["PATCH"])(change_password_controller)
from flask import Blueprint
from project.controllers.booking_controller import (
    create_booking_controller,
    get_history_controller,
    get_booking_detail_controller
)

booking_bp = Blueprint("booking_bp", __name__, url_prefix="/bookings")

booking_bp.route("", methods=["POST"])(create_booking_controller)
booking_bp.route("/history", methods=["GET"])(get_history_controller)
booking_bp.route("/<int:booking_id>", methods=["GET"])(get_booking_detail_controller)
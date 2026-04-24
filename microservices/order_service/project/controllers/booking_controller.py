from flask import request, jsonify
from project.services.booking_service import (
    create_booking,
    get_booking_history,
    get_booking_detail
)

def create_booking_controller():
    data = request.get_json() or {}

    user_id = data.get("user_id")
    showtime_id = data.get("showtime_id")
    seats = data.get("seats")

    if not user_id or not showtime_id or not seats:
        return jsonify({"message": "Missing data"}), 400

    booking = create_booking(user_id, showtime_id, seats)

    return jsonify({
        "booking_id": booking.booking_id,
        "status": booking.status
    }), 201


def get_history_controller():
    user_id = request.args.get("user_id")

    if not user_id:
        return jsonify({"message": "user_id is required"}), 400

    bookings = get_booking_history(user_id)

    return jsonify([
        {
            "booking_id": b.booking_id,
            "total_amount": b.total_amount,
            "status": b.status
        }
        for b in bookings
    ]), 200


def get_booking_detail_controller(booking_id):
    booking, details = get_booking_detail(booking_id)

    if not booking:
        return jsonify({"message": "Booking not found"}), 404

    return jsonify({
        "booking_id": booking.booking_id,
        "showtime_id": booking.showtime_id,
        "total_amount": booking.total_amount,
        "status": booking.status,
        "seats": [
            {
                "seat_code": d.seat_code,
                "price": d.seat_price
            }
            for d in details
        ]
    }), 200
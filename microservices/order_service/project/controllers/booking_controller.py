from flask import g, jsonify, request

from project.middleware.order_middleware import token_required
from project.services.booking_service import (
    create_booking,
    get_booking_detail,
    get_booking_history,
    get_reserved_seats,
)
from project.utils.response_handler import error_response, success_response


def _extract_requested_seats(data) -> list[str]:
    seat_codes = data.get("seat_codes")
    if isinstance(seat_codes, list) and seat_codes:
        return [str(seat_code).strip().upper() for seat_code in seat_codes if str(seat_code).strip()]

    seats = data.get("seats")
    if isinstance(seats, list) and seats:
        extracted = []
        for seat in seats:
            if isinstance(seat, dict) and seat.get("seat_code"):
                extracted.append(str(seat["seat_code"]).strip().upper())
            elif isinstance(seat, str) and seat.strip():
                extracted.append(seat.strip().upper())
        return extracted

    return []


@token_required
def create_booking_controller():
    data = request.get_json() or {}
    showtime_id = data.get("showtime_id")
    seat_codes = _extract_requested_seats(data)

    if not showtime_id or not seat_codes:
        return error_response("showtime_id and seat_codes are required", 400)

    try:
        booking = create_booking(
            user_id=g.current_user_id,
            showtime_id=showtime_id,
            seat_codes=seat_codes,
            access_token=g.current_token,
        )
    except ValueError as exc:
        return error_response(str(exc), 400)

    return success_response(
        {
            "booking": {
                "booking_id": booking.booking_id,
                "status": booking.status,
                "user_id": booking.user_id,
                "showtime_id": booking.showtime_id,
                "total_amount": booking.total_amount,
            }
        },
        status_code=201,
        message="Booking created successfully"
    )


@token_required
def get_history_controller():
    bookings = get_booking_history(g.current_user_id)

    return jsonify(
        [
            {
                "booking_id": booking.booking_id,
                "showtime_id": booking.showtime_id,
                "total_amount": booking.total_amount,
                "status": booking.status,
                "created_at": booking.created_at.isoformat() if booking.created_at else None,
            }
            for booking in bookings
        ]
    ), 200


@token_required
def get_reserved_seats_controller(showtime_id):
    seat_codes = get_reserved_seats(showtime_id)
    return success_response(
        {
            "showtime_id": showtime_id,
            "seat_codes": seat_codes,
        }
    )


@token_required
def get_booking_detail_controller(booking_id):
    booking, details = get_booking_detail(booking_id, g.current_user_id)

    if not booking:
        return error_response("Booking not found", 404)

    return success_response(
        {
            "booking": {
                "booking_id": booking.booking_id,
                "showtime_id": booking.showtime_id,
                "total_amount": booking.total_amount,
                "status": booking.status,
                "seats": [
                    {
                        "seat_code": detail.seat_code,
                        "price": detail.seat_price,
                    }
                    for detail in details
                ],
            }
        }
    )

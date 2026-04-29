import requests
from flask import current_app
from datetime import datetime, timedelta

from project.models.models import Booking, BookingDetail, db


def _fetch_seat_map(showtime_id, access_token):
    try:
        response = requests.get(
            f"{current_app.config['CINEMA_SERVICE_URL'].rstrip('/')}/showtimes/{showtime_id}/seats",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=current_app.config.get("REQUEST_TIMEOUT", 5),
        )
    except requests.RequestException as exc:
        raise ValueError("Cinema service is unavailable") from exc

    if response.status_code == 404:
        raise ValueError("Showtime not found")

    if response.status_code != 200:
        raise ValueError("Unable to verify seats from cinema service")

    return response.json()


def _get_reserved_seats(showtime_id, seat_codes):
    booked_rows = (
        db.session.query(BookingDetail.seat_code)
        .join(Booking, Booking.booking_id == BookingDetail.booking_id)
        .filter(
            Booking.showtime_id == showtime_id,
            Booking.status >= 0,
            BookingDetail.seat_code.in_(seat_codes),
        )
        .all()
    )
    return {row[0] for row in booked_rows}


def create_booking(user_id, showtime_id, seat_codes, access_token):
    normalized_seat_codes = [seat_code.strip().upper() for seat_code in seat_codes if seat_code.strip()]
    unique_seat_codes = list(dict.fromkeys(normalized_seat_codes))

    if not unique_seat_codes:
        raise ValueError("At least one seat must be selected")

    seat_map = _fetch_seat_map(showtime_id, access_token)
    available_seats = {seat["code"]: seat for seat in seat_map.get("seats", [])}

    invalid_seats = [seat_code for seat_code in unique_seat_codes if seat_code not in available_seats]
    if invalid_seats:
        raise ValueError(f"Invalid seat codes: {', '.join(invalid_seats)}")

    unavailable_in_cinema = [
        seat_code
        for seat_code in unique_seat_codes
        if not available_seats[seat_code].get("is_available", False)
    ]
    if unavailable_in_cinema:
        raise ValueError(f"Seats are temporarily unavailable: {', '.join(unavailable_in_cinema)}")

    already_booked = _get_reserved_seats(showtime_id, unique_seat_codes)
    if already_booked:
        raise ValueError(f"Seats already booked: {', '.join(sorted(already_booked))}")

    total_amount = sum(available_seats[seat_code]["price"] for seat_code in unique_seat_codes)

    try:
        booking = Booking(
            user_id=user_id,
            showtime_id=showtime_id,
            total_amount=total_amount,
            status=1,  # Status = 1 (confirmed, no payment needed for this project)
        )

        db.session.add(booking)
        db.session.flush()

        for seat_code in unique_seat_codes:
            db.session.add(
                BookingDetail(
                    booking_id=booking.booking_id,
                    seat_code=seat_code,
                    seat_price=available_seats[seat_code]["price"],
                )
            )

        # Note: Seat locks are managed by cinema service
        # Order service only handles booking records

        db.session.commit()
        return booking
    except Exception:
        db.session.rollback()
        raise


def get_booking_history(user_id):
    return (
        Booking.query.filter_by(user_id=user_id)
        .order_by(Booking.booking_id.desc())
        .all()
    )


def get_booking_detail(booking_id, user_id):
    booking = Booking.query.filter_by(booking_id=booking_id, user_id=user_id).first()
    if not booking:
        return None, []

    details = BookingDetail.query.filter_by(booking_id=booking_id).all()
    return booking, details

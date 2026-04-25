from project.models.models import db, Booking, BookingDetail

# giả lập gọi cinema service
def lock_seats_fake():
    return True


def create_booking(user_id, showtime_id, seats):
    try:
        if not lock_seats_fake():
            raise Exception("Cannot lock seats")

        total_amount = sum([seat["price"] for seat in seats])

        booking = Booking(
            user_id=user_id,
            showtime_id=showtime_id,
            total_amount=total_amount,
            status=0
        )

        db.session.add(booking)
        db.session.flush()  # lấy booking_id

        for seat in seats:
            detail = BookingDetail(
                booking_id=booking.booking_id,
                seat_code=seat["seat_code"],
                seat_price=seat["price"]
            )
            db.session.add(detail)

        db.session.commit()
        return booking

    except Exception as e:
        db.session.rollback()
        raise e


def get_booking_history(user_id):
    return Booking.query.filter_by(user_id=user_id).all()


def get_booking_detail(booking_id):
    booking = Booking.query.get(booking_id)
    details = BookingDetail.query.filter_by(booking_id=booking_id).all()
    return booking, details
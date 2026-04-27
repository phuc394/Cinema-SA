from datetime import datetime, timedelta

from ..models.models import Movie, Room, Seat, Showtime, TemporarySeatLock
from ..models.init_db import db


STATUS_LABELS = {
    1: "now_showing",
    0: "coming_soon",
    -1: "stopped",
}

STANDARD_PRICE = 75000
VIP_PRICE = 90000


class MovieService:
    @staticmethod
    def _seat_code(seat: Seat) -> str:
        return f"{seat.row_index}{seat.col_index}"

    @staticmethod
    def _seat_type(seat: Seat) -> str:
        return "VIP" if seat.row_index >= "H" else "STANDARD"

    @classmethod
    def _seat_price(cls, seat: Seat) -> int:
        return VIP_PRICE if cls._seat_type(seat) == "VIP" else STANDARD_PRICE

    @staticmethod
    def get_all_movies():
        return Movie.query.order_by(Movie.movie_id.asc()).all()

    @staticmethod
    def get_movie_by_id(movie_id):
        return Movie.query.get(movie_id)

    @staticmethod
    def get_showtimes(movie_id, date_iso=None):
        query = Showtime.query.filter_by(movie_id=movie_id)

        if date_iso:
            show_date = datetime.strptime(date_iso, "%Y-%m-%d").date()
            query = query.filter_by(show_date=show_date)

        return query.order_by(Showtime.show_date.asc(), Showtime.start_time.asc()).all()

    @classmethod
    def get_seat_map(cls, showtime_id, user_id=None):
        showtime = Showtime.query.get(showtime_id)
        if not showtime:
            return None, []

        room = Room.query.get(showtime.room_id)
        seats = Seat.query.filter_by(room_id=showtime.room_id).order_by(
            Seat.row_index.asc(),
            Seat.col_index.asc(),
        ).all()

        now = datetime.utcnow()

        # Clear expired locks
        TemporarySeatLock.query.filter(
            TemporarySeatLock.showtime_id == showtime_id,
            TemporarySeatLock.expires_at <= now,
            TemporarySeatLock.status == 1
        ).delete()

        # If user_id provided, create new locks for this user (5 minute validity)
        if user_id:
            # First, remove any existing locks for this user on this showtime
            TemporarySeatLock.query.filter_by(
                showtime_id=showtime_id,
                user_id=user_id,
                status=1
            ).delete()

            # Create locks for all seats
            lock_expiry = now + timedelta(minutes=5)
            for seat in seats:
                seat_code = cls._seat_code(seat)
                lock = TemporarySeatLock(
                    showtime_id=showtime_id,
                    seat_code=seat_code,
                    user_id=user_id,
                    locked_at=now,
                    expires_at=lock_expiry,
                    status=1
                )
                db.session.add(lock)
            db.session.commit()

        # Get current locked seats
        locked_seats = {
            lock.seat_code
            for lock in TemporarySeatLock.query.filter_by(showtime_id=showtime_id, status=1).all()
            if lock.expires_at > now
        }

        seat_map = [
            {
                "seat_id": seat.seat_id,
                "code": cls._seat_code(seat),
                "row": seat.row_index,
                "column": seat.col_index,
                "type": cls._seat_type(seat),
                "price": cls._seat_price(seat),
                "is_available": cls._seat_code(seat) not in locked_seats,
            }
            for seat in seats
        ]

        return showtime, {
            "showtime_id": showtime.showtime_id,
            "movie_id": showtime.movie_id,
            "room": room.room_name if room else None,
            "show_date": showtime.show_date.isoformat(),
            "start_time": showtime.start_time.isoformat(),
            "end_time": showtime.end_time.isoformat(),
            "seats": seat_map,
        }

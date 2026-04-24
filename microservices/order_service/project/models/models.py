import datetime
from sqlalchemy import Column, Integer, String, DateTime
from project.models.init_db import db


class Booking(db.Model):
    __tablename__ = "Booking"

    booking_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    showtime_id = db.Column(db.Integer, nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime)

class BookingDetail(db.Model):
    __tablename__ = "BookingDetail"

    detail_id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(
        db.Integer,
        db.ForeignKey("Booking.booking_id", ondelete="CASCADE"),
        nullable=False
    )
    seat_code = db.Column(db.String(10), nullable=False)
    seat_price = db.Column(db.Float, nullable=False)

from project.models.init_db import db


class Movie(db.Model):
    __tablename__ = "Movie"

    movie_id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    poster_url = db.Column(db.String(500))
    genre = db.Column(db.String(100))
    description = db.Column(db.Text)
    duration = db.Column(db.Integer, nullable=False)
    release_date = db.Column(db.Date)
    status = db.Column(db.Integer, default=0)


class Room(db.Model):
    __tablename__ = "Room"

    room_id = db.Column(db.Integer, primary_key=True)
    room_name = db.Column(db.String(100), nullable=False)


class Seat(db.Model):
    __tablename__ = "Seat"

    seat_id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(
        db.Integer,
        db.ForeignKey("Room.room_id", ondelete="CASCADE"),
        nullable=False,
    )
    row_index = db.Column(db.String(5), nullable=False)
    col_index = db.Column(db.Integer, nullable=False)


class Showtime(db.Model):
    __tablename__ = "Showtime"

    showtime_id = db.Column(db.Integer, primary_key=True)
    movie_id = db.Column(db.Integer, db.ForeignKey("Movie.movie_id"), nullable=False)
    show_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey("Room.room_id"), nullable=False)


class TemporarySeatLock(db.Model):
    __tablename__ = "TemporarySeatLock"

    lock_id = db.Column(db.Integer, primary_key=True)
    showtime_id = db.Column(
        db.Integer,
        db.ForeignKey("Showtime.showtime_id"),
        nullable=False,
    )
    seat_code = db.Column(db.String(10), nullable=False)
    user_id = db.Column(db.Integer, nullable=False)
    locked_at = db.Column(db.DateTime)
    expires_at = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.Integer, default=1)

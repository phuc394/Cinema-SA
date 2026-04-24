import datetime
from sqlalchemy import Column, Integer, String, DateTime
from project.models.init_db import db


class ExampleModel(db.Model):
    """Example model"""
    __tablename__ = 'example_model'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.now)

class Movie(db.Model):
    __tablename__ = 'movies'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    poster_url = db.Column(db.String(500))
    status = db.Column(db.String(50), default='now_showing')

class Showtime(db.Model):
    __tablename__ = 'showtimes'
    id = db.Column(db.Integer, primary_key=True)
    movie_id = db.Column(db.Integer, db.ForeignKey('movies.id'))
    start_time = db.Column(db.DateTime, nullable=False)
    price = db.Column(db.Float)
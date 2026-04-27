from flask import Blueprint

from ..controllers.movie_controller import (
    get_seat_map,
    list_movies,
    list_showtimes,
    movie_details,
)


movie_bp = Blueprint("movie_bp", __name__)

movie_bp.route("/movies", methods=["GET"])(list_movies)
movie_bp.route("/movies/<int:movie_id>", methods=["GET"])(movie_details)
movie_bp.route("/movies/<int:movie_id>/showtimes", methods=["GET"])(list_showtimes)
movie_bp.route("/showtimes/<int:showtime_id>/seats", methods=["GET"])(get_seat_map)

from flask import Blueprint
from ..controllers.movie_controller import list_movies, movie_details

movie_bp = Blueprint('movie_bp', __name__)

movie_bp.route('/movies', methods=['GET'])(list_movies)
movie_bp.route('/movies/<int:movie_id>', methods=['GET'])(movie_details)
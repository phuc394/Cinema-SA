from flask import jsonify
from ..services.movie_service import MovieService

def list_movies():
    movies = MovieService.get_all_movies()
    return jsonify([{"id": m.id, "title": m.title, "status": m.status} for m in movies])

def movie_details(movie_id):
    movie = MovieService.get_movie_by_id(movie_id)
    if not movie:
        return jsonify({"error": "Không tìm thấy phim"}), 404
    return jsonify({"id": movie.id, "title": movie.title, "desc": movie.description}), 200
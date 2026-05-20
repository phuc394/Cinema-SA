from flask import jsonify, request, g

from ..middleware.auth_middleware import token_required
from ..services.movie_service import MovieService, STATUS_LABELS
from ..utils.response_handler import error_response, success_response


def list_movies():
    movies = MovieService.get_all_movies()
    return jsonify(
        [
            {
                "id": movie.movie_id,
                "title": movie.title,
                "genre": movie.genre,
                "poster_url": movie.poster_url,
                "duration": movie.duration,
                "release_date": movie.release_date.isoformat() if movie.release_date else None,
                "status": STATUS_LABELS.get(movie.status, "unknown"),
            }
            for movie in movies
        ]
    ), 200


def movie_details(movie_id):
    movie = MovieService.get_movie_by_id(movie_id)
    if not movie:
        return error_response("Movie not found", 404)

    return success_response(
        {
            "movie": {
                "id": movie.movie_id,
                "title": movie.title,
                "genre": movie.genre,
                "description": movie.description,
                "poster_url": movie.poster_url,
                "duration": movie.duration,
                "release_date": movie.release_date.isoformat() if movie.release_date else None,
                "status": STATUS_LABELS.get(movie.status, "unknown"),
            }
        }
    )


def list_showtimes(movie_id):
    date_iso = request.args.get("date")

    try:
        showtimes = MovieService.get_showtimes(movie_id, date_iso=date_iso)
    except ValueError:
        return error_response("date must be in YYYY-MM-DD format", 400)

    return success_response(
        {
            "showtimes": [
                {
                    "showtime_id": showtime.showtime_id,
                    "movie_id": showtime.movie_id,
                    "room_id": showtime.room_id,
                    "show_date": showtime.show_date.isoformat(),
                    "start_time": showtime.start_time.isoformat(),
                    "end_time": showtime.end_time.isoformat(),
                }
                for showtime in showtimes
            ]
        }
    )


@token_required
def get_seat_map(showtime_id):
    showtime, seat_map = MovieService.get_seat_map(showtime_id, user_id=g.current_user_id)
    if not showtime:
        return error_response("Showtime not found", 404)

    return success_response(seat_map)


@token_required
def lock_seats(showtime_id):
    data = request.get_json() or {}
    seat_codes = data.get("seat_codes", [])
    
    if not seat_codes:
        return error_response("seat_codes are required", 400)
    
    try:
        MovieService.lock_seats_for_booking(showtime_id, seat_codes, g.current_user_id)
        return success_response({"message": "Seats locked successfully"})
    except ValueError as exc:
        return error_response(str(exc), 400)


@token_required
def release_seats(showtime_id):
    data = request.get_json() or {}
    seat_codes = data.get("seat_codes", [])
    
    if not seat_codes:
        return error_response("seat_codes are required", 400)
    
    MovieService.release_seat_locks(showtime_id, seat_codes, g.current_user_id)
    return success_response({"message": "Seats released successfully"})

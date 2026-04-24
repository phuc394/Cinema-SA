from ..models.models import Movie

class MovieService:
    @staticmethod
    def get_all_movies():
        return Movie.query.all()

    @staticmethod
    def get_movie_by_id(movie_id):
        return Movie.query.get(movie_id)
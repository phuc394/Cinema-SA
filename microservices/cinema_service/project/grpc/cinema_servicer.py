import grpc
from . import cinema_pb2, cinema_pb2_grpc
from ..services.movie_service import MovieService

class CinemaServicer(cinema_pb2_grpc.CinemaServiceServicer):
    def ListMovies(self, request, context):
        movies = MovieService.get_all_movies()
        # Chuyển đổi từ Model sang định dạng gRPC
        grpc_movies = [cinema_pb2.Movie(id=str(m.id), title=m.title) for m in movies]
        return cinema_pb2.ListMoviesResponse(movies=grpc_movies)

    def GetMovie(self, request, context):
        movie = MovieService.get_movie_by_id(request.movie_id)
        if not movie:
            context.abort(grpc.StatusCode.NOT_FOUND, "Không tìm thấy phim")
        
        # Tạo đối tượng Movie theo đúng proto
        movie_data = cinema_pb2.Movie(id=str(movie.id), title=movie.title, description=movie.description)
        return cinema_pb2.MovieResponse(movie=movie_data)

    # có thể bổ sung ListShowtimes và GetSeatMap tương tự sau này
    def ListShowtimes(self, request, context):
        return cinema_pb2.ListShowtimesResponse()

    def GetSeatMap(self, request, context):
        return cinema_pb2.GetSeatMapResponse()
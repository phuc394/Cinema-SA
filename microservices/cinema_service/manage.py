# encoding: utf-8
import threading
import grpc
from concurrent import futures
from project.app import create_app
from project.grpc.cinema_servicer import CinemaServicer
from project.grpc import cinema_pb2_grpc

app = create_app()

def run_grpc():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    cinema_pb2_grpc.add_CinemaServiceServicer_to_server(CinemaServicer(), server)
    server.add_insecure_port('[::]:50051')
    print("🚀 gRPC Server đang chạy tại port 50051...")
    server.start()
    server.wait_for_termination()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

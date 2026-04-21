from pathlib import Path
from grpc_tools import protoc


ROOT = Path(__file__).resolve().parent

PROTO_TARGETS = [
    (ROOT / "auth_service" / "proto" / "auth.proto", ROOT / "auth_service"),
    (ROOT / "cinema_service" / "proto" / "cinema.proto", ROOT / "cinema_service"),
    (ROOT / "order_service" / "proto" / "order.proto", ROOT / "order_service"),
]


def generate(proto_file: Path, service_root: Path) -> None:
    out_dir = service_root / "project" / "grpc"
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "__init__.py").touch(exist_ok=True)

    exit_code = protoc.main(
        [
            "grpc_tools.protoc",
            f"-I{service_root / 'proto'}",
            f"--python_out={out_dir}",
            f"--grpc_python_out={out_dir}",
            str(proto_file),
        ]
    )
    if exit_code != 0:
        raise SystemExit(f"Failed generating stubs for {proto_file}")


def main() -> None:
    for proto_file, service_root in PROTO_TARGETS:
        generate(proto_file, service_root)
    print("Generated gRPC stubs for auth, cinema, and order services.")


if __name__ == "__main__":
    main()

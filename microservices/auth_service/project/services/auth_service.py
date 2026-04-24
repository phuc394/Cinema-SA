from datetime import datetime
from uuid import uuid4

from flask import current_app
from itsdangerous import URLSafeTimedSerializer
from werkzeug.security import check_password_hash, generate_password_hash

from project.models.init_db import db
from project.models.models import User


REVOKED_TOKEN_JTI = set()


def _token_serializer():
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"], salt="auth-token")


def _encode_access_token(user_id, role="USER"):
    payload = {
        "sub": user_id,
        "role": role,
        "jti": str(uuid4()),
        "iat": datetime.utcnow().isoformat(),
    }
    token = _token_serializer().dumps(payload)
    return token


def decode_access_token(token):
    max_age = int(current_app.config.get("JWT_EXPIRES_IN_HOURS", 24)) * 3600
    return _token_serializer().loads(token, max_age=max_age)


def is_token_revoked(jti):
    return jti in REVOKED_TOKEN_JTI


def revoke_token(jti):
    REVOKED_TOKEN_JTI.add(jti)


def register_user(data):
    full_name = (data.get("full_name") or "").strip()
    phone_number = (data.get("phone_number") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not full_name or not phone_number or not email or not password:
        raise ValueError("Missing required fields")

    existing_phone = User.query.filter_by(phone_number=phone_number).first()
    if existing_phone:
        raise ValueError("Phone number already exists")

    existing_email = User.query.filter_by(email=email).first()
    if existing_email:
        raise ValueError("Email already exists")

    user = User(
        full_name=full_name,
        phone_number=phone_number,
        email=email,
        password_hash=generate_password_hash(password),
    )

    db.session.add(user)
    db.session.commit()

    return user


def login_user(data):
    identifier = (data.get("email") or data.get("phone_number") or "").strip().lower()
    password = data.get("password") or ""

    if not identifier or not password:
        raise ValueError("email/phone_number and password are required")

    user = User.query.filter_by(email=identifier).first()
    if not user:
        user = User.query.filter_by(phone_number=identifier).first()

    if not user or not check_password_hash(user.password_hash, password):
        raise PermissionError("Invalid credentials")

    role = "USER"
    token = _encode_access_token(user.user_id, role=role)
    return user, role, token


def logout_user(token):
    payload = decode_access_token(token)
    jti = payload.get("jti")
    if jti:
        revoke_token(jti)


def get_profile(user_id):
    return User.query.get(user_id)


def update_profile(user_id, data):
    user = User.query.get(user_id)
    if not user:
        return None

    full_name = (data.get("full_name") or "").strip()
    phone_number = (data.get("phone_number") or "").strip()
    email = (data.get("email") or "").strip().lower()

    if not full_name or not phone_number or not email:
        raise ValueError("full_name, phone_number and email are required")

    duplicated_phone = User.query.filter(
        User.phone_number == phone_number,
        User.user_id != user_id,
    ).first()
    if duplicated_phone:
        raise ValueError("Phone number already exists")

    duplicated_email = User.query.filter(
        User.email == email,
        User.user_id != user_id,
    ).first()
    if duplicated_email:
        raise ValueError("Email already exists")

    user.full_name = full_name
    user.phone_number = phone_number
    user.email = email
    user.updated_at = datetime.utcnow()

    db.session.commit()
    return user


def change_password(user_id, data):
    user = User.query.get(user_id)
    if not user:
        return None

    current_password = data.get("current_password") or ""
    new_password = data.get("new_password") or ""

    if not current_password or not new_password:
        raise ValueError("current_password and new_password are required")

    if not check_password_hash(user.password_hash, current_password):
        raise PermissionError("Current password is incorrect")

    user.password_hash = generate_password_hash(new_password)
    user.updated_at = datetime.utcnow()
    db.session.commit()

    return user
import re


def validate_email(email: str) -> None:
    """Validate email format"""
    if not email or "@" not in email:
        raise ValueError("Email must contain @ symbol")
    
    # Basic email pattern
    if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
        raise ValueError("Invalid email format")


def validate_password(password: str) -> None:
    """Validate password: at least 6 characters with numbers"""
    if not password or len(password) < 6:
        raise ValueError("Password must be at least 6 characters")
    
    if not re.search(r'\d', password):
        raise ValueError("Password must contain at least one number")


def validate_phone_number(phone: str) -> None:
    """Validate phone number: 10 or 11 digits only"""
    if not phone:
        raise ValueError("Phone number is required")
    
    # Remove any spaces or dashes
    cleaned = re.sub(r'[\s\-]', '', phone)
    
    if not cleaned.isdigit():
        raise ValueError("Phone number must contain only digits")
    
    if len(cleaned) not in [10, 11]:
        raise ValueError("Phone number must be 10 or 11 digits")

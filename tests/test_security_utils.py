from src.core.security import decode_access_token, hash_password, verify_password


def test_hash_and_verify_password():
    hashed = hash_password("secret123")
    assert verify_password("secret123", hashed) is True
    assert verify_password("wrong", hashed) is False


def test_decode_invalid_token_returns_none():
    assert decode_access_token("invalid.token.value") is None

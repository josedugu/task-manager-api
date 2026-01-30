import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    payload = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == payload["username"]
    assert data["email"] == payload["email"]
    assert "id" in data
    assert data["role"] == "member"  # Default role


@pytest.mark.asyncio
async def test_login_user(client: AsyncClient):
    # 1. Register
    payload = {
        "username": "loginuser",
        "email": "login@example.com",
        "password": "password123",
    }
    await client.post("/api/v1/auth/register", json=payload)

    # 2. Login
    login_payload = {"username": "loginuser", "password": "password123"}
    response = await client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    login_payload = {"username": "nonexistent", "password": "wrongpassword"}
    response = await client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_register_duplicate_user(client: AsyncClient):
    payload = {
        "username": "dupuser",
        "email": "dup@example.com",
        "password": "password123",
    }
    # First registration OK
    await client.post("/api/v1/auth/register", json=payload)

    # Second registration FAIL
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]

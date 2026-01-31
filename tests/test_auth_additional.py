from datetime import timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy import text

from src.core.security import create_access_token


@pytest.mark.asyncio
async def test_login_with_email(client: AsyncClient):
    payload = {
        "username": "emailuser",
        "email": "emailuser@test.com",
        "password": "password123",
    }
    await client.post("/api/v1/auth/register", json=payload)

    response = await client.post(
        "/api/v1/auth/login",
        json={"username": payload["email"], "password": payload["password"]},
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_inactive_user_forbidden(client: AsyncClient, db_session):
    payload = {
        "username": "inactiveuser",
        "email": "inactiveuser@test.com",
        "password": "password123",
    }
    await client.post("/api/v1/auth/register", json=payload)

    await db_session.execute(
        text("UPDATE users SET is_active = 0 WHERE username = 'inactiveuser'")
    )
    await db_session.commit()

    response = await client.post(
        "/api/v1/auth/login",
        json={"username": payload["username"], "password": payload["password"]},
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_expired_token_rejected(client: AsyncClient):
    token = create_access_token({"sub": "1"}, expires_delta=timedelta(seconds=-1))
    response = await client.get(
        "/api/v1/tasks", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_token_with_non_int_subject_rejected(client: AsyncClient):
    token = create_access_token({"sub": "not-an-int"})
    response = await client.get(
        "/api/v1/tasks", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 401

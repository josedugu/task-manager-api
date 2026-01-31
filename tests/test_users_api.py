import pytest
from httpx import AsyncClient
from sqlalchemy import text


async def _register_and_login(client: AsyncClient, username: str, email: str) -> str:
    await client.post(
        "/api/v1/auth/register",
        json={"username": username, "email": email, "password": "password123"},
    )
    token = (
        await client.post(
            "/api/v1/auth/login",
            json={"username": username, "password": "password123"},
        )
    ).json()["access_token"]
    return token


@pytest.mark.asyncio
async def test_list_users_excludes_inactive(client: AsyncClient, db_session):
    token = await _register_and_login(
        client, username="activeuser", email="activeuser@test.com"
    )
    await _register_and_login(
        client, username="inactiveuser2", email="inactiveuser2@test.com"
    )

    await db_session.execute(
        text("UPDATE users SET is_active = 0 WHERE username = 'inactiveuser2'")
    )
    await db_session.commit()

    response = await client.get(
        "/api/v1/users", headers={"Authorization": f"Bearer {token}"}
    )
    usernames = {u["username"] for u in response.json()}
    assert "activeuser" in usernames
    assert "inactiveuser2" not in usernames

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


async def _login(client: AsyncClient, username: str) -> str:
    token = (
        await client.post(
            "/api/v1/auth/login",
            json={"username": username, "password": "password123"},
        )
    ).json()["access_token"]
    return token


@pytest.mark.asyncio
async def test_owner_sees_all_tasks(client: AsyncClient, db_session):
    owner_token = await _register_and_login(
        client, username="ownerlist", email="ownerlist@test.com"
    )
    await db_session.execute(
        text("UPDATE users SET role = 'owner' WHERE username = 'ownerlist'")
    )
    await db_session.commit()
    owner_token = await _login(client, username="ownerlist")

    member_token = await _register_and_login(
        client, username="memberlist", email="memberlist@test.com"
    )

    await client.post(
        "/api/v1/tasks",
        json={"title": "Owner Task", "status": "todo"},
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    await client.post(
        "/api/v1/tasks",
        json={"title": "Member Task", "status": "todo"},
        headers={"Authorization": f"Bearer {member_token}"},
    )

    response = await client.get(
        "/api/v1/tasks", headers={"Authorization": f"Bearer {owner_token}"}
    )
    titles = {t["title"] for t in response.json()}
    assert {"Owner Task", "Member Task"} <= titles


@pytest.mark.asyncio
async def test_member_sees_only_own_and_assigned_tasks(client: AsyncClient):
    member1_token = await _register_and_login(
        client, username="memberone", email="memberone@test.com"
    )
    member2_token = await _register_and_login(
        client, username="membertwo", email="membertwo@test.com"
    )

    users_response = await client.get(
        "/api/v1/users", headers={"Authorization": f"Bearer {member2_token}"}
    )
    member1_id = next(
        u["id"] for u in users_response.json() if u["username"] == "memberone"
    )

    await client.post(
        "/api/v1/tasks",
        json={"title": "Owned by Member1", "status": "todo"},
        headers={"Authorization": f"Bearer {member1_token}"},
    )
    await client.post(
        "/api/v1/tasks",
        json={
            "title": "Assigned to Member1",
            "status": "todo",
            "assigned_to_id": member1_id,
        },
        headers={"Authorization": f"Bearer {member2_token}"},
    )
    await client.post(
        "/api/v1/tasks",
        json={"title": "Member2 Only", "status": "todo"},
        headers={"Authorization": f"Bearer {member2_token}"},
    )

    response = await client.get(
        "/api/v1/tasks", headers={"Authorization": f"Bearer {member1_token}"}
    )
    titles = {t["title"] for t in response.json()}
    assert "Owned by Member1" in titles
    assert "Assigned to Member1" in titles
    assert "Member2 Only" not in titles


@pytest.mark.asyncio
async def test_get_task_forbidden_for_unrelated_user(client: AsyncClient):
    owner_token = await _register_and_login(
        client, username="taskowner", email="taskowner2@test.com"
    )
    other_token = await _register_and_login(
        client, username="taskother", email="taskother@test.com"
    )

    task_id = (
        await client.post(
            "/api/v1/tasks",
            json={"title": "Secret Task", "status": "todo"},
            headers={"Authorization": f"Bearer {owner_token}"},
        )
    ).json()["id"]

    response = await client.get(
        f"/api/v1/tasks/{task_id}",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_task_allowed_for_assigned_user(client: AsyncClient):
    owner_token = await _register_and_login(
        client, username="assignowner", email="assignowner@test.com"
    )
    assignee_token = await _register_and_login(
        client, username="assigneeuser", email="assigneeuser@test.com"
    )

    users_response = await client.get(
        "/api/v1/users", headers={"Authorization": f"Bearer {owner_token}"}
    )
    assignee_id = next(
        u["id"] for u in users_response.json() if u["username"] == "assigneeuser"
    )

    task_id = (
        await client.post(
            "/api/v1/tasks",
            json={
                "title": "Shared Task",
                "status": "todo",
                "assigned_to_id": assignee_id,
            },
            headers={"Authorization": f"Bearer {owner_token}"},
        )
    ).json()["id"]

    response = await client.get(
        f"/api/v1/tasks/{task_id}",
        headers={"Authorization": f"Bearer {assignee_token}"},
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Shared Task"


@pytest.mark.asyncio
async def test_update_task_not_found(client: AsyncClient):
    token = await _register_and_login(
        client, username="updatenotfound", email="updatenotfound@test.com"
    )
    response = await client.patch(
        "/api/v1/tasks/9999",
        json={"title": "Nope"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_task_not_found(client: AsyncClient):
    token = await _register_and_login(
        client, username="deletenotfound", email="deletenotfound@test.com"
    )
    response = await client.delete(
        "/api/v1/tasks/9999",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 404

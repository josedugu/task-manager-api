import pytest
from httpx import AsyncClient


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
async def test_notification_not_found_and_ownership(client: AsyncClient):
    owner_token = await _register_and_login(
        client, username="notifowner", email="notifowner@test.com"
    )
    other_token = await _register_and_login(
        client, username="notifother", email="notifother@test.com"
    )

    users_response = await client.get(
        "/api/v1/users", headers={"Authorization": f"Bearer {owner_token}"}
    )
    other_id = next(
        u["id"] for u in users_response.json() if u["username"] == "notifother"
    )

    await client.post(
        "/api/v1/tasks",
        json={
            "title": "Notification Task",
            "status": "todo",
            "assigned_to_id": other_id,
        },
        headers={"Authorization": f"Bearer {owner_token}"},
    )

    notifications = (
        await client.get(
            "/api/v1/notifications",
            headers={"Authorization": f"Bearer {other_token}"},
        )
    ).json()
    notification_id = notifications[0]["id"]

    forbidden = await client.patch(
        f"/api/v1/notifications/{notification_id}",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert forbidden.status_code == 404

    forbidden_delete = await client.delete(
        f"/api/v1/notifications/{notification_id}",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert forbidden_delete.status_code == 404

    not_found = await client.patch(
        "/api/v1/notifications/9999",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert not_found.status_code == 404

    not_found_delete = await client.delete(
        "/api/v1/notifications/9999",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert not_found_delete.status_code == 404


@pytest.mark.asyncio
async def test_task_updated_notification_created(client: AsyncClient):
    owner_token = await _register_and_login(
        client, username="updateowner", email="updateowner@test.com"
    )
    assignee_token = await _register_and_login(
        client, username="updateassignee", email="updateassignee@test.com"
    )

    users_response = await client.get(
        "/api/v1/users", headers={"Authorization": f"Bearer {owner_token}"}
    )
    assignee_id = next(
        u["id"] for u in users_response.json() if u["username"] == "updateassignee"
    )

    task_id = (
        await client.post(
            "/api/v1/tasks",
            json={
                "title": "Update Notif Task",
                "status": "todo",
                "assigned_to_id": assignee_id,
            },
            headers={"Authorization": f"Bearer {owner_token}"},
        )
    ).json()["id"]

    await client.patch(
        f"/api/v1/tasks/{task_id}",
        json={"status": "in_progress"},
        headers={"Authorization": f"Bearer {owner_token}"},
    )

    notifications = (
        await client.get(
            "/api/v1/notifications",
            headers={"Authorization": f"Bearer {assignee_token}"},
        )
    ).json()
    types = {n["type"] for n in notifications}
    assert "task_updated" in types


@pytest.mark.asyncio
async def test_overdue_notifications_created(client: AsyncClient):
    from datetime import datetime, timedelta

    token = await _register_and_login(
        client, username="overdueuser", email="overdueuser@test.com"
    )
    overdue_date = (datetime.utcnow() - timedelta(days=1)).isoformat()
    await client.post(
        "/api/v1/tasks",
        json={
            "title": "Overdue Task",
            "status": "todo",
            "due_date": overdue_date,
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    await client.get("/api/v1/tasks", headers={"Authorization": f"Bearer {token}"})

    notifications = (
        await client.get(
            "/api/v1/notifications",
            headers={"Authorization": f"Bearer {token}"},
        )
    ).json()
    overdue = [n for n in notifications if n["type"] == "overdue"]
    assert overdue

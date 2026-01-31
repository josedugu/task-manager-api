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
async def test_comments_and_history_permissions_and_order(client: AsyncClient):
    owner_token = await _register_and_login(
        client, username="commentowner", email="commentowner@test.com"
    )
    assignee_token = await _register_and_login(
        client, username="commenter", email="commenter2@test.com"
    )
    other_token = await _register_and_login(
        client, username="outsider", email="outsider@test.com"
    )

    users_response = await client.get(
        "/api/v1/users", headers={"Authorization": f"Bearer {owner_token}"}
    )
    assignee_id = next(
        u["id"] for u in users_response.json() if u["username"] == "commenter"
    )

    task_id = (
        await client.post(
            "/api/v1/tasks",
            json={
                "title": "Task With Comments",
                "status": "todo",
                "assigned_to_id": assignee_id,
            },
            headers={"Authorization": f"Bearer {owner_token}"},
        )
    ).json()["id"]

    forbidden = await client.get(
        f"/api/v1/tasks/{task_id}/comments",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert forbidden.status_code == 403

    await client.post(
        f"/api/v1/tasks/{task_id}/comments",
        json={"content": "First comment"},
        headers={"Authorization": f"Bearer {assignee_token}"},
    )
    await client.post(
        f"/api/v1/tasks/{task_id}/comments",
        json={"content": "Second comment"},
        headers={"Authorization": f"Bearer {assignee_token}"},
    )

    comments_response = await client.get(
        f"/api/v1/tasks/{task_id}/comments",
        headers={"Authorization": f"Bearer {assignee_token}"},
    )
    comments = comments_response.json()
    assert [c["content"] for c in comments] == ["First comment", "Second comment"]

    await client.patch(
        f"/api/v1/tasks/{task_id}",
        json={"title": "Updated Title"},
        headers={"Authorization": f"Bearer {owner_token}"},
    )

    history_response = await client.get(
        f"/api/v1/tasks/{task_id}/history",
        headers={"Authorization": f"Bearer {assignee_token}"},
    )
    history = history_response.json()
    assert len(history) >= 2
    assert history[0]["action"] in {"UPDATE_TASK", "COMMENTED"}

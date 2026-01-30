import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_task(client: AsyncClient):
    # 1. Register & Login
    await client.post(
        "/api/v1/auth/register",
        json={
            "username": "taskuser",
            "email": "task@example.com",
            "password": "password123",
        },
    )
    login_res = await client.post(
        "/api/v1/auth/login", json={"username": "taskuser", "password": "password123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Task
    task_payload = {"title": "Test Task", "description": "Desc", "status": "todo"}
    response = await client.post("/api/v1/tasks", json=task_payload, headers=headers)

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == task_payload["title"]
    assert data["status"] == "todo"


@pytest.mark.asyncio
async def test_access_denied_without_token(client: AsyncClient):
    response = await client.get("/api/v1/tasks")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_filter_tasks(client: AsyncClient):
    # 1. Auth
    await client.post(
        "/api/v1/auth/register",
        json={
            "username": "filteruser",
            "email": "filter@example.com",
            "password": "password123",
        },
    )
    token = (
        await client.post(
            "/api/v1/auth/login",
            json={"username": "filteruser", "password": "password123"},
        )
    ).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create tasks with different statuses
    await client.post(
        "/api/v1/tasks", json={"title": "T1", "status": "todo"}, headers=headers
    )
    await client.post(
        "/api/v1/tasks", json={"title": "T2", "status": "done"}, headers=headers
    )

    # 3. Filter 'todo'
    res_todo = await client.get("/api/v1/tasks?status=todo", headers=headers)
    assert len(res_todo.json()) == 1
    assert res_todo.json()[0]["status"] == "todo"

    # 4. Filter 'done'
    res_done = await client.get("/api/v1/tasks?status=done", headers=headers)
    assert len(res_done.json()) == 1
    assert res_done.json()[0]["status"] == "done"


@pytest.mark.asyncio
async def test_task_not_found(client: AsyncClient):
    # Auth
    await client.post(
        "/api/v1/auth/register",
        json={
            "username": "404user",
            "email": "404@example.com",
            "password": "password123",
        },
    )
    token = (
        await client.post(
            "/api/v1/auth/login",
            json={"username": "404user", "password": "password123"},
        )
    ).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Try to get non-existent task
    response = await client.get("/api/v1/tasks/9999", headers=headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_member_cannot_delete_other_task(client: AsyncClient):
    # 1. Create Victim User & Task
    await client.post(
        "/api/v1/auth/register",
        json={
            "username": "victim",
            "email": "v@example.com",
            "password": "password123",
        },
    )
    victim_token = (
        await client.post(
            "/api/v1/auth/login", json={"username": "victim", "password": "password123"}
        )
    ).json()["access_token"]

    task_res = await client.post(
        "/api/v1/tasks",
        json={"title": "Victim Task", "status": "todo"},
        headers={"Authorization": f"Bearer {victim_token}"},
    )
    task_id = task_res.json()["id"]

    # 2. Create Attacker User
    await client.post(
        "/api/v1/auth/register",
        json={
            "username": "attacker",
            "email": "a@example.com",
            "password": "password123",
        },
    )
    attacker_token = (
        await client.post(
            "/api/v1/auth/login",
            json={"username": "attacker", "password": "password123"},
        )
    ).json()["access_token"]

    # 3. Attacker tries to delete Victim's task
    response = await client.delete(
        f"/api/v1/tasks/{task_id}",
        headers={"Authorization": f"Bearer {attacker_token}"},
    )

    assert response.status_code == 403  # Forbidden


@pytest.mark.asyncio
async def test_owner_can_delete_any_task(client: AsyncClient, db_session):
    # 1. Create Victim (Member) & Task
    await client.post(
        "/api/v1/auth/register",
        json={
            "username": "victim2",
            "email": "v2@example.com",
            "password": "password123",
        },
    )
    v_token = (
        await client.post(
            "/api/v1/auth/login",
            json={"username": "victim2", "password": "password123"},
        )
    ).json()["access_token"]
    task_id = (
        await client.post(
            "/api/v1/tasks",
            json={"title": "T", "status": "todo"},
            headers={"Authorization": f"Bearer {v_token}"},
        )
    ).json()["id"]

    # 2. Create Admin (Initially Member)
    await client.post(
        "/api/v1/auth/register",
        json={
            "username": "admin",
            "email": "admin@example.com",
            "password": "password123",
        },
    )

    # 3. FORCE ADMIN ROLE IN DB
    from sqlalchemy import text

    await db_session.execute(
        text("UPDATE users SET role = 'owner' WHERE username = 'admin'")
    )
    await db_session.commit()

    # 4. Admin logs in
    admin_token = (
        await client.post(
            "/api/v1/auth/login", json={"username": "admin", "password": "password123"}
        )
    ).json()["access_token"]

    # 5. Admin deletes Victim's task
    response = await client.delete(
        f"/api/v1/tasks/{task_id}", headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 204  # Success (No Content)

    # Verify deletion
    assert (
        await client.get(
            f"/api/v1/tasks/{task_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
    ).status_code == 404


@pytest.mark.asyncio
async def test_update_own_task(client: AsyncClient):
    # Auth
    await client.post(
        "/api/v1/auth/register",
        json={
            "username": "updater",
            "email": "up@example.com",
            "password": "password123",
        },
    )
    token = (
        await client.post(
            "/api/v1/auth/login",
            json={"username": "updater", "password": "password123"},
        )
    ).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Task
    task = (
        await client.post(
            "/api/v1/tasks",
            json={"title": "Old Title", "status": "todo"},
            headers=headers,
        )
    ).json()

    # Update Task
    update_res = await client.patch(
        f"/api/v1/tasks/{task['id']}",
        json={"title": "New Title", "status": "done"},
        headers=headers,
    )
    assert update_res.status_code == 200

    data = update_res.json()
    assert data["title"] == "New Title"
    assert data["status"] == "done"

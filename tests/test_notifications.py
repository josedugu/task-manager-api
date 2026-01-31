"""
Tests for notification functionality.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_notification_on_task_assignment(client: AsyncClient):
    """Test that notification is created when task is assigned."""
    # Create two users
    await client.post(
        "/api/v1/auth/register",
        json={
            "username": "owner",
            "email": "owner@test.com",
            "password": "password123",
        },
    )
    owner_token = (
        await client.post(
            "/api/v1/auth/login",
            json={"username": "owner", "password": "password123"},
        )
    ).json()["access_token"]

    await client.post(
        "/api/v1/auth/register",
        json={
            "username": "assignee",
            "email": "assignee@test.com",
            "password": "password123",
        },
    )
    assignee_token = (
        await client.post(
            "/api/v1/auth/login",
            json={"username": "assignee", "password": "password123"},
        )
    ).json()["access_token"]

    # Get assignee user ID
    users_response = await client.get(
        "/api/v1/users", headers={"Authorization": f"Bearer {owner_token}"}
    )
    assignee_id = next(
        u["id"] for u in users_response.json() if u["username"] == "assignee"
    )

    # Create task assigned to assignee
    await client.post(
        "/api/v1/tasks",
        json={
            "title": "Assigned Task",
            "description": "Test",
            "status": "todo",
            "assigned_to_id": assignee_id,
        },
        headers={"Authorization": f"Bearer {owner_token}"},
    )

    # Check assignee's notifications
    notifications_response = await client.get(
        "/api/v1/notifications",
        headers={"Authorization": f"Bearer {assignee_token}"},
    )

    assert notifications_response.status_code == 200
    notifications = notifications_response.json()
    assert len(notifications) == 1
    assert notifications[0]["type"] == "task_assigned"
    assert "Assigned Task" in notifications[0]["message"]


@pytest.mark.asyncio
async def test_create_notification_on_comment(client: AsyncClient):
    """Test that notification is created when someone comments on a task."""
    # Create two users
    await client.post(
        "/api/v1/auth/register",
        json={
            "username": "taskowner",
            "email": "taskowner@test.com",
            "password": "password123",
        },
    )
    owner_token = (
        await client.post(
            "/api/v1/auth/login",
            json={"username": "taskowner", "password": "password123"},
        )
    ).json()["access_token"]

    await client.post(
        "/api/v1/auth/register",
        json={
            "username": "commenter",
            "email": "commenter@test.com",
            "password": "password123",
        },
    )
    commenter_token = (
        await client.post(
            "/api/v1/auth/login",
            json={"username": "commenter", "password": "password123"},
        )
    ).json()["access_token"]

    # Owner creates task
    task_response = await client.post(
        "/api/v1/tasks",
        json={"title": "Task for Comments", "status": "todo"},
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    task_id = task_response.json()["id"]

    # Get commenter user ID and assign task
    users_response = await client.get(
        "/api/v1/users", headers={"Authorization": f"Bearer {owner_token}"}
    )
    commenter_id = next(
        u["id"] for u in users_response.json() if u["username"] == "commenter"
    )

    await client.patch(
        f"/api/v1/tasks/{task_id}",
        json={"assigned_to_id": commenter_id},
        headers={"Authorization": f"Bearer {owner_token}"},
    )

    # Clear notifications from assignment
    await client.post(
        "/api/v1/notifications/mark-all-read",
        headers={"Authorization": f"Bearer {owner_token}"},
    )

    # Commenter adds comment
    await client.post(
        f"/api/v1/tasks/{task_id}/comments",
        json={"content": "This is a comment"},
        headers={"Authorization": f"Bearer {commenter_token}"},
    )

    # Check owner's notifications
    notifications_response = await client.get(
        "/api/v1/notifications",
        params={"unread_only": True},
        headers={"Authorization": f"Bearer {owner_token}"},
    )

    assert notifications_response.status_code == 200
    notifications = notifications_response.json()
    assert len(notifications) >= 1
    comment_notif = next(n for n in notifications if n["type"] == "task_comment")
    assert "commented on" in comment_notif["message"]


@pytest.mark.asyncio
async def test_mark_notification_as_read(client: AsyncClient):
    """Test marking a notification as read."""
    # Create user and task
    await client.post(
        "/api/v1/auth/register",
        json={
            "username": "reader",
            "email": "reader@test.com",
            "password": "password123",
        },
    )
    token = (
        await client.post(
            "/api/v1/auth/login",
            json={"username": "reader", "password": "password123"},
        )
    ).json()["access_token"]

    # Create another user
    await client.post(
        "/api/v1/auth/register",
        json={
            "username": "assigner",
            "email": "assigner@test.com",
            "password": "password123",
        },
    )
    assigner_token = (
        await client.post(
            "/api/v1/auth/login",
            json={"username": "assigner", "password": "password123"},
        )
    ).json()["access_token"]

    # Get reader ID
    users_response = await client.get(
        "/api/v1/users", headers={"Authorization": f"Bearer {assigner_token}"}
    )
    reader_id = next(
        u["id"] for u in users_response.json() if u["username"] == "reader"
    )

    # Assign task to reader
    await client.post(
        "/api/v1/tasks",
        json={
            "title": "Task to Mark Read",
            "status": "todo",
            "assigned_to_id": reader_id,
        },
        headers={"Authorization": f"Bearer {assigner_token}"},
    )

    # Get notification
    notifications_response = await client.get(
        "/api/v1/notifications",
        headers={"Authorization": f"Bearer {token}"},
    )
    notification_id = notifications_response.json()[0]["id"]

    # Mark as read
    mark_read_response = await client.patch(
        f"/api/v1/notifications/{notification_id}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert mark_read_response.status_code == 200
    assert mark_read_response.json()["is_read"] is True


@pytest.mark.asyncio
async def test_mark_all_notifications_as_read(client: AsyncClient):
    """Test marking all notifications as read."""
    # Create user
    await client.post(
        "/api/v1/auth/register",
        json={
            "username": "bulkreader",
            "email": "bulkreader@test.com",
            "password": "password123",
        },
    )
    token = (
        await client.post(
            "/api/v1/auth/login",
            json={"username": "bulkreader", "password": "password123"},
        )
    ).json()["access_token"]

    # Create another user to assign tasks
    await client.post(
        "/api/v1/auth/register",
        json={
            "username": "bulkassigner",
            "email": "bulkassigner@test.com",
            "password": "password123",
        },
    )
    assigner_token = (
        await client.post(
            "/api/v1/auth/login",
            json={"username": "bulkassigner", "password": "password123"},
        )
    ).json()["access_token"]

    # Get reader ID
    users_response = await client.get(
        "/api/v1/users", headers={"Authorization": f"Bearer {assigner_token}"}
    )
    reader_id = next(
        u["id"] for u in users_response.json() if u["username"] == "bulkreader"
    )

    # Create multiple tasks
    for i in range(3):
        await client.post(
            "/api/v1/tasks",
            json={
                "title": f"Task {i}",
                "status": "todo",
                "assigned_to_id": reader_id,
            },
            headers={"Authorization": f"Bearer {assigner_token}"},
        )

    # Mark all as read
    mark_all_response = await client.post(
        "/api/v1/notifications/mark-all-read",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert mark_all_response.status_code == 200
    assert mark_all_response.json()["marked_as_read"] == 3

    # Verify all are read
    notifications_response = await client.get(
        "/api/v1/notifications",
        params={"unread_only": True},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert len(notifications_response.json()) == 0


@pytest.mark.asyncio
async def test_delete_notification(client: AsyncClient):
    """Test deleting a notification."""
    # Create user
    await client.post(
        "/api/v1/auth/register",
        json={
            "username": "deleter",
            "email": "deleter@test.com",
            "password": "password123",
        },
    )
    token = (
        await client.post(
            "/api/v1/auth/login",
            json={"username": "deleter", "password": "password123"},
        )
    ).json()["access_token"]

    # Create another user
    await client.post(
        "/api/v1/auth/register",
        json={
            "username": "taskmaker",
            "email": "taskmaker@test.com",
            "password": "password123",
        },
    )
    taskmaker_token = (
        await client.post(
            "/api/v1/auth/login",
            json={"username": "taskmaker", "password": "password123"},
        )
    ).json()["access_token"]

    # Get deleter ID
    users_response = await client.get(
        "/api/v1/users", headers={"Authorization": f"Bearer {taskmaker_token}"}
    )
    deleter_id = next(
        u["id"] for u in users_response.json() if u["username"] == "deleter"
    )

    # Assign task
    await client.post(
        "/api/v1/tasks",
        json={
            "title": "Task to Delete",
            "status": "todo",
            "assigned_to_id": deleter_id,
        },
        headers={"Authorization": f"Bearer {taskmaker_token}"},
    )

    # Get notification
    notifications_response = await client.get(
        "/api/v1/notifications",
        headers={"Authorization": f"Bearer {token}"},
    )
    notification_id = notifications_response.json()[0]["id"]

    # Delete notification
    delete_response = await client.delete(
        f"/api/v1/notifications/{notification_id}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert delete_response.status_code == 204

    # Verify deleted
    notifications_response = await client.get(
        "/api/v1/notifications",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert len(notifications_response.json()) == 0


@pytest.mark.asyncio
async def test_due_date_notifications_created(client: AsyncClient, db_session):
    """Test that due date notifications are created for tasks."""
    from datetime import datetime, timedelta

    # Create user
    await client.post(
        "/api/v1/auth/register",
        json={
            "username": "dueuser",
            "email": "dueuser@test.com",
            "password": "password123",
        },
    )
    token = (
        await client.post(
            "/api/v1/auth/login",
            json={"username": "dueuser", "password": "password123"},
        )
    ).json()["access_token"]

    # Create task due in 2 days
    due_date = (datetime.utcnow() + timedelta(days=2)).isoformat()
    await client.post(
        "/api/v1/tasks",
        json={
            "title": "Due Soon Task",
            "status": "todo",
            "due_date": due_date,
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    # List tasks (triggers lazy notification check)
    await client.get("/api/v1/tasks", headers={"Authorization": f"Bearer {token}"})

    # Check notifications
    notifications_response = await client.get(
        "/api/v1/notifications",
        headers={"Authorization": f"Bearer {token}"},
    )

    notifications = notifications_response.json()
    due_soon_notifs = [n for n in notifications if n["type"] == "due_soon"]
    assert len(due_soon_notifs) >= 1
    assert "due in" in due_soon_notifs[0]["message"].lower()

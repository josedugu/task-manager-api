"""
Task service.
Contiene lógica de negocio para CRUD de tareas, comentarios y activity logs.
"""

import logging
from datetime import timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db import ActivityLog, Comment, Task, User
from src.schemas import (
    ActivityLogResponse,
    CommentCreate,
    CommentResponse,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)
from src.services.notification_service import NotificationService

logger = logging.getLogger(__name__)


class TaskService:
    """Service para operaciones CRUD de tareas."""

    @staticmethod
    async def _log_activity(
        db: AsyncSession,
        user_id: int,
        action: str,
        entity_type: str,
        entity_id: int,
        details: str | None = None,
    ) -> None:
        """Helper para registrar actividad."""
        log = ActivityLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
        )
        db.add(log)
        # No hacemos commit aquí, esperamos que el caller lo haga

    @staticmethod
    async def list_tasks(
        user: User,
        db: AsyncSession,
        status_filter: str | None = None,
        search: str | None = None,
    ) -> list[TaskResponse]:
        # Lazy check for due date notifications
        await NotificationService.check_and_create_due_date_notifications(db)

        query = select(Task)

        # 1. Aplicar filtro de Rol
        if not user.is_owner():
            logger.info(f"Member user_id={user.id} listing OWN + ASSIGNED tasks")
            query = query.where(
                (Task.owner_id == user.id) | (Task.assigned_to_id == user.id)
            )
        else:
            logger.info(f"Owner user_id={user.id} listing ALL tasks")

        # 2. Aplicar filtro de Status
        if status_filter:
            logger.info(f"Filtering by status: {status_filter}")
            query = query.where(Task.status == status_filter)

        # 3. Aplicar filtro de búsqueda (título o descripción)
        if search:
            search_pattern = f"%{search}%"
            logger.info(f"Searching for: {search}")
            query = query.where(
                (Task.title.ilike(search_pattern))
                | (Task.description.ilike(search_pattern))
            )

        result = await db.execute(query)
        tasks = result.scalars().all()
        return [TaskResponse.model_validate(task) for task in tasks]

    @staticmethod
    async def create_task(
        task_data: TaskCreate, user: User, db: AsyncSession
    ) -> TaskResponse:
        logger.info(f"Creating task for user_id={user.id}")

        if task_data.due_date and task_data.due_date.tzinfo:
            task_data.due_date = task_data.due_date.astimezone(timezone.utc).replace(
                tzinfo=None
            )

        new_task = Task(
            title=task_data.title,
            description=task_data.description,
            status=task_data.status,
            owner_id=user.id,
            assigned_to_id=task_data.assigned_to_id,
            due_date=task_data.due_date,
        )

        db.add(new_task)
        await db.flush()  # Para obtener el ID antes del commit final

        # Log Activity
        await TaskService._log_activity(
            db,
            user.id,
            "CREATE_TASK",
            "task",
            new_task.id,
            f"Created task '{new_task.title}'",
        )

        # Create notification if task is assigned to someone
        if new_task.assigned_to_id and new_task.assigned_to_id != user.id:
            result = await db.execute(
                select(User).where(User.id == new_task.assigned_to_id)
            )
            assigned_user = result.scalar_one_or_none()
            if assigned_user:
                await NotificationService.create_task_assigned_notification(
                    new_task, assigned_user, user, db
                )

        await db.commit()
        await db.refresh(new_task)
        return TaskResponse.model_validate(new_task)

    @staticmethod
    async def get_task(task_id: int, user: User, db: AsyncSession) -> TaskResponse:
        result = await db.execute(select(Task).where(Task.id == task_id))
        task = result.scalar_one_or_none()

        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        # Access Control
        can_access = (
            user.is_owner()
            or task.owner_id == user.id
            or task.assigned_to_id == user.id
        )
        if not can_access:
            raise HTTPException(status_code=403, detail="Not authorized")

        return TaskResponse.model_validate(task)

    @staticmethod
    async def update_task(
        task_id: int, task_data: TaskUpdate, user: User, db: AsyncSession
    ) -> TaskResponse:
        from sqlalchemy.orm import selectinload

        result = await db.execute(
            select(Task)
            .where(Task.id == task_id)
            .options(selectinload(Task.owner), selectinload(Task.assigned_to))
        )
        task = result.scalar_one_or_none()

        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        # Access Control
        can_modify = (
            user.is_owner()
            or task.owner_id == user.id
            or task.assigned_to_id == user.id
        )
        if not can_modify:
            raise HTTPException(status_code=403, detail="Not authorized")

        if task_data.due_date and task_data.due_date.tzinfo:
            task_data.due_date = task_data.due_date.astimezone(timezone.utc).replace(
                tzinfo=None
            )

        # Update fields
        update_dict = task_data.model_dump(exclude_unset=True)
        changes = []
        old_assigned_to_id = task.assigned_to_id

        for field, value in update_dict.items():
            current_value = getattr(task, field)
            if current_value != value:
                changes.append(f"{field}: {current_value} -> {value}")
                setattr(task, field, value)

        if changes:
            # Log Activity
            await TaskService._log_activity(
                db, user.id, "UPDATE_TASK", "task", task.id, ", ".join(changes)
            )

            # Create notification if task was assigned to someone new
            if (
                "assigned_to_id" in update_dict
                and task.assigned_to_id
                and task.assigned_to_id != old_assigned_to_id
                and task.assigned_to_id != user.id
            ):
                result = await db.execute(
                    select(User).where(User.id == task.assigned_to_id)
                )
                assigned_user = result.scalar_one_or_none()
                if assigned_user:
                    await NotificationService.create_task_assigned_notification(
                        task, assigned_user, user, db
                    )

            # Create general update notification
            await NotificationService.create_task_updated_notification(task, user, db)

        await db.commit()
        await db.refresh(task)
        return TaskResponse.model_validate(task)

    @staticmethod
    async def delete_task(task_id: int, user: User, db: AsyncSession) -> None:
        result = await db.execute(select(Task).where(Task.id == task_id))
        task = result.scalar_one_or_none()

        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        can_delete = user.is_owner() or task.owner_id == user.id
        if not can_delete:
            raise HTTPException(status_code=403, detail="Not authorized")

        await db.delete(task)
        await db.commit()

    # --- Comments ---
    @staticmethod
    async def add_comment(
        task_id: int, comment_data: CommentCreate, user: User, db: AsyncSession
    ) -> CommentResponse:
        # Check task existence & access
        await TaskService.get_task(task_id, user, db)  # Reuses perm check logic

        # Get task for notification (with eager loading to avoid lazy load issues)
        from sqlalchemy.orm import selectinload

        task_result = await db.execute(
            select(Task)
            .where(Task.id == task_id)
            .options(selectinload(Task.owner), selectinload(Task.assigned_to))
        )
        task = task_result.scalar_one()

        new_comment = Comment(
            content=comment_data.content, task_id=task_id, user_id=user.id
        )
        db.add(new_comment)
        await db.flush()

        # Log Activity
        await TaskService._log_activity(
            db, user.id, "COMMENTED", "task", task_id, f"Comment ID {new_comment.id}"
        )

        # Create comment notification
        await NotificationService.create_task_comment_notification(task, user, db)

        await db.commit()
        await db.refresh(new_comment)
        return CommentResponse.model_validate(new_comment)

    @staticmethod
    async def get_comments(
        task_id: int, user: User, db: AsyncSession
    ) -> list[CommentResponse]:
        await TaskService.get_task(task_id, user, db)  # Check perms

        result = await db.execute(
            select(Comment)
            .where(Comment.task_id == task_id)
            .order_by(Comment.created_at)
        )
        return [CommentResponse.model_validate(c) for c in result.scalars().all()]

    # --- History ---
    @staticmethod
    async def get_history(
        task_id: int, user: User, db: AsyncSession
    ) -> list[ActivityLogResponse]:
        await TaskService.get_task(task_id, user, db)  # Check perms

        result = await db.execute(
            select(ActivityLog)
            .where(ActivityLog.entity_type == "task", ActivityLog.entity_id == task_id)
            .order_by(ActivityLog.created_at.desc())
        )
        return [
            ActivityLogResponse.model_validate(log) for log in result.scalars().all()
        ]

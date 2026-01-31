"""
Notification service.
Business logic for notification management.
"""

import logging
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.notifications import Notification
from src.db.tasks import Task
from src.db.users import User
from src.schemas.notification import NotificationCreate

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for notification operations."""

    @staticmethod
    async def create_notification(
        notification_data: NotificationCreate, db: AsyncSession
    ) -> Notification:
        """
        Create a new notification.

        Args:
            notification_data: Notification data
            db: Database session

        Returns:
            Notification: Created notification
        """
        notification = Notification(
            user_id=notification_data.user_id,
            task_id=notification_data.task_id,
            type=notification_data.type,
            title=notification_data.title,
            message=notification_data.message,
        )

        db.add(notification)
        await db.commit()
        await db.refresh(notification)

        logger.info(
            f"Notification created: type={notification.type}, user_id={notification.user_id}"
        )
        return notification

    @staticmethod
    async def get_user_notifications(
        user_id: int, db: AsyncSession, unread_only: bool = False
    ) -> list[Notification]:
        """
        Get all notifications for a user.

        Args:
            user_id: User ID
            db: Database session
            unread_only: If True, only return unread notifications

        Returns:
            list[Notification]: List of notifications
        """
        query = select(Notification).where(Notification.user_id == user_id)

        if unread_only:
            query = query.where(not Notification.is_read)

        query = query.order_by(Notification.created_at.desc())

        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def mark_as_read(
        notification_id: int, user_id: int, db: AsyncSession
    ) -> Notification | None:
        """
        Mark a notification as read.

        Args:
            notification_id: Notification ID
            user_id: User ID (for authorization)
            db: Database session

        Returns:
            Notification | None: Updated notification or None if not found
        """
        result = await db.execute(
            select(Notification).where(
                Notification.id == notification_id, Notification.user_id == user_id
            )
        )
        notification = result.scalar_one_or_none()

        if not notification:
            return None

        notification.is_read = True
        await db.commit()
        await db.refresh(notification)

        logger.info(f"Notification {notification_id} marked as read")
        return notification

    @staticmethod
    async def mark_all_as_read(user_id: int, db: AsyncSession) -> int:
        """
        Mark all notifications as read for a user.

        Args:
            user_id: User ID
            db: Database session

        Returns:
            int: Number of notifications updated
        """
        result = await db.execute(
            select(Notification).where(
                Notification.user_id == user_id, not Notification.is_read
            )
        )
        notifications = result.scalars().all()

        count = 0
        for notification in notifications:
            notification.is_read = True
            count += 1

        await db.commit()
        logger.info(f"Marked {count} notifications as read for user {user_id}")
        return count

    @staticmethod
    async def delete_notification(
        notification_id: int, user_id: int, db: AsyncSession
    ) -> bool:
        """
        Delete a notification.

        Args:
            notification_id: Notification ID
            user_id: User ID (for authorization)
            db: Database session

        Returns:
            bool: True if deleted, False if not found
        """
        result = await db.execute(
            select(Notification).where(
                Notification.id == notification_id, Notification.user_id == user_id
            )
        )
        notification = result.scalar_one_or_none()

        if not notification:
            return False

        await db.delete(notification)
        await db.commit()

        logger.info(f"Notification {notification_id} deleted")
        return True

    @staticmethod
    async def create_task_assigned_notification(
        task: Task, assigned_user: User, assigner: User, db: AsyncSession
    ) -> None:
        """
        Create notification when a task is assigned.

        Args:
            task: Task that was assigned
            assigned_user: User who was assigned the task
            assigner: User who assigned the task
            db: Database session
        """
        if assigned_user.id == assigner.id:
            return  # Don't notify if user assigned task to themselves

        notification_data = NotificationCreate(
            user_id=assigned_user.id,
            task_id=task.id,
            type="task_assigned",
            title="New Task Assigned",
            message=f"{assigner.username} assigned you the task: {task.title}",
        )

        await NotificationService.create_notification(notification_data, db)

    @staticmethod
    async def create_task_comment_notification(
        task: Task, commenter: User, db: AsyncSession
    ) -> None:
        """
        Create notification when someone comments on a task.

        Args:
            task: Task that was commented on
            commenter: User who made the comment
            db: Database session
        """
        # Notify task owner if they're not the commenter
        if task.owner_id != commenter.id:
            notification_data = NotificationCreate(
                user_id=task.owner_id,
                task_id=task.id,
                type="task_comment",
                title="New Comment",
                message=f"{commenter.username} commented on: {task.title}",
            )
            await NotificationService.create_notification(notification_data, db)

        # Notify assigned user if they exist and are not the commenter or owner
        if (
            task.assigned_to_id
            and task.assigned_to_id != commenter.id
            and task.assigned_to_id != task.owner_id
        ):
            notification_data = NotificationCreate(
                user_id=task.assigned_to_id,
                task_id=task.id,
                type="task_comment",
                title="New Comment",
                message=f"{commenter.username} commented on: {task.title}",
            )
            await NotificationService.create_notification(notification_data, db)

    @staticmethod
    async def create_task_updated_notification(
        task: Task, updater: User, db: AsyncSession
    ) -> None:
        """
        Create notification when a task is updated.

        Args:
            task: Task that was updated
            updater: User who updated the task
            db: Database session
        """
        # Notify assigned user if they exist and are not the updater
        if task.assigned_to_id and task.assigned_to_id != updater.id:
            notification_data = NotificationCreate(
                user_id=task.assigned_to_id,
                task_id=task.id,
                type="task_updated",
                title="Task Updated",
                message=f"{updater.username} updated the task: {task.title}",
            )
            await NotificationService.create_notification(notification_data, db)

    @staticmethod
    async def check_and_create_due_date_notifications(db: AsyncSession) -> int:
        """
        Check all tasks and create notifications for due soon/overdue tasks.
        This should be called periodically or when listing tasks.

        Args:
            db: Database session

        Returns:
            int: Number of notifications created
        """
        now = datetime.utcnow()
        three_days_from_now = now + timedelta(days=3)

        # Get all tasks that are not done and have a due date
        result = await db.execute(
            select(Task).where(
                Task.status != "done",
                Task.due_date.isnot(None),
            )
        )
        tasks = result.scalars().all()

        notifications_created = 0

        for task in tasks:
            # Skip if no due date
            if not task.due_date:
                continue

            # Check if already notified recently (within last 24 hours)
            recent_notification = await db.execute(
                select(Notification)
                .where(
                    Notification.task_id == task.id,
                    Notification.type.in_(["due_soon", "overdue"]),
                    Notification.created_at >= now - timedelta(hours=24),
                )
                .limit(1)
            )
            if recent_notification.scalar():
                continue  # Already notified recently

            # Determine notification type
            notification_type = None
            title = None
            message = None

            if task.due_date < now:
                notification_type = "overdue"
                title = "Task Overdue"
                message = f"Task '{task.title}' is overdue!"
            elif task.due_date <= three_days_from_now:
                notification_type = "due_soon"
                title = "Task Due Soon"
                days_left = (task.due_date - now).days
                message = f"Task '{task.title}' is due in {days_left} day(s)"

            # Create notification if needed
            if notification_type:
                # Notify owner
                notification_data = NotificationCreate(
                    user_id=task.owner_id,
                    task_id=task.id,
                    type=notification_type,
                    title=title,
                    message=message,
                )
                await NotificationService.create_notification(notification_data, db)
                notifications_created += 1

                # Notify assigned user if different from owner
                if task.assigned_to_id and task.assigned_to_id != task.owner_id:
                    notification_data = NotificationCreate(
                        user_id=task.assigned_to_id,
                        task_id=task.id,
                        type=notification_type,
                        title=title,
                        message=message,
                    )
                    await NotificationService.create_notification(notification_data, db)
                    notifications_created += 1

        logger.info(f"Created {notifications_created} due date notifications")
        return notifications_created

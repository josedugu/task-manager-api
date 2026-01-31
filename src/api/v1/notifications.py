"""
Notifications router (API v1).
Endpoints: CRUD operations for notifications
"""

from fastapi import APIRouter, status

from src.api.dependencies import CurrentUser, DatabaseDep
from src.schemas.notification import NotificationResponse
from src.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=list[NotificationResponse])
async def list_notifications(
    current_user: CurrentUser, db: DatabaseDep, unread_only: bool = False
) -> list[NotificationResponse]:
    """
    List all notifications for the current user.

    Args:
        current_user: Usuario autenticado
        db: Sesión de base de datos
        unread_only: If True, only return unread notifications

    Returns:
        list[NotificationResponse]: Lista de notificaciones
    """
    notifications = await NotificationService.get_user_notifications(
        current_user.id, db, unread_only
    )
    return notifications


@router.patch("/{notification_id}", response_model=NotificationResponse)
async def mark_notification_as_read(
    notification_id: int, current_user: CurrentUser, db: DatabaseDep
) -> NotificationResponse:
    """
    Mark a notification as read.

    Args:
        notification_id: ID de la notificación
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        NotificationResponse: Notificación actualizada

    Raises:
        404: Notificación no encontrada
    """
    from fastapi import HTTPException

    notification = await NotificationService.mark_as_read(
        notification_id, current_user.id, db
    )

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    return notification


@router.post("/mark-all-read", status_code=status.HTTP_200_OK)
async def mark_all_notifications_as_read(
    current_user: CurrentUser, db: DatabaseDep
) -> dict:
    """
    Mark all notifications as read for the current user.

    Args:
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        dict: Number of notifications marked as read
    """
    count = await NotificationService.mark_all_as_read(current_user.id, db)
    return {"marked_as_read": count}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: int, current_user: CurrentUser, db: DatabaseDep
) -> None:
    """
    Delete a notification.

    Args:
        notification_id: ID de la notificación
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Raises:
        404: Notificación no encontrada
    """
    from fastapi import HTTPException

    deleted = await NotificationService.delete_notification(
        notification_id, current_user.id, db
    )

    if not deleted:
        raise HTTPException(status_code=404, detail="Notification not found")

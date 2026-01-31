"""
Tasks router (API v1).
Endpoints: CRUD operations for tasks
"""

from fastapi import APIRouter, status

from src.api.dependencies import CurrentUser, DatabaseDep
from src.schemas import (
    ActivityLogResponse,
    CommentCreate,
    CommentResponse,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)
from src.services import TaskService

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.get("", response_model=list[TaskResponse])
async def list_tasks(
    current_user: CurrentUser,
    db: DatabaseDep,
    status: str | None = None,
    search: str | None = None,
) -> list[TaskResponse]:
    """
    Lista las tareas del usuario, opcionalmente filtradas por estado y/o búsqueda.

    Args:
        current_user: Usuario autenticado
        db: Sesión de base de datos
        status: (Query Param) Filtro opcional por estado (pending, in_progress, done)
        search: (Query Param) Búsqueda por título o descripción

    Returns:
        list[TaskResponse]: Lista de tareas
    """
    return await TaskService.list_tasks(
        current_user, db, status_filter=status, search=search
    )


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate, current_user: CurrentUser, db: DatabaseDep
) -> TaskResponse:
    """
    Crea una nueva tarea.

    Args:
        task_data: Datos de la tarea (title, description, status)
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        TaskResponse: Tarea creada
    """
    return await TaskService.create_task(task_data, current_user, db)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int, current_user: CurrentUser, db: DatabaseDep
) -> TaskResponse:
    """
    Obtiene una tarea por ID.

    Args:
        task_id: ID de la tarea
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        TaskResponse: Tarea encontrada

    Raises:
        404: Tarea no encontrada
        403: No autorizado para acceder a esta tarea
    """
    return await TaskService.get_task(task_id, current_user, db)


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int, task_data: TaskUpdate, current_user: CurrentUser, db: DatabaseDep
) -> TaskResponse:
    """
    Actualiza una tarea.

    Args:
        task_id: ID de la tarea
        task_data: Campos a actualizar (title, description, status)
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Returns:
        TaskResponse: Tarea actualizada

    Raises:
        404: Tarea no encontrada
        403: No autorizado para modificar esta tarea
    """
    return await TaskService.update_task(task_id, task_data, current_user, db)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: int, current_user: CurrentUser, db: DatabaseDep) -> None:
    """
    Elimina una tarea.

    Args:
        task_id: ID de la tarea
        current_user: Usuario autenticado
        db: Sesión de base de datos

    Raises:
        404: Tarea no encontrada
        403: No autorizado para eliminar esta tarea
    """
    await TaskService.delete_task(task_id, current_user, db)


# --- Comments & History Endpoints ---


@router.post("/{task_id}/comments", response_model=CommentResponse)
async def add_comment(
    task_id: int,
    comment: CommentCreate,
    current_user: CurrentUser,
    db: DatabaseDep,
) -> CommentResponse:
    """Añadir comentario a una tarea."""
    return await TaskService.add_comment(task_id, comment, current_user, db)


@router.get("/{task_id}/comments", response_model=list[CommentResponse])
async def list_comments(
    task_id: int, current_user: CurrentUser, db: DatabaseDep
) -> list[CommentResponse]:
    """Listar comentarios de una tarea."""
    return await TaskService.get_comments(task_id, current_user, db)


@router.get("/{task_id}/history", response_model=list[ActivityLogResponse])
async def get_history(
    task_id: int, current_user: CurrentUser, db: DatabaseDep
) -> list[ActivityLogResponse]:
    """Ver historial de cambios de una tarea."""
    return await TaskService.get_history(task_id, current_user, db)

import asyncio

from sqlalchemy import select

from src.db.base import AsyncSessionLocal
from src.db.tasks import Task
from src.db.users import User


async def inspect_task():
    try:
        async with AsyncSessionLocal() as session:
            # Find the tasks
            result = await session.execute(
                select(Task).where(Task.title == "Update dependencies")
            )
            tasks = result.scalars().all()

            if tasks:
                print(f"Found {len(tasks)} tasks with title 'Update dependencies':")
                for task in tasks:
                    print(f"--- Task ID: {task.id} ---")
                    print(f"Title: {task.title}")
                    print(f"Assigned To ID: {task.assigned_to_id}")
                    print(f"Owner ID: {task.owner_id}")
                    print(f"Status: {task.status}")
                    print(f"Due Date: {task.due_date}")
                    print(f"Updated At: {task.updated_at}")

                    # If assigned, check if user exists
                    assigned_user_name = "None"
                    if task.assigned_to_id:
                        user_res = await session.execute(
                            select(User).where(User.id == task.assigned_to_id)
                        )
                        user = user_res.scalar_one_or_none()
                        if user:
                            assigned_user_name = f"{user.username} (ID: {user.id})"
                        else:
                            assigned_user_name = "ID not found in Users table"

                    print(f"Assigned User: {assigned_user_name}")
            else:
                print("Task 'Update dependencies' not found.")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    asyncio.run(inspect_task())

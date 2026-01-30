import asyncio
import logging
import random
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from src.core.config import settings
from src.core.security import hash_password
from src.db import Comment, Task, User, UserRole

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def seed():
    engine = create_async_engine(settings.DATABASE_URL)
    session_maker = async_sessionmaker(engine, expire_on_commit=False)

    async with session_maker() as db:
        logger.info("🌱 Seeding database...")

        # 1. Users
        password_hash = hash_password("password123")

        users_data = [
            {
                "username": "admin",
                "email": "admin@example.com",
                "role": UserRole.OWNER.value,
            },
            {
                "username": "alice",
                "email": "alice@example.com",
                "role": UserRole.MEMBER.value,
            },
            {
                "username": "bob",
                "email": "bob@example.com",
                "role": UserRole.MEMBER.value,
            },
            {
                "username": "charlie",
                "email": "charlie@example.com",
                "role": UserRole.MEMBER.value,
            },
        ]

        users = []
        for u in users_data:
            user = User(
                username=u["username"],
                email=u["email"],
                hashed_password=password_hash,
                role=u["role"],
                is_active=True,
            )
            db.add(user)
            users.append(user)

        await db.commit()
        for u in users:
            await db.refresh(u)

        logger.info(f"✅ Created {len(users)} users. (Password: password123)")

        # 2. Tasks
        statuses = ["todo", "in_progress", "done"]
        titles = [
            "Fix navigation bug",
            "Refactor auth service",
            "Update dependencies",
            "Design new logo",
            "Write documentation",
            "Setup CI/CD",
            "Optimize database queries",
            "Add dark mode",
            "Meeting with client",
        ]

        owner = users[0]
        members = users[1:]

        tasks = []
        for _ in range(15):
            assigned_to = random.choice(members + [None])
            task = Task(
                title=random.choice(titles),
                description="This is a generated task description for testing.",
                status=random.choice(statuses),
                owner_id=owner.id,  # Admin owns challenges
                assigned_to_id=assigned_to.id if assigned_to else None,
                due_date=datetime.utcnow() + timedelta(days=random.randint(1, 10)),
            )
            db.add(task)
            tasks.append(task)

        await db.commit()
        for t in tasks:
            await db.refresh(t)
        logger.info(f"✅ Created {len(tasks)} tasks.")

        # 3. Comments
        comments_texts = [
            "Looking into this",
            "Fixed in latest commit",
            "Needs review",
            "Can you clarify?",
            "Great job!",
            "Blocked by other task",
        ]

        for task in tasks:
            # Add 0-3 comments per task
            for _ in range(random.randint(0, 3)):
                commentor = random.choice(users)
                comment = Comment(
                    content=random.choice(comments_texts),
                    task_id=task.id,
                    user_id=commentor.id,
                )
                db.add(comment)

        await db.commit()
        logger.info("✅ Added comments.")
        logger.info("✨ Seeding completed successfully!")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())

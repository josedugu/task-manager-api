"""
Database Seed Script
====================

This script populates the database with sample data for development and testing.

Usage:
    # From project root
    uv run python -m src.scripts.seed_db

    # Or with Docker
    docker-compose exec api python -m src.scripts.seed_db

Features:
    - Creates default users (admin + members)
    - Generates sample tasks with various statuses
    - Adds comments to tasks
    - Creates sample notifications
    - Idempotent: safe to run multiple times (skips existing data)

Default Users:
    | Username | Password    | Role   |
    |----------|-------------|--------|
    | admin    | password123 | Owner  |
    | alice    | password123 | Member |
    | bob      | password123 | Member |
    | charlie  | password123 | Member |
"""

import asyncio
import logging
import random
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from src.core.config import settings
from src.core.security import hash_password
from src.db import Comment, Notification, Task, User, UserRole

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Sample data
USERS_DATA = [
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

TASK_TITLES = [
    "Fix navigation bug in sidebar",
    "Refactor authentication service",
    "Update project dependencies",
    "Design new company logo",
    "Write API documentation",
    "Setup CI/CD pipeline",
    "Optimize database queries",
    "Implement dark mode toggle",
    "Schedule meeting with client",
    "Review pull request #42",
    "Add unit tests for auth module",
    "Configure monitoring alerts",
    "Migrate to PostgreSQL 16",
    "Implement password reset flow",
    "Create onboarding tutorial",
]

TASK_DESCRIPTIONS = [
    "This task requires careful attention to detail and thorough testing.",
    "Please prioritize this as it's blocking other team members.",
    "Follow the design specs in Figma before implementing.",
    "Make sure to update the related documentation after completion.",
    "Coordinate with the backend team before starting.",
    "This is a quick fix that should take less than an hour.",
    "Research best practices before implementing the solution.",
    "Consider backward compatibility when making changes.",
]

COMMENT_TEXTS = [
    "Looking into this now.",
    "Fixed in the latest commit, please review.",
    "This needs additional review from the team.",
    "Can you clarify the requirements?",
    "Great progress! Keep it up.",
    "Blocked by another task, will resume soon.",
    "I have some questions about the implementation.",
    "Updated the PR with the requested changes.",
    "Testing in staging environment.",
    "Ready for QA review.",
]


async def seed():
    """Main seed function - populates database with sample data."""
    engine = create_async_engine(settings.DATABASE_URL)
    session_maker = async_sessionmaker(engine, expire_on_commit=False)

    async with session_maker() as db:
        logger.info("🌱 Starting database seed...")

        # Check if already seeded
        result = await db.execute(select(User).where(User.username == "admin"))
        if result.scalar_one_or_none():
            logger.info("⚠️  Database already seeded. Skipping...")
            logger.info("   To reseed, drop the database and run migrations first.")
            await engine.dispose()
            return

        # 1. Create Users
        password_hash = hash_password("password123")
        users = []

        for user_data in USERS_DATA:
            user = User(
                username=user_data["username"],
                email=user_data["email"],
                hashed_password=password_hash,
                role=user_data["role"],
                is_active=True,
            )
            db.add(user)
            users.append(user)

        await db.commit()
        for user in users:
            await db.refresh(user)

        logger.info(f"✅ Created {len(users)} users (password: password123)")

        # 2. Create Tasks
        statuses = ["todo", "in_progress", "done"]
        owner = users[0]  # admin
        members = users[1:]  # alice, bob, charlie

        tasks = []
        for i in range(15):
            # Randomly assign to a member or leave unassigned
            assigned_to = random.choice(members + [None])

            # Vary due dates: some past, some future
            days_offset = random.randint(-3, 14)
            due_date = datetime.utcnow() + timedelta(days=days_offset)

            task = Task(
                title=TASK_TITLES[i % len(TASK_TITLES)],
                description=random.choice(TASK_DESCRIPTIONS),
                status=random.choice(statuses),
                owner_id=owner.id,
                assigned_to_id=assigned_to.id if assigned_to else None,
                due_date=due_date,
            )
            db.add(task)
            tasks.append(task)

        await db.commit()
        for task in tasks:
            await db.refresh(task)

        logger.info(f"✅ Created {len(tasks)} tasks")

        # 3. Create Comments
        comment_count = 0
        for task in tasks:
            # Add 0-3 comments per task
            num_comments = random.randint(0, 3)
            for _ in range(num_comments):
                commenter = random.choice(users)
                comment = Comment(
                    content=random.choice(COMMENT_TEXTS),
                    task_id=task.id,
                    user_id=commenter.id,
                )
                db.add(comment)
                comment_count += 1

        await db.commit()
        logger.info(f"✅ Created {comment_count} comments")

        # 4. Create Sample Notifications
        notification_types = [
            (
                "task_assigned",
                "Task Assigned",
                "You have been assigned to task '{title}'",
            ),
            ("task_updated", "Task Updated", "Task '{title}' has been updated"),
            ("due_soon", "Due Soon", "Task '{title}' is due soon"),
            ("task_comment", "New Comment", "New comment on task '{title}'"),
        ]

        notification_count = 0
        all_users = [owner] + members  # Include admin too
        for user in all_users:
            # Create 3-5 notifications per member, mostly unread
            for i in range(random.randint(3, 5)):
                task = random.choice(tasks)
                notif_type, title, message_template = random.choice(notification_types)
                notification = Notification(
                    user_id=user.id,
                    task_id=task.id,
                    type=notif_type,
                    title=title,
                    message=message_template.format(title=task.title),
                    is_read=(i == 0),  # Only first one is read, rest are unread
                )
                db.add(notification)
                notification_count += 1

        await db.commit()
        logger.info(f"✅ Created {notification_count} notifications")

        # Summary
        logger.info("")
        logger.info("=" * 50)
        logger.info("✨ Database seeding completed successfully!")
        logger.info("=" * 50)
        logger.info("")
        logger.info("Default credentials:")
        logger.info("  Admin:  admin / password123")
        logger.info("  Member: alice / password123")
        logger.info("  Member: bob / password123")
        logger.info("  Member: charlie / password123")
        logger.info("")

    await engine.dispose()


async def clear_and_seed():
    """Clear all data and reseed (use with caution)."""
    engine = create_async_engine(settings.DATABASE_URL)
    session_maker = async_sessionmaker(engine, expire_on_commit=False)

    async with session_maker() as db:
        logger.warning("🗑️  Clearing all data...")

        # Delete in order to respect foreign keys
        await db.execute(Notification.__table__.delete())
        await db.execute(Comment.__table__.delete())
        await db.execute(Task.__table__.delete())
        await db.execute(User.__table__.delete())
        await db.commit()

        logger.info("✅ All data cleared")

    await engine.dispose()

    # Now seed
    await seed()


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--force":
        asyncio.run(clear_and_seed())
    else:
        asyncio.run(seed())

# Task Manager Application - Solution Documentation

## Overview
This project is a full-stack Task Manager application built with **FastAPI** (Backend) and **React** (Frontend). It implements advanced features such as Role-Based Access Control (RBAC), Activity Logging, Task Comments, and Assignment.

## Architecture

### Backend (Python/FastAPI)
The backend follows a **Layered Architecture** to ensure separation of concerns:
- **`src/api`**: Handles HTTP requests, dependency injection, and routing.
- **`src/services`**: Contains business logic (Auth, Tasks). Activity logging is handled explicitly here.
- **`src/schemas`**: Pydantic models for request/response validation.
- **`src/db`**: SQLAlchemy models (PostgreSQL) and database connection logic.

**Key Decisions:**
- **Explicit Logging**: Instead of using SQLAlchemy hooks, activity logs are created explicitly in the service layer (`_log_activity`). This provides more context and control over what constitutes a "business event".
- **RBAC**: Implemented using a custom `UserRole` enum. Permissions are checked imperatively in Service methods (e.g., `user.is_owner()`).
- **Async**: Fully asynchronous stack using `asyncpg` and `aiosqlite` (for tests).

### Frontend (React/Vite)
The frontend uses a modern React stack with a **Service-Oriented** structure:
- **`services/`**: Abstracts API calls (`auth.service.js`, `task.service.js`).
- **`context/`**: Manages global state (Authentication).
- **`pages/`**: View components (`Dashboard`, `Login`).
- **Styles**: Plain CSS with variables and utility classes (no heavy UI framework, though mimicking Tailwind classes for familiarity).

## Features Implemented
1.  **Authentication**: JWT-based login/register.
2.  **Task Management**: CRUD operations, Status filtering (Todo, In Progress, Done).
3.  **Advanced Features**:
    - **Assignment**: Owners can assign tasks to users.
    - **Comments**: Users can discuss tasks.
    - **Activity Log**: Full audit trail of changes (Creation, Updates, Comments).
4.  **Role-Based Access Control**:
    - **Owners**: Can manage all tasks and delete specific ones.
    - **Members**: Can only manage their own or assigned tasks.

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+

### Running the Application

1.  **Start Backend (Docker)**:
    ```bash
    docker-compose up -d --build
    ```
    API will run at `http://localhost:8000`.

2.  **Start Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    App will run at `http://localhost:5173`.

### Running Tests
The backend includes a comprehensive test suite using `pytest` and `aiosqlite`:
```bash
# In the root directory
uv run pytest
```

## Trade-offs
- **Auth Persistence**: For simplicity, JWT is stored in `localStorage`. In a high-security environment, `httpOnly` cookies would be preferred to prevent XSS.
- **State Management**: React `Context` is used. For a larger app, `Zustand` or `Redux` might be better.
- **Database**: Activity Logs share the same DB as main data. In high-scale systems, an append-only log store (e.g., ElasticSearch, DynamoDB) would be preferable.

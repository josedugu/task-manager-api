# Task Manager Application - Solution Documentation

## Overview

This project is a full-stack Task Manager application built with **FastAPI** (Backend) and **React** (Frontend). It implements all required features plus bonus functionality including Role-Based Access Control (RBAC), Activity Logging, Task Comments, Notifications, and Search.

---

## Architecture

### Backend (Python/FastAPI)

The backend follows a **Layered Architecture** to ensure separation of concerns:

```
src/
├── api/v1/          # HTTP endpoints and routing
├── services/        # Business logic layer
├── schemas/         # Pydantic models (request/response validation)
├── db/              # SQLAlchemy models and database connection
├── core/            # Security, logging, and configuration
└── scripts/         # Utility scripts (database seeding)
```

**Key Architectural Decisions:**

| Decision | Rationale |
|----------|-----------|
| **Layered Architecture** | Clear separation between API, business logic, and data layers makes the code maintainable and testable |
| **Async SQLAlchemy** | Using `asyncpg` for PostgreSQL enables high concurrency without blocking |
| **Service Pattern** | Business logic in services keeps endpoints thin and reusable |
| **Dependency Injection** | FastAPI's DI system for database sessions and current user |

### Frontend (React/Vite)

The frontend uses a modern React stack with a **Service-Oriented** structure:

```
frontend/src/
├── api/             # API client configuration
├── services/        # API call abstractions
├── hooks/           # Custom React hooks (useTasks, useDebounce, etc.)
├── context/         # Global state (Authentication)
├── components/      # Reusable UI components
├── pages/           # Route-level components
└── schemas/         # Zod validation schemas
```

---

## Architectural Decisions

### 1. JWT Authentication with localStorage
- **Decision**: Store JWT tokens in localStorage
- **Why**: Simple implementation, works well for SPAs
- **Trade-off**: Less secure than httpOnly cookies (see Trade-offs section)

### 2. Explicit Activity Logging
- **Decision**: Log activities explicitly in the service layer instead of using SQLAlchemy hooks
- **Why**: Provides more context and control over what constitutes a "business event"
- **Benefit**: Can include user context and custom messages

### 3. Role-Based Access Control (RBAC)
- **Decision**: Implement using a `UserRole` enum with imperative checks
- **Why**: Simple and explicit permission checking in service methods
- **Implementation**: `user.is_owner()` method for role verification

### 4. React Query for Server State
- **Decision**: Use TanStack Query instead of Redux/Context for server state
- **Why**: Built-in caching, background refetching, and optimistic updates
- **Benefit**: Reduced boilerplate and better UX with loading states

### 5. Debounced Search
- **Decision**: Implement client-side debounce (400ms) for search
- **Why**: Reduces API calls while typing, better UX
- **Implementation**: Custom `useDebounce` hook

---

## Trade-offs Considered

| Trade-off | Chosen Approach | Alternative | Reasoning |
|-----------|-----------------|-------------|-----------|
| **Auth Storage** | localStorage | httpOnly cookies | Simpler implementation; for production, cookies would prevent XSS token theft |
| **State Management** | React Context + Query | Redux/Zustand | Sufficient for this app size; Query handles server state well |
| **Activity Logs DB** | Same PostgreSQL DB | Separate log store | Simpler setup; for high-scale, ElasticSearch would be better |
| **Search** | SQL ILIKE | Full-text search | Sufficient for small datasets; PostgreSQL FTS for larger scale |
| **Notifications** | In-app only | Email/Push | Focused on core functionality; email would require SMTP setup |
| **Real-time Updates** | Polling via React Query | WebSockets | Simpler; WebSockets would provide instant updates |

---

## What I Prioritized and Why

### Priority 1: MVP Features (Must Have)
1. **Authentication** - Foundation for all protected features
2. **Task CRUD** - Core functionality of the application
3. **Role-based access** - Security requirement
4. **Minimal React frontend** - Required for API interaction

### Priority 2: Should Have Features
5. **Task filtering by status** - Essential for task management UX
6. **Task assignment** - Team collaboration feature

### Priority 3: Nice to Have (Bonus)
7. **Comments** - Enables team discussion on tasks
8. **Activity Log** - Audit trail for accountability
9. **Due date notifications** - Proactive task management
10. **Search functionality** - Quick task discovery

### Priority 4: Production Readiness
11. **Comprehensive tests** - 40+ tests covering critical paths
12. **Error handling** - Proper HTTP status codes and messages
13. **Logging** - Centralized logging configuration
14. **Security** - Password hashing, JWT validation, input validation

---

## Features Implemented

### MVP (Must Have) - 100% Complete
- [x] User authentication (JWT-based login)
- [x] Task CRUD operations
- [x] Role-based access (Owner vs Member)
- [x] React frontend with API integration

### Should Have - 100% Complete
- [x] Task filtering by status (todo, in_progress, done)
- [x] Task assignment to users

### Nice to Have (Bonus) - 100% Complete
- [x] Task comments with timestamps
- [x] Due date notifications (due_soon, overdue)
- [x] Activity log (CREATE, UPDATE, COMMENT actions)
- [x] Advanced frontend features (responsive, dark mode, skeletons)

### Stretch Goals - 100% Complete
- [x] Task management UI with expandable details
- [x] Task filtering and search (with debounce)
- [x] User assignment interface
- [x] Responsive design (mobile-first)

---

## Security Implementation

### Rate Limiting (DDoS Protection)

The API implements rate limiting using **SlowAPI** to protect against:
- Brute force attacks on login
- Registration abuse
- API resource exhaustion

| Endpoint | Limit | Purpose |
|----------|-------|---------|
| `POST /auth/login` | 5/minute | Brute force protection |
| `POST /auth/register` | 3/hour | Registration abuse prevention |
| All other endpoints | 1000/hour | General DDoS protection |

**Important Note for Testing:**

Rate limiting is **disabled during tests** to prevent test failures due to rate limit exceeded errors. This is configured in `tests/conftest.py`:

```python
# Disable rate limiting for tests
limiter.enabled = False
```

**Why this is necessary:**
- Tests execute many rapid requests (register, login, CRUD operations)
- Rate limits would cause tests to fail with HTTP 429 errors
- Testing focuses on functionality, not rate limiting behavior

**To enable rate limiting in tests** (not recommended):
1. Comment out `limiter.enabled = False` in `tests/conftest.py`
2. Be aware that tests may fail, especially:
   - `test_register_duplicate_user` (expects 400, gets 429)
   - `test_login_*` tests (multiple rapid login attempts)
   - Any test creating multiple tasks/comments quickly

**Production behavior:** Rate limiting is fully active in production and development environments.

### Security Headers

All responses include security headers:

| Header | Value | Purpose |
|--------|-------|---------|
| `Strict-Transport-Security` | max-age=31536000 | Force HTTPS |
| `X-Content-Type-Options` | nosniff | Prevent MIME sniffing |
| `X-Frame-Options` | DENY | Prevent clickjacking |
| `X-XSS-Protection` | 1; mode=block | Legacy XSS protection |
| `Content-Security-Policy` | default-src 'self' | Injection prevention |
| `Referrer-Policy` | strict-origin-when-cross-origin | Control referrer |
| `Permissions-Policy` | geolocation=()... | Restrict browser APIs |
| `Cache-Control` | no-store, private | Prevent caching sensitive data |

### Additional Security Measures

- **Password Hashing**: bcrypt with automatic salt generation
- **JWT Authentication**: HS256 with configurable expiration
- **Input Validation**: Pydantic schemas with strict validation
- **SQL Injection Protection**: SQLAlchemy ORM with parameterized queries
- **CORS Restrictive**: Only allowed origins, methods, and headers
- **SQL Logging Disabled**: In production to prevent info disclosure

---

## What I Would Improve With More Time

### Backend Improvements
1. **Pagination** - Add limit/offset for task listing to handle large datasets
2. **Full-text Search** - PostgreSQL FTS for better search performance
3. ~~**Rate Limiting**~~ - ✅ Implemented
4. **Email Notifications** - Send emails for due dates and assignments
5. **WebSocket Support** - Real-time notifications without polling
6. **API Versioning** - More robust versioning strategy
7. **Database Migrations** - Alembic for production schema changes

### Frontend Improvements
1. **E2E Tests** - Playwright/Cypress for full user flow testing
2. **Optimistic Updates** - Better UX for mutations
3. **Offline Support** - Service worker for offline capability
4. **Accessibility** - ARIA labels and keyboard navigation
5. **Internationalization** - i18n support for multiple languages
6. **Dashboard Metrics** - Charts and statistics for task overview

### Infrastructure
1. **CI/CD Pipeline** - GitHub Actions for automated testing and deployment
2. **Docker Production Build** - Multi-stage builds for smaller images
3. **Monitoring** - APM and error tracking (Sentry)
4. **Load Testing** - Verify performance under load

---

## How to Run and Test

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Python 3.13+ (for local development)

### Running the Application

#### Option 1: Docker (Recommended)
```bash
# Start backend + database
docker-compose up -d --build

# API runs at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

#### Option 2: Local Development
```bash
# Start database only
docker-compose up -d db

# Install Python dependencies
uv pip install -e ".[dev]"

# Run backend
uvicorn src.main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev

# App runs at http://localhost:5173
```

> **Note on Frontend-Backend Connection:**
> In the development environment, the connection is managed via a **Vite Proxy** configured in `vite.config.js`. This automatically redirects all requests starting with `/api` to `http://127.0.0.1:8000`, avoiding CORS issues and the need to configure environment variables for the local API URL.

### Running Tests

#### Backend Tests
```bash
# Run all tests
uv run pytest

# Run with verbose output
uv run pytest -v

# Run specific test file
uv run pytest tests/test_tasks.py
```

#### Frontend Tests
```bash
cd frontend
npm test
```

### Database Seeding

The project includes a seed script to populate the database with sample data for development and testing.

```bash
# Run seed (from project root)
uv run python -m src.scripts.seed_db

# Or with Docker
docker-compose exec api python -m src.scripts.seed_db

# Force reseed (clears all data first)
uv run python -m src.scripts.seed_db --force
```

**What the seed creates:**
- 4 users (1 admin + 3 members)
- 15 sample tasks with various statuses
- Random comments on tasks
- Sample notifications

**Features:**
- **Idempotent**: Safe to run multiple times (skips if data exists)
- **Force mode**: Use `--force` flag to clear and reseed
- **Realistic data**: Varied task titles, descriptions, and due dates

### Default Users

After seeding, the following users are available:

| Username | Password | Role | Description |
|----------|----------|------|-------------|
| `admin` | `password123` | Owner | Can see and manage all tasks |
| `alice` | `password123` | Member | Can only see own/assigned tasks |
| `bob` | `password123` | Member | Can only see own/assigned tasks |
| `charlie` | `password123` | Member | Can only see own/assigned tasks |

---

## Dependencies Added/Modified

### Backend
| Dependency | Purpose |
|------------|---------|
| `fastapi` | Web framework |
| `sqlalchemy[asyncio]` | Async ORM |
| `asyncpg` | PostgreSQL async driver |
| `python-jose` | JWT handling |
| `bcrypt` | Password hashing |
| `pydantic` | Data validation |
| `pytest-asyncio` | Async test support |
| `aiosqlite` | SQLite for tests |

### Frontend
| Dependency | Purpose |
|------------|---------|
| `react-router-dom` | Client-side routing |
| `@tanstack/react-query` | Server state management |
| `react-hook-form` | Form handling |
| `zod` | Schema validation |
| `lucide-react` | Icons |
| `sonner` | Toast notifications |

---

## API Endpoints Summary

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login and get JWT token |
| POST | `/api/v1/auth/register` | Register new user |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/tasks` | List tasks (supports `?status=` and `?search=`) |
| POST | `/api/v1/tasks` | Create task |
| GET | `/api/v1/tasks/{id}` | Get task by ID |
| PATCH | `/api/v1/tasks/{id}` | Update task |
| DELETE | `/api/v1/tasks/{id}` | Delete task |
| POST | `/api/v1/tasks/{id}/comments` | Add comment |
| GET | `/api/v1/tasks/{id}/comments` | List comments |
| GET | `/api/v1/tasks/{id}/history` | Get activity history |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/notifications` | List user notifications |
| PATCH | `/api/v1/notifications/{id}` | Mark as read |
| POST | `/api/v1/notifications/mark-all-read` | Mark all as read |
| DELETE | `/api/v1/notifications/{id}` | Delete notification |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users` | List active users |

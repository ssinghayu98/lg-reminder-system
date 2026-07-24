# LG Employee Reminder System
vercel link:- https://lg-reminder-system.vercel.app/login
backend:- https://dashboard.render.com/web/srv-d9b2o2hkh4rs73cc7tjg

A production-ready enterprise web application for automated employee task reminders, deadline tracking, and escalation management.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, ShadCN UI, React Query, Axios |
| Backend | Java 21, Spring Boot 3, Spring Security, Spring Data JPA, Spring Mail, Spring Scheduler |
| Database | MySQL 8 |
| Auth | JWT + Refresh Tokens |
| Email | Spring Mail (Gmail SMTP / Company SMTP) |
| Deployment | Vercel (frontend), Render (backend), Railway MySQL |

---

## Features

- **3 User Roles**: Super Admin, Manager, Employee with RBAC
- **Automated Reminder Scheduler**: Runs daily at 8 AM, sends deadline/recurring reminders
- **Smart Escalation**: Auto-escalates overdue tasks to managers at 3, 7, 15 days
- **In-App Notifications**: Real-time notification center with unread count
- **Reports & Analytics**: Dashboard charts, Excel exports for tasks and employees
- **Email Templates**: HTML Thymeleaf email templates for all notification types
- **Audit Logging**: Full audit trail of all user actions
- **Dark Mode**: Full dark/light theme support
- **Bulk Import**: CSV-based employee bulk import

---

## Quick Start (Docker)

### Prerequisites
- Docker & Docker Compose installed
- Gmail account with App Password enabled

### 1. Clone and configure

```bash
git clone <your-repo>
cd lg-reminder
cp .env.example .env
```

Edit `.env` with your values:

```env
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password   # 16-char Gmail App Password
JWT_SECRET=<generate-with-openssl-rand-hex-32>
```

> **Gmail App Password**: Go to Google Account → Security → 2-Step Verification → App Passwords

### 2. Start all services

```bash
docker-compose up -d
```

Services:
- Frontend: http://localhost:80
- Backend API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html
- MySQL: localhost:3306

### 3. First-time setup

Register a Super Admin via the API:
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Admin User",
    "email": "admin@company.com",
    "password": "Admin@1234",
    "role": "ROLE_SUPER_ADMIN"
  }'
```

---

## Local Development

### Backend

```bash
cd backend

# Requirements: Java 21, Maven 3.9+

# Start MySQL locally or use Docker
docker run -d --name mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=lg_reminder \
  -p 3306:3306 mysql:8.0

# Run
mvn spring-boot:run
```

Backend runs on http://localhost:8080

### Frontend

```bash
cd frontend

# Requirements: Node 20+
npm install

# Create env file
cp .env.example .env.local
# Set VITE_API_URL=http://localhost:8080

npm run dev
```

Frontend runs on http://localhost:5173

---

## Deployment

### Backend → Render

1. Push backend to GitHub
2. Create new **Web Service** on [render.com](https://render.com)
3. Connect repository, set root directory to `backend/`
4. Build command: `mvn clean package -DskipTests`
5. Start command: `java -jar target/*.jar`
6. Add environment variables from `.env.example`

### Frontend → Vercel

```bash
cd frontend
npx vercel --prod
```

Or connect GitHub repo to Vercel and set:
- Framework: Vite
- Root directory: `frontend/`
- Environment variable: `VITE_API_URL=https://your-backend.onrender.com`

### Database → Railway MySQL

1. Create project on [railway.app](https://railway.app)
2. Add MySQL plugin
3. Copy connection string to `DB_URL` in backend env vars

---

## API Documentation

Swagger UI: `http://localhost:8080/swagger-ui.html`  
OpenAPI JSON: `http://localhost:8080/api-docs`

### Key endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register user |
| POST | `/api/v1/auth/login` | Login, get JWT |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/tasks` | List all tasks |
| POST | `/api/v1/tasks` | Create task |
| POST | `/api/v1/tasks/{id}/progress` | Add progress update |
| POST | `/api/v1/tasks/{id}/complete` | Mark complete |
| GET | `/api/v1/employees` | List employees |
| POST | `/api/v1/employees` | Create employee |
| POST | `/api/v1/employees/bulk-import` | Bulk import |
| GET | `/api/v1/departments` | List departments |
| GET | `/api/v1/reports/dashboard` | Admin stats |
| GET | `/api/v1/reports/tasks/excel` | Export task report |
| GET | `/api/v1/notifications` | Get notifications |
| PUT | `/api/v1/notifications/mark-all-read` | Mark all read |

---

## Reminder Scheduler

The scheduler runs at **8:00 AM daily** (configurable via `app.reminder.cron`).

### What it does

1. **Marks overdue tasks** — any task past due date that isn't COMPLETED/CANCELLED
2. **Deadline reminders** — emails at 7 days, 3 days, 1 day before, and on due date
3. **Recurring reminders** — processes active `ReminderSchedule` entries (DAILY/WEEKLY/MONTHLY/CUSTOM)
4. **Overdue notifications** — in-app notifications for all overdue tasks
5. **Escalation emails** — emails to managers at +3, +7, +15 days overdue

### Configure reminder schedule

```yaml
# application.yml
app:
  reminder:
    scheduler-enabled: true
    cron: "0 0 8 * * *"   # 8 AM daily
```

---

## Database Schema

Key tables: `users`, `employees`, `departments`, `tasks`, `task_updates`, `attachments`, `reminder_schedules`, `reminder_logs`, `notifications`, `audit_logs`

All tables use auto-increment PKs with indexed foreign keys and timestamps (`created_at`, `updated_at`) via Spring JPA Auditing.

---

## Project Structure

```
lg-reminder/
├── backend/
│   ├── src/main/java/com/lg/reminder/
│   │   ├── config/          # SecurityConfig, SwaggerConfig, AsyncConfig
│   │   ├── controller/      # REST controllers
│   │   ├── dto/             # Request/Response DTOs
│   │   ├── entity/          # JPA entities
│   │   ├── enums/           # Role, TaskStatus, Priority, etc.
│   │   ├── exception/       # GlobalExceptionHandler, custom exceptions
│   │   ├── repository/      # Spring Data JPA repositories
│   │   ├── scheduler/       # ReminderScheduler (core feature)
│   │   ├── security/        # JWT filter, UserDetailsService
│   │   └── service/impl/    # Business logic services
│   └── src/main/resources/
│       ├── application.yml
│       └── templates/email/ # Thymeleaf HTML email templates
│
├── frontend/
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── pages/           # Route pages
│       ├── services/        # API service layer
│       ├── store/           # Auth state store
│       └── types/           # TypeScript type definitions
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_URL` | MySQL JDBC URL | `jdbc:mysql://host:3306/lg_reminder` |
| `DB_USERNAME` | DB username | `lguser` |
| `DB_PASSWORD` | DB password | `secret` |
| `JWT_SECRET` | 256-bit hex secret | `404E635266...` |
| `JWT_EXPIRATION` | Access token TTL (ms) | `86400000` (24h) |
| `JWT_REFRESH` | Refresh token TTL (ms) | `604800000` (7d) |
| `MAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP port | `587` |
| `MAIL_USERNAME` | SMTP username | `you@gmail.com` |
| `MAIL_PASSWORD` | SMTP password / app password | `xxxx xxxx xxxx xxxx` |
| `FRONTEND_URL` | Frontend URL for email links | `https://app.yourdomain.com` |
| `SCHEDULER_ENABLED` | Enable/disable reminder scheduler | `true` |

---

## Security

- Passwords hashed with BCrypt
- JWT access tokens (24h) + refresh tokens (7d)
- Role-based endpoint protection with `@PreAuthorize`
- CORS configured for frontend domain
- Input validation via Bean Validation (`@Valid`)
- Global exception handler — no stack traces in responses
- Email verification on registration
- Password reset with expiring tokens (1h)

---

## License

Proprietary — LG Systems

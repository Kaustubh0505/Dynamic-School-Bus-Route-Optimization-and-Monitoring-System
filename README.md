# 🚌 Dynamic School Bus Route Optimization & Monitoring Platform

> A web-based system for dynamically generating and monitoring school bus routes based on daily operational conditions.

---

## 📌 Project Overview

Traditional school transportation systems use fixed routes and static schedules that cannot adapt to daily changes. This platform solves that by applying **rule-based dynamic routing** that accounts for:
- Daily student attendance
- Bus capacity constraints
- Pickup time windows
- Simulated traffic conditions

---

## 🛠️ Tech Stack

| Layer       | Technology              |
|-------------|-------------------------|
| Backend     | Python 3.11 + FastAPI   |
| ORM         | SQLAlchemy 2.0          |
| Database    | PostgreSQL              |
| Migrations  | Alembic                 |
| Frontend    | React + Tailwind CSS    |
| Auth        | JWT (python-jose)       |
| Testing     | pytest + pytest-asyncio |

---

## 👥 Team Members & Contributions

| Member | Role | Responsibilities |
|--------|------|-----------------|
| Rudraksh Rathod | Backend Lead | Project scaffold, DB models, migrations, base classes |
| Member 2 | Route Engine | Optimization algorithm, route APIs, traffic simulation |
| Member 3 | Monitoring & Alerts | Bus tracking, boarding logs, alert service |
| Member 4 | Frontend | React UI, auth flow, all pages |
| Member 5 | Design & Docs | Design patterns, UML diagrams, project report |

---

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.11+
- PostgreSQL 15+
- Node.js 18+ (for frontend)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env with your PostgreSQL credentials

alembic upgrade head             # Run migrations
uvicorn app.main:app --reload    # Start server
```

API will be live at: `http://localhost:8000`
Interactive docs at: `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will be live at: `http://localhost:5173`

---

## 🏗️ Architecture

```
school-bus-platform/
├── backend/
│   ├── app/
│   │   ├── core/           # Config, DB connection, base entity
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── schemas/        # Pydantic request/response schemas
│   │   ├── routes/         # FastAPI route handlers (controllers)
│   │   ├── services/       # Business logic layer
│   │   │   └── optimization/  # Route optimization strategies
│   │   └── utils/          # Factories, helpers
│   └── alembic/            # Database migrations
└── frontend/               # React application
```

### Design Patterns
- **Strategy Pattern** — Swappable routing algorithm strategies
- **Observer Pattern** — Event-driven alert notifications
- **Factory Pattern** — Centralized object creation

### SOLID Principles
- **S** — Each service handles one domain concern
- **O** — BaseEntity & strategies open for extension, closed for modification
- **L** — All routing strategies are interchangeable
- **I** — Separate Pydantic schemas per operation
- **D** — Routes depend on service interfaces, not implementations

---

## 🧪 Test Cases

*(To be filled in Phase 7)*

---

## 📊 UML Diagrams

All diagrams are in the `/diagrams` folder:
- `class_diagram.png`
- `use_case_diagram.png`
- `sequence_diagram.png`
- `er_diagram.png`

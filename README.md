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

## 🚀 Tech Stack

| Layer            | Technology                                      |
|------------------|-------------------------------------------------|
| Frontend         | React (Vite + TypeScript), Tailwind CSS         |
| Backend          | Node.js, Express.js (TypeScript)                |
| Database         | MongoDB                                         |
| ORM/ODM          | Mongoose                                        |
| Authentication   | JWT, bcrypt                                     |
| API Communication| REST APIs (JSON), Axios                         |
| Routing(Frontend)| React Router                                    |
| Architecture     | Layered (Controller → Service → Model)          |
| Design Patterns  | Strategy, Factory, Observer                     |
| State Management | React Hooks                                     |
| Tools            | VS Code, Git, GitHub                            |
| Environment      | dotenv                                          |

---

## 👥 Team Members & Contributions

| Member | Role | Responsibilities |
|--------|------|-----------------|
| Rudraksh Rathod | Backend Lead | Project scaffold, DB models, migrations, base classes |
| Viraj Chafale | Route Engine | Optimization algorithm, route APIs, traffic simulation |
| Krishna Duble | Monitoring & Alerts | Bus tracking, boarding logs, alert service |
| Bhargav Patil | Frontend | React UI, auth flow, all pages |
| Kaustubh Hiwanj | Design & Docs | Design patterns, UML diagrams, project report |

---

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.11+
- PostgreSQL 15+
- Node.js 18+ (for frontend)

### Backend Setup

```bash
cd backend
npm install

PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret

npm run dev
```

API will be live at: `http://localhost:5000`
Interactive docs at: `http://localhost:5000/docs`

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
school-bus-system/
│
├── backend/
│ ├── src/
│ │ ├── controllers/
│ │ ├── factories/
│ │ ├── middleware/
│ │ ├── models/
│ │ ├── patterns/
│ │ ├── routes/
│ │ ├── services/
│ │ ├── app.ts
│ │ └── server.ts
│ │
│ ├── .env
│ ├── package.json
│ ├── package-lock.json
│ └── tsconfig.json
│
├── frontend/
│ ├── src/
│ ├── public/
│ ├── .env
│ ├── index.html
│ ├── package.json
│ ├── package-lock.json
│ ├── tailwind.config.js
│ ├── postcss.config.js
│ ├── vite.config.ts
│ └── tsconfig*.json
│
└── README.md
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


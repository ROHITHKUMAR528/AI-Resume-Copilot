# AI Resume Copilot 🚀

> **Production-ready AI-powered Resume Intelligence Platform**

![Stack](https://img.shields.io/badge/FastAPI-Python-009688?style=flat&logo=fastapi)
![Stack](https://img.shields.io/badge/React-TypeScript-61DAFB?style=flat&logo=react)
![Stack](https://img.shields.io/badge/OpenAI-GPT--4o-412991?style=flat&logo=openai)
![Stack](https://img.shields.io/badge/PostgreSQL-pgvector-336791?style=flat&logo=postgresql)

## Features

| Module | Description |
|--------|-------------|
| 📄 Resume Parsing | PDF/DOCX upload with entity extraction |
| 🎯 Match Analysis | AI-powered resume vs JD scoring |
| 🧠 Semantic Matching | Knowledge graph skill similarity (70/30 formula) |
| 🔍 ATS Audit | ATS compatibility checker with actionable fixes |
| ✏️ Resume Morphing | GPT-4o powered bullet rewriting |
| 📚 Skill Roadmap | Personalized learning paths per skill gap |
| 💬 Interview Sim | Technical, behavioral & gap-based questions |
| 📊 Career Intel | Salary range, growth paths, readiness score |
| 🕒 History | Full analysis history tracking |

---

## Quick Start

### 1. Clone and setup

```bash
git clone https://github.com/your-org/ai-resume-copilot
cd ai-resume-copilot
cp .env.example .env
# Edit .env with your API keys
```

### 2. Docker Compose (recommended)

```bash
docker-compose up -d
```

Services:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 3. Local Development (without Docker)

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
SECRET_KEY=your-super-secret-key        # Required
DATABASE_URL=postgresql+asyncpg://...   # Required
REDIS_URL=redis://:password@...         # Required
OPENAI_API_KEY=sk-...                   # For AI features
AWS_ACCESS_KEY_ID=...                   # For S3 storage (optional)
AWS_SECRET_ACCESS_KEY=...              # For S3 storage (optional)
```

> **Note**: The app works without OpenAI keys (fallback mode) and without AWS S3 (local only).

---

## Architecture

```
Frontend (React/Vite/TS)
    ↕ REST API
Backend (FastAPI)
    ├── Resume Parser (PyMuPDF + pdfplumber + python-docx)
    ├── Semantic Skill Graph (Knowledge graph matcher)
    ├── ATS Engine (Rule-based audit)
    ├── AI Analyzer (GPT-4o orchestrator)
    ├── Learning Service (Roadmap generator)
    └── Interview Service (Question generator)
    ↕
PostgreSQL + pgvector + Redis
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login & get JWT |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/upload-resume` | Upload & parse resume |
| GET | `/api/resumes` | List user resumes |
| POST | `/api/analyze` | Full AI analysis |
| GET | `/api/history` | Analysis history |
| POST | `/api/upskill-roadmap/{id}` | Generate roadmap |
| POST | `/api/interview` | Generate questions |
| GET | `/docs` | Interactive API docs |

---

## Running Tests

```bash
cd backend
pytest tests/ -v
```

---

## Sprints

| # | Sprint | Status |
|---|--------|--------|
| 1 | Foundation — Scaffold, Docker, DB, Auth | ✅ Complete |
| 2 | Resume Parser | ✅ Complete |
| 3 | AI Analyzer | ✅ Complete |
| 4 | Semantic Skill Graph | ✅ Complete |
| 5 | ATS Engine | ✅ Complete |
| 6 | Resume Morphing | ✅ Complete |
| 7 | Upskill Pipeline | ✅ Complete |
| 8 | Interview Simulator | ✅ Complete |
| 9 | Dashboard UI | ✅ Complete |
| 10 | Authentication | ✅ Complete |
| 11 | History Tracking | ✅ Complete |
| 12 | Deployment | 🔄 Next |

---

## Deployment

**Frontend → Vercel:**
```bash
cd frontend
npm run build
# Deploy dist/ to Vercel
```

**Backend → Railway/Render:**
```bash
# Set environment variables in Railway/Render dashboard
# Connect your GitHub repo
# Railway will auto-detect Python and use Dockerfile
```

---

## Tech Stack

**Frontend:** React 18, Vite, TypeScript, TailwindCSS, Framer Motion, Recharts, Zustand, React Query  
**Backend:** FastAPI, SQLAlchemy 2.0 async, Alembic, Pydantic v2  
**AI:** OpenAI GPT-4o, Custom Semantic Skill Graph  
**Database:** PostgreSQL 16 + pgvector  
**Cache:** Redis 7  
**Auth:** JWT + bcrypt  
**Storage:** AWS S3  
**Monitoring:** Sentry, structlog  

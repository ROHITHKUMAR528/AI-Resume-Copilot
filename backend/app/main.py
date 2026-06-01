"""
AI Resume Copilot — FastAPI Application Entry Point
"""
import sentry_sdk
import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi_limiter import FastAPILimiter

from app.core.config import settings
from app.core.database import engine, Base
from app.core.redis_client import get_redis
from app.routes import auth, resume, analysis, roadmap, interview

# ─── Structured Logging ───────────────────────────────────────────────────────
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer(),
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

log = structlog.get_logger()

# ─── Sentry ───────────────────────────────────────────────────────────────────
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        traces_sample_rate=0.1,
        environment="production" if not settings.DEBUG else "development",
    )


# ─── Lifespan ────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    log.info("Starting AI Resume Copilot API", version=settings.APP_VERSION)

    # Initialize database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    log.info("Database tables initialized")

    # Initialize Redis rate limiter
    redis = await get_redis()
    await FastAPILimiter.init(redis)
    log.info("Redis rate limiter initialized")

    yield

    # Cleanup
    await engine.dispose()
    log.info("Application shutdown complete")


# ─── App Instance ─────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered Resume Intelligence Platform",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# ─── Middleware ───────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(resume.router, prefix="/api", tags=["Resume"])
app.include_router(analysis.router, prefix="/api", tags=["Analysis"])
app.include_router(roadmap.router, prefix="/api", tags=["Roadmap"])
app.include_router(interview.router, prefix="/api", tags=["Interview"])


# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    return JSONResponse(
        content={
            "status": "healthy",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
        }
    )


@app.get("/", tags=["Root"])
async def root():
    return {"message": "AI Resume Copilot API", "docs": "/docs"}

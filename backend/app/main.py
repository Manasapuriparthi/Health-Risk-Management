from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from collections import defaultdict
import os, time, asyncio

from .db import check_db_health, seed_database
from .ml_models import train_models
from .routes import auth, vitals, prediction, report, chat, twin, planner, appointments

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Train the Machine Learning classifiers on startup
    try:
        train_models()
    except Exception as e:
        print(f"Error training models on startup: {e}")
        
    # Seed default doctor database records
    try:
        await seed_database()
    except Exception as e:
        print(f"Error seeding database on startup: {e}")
    yield

# Disable docs in production if env var set
_disable_docs = os.getenv("DISABLE_DOCS", "true").lower() == "true"

app = FastAPI(
    title="Health Risk Management API",
    description="Offline AI-powered clinical assistant and predictive analytics.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None if _disable_docs else "/docs",
    redoc_url=None if _disable_docs else "/redoc",
    openapi_url=None if _disable_docs else "/openapi.json",
)

# ── In-memory rate limiter for login endpoint ─────────────────────────────────
_login_attempts: dict = defaultdict(list)
_RATE_LIMIT = 10      # max attempts
_RATE_WINDOW = 60     # per seconds

@app.middleware("http")
async def rate_limit_login(request: Request, call_next):
    if request.url.path == "/api/auth/login" and request.method == "POST":
        ip = request.client.host if request.client else "unknown"
        now = time.time()
        # Clean up old attempts
        _login_attempts[ip] = [t for t in _login_attempts[ip] if now - t < _RATE_WINDOW]
        if len(_login_attempts[ip]) >= _RATE_LIMIT:
            return JSONResponse(
                status_code=429,
                content={"detail": f"Too many login attempts. Try again in {_RATE_WINDOW} seconds."}
            )
        _login_attempts[ip].append(now)
    return await call_next(request)

# Configure CORS - reads from CORS_ORIGINS env var (comma-separated) or allows all for local dev
_cors_env = os.getenv("CORS_ORIGINS", "*")
cors_origins = [o.strip() for o in _cors_env.split(",")] if _cors_env != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(vitals.router, prefix="/api/vitals", tags=["Vitals Logging"])
app.include_router(prediction.router, prefix="/api/prediction", tags=["ML Predictions"])
app.include_router(report.router, prefix="/api/report", tags=["Medical Reports"])
app.include_router(chat.router, prefix="/api/chat", tags=["RAG Chatbot"])
app.include_router(twin.router, prefix="/api/twin", tags=["AI Health Twin"])
app.include_router(planner.router, prefix="/api/planner", tags=["Health Planners"])
app.include_router(appointments.router, prefix="/api/appointments", tags=["Clinical Appointments"])

from fastapi.responses import JSONResponse, FileResponse

@app.get("/api/health")
async def health_check():
    db_status = await check_db_health()
    return {
        "status": "healthy",
        "database": db_status
    }

@app.get("/download/apk")
@app.get("/app-debug.apk")
async def download_apk():
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    apk_path = os.path.join(root_dir, "app-debug.apk")
    if os.path.exists(apk_path):
        return FileResponse(apk_path, media_type="application/vnd.android.package-archive", filename="app-debug.apk")
    return JSONResponse(status_code=404, content={"detail": "APK file not found"})


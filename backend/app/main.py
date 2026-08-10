from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

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

app = FastAPI(
    title="Health Risk Management API",
    description="Offline AI-powered clinical assistant and predictive analytics.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev, allow all. In production, restrict.
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

@app.get("/api/health")
async def health_check():
    db_status = await check_db_health()
    return {
        "status": "healthy",
        "database": db_status
    }

import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017")
    DB_NAME: str = os.getenv("DB_NAME", "health_risk_db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "b3d9c7e0f2a481c9a1d8e7b6c504a3f2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    class Config:
        env_file = ".env"

settings = Settings()

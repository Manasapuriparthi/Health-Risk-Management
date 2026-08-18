from datetime import datetime, timedelta
import random
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from bson import ObjectId

from ..config import settings
from ..db import users_collection, otps_collection

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Pydantic schemas
class UserRegister(BaseModel):
    username: str = Field(..., min_length=3)
    email: EmailStr
    password: str = Field(..., min_length=6)
    age: Optional[int] = None
    height: Optional[float] = None # cm
    weight: Optional[float] = None # kg
    active_minutes: Optional[int] = 30 # daily average
    role: Optional[str] = "patient"
    specialty: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    age: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    active_minutes: Optional[int] = 30
    role: str
    specialty: Optional[str] = None

# Helper functions
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = await users_collection.find_one({"email": email})
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", response_model=Token)
async def register(user_data: UserRegister):
    # Check if user already exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
        
    hashed_password = get_password_hash(user_data.password)
    
    new_user = {
        "username": user_data.username,
        "email": user_data.email,
        "hashed_password": hashed_password,
        "age": user_data.age,
        "height": user_data.height,
        "weight": user_data.weight,
        "active_minutes": user_data.active_minutes,
        "role": user_data.role or "patient",
        "specialty": user_data.specialty,
        "created_at": datetime.utcnow()
    }
    
    result = await users_collection.insert_one(new_user)
    
    access_token = create_access_token(data={"sub": user_data.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await users_collection.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "username": current_user["username"],
        "email": current_user["email"],
        "age": current_user.get("age"),
        "height": current_user.get("height"),
        "weight": current_user.get("weight"),
        "active_minutes": current_user.get("active_minutes", 30),
        "role": current_user.get("role", "patient"),
        "specialty": current_user.get("specialty")
    }

@router.put("/me")
async def update_me(profile_updates: dict, current_user: dict = Depends(get_current_user)):
    # Sanitize inputs
    allowed_keys = ["age", "height", "weight", "active_minutes", "role", "specialty"]
    updates = {k: v for k, v in profile_updates.items() if k in allowed_keys}
    
    if updates:
        await users_collection.update_one(
            {"_id": current_user["_id"]},
            {"$set": updates}
        )
    return {"status": "success", "updated_fields": updates}

class SwitchRoleRequest(BaseModel):
    role: str

@router.post("/switch-role")
async def switch_role(req: SwitchRoleRequest, current_user: dict = Depends(get_current_user)):
    if req.role not in ["patient", "doctor"]:
        raise HTTPException(status_code=400, detail="Invalid role specified")
    
    await users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"role": req.role}}
    )
    return {"status": "success", "new_role": req.role}

@router.get("/doctors", response_model=List[UserResponse])
async def get_doctors(current_user: dict = Depends(get_current_user)):
    """Return all registered doctors — used by patients to book appointments."""
    cursor = users_collection.find({"role": "doctor"})
    doctors = []
    async for doc in cursor:
        doctors.append({
            "id": str(doc["_id"]),
            "username": doc["username"],
            "email": doc["email"],
            "age": doc.get("age"),
            "height": doc.get("height"),
            "weight": doc.get("weight"),
            "active_minutes": doc.get("active_minutes", 30),
            "role": doc.get("role", "doctor"),
            "specialty": doc.get("specialty"),
        })
    return doctors

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_by_id(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Access denied")
    try:
        obj_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    user = await users_collection.find_one({"_id": obj_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": str(user["_id"]),
        "username": user["username"],
        "email": user["email"],
        "age": user.get("age"),
        "height": user.get("height"),
        "weight": user.get("weight"),
        "active_minutes": user.get("active_minutes", 30),
        "role": user.get("role", "patient"),
        "specialty": user.get("specialty")
    }


class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    password: str = Field(..., min_length=6)

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    user = await users_collection.find_one({"email": req.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No user registered with this email address"
        )
        
    otp = f"{random.randint(100000, 999999)}"
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    await otps_collection.update_one(
        {"email": req.email},
        {"$set": {"otp": otp, "expires_at": expires_at}},
        upsert=True
    )
    
    print(f"==================================================")
    print(f"SIMULATED OTP FOR {req.email}: {otp}")
    print(f"==================================================")
    
    return {
        "status": "success",
        "message": "OTP code generated and logged to console",
        "otp": otp
    }

@router.post("/verify-otp")
async def verify_otp(req: VerifyOtpRequest):
    otp_record = await otps_collection.find_one({"email": req.email})
    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OTP requested for this email"
        )
        
    if otp_record["expires_at"] < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP code has expired"
        )
        
    if otp_record["otp"] != req.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect OTP code"
        )
        
    return {"status": "success", "message": "OTP verified successfully"}

@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    otp_record = await otps_collection.find_one({"email": req.email})
    if not otp_record or otp_record["expires_at"] < datetime.utcnow() or otp_record["otp"] != req.otp:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code"
        )
         
    hashed_password = get_password_hash(req.password)
    result = await users_collection.update_one(
        {"email": req.email},
        {"$set": {"hashed_password": hashed_password}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    await otps_collection.delete_one({"email": req.email})
    return {"status": "success", "message": "Password reset successfully"}


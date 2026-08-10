from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from bson import ObjectId

from .auth import get_current_user
from ..db import vitals_collection

router = APIRouter()

class VitalLog(BaseModel):
    systolic_bp: Optional[int] = Field(None, description="Systolic Blood Pressure (mmHg)")
    diastolic_bp: Optional[int] = Field(None, description="Diastolic Blood Pressure (mmHg)")
    blood_sugar: Optional[int] = Field(None, description="Fasting Blood Glucose (mg/dL)")
    heart_rate: Optional[int] = Field(None, description="Heart Rate (bpm)")
    sleep_hours: Optional[float] = Field(None, description="Sleep hours logged")
    weight: Optional[float] = Field(None, description="Weight in kg")
    cholesterol: Optional[int] = Field(None, description="Total cholesterol (mg/dL)")
    active_minutes: Optional[int] = Field(None, description="Daily activity duration in minutes")

class VitalResponse(BaseModel):
    id: str
    user_id: str
    systolic_bp: Optional[int]
    diastolic_bp: Optional[int]
    blood_sugar: Optional[int]
    heart_rate: Optional[int]
    sleep_hours: Optional[float]
    weight: Optional[float]
    cholesterol: Optional[int]
    active_minutes: Optional[int]
    timestamp: datetime

@router.post("", response_model=VitalResponse)
async def log_vital(vital: VitalLog, current_user: dict = Depends(get_current_user)):
    vital_dict = vital.dict()
    vital_dict["user_id"] = str(current_user["_id"])
    vital_dict["timestamp"] = datetime.utcnow()
    
    result = await vitals_collection.insert_one(vital_dict)
    vital_dict["id"] = str(result.inserted_id)
    return vital_dict

@router.get("", response_model=List[VitalResponse])
async def get_vitals_history(current_user: dict = Depends(get_current_user)):
    cursor = vitals_collection.find({"user_id": str(current_user["_id"])}).sort("timestamp", -1)
    vitals = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        vitals.append(doc)
    return vitals

@router.get("/latest", response_model=Optional[VitalResponse])
async def get_latest_vital(current_user: dict = Depends(get_current_user)):
    doc = await vitals_collection.find_one(
        {"user_id": str(current_user["_id"])},
        sort=[("timestamp", -1)]
    )
    if doc:
        doc["id"] = str(doc["_id"])
        return doc
    return None

@router.get("/user/{user_id}", response_model=List[VitalResponse])
async def get_patient_vitals_history(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Access denied")
    cursor = vitals_collection.find({"user_id": user_id}).sort("timestamp", -1)
    vitals = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        vitals.append(doc)
    return vitals

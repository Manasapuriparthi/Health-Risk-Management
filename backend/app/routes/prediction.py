from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from bson import ObjectId

from .auth import get_current_user
from ..db import predictions_collection, vitals_collection
from ..ml_models import predict_health_risks

router = APIRouter()

class PredictionRequest(BaseModel):
    # Form override inputs. If missing, we fall back to profile/vitals.
    age: Optional[int] = None
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    blood_sugar: Optional[int] = None
    cholesterol: Optional[int] = None
    bmi: Optional[float] = None
    active_minutes: Optional[int] = None
    smoking: Optional[int] = Field(0, description="0 = No, 1 = Yes")
    alcohol: Optional[int] = Field(0, description="0 = No, 1 = Yes")

class PredictionResponse(BaseModel):
    id: str
    user_id: str
    input_data: dict
    predictions: dict
    timestamp: datetime

@router.post("/predict", response_model=PredictionResponse)
async def predict_risk(req: PredictionRequest, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    # 1. Gather baseline parameters, resolving hierarchies:
    # Priority: Request form overrides > Latest vital logs > User profile averages
    
    # Get latest vital log
    latest_vital = await vitals_collection.find_one(
        {"user_id": user_id},
        sort=[("timestamp", -1)]
    ) or {}
    
    # Resolve age
    age = req.age or current_user.get("age") or 35
    
    # Resolve BMI
    bmi = req.bmi
    if not bmi:
        # Check latest vital weight
        weight = latest_vital.get("weight") or current_user.get("weight")
        height = current_user.get("height")
        if weight and height:
            bmi = float(weight / ((height / 100.0) ** 2))
        else:
            bmi = latest_vital.get("bmi") or 24.5 # normal baseline default
            
    # Resolve other parameters
    systolic_bp = req.systolic_bp or latest_vital.get("systolic_bp") or 120
    diastolic_bp = req.diastolic_bp or latest_vital.get("diastolic_bp") or 80
    blood_sugar = req.blood_sugar or latest_vital.get("blood_sugar") or 90
    cholesterol = req.cholesterol or latest_vital.get("cholesterol") or 180
    active_minutes = req.active_minutes or latest_vital.get("active_minutes") or current_user.get("active_minutes") or 30
    smoking = req.smoking if req.smoking is not None else 0
    alcohol = req.alcohol if req.alcohol is not None else 0
    
    patient_data = {
        "age": int(age),
        "bmi": float(round(bmi, 2)),
        "systolic_bp": int(systolic_bp),
        "diastolic_bp": int(diastolic_bp),
        "blood_sugar": int(blood_sugar),
        "cholesterol": int(cholesterol),
        "active_minutes": int(active_minutes),
        "smoking": int(smoking),
        "alcohol": int(alcohol)
    }
    
    # Run predictions (using ML classifiers Random Forest vs XGBoost)
    predictions = predict_health_risks(patient_data)
    
    record = {
        "user_id": user_id,
        "input_data": patient_data,
        "predictions": predictions,
        "timestamp": datetime.utcnow()
    }
    
    result = await predictions_collection.insert_one(record)
    record["id"] = str(result.inserted_id)
    
    return record

@router.get("/history", response_model=List[PredictionResponse])
async def get_predictions_history(current_user: dict = Depends(get_current_user)):
    cursor = predictions_collection.find({"user_id": str(current_user["_id"])}).sort("timestamp", -1)
    history = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        history.append(doc)
    return history

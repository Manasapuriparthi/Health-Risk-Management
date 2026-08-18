from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from bson import ObjectId

from .auth import get_current_user
from ..db import appointments_collection

router = APIRouter()

class AppointmentCreate(BaseModel):
    doctor_name: str
    specialty: str
    date: str  # YYYY-MM-DD
    time: str  # e.g., "10:00 AM"

class AppointmentStatusUpdate(BaseModel):
    status: str  # "pending", "accepted", "rejected"

class AppointmentResponse(BaseModel):
    id: str
    patient_id: str
    patient_name: str
    doctor_name: str
    specialty: str
    date: str
    time: str
    status: str
    created_at: datetime

@router.post("", response_model=AppointmentResponse)
async def create_appointment(app_data: AppointmentCreate, current_user: dict = Depends(get_current_user)):
    app_dict = app_data.dict()
    app_dict["patient_id"] = str(current_user["_id"])
    app_dict["patient_name"] = current_user.get("username", "Patient")
    app_dict["status"] = "pending"
    app_dict["created_at"] = datetime.utcnow()
    
    result = await appointments_collection.insert_one(app_dict)
    app_dict["id"] = str(result.inserted_id)
    return app_dict

@router.get("", response_model=List[AppointmentResponse])
async def get_appointments(current_user: dict = Depends(get_current_user)):
    user_role = current_user.get("role", "patient")
    
    if user_role == "doctor":
        # Doctors see only appointments matching their name or specialty
        doctor_name = current_user.get("username")
        specialty = current_user.get("specialty")
        
        query_conditions = []
        if doctor_name:
            query_conditions.append({"doctor_name": doctor_name})
        if specialty:
            query_conditions.append({"specialty": {"$regex": f"^{specialty}$", "$options": "i"}})
            
        query = {"$or": query_conditions} if query_conditions else {}
        cursor = appointments_collection.find(query).sort("created_at", -1)
    else:
        # Patients see only their own
        cursor = appointments_collection.find({"patient_id": str(current_user["_id"])}).sort("created_at", -1)
        
    apps = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        apps.append(doc)
    return apps

@router.put("/{appointment_id}/status", response_model=AppointmentResponse)
async def update_appointment_status(
    appointment_id: str, 
    status_update: AppointmentStatusUpdate, 
    current_user: dict = Depends(get_current_user)
):
    user_role = current_user.get("role", "patient")
    if user_role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can modify appointment status"
        )
        
    # Check if status is valid
    if status_update.status not in ["accepted", "rejected", "pending"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status"
        )
        
    # Find and update
    try:
        obj_id = ObjectId(appointment_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid appointment ID")
        
    result = await appointments_collection.find_one_and_update(
        {"_id": obj_id},
        {"$set": {"status": status_update.status}},
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    result["id"] = str(result["_id"])
    return result

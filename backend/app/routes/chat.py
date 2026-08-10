from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional

from .auth import get_current_user
from ..db import vitals_collection
from ..rag_service import generate_rag_response

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    suggestions: List[str]

@router.post("", response_model=ChatResponse)
async def chat_with_coach(req: ChatRequest, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    # Get user's latest vitals
    latest_vital = await vitals_collection.find_one(
        {"user_id": user_id},
        sort=[("timestamp", -1)]
    ) or {}
    
    # Calculate BMI if weight and height are available
    bmi = None
    weight = latest_vital.get("weight") or current_user.get("weight")
    height = current_user.get("height")
    if weight and height:
        bmi = float(weight / ((height / 100.0) ** 2))
    
    vitals_context = {
        "systolic_bp": latest_vital.get("systolic_bp"),
        "diastolic_bp": latest_vital.get("diastolic_bp"),
        "blood_sugar": latest_vital.get("blood_sugar"),
        "bmi": bmi
    }
    
    # Clean dictionary to only send what is logged
    vitals_context = {k: v for k, v in vitals_context.items() if v is not None}
    
    # Call local RAG
    result = generate_rag_response(req.message, vitals_context)
    return result

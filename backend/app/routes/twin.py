from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from .auth import get_current_user
from ..db import vitals_collection
from ..ml_models import predict_health_risks

router = APIRouter()

class SimulationRequest(BaseModel):
    # Base inputs
    weight_change: float = 0.0 # kg
    activity_change: int = 0 # minutes (daily)
    sodium_reduction: bool = False # DASH adherence
    sleep_change: float = 0.0 # hours
    smoking_change: int = 0 # -1 = quit smoking, 0 = no change, 1 = start smoking (relative)

class SimulationResponse(BaseModel):
    baseline_vitals: dict
    simulated_vitals: dict
    baseline_risks: dict
    simulated_risks: dict
    narrative: str

@router.post("/simulate", response_model=SimulationResponse)
async def simulate_health_twin(req: SimulationRequest, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    
    # 1. Fetch latest vital logs
    latest_vital = await vitals_collection.find_one(
        {"user_id": user_id},
        sort=[("timestamp", -1)]
    ) or {}
    
    # Resolve baselines
    age = current_user.get("age") or 35
    height = current_user.get("height") or 170.0
    weight = latest_vital.get("weight") or current_user.get("weight") or 75.0
    systolic_bp = latest_vital.get("systolic_bp") or 120
    diastolic_bp = latest_vital.get("diastolic_bp") or 80
    blood_sugar = latest_vital.get("blood_sugar") or 90
    cholesterol = latest_vital.get("cholesterol") or 180
    active_minutes = latest_vital.get("active_minutes") or current_user.get("active_minutes") or 30
    smoking = latest_vital.get("smoking") or 0
    alcohol = latest_vital.get("alcohol") or 0
    
    bmi = float(weight / ((height / 100.0) ** 2))
    
    baseline_data = {
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
    
    # Predict baselines
    baseline_risks = predict_health_risks(baseline_data)
    
    # 2. Calculate Simulated Vitals
    sim_weight = weight + req.weight_change
    sim_bmi = float(sim_weight / ((height / 100.0) ** 2))
    
    # Activity impacts
    # More activity lowers BP and Blood Sugar
    bp_act_drop = (req.activity_change / 10.0) * 1.0 # 1 mmHg drop per 10 active mins
    sugar_act_drop = (req.activity_change / 10.0) * 1.5 # 1.5 mg/dL drop per 10 active mins
    
    # Weight impacts
    # Losing weight lowers BP, sugar, and cholesterol
    bp_wt_drop = 0.0
    sugar_wt_drop = 0.0
    chol_wt_drop = 0.0
    if req.weight_change < 0:
        kg_lost = abs(req.weight_change)
        bp_wt_drop = kg_lost * 1.5 # 1.5 mmHg drop per kg
        sugar_wt_drop = kg_lost * 2.0 # 2 mg/dL drop per kg
        chol_wt_drop = kg_lost * 3.0 # 3 mg/dL drop per kg
    elif req.weight_change > 0:
        kg_gained = req.weight_change
        bp_wt_drop = -kg_gained * 1.0
        sugar_wt_drop = -kg_gained * 1.5
        chol_wt_drop = -kg_gained * 2.0
        
    # Sodium impact
    bp_sodium_drop = 5.0 if req.sodium_reduction else 0.0
    
    # Adjust vitals (ensure they remain in physiological bounds)
    sim_systolic = max(90, min(200, int(systolic_bp - bp_act_drop - bp_wt_drop - bp_sodium_drop)))
    sim_diastolic = max(60, min(120, int(diastolic_bp - (bp_act_drop + bp_wt_drop + bp_sodium_drop) * 0.6)))
    sim_sugar = max(65, min(300, int(blood_sugar - sugar_act_drop - sugar_wt_drop)))
    sim_chol = max(110, min(400, int(cholesterol - chol_wt_drop)))
    sim_act = max(0, min(180, int(active_minutes + req.activity_change)))
    sim_smoking = max(0, min(1, int(smoking + req.smoking_change)))
    
    simulated_data = {
        "age": int(age),
        "bmi": float(round(sim_bmi, 2)),
        "systolic_bp": sim_systolic,
        "diastolic_bp": sim_diastolic,
        "blood_sugar": sim_sugar,
        "cholesterol": sim_chol,
        "active_minutes": sim_act,
        "smoking": sim_smoking,
        "alcohol": int(alcohol)
    }
    
    # Predict simulated risks
    simulated_risks = predict_health_risks(simulated_data)
    
    # 3. Create Simulation Narrative
    narrative_parts = []
    if req.weight_change < 0:
        narrative_parts.append(f"Reducing body weight by {abs(req.weight_change)}kg lowers your BMI from {bmi:.1f} to {sim_bmi:.1f}.")
    if req.activity_change > 0:
        narrative_parts.append(f"Increasing active duration by {req.activity_change} minutes per day boosts insulin sensitivity.")
    if req.sodium_reduction:
        narrative_parts.append("Adhering to DASH diet guidelines (sodium restriction) relieves arterial pressure.")
    if req.smoking_change < 0:
        narrative_parts.append("Quitting smoking removes chemical toxins and increases blood oxygen.")
        
    # Compute average risk drops
    rf_drops = []
    xgb_drops = []
    for disease in ["diabetes", "cvd", "hypertension"]:
        base_rf = baseline_risks[disease]["rf"]["probability"]
        sim_rf = simulated_risks[disease]["rf"]["probability"]
        base_xgb = baseline_risks[disease]["xgb"]["probability"]
        sim_xgb = simulated_risks[disease]["xgb"]["probability"]
        
        rf_diff = (base_rf - sim_rf) * 100
        xgb_diff = (base_xgb - sim_xgb) * 100
        
        if rf_diff > 1.0:
            rf_drops.append(f"{disease.capitalize()} risk drops by {rf_diff:.1f}% (RF)")
        if xgb_diff > 1.0:
            xgb_drops.append(f"{disease.capitalize()} risk drops by {xgb_diff:.1f}% (XGB)")
            
    if rf_drops or xgb_drops:
        narrative_parts.append("As a result of these adjustments, the ML algorithms predict:")
        for drop in xgb_drops[:2]:
            narrative_parts.append(f"- {drop}")
    else:
        narrative_parts.append("Maintain positive modifications over time to see long-term risk curves decline.")
        
    narrative = " ".join(narrative_parts)
    
    return {
        "baseline_vitals": baseline_data,
        "simulated_vitals": simulated_data,
        "baseline_risks": baseline_risks,
        "simulated_risks": simulated_risks,
        "narrative": narrative
    }

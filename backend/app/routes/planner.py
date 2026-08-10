from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import List, Optional

from .auth import get_current_user

router = APIRouter()

# -----------------
# DRUG CHECKER DATA
# -----------------
DRUG_DB = {
    "aspirin": {
        "class": "NSAID / Antiplatelet",
        "uses": "Pain relief, fever reducer, cardiac protection (anti-clotting).",
        "side_effects": ["Stomach irritation", "Easy bruising", "Gastrointestinal bleeding"]
    },
    "warfarin": {
        "class": "Anticoagulant (Blood Thinner)",
        "uses": "Prevention of blood clots, stroke reduction in atrial fibrillation.",
        "side_effects": ["Severe bleeding", "Bruising", "Nosebleeds"]
    },
    "lisinopril": {
        "class": "ACE Inhibitor",
        "uses": "Treating high blood pressure, heart failure recovery.",
        "side_effects": ["Dry cough", "Dizziness", "High potassium levels"]
    },
    "spironolactone": {
        "class": "Potassium-Sparing Diuretic",
        "uses": "Heart failure, edema, resistant hypertension.",
        "side_effects": ["Dehydration", "Hyperkalemia (high potassium)", "Muscle cramps"]
    },
    "metformin": {
        "class": "Biguanide (Antidiabetic)",
        "uses": "Type 2 Diabetes glycemic control.",
        "side_effects": ["Nausea", "Diarrhea / stomach upset", "Metallic taste"]
    },
    "ibuprofen": {
        "class": "NSAID (Painkiller)",
        "uses": "Pain relief, inflammation reducer, fever helper.",
        "side_effects": ["Stomach ulcers", "Heartburn", "Kidney strain if overused"]
    },
    "nitroglycerin": {
        "class": "Nitrate (Vasodilator)",
        "uses": "Angina (chest pain) relief.",
        "side_effects": ["Severe headache", "Rapid drop in BP", "Flushing"]
    },
    "sildenafil": {
        "class": "PDE5 Inhibitor",
        "uses": "Erectile dysfunction, pulmonary arterial hypertension.",
        "side_effects": ["Headache", "Flushing", "Indigestion"]
    },
    "atorvastatin": {
        "class": "Statin (Cholesterol lowering)",
        "uses": "Lowering LDL cholesterol, preventing cardiovascular events.",
        "side_effects": ["Muscle ache (myalgia)", "Liver enzyme elevations", "Mild confusion"]
    }
}

INTERACTIONS = [
    {
        "drugs": ["aspirin", "warfarin"],
        "severity": "CRITICAL",
        "warning": "Extreme risk of internal bleeding. These blood-thinning effects multiply. Do not combine without close medical monitoring."
    },
    {
        "drugs": ["ibuprofen", "warfarin"],
        "severity": "CRITICAL",
        "warning": "Severe risk of major gastrointestinal bleeding. Avoid NSAIDs while taking anticoagulants."
    },
    {
        "drugs": ["lisinopril", "spironolactone"],
        "severity": "HIGH",
        "warning": "Risk of hyperkalemia (dangerously high potassium levels). Can lead to lethal cardiac arrhythmias. Frequent serum potassium checks required."
    },
    {
        "drugs": ["nitroglycerin", "sildenafil"],
        "severity": "CRITICAL",
        "warning": "Severe, life-threatening drop in blood pressure. NEVER combine nitrates and PDE5 inhibitors."
    },
    {
        "drugs": ["aspirin", "ibuprofen"],
        "severity": "MODERATE",
        "warning": "Ibuprofen can block the cardioprotective effects of low-dose aspirin. Take ibuprofen at least 8 hours after or 30 minutes before aspirin."
    }
]

class DrugCheckRequest(BaseModel):
    drugs: List[str]

class DrugCheckResponse(BaseModel):
    drugs_analyzed: List[dict]
    interactions: List[dict]

@router.post("/drug-checker", response_model=DrugCheckResponse)
async def check_drugs(req: DrugCheckRequest, current_user: dict = Depends(get_current_user)):
    cleaned_inputs = [d.strip().lower() for d in req.drugs]
    
    analyzed = []
    for d in cleaned_inputs:
        if d in DRUG_DB:
            info = DRUG_DB[d]
            analyzed.append({
                "name": d.capitalize(),
                "class": info["class"],
                "uses": info["uses"],
                "side_effects": info["side_effects"],
                "status": "Recognized"
            })
        else:
            analyzed.append({
                "name": d.capitalize(),
                "class": "Unknown",
                "uses": "No details in local database",
                "side_effects": [],
                "status": "Unrecognized"
            })
            
    # Find interactions
    found_interactions = []
    for interaction in INTERACTIONS:
        matched_drugs = [d for d in cleaned_inputs if d in interaction["drugs"]]
        if len(matched_drugs) >= 2:
            found_interactions.append({
                "severity": interaction["severity"],
                "drugs": [d.capitalize() for d in interaction["drugs"]],
                "warning": interaction["warning"]
            })
            
    return {
        "drugs_analyzed": analyzed,
        "interactions": found_interactions
    }


# -----------------
# DIET PLANNER
# -----------------
class DietRequest(BaseModel):
    calories: int = Field(2000, ge=1000, le=4500)
    preference: str = "Vegetarian" # Vegetarian, Vegan, Non-Vegetarian, Keto
    conditions: List[str] = [] # Diabetes, Hypertension, CVD

@router.post("/diet-planner")
async def generate_diet(req: DietRequest, current_user: dict = Depends(get_current_user)):
    pref = req.preference.capitalize()
    conds = [c.capitalize() for c in req.conditions]
    
    # Custom meal blocks based on preference
    meals = {
        "Vegetarian": {
            "breakfast": "Steel-cut oatmeal topped with chia seeds, walnuts, and fresh berries.",
            "lunch": "Quinoa salad with chickpeas, cucumbers, cherry tomatoes, and lemon-olive oil dressing.",
            "dinner": "Lentil vegetable curry with a side of steamed brown rice.",
            "snack": "Apple slices with almond butter."
        },
        "Vegan": {
            "breakfast": "Tofu scramble with spinach, bell peppers, turmeric, and whole grain toast.",
            "lunch": "Mediterranean grain bowl with brown rice, hummus, roasted broccoli, and pumpkin seeds.",
            "dinner": "Black bean and sweet potato chili topped with sliced avocado.",
            "snack": "A handful of mixed nuts (walnuts, almonds)."
        },
        "Non-vegetarian": {
            "breakfast": "Poached eggs, avocado slices, and grilled asparagus.",
            "lunch": "Grilled salmon or chicken breast with a large mixed greens salad.",
            "dinner": "Baked turkey breast, roasted sweet potato, and steamed green beans.",
            "snack": "Greek yogurt (or dairy-free alt) with a drizzle of honey and walnuts."
        },
        "Keto": {
            "breakfast": "Three-egg omelet cooked in butter with spinach, mushrooms, and cheese.",
            "lunch": "Avocado chicken salad with olive oil dressing, celery, and pecans.",
            "dinner": "Pan-seared salmon fillet with asparagus spears roasted in olive oil.",
            "snack": "Macadamia nuts or celery sticks with cream cheese."
        }
    }
    
    meal_plan = meals.get(pref, meals["Vegetarian"]).copy()
    
    # Adjust meals dynamically if specific health risks are checked
    tips = []
    shopping_list = []
    
    if "Diabetes" in conds:
        tips.append("Focus on low-glycemic index foods. Distribute carbs evenly across meals. Avoid simple sugars.")
        shopping_list.extend(["Quinoa", "Walnuts", "Spinach", "Avocado", "Chias"])
        meal_plan["breakfast"] = "Low-glycemic seed porridge with walnuts and cinnamon (no added sweeteners)."
        meal_plan["snack"] = "Celery sticks with sugar-free peanut butter."
        
    if "Hypertension" in conds:
        tips.append("Lower sodium intake below 1500mg/day. Increase potassium-rich foods like bananas, spinach, and avocados.")
        shopping_list.extend(["Bananas", "Spinach", "Sweet Potatoes", "Low-sodium lentils"])
        meal_plan["lunch"] = "Sodium-free chickpea salad with fresh herbs and sliced avocado."
        
    if "Cvd" in conds or "Cardiovascular" in conds:
        tips.append("Focus on monounsaturated fats (olive oil, avocado) and omega-3 fatty acids (salmon, walnuts). Minimize saturated fats.")
        shopping_list.extend(["Extra Virgin Olive Oil", "Salmon", "Walnuts", "Blueberries"])
        meal_plan["dinner"] = "Baked cod or grilled tofu cooked in extra virgin olive oil, served with steamed broccoli."
        
    if not tips:
        tips.append("Stay hydrated by drinking 8-10 glasses of water. Avoid processed foods.")
        shopping_list.extend(["Whole grains", "Fresh greens", "Mixed berries", "Lean protein"])
        
    # Generate shopping list without duplicates
    shopping_list = list(set(shopping_list))
    
    return {
        "calorie_target": req.calories,
        "preference": pref,
        "conditions": conds,
        "meals": meal_plan,
        "shopping_list": shopping_list,
        "clinical_tips": tips
    }


# -----------------
# WORKOUT PLANNER
# -----------------
class WorkoutRequest(BaseModel):
    goal: str = "Weight Loss" # Weight Loss, Cardiovascular Fitness, Strength, Flexibility
    risk_level: str = "Low" # Low, Moderate, High

@router.post("/workout-planner")
async def generate_workout(req: WorkoutRequest, current_user: dict = Depends(get_current_user)):
    goal = req.goal.capitalize()
    risk = req.risk_level.capitalize()
    
    routine = {}
    precautions = []
    
    # High risk cardio/BP restrictions
    if risk == "High":
        precautions.append("⚠️ MEDICAL ADVISORY: Your cardiovascular/hypertension risk is classified as High. Avoid heavy lifting and intense isometric strain. Keep heart rate below 120 bpm.")
        precautions.append("Exercise in a cool environment, and stop immediately if you feel chest tightness, dizziness, or shortness of breath.")
        
        routine = {
            "Monday": "20-minute slow walk on flat ground. Hydrate fully.",
            "Tuesday": "15-minute gentle seated stretching and mobility exercises.",
            "Wednesday": "20-minute slow walk or gentle stationary cycling (low resistance).",
            "Thursday": "Rest and monitor vital recovery.",
            "Friday": "15-minute slow walk followed by light hamstring and shoulder stretches.",
            "Saturday": "Rest day. Short casual gardening or slow strolling.",
            "Sunday": "Rest day. Focus on slow deep-breathing cycles (10 minutes)."
        }
    elif risk == "Moderate":
        precautions.append("Keep workouts at a moderate pace (you should be able to speak but not sing). Warm up for 10 minutes.")
        routine = {
            "Monday": "30-minute brisk walk or light jogging. 5-minute cooldown.",
            "Tuesday": "Bodyweight squats and wall push-ups (3 sets of 10), plus core planks (30 seconds).",
            "Wednesday": "30-minute cycling or swimming at an easy pace.",
            "Thursday": "Rest day.",
            "Friday": "30-minute brisk walk and light yoga stretches.",
            "Saturday": "25-minute stationary rowing or elliptical training.",
            "Sunday": "Rest day."
        }
    else: # Low Risk
        precautions.append("Standard warm-up and cool-down are recommended. Push intensity safely.")
        
        if "Strength" in goal:
            routine = {
                "Monday": "Upper body push focus: Dumbbell press, overhead press, tricep extensions.",
                "Tuesday": "Lower body focus: Weighted squats, lunges, Romanian deadlifts.",
                "Wednesday": "Cardio interval training (HIIT or running - 30 minutes).",
                "Thursday": "Rest or active recovery yoga.",
                "Friday": "Upper body pull focus: Pull-ups, dumbbell rows, bicep curls.",
                "Saturday": "Full body compound lifting + core circuit.",
                "Sunday": "Rest day."
            }
        else: # Weight Loss / Cardio / Default
            routine = {
                "Monday": "40-minute jogging or interval running. Core plank circuit.",
                "Tuesday": "Full body resistance training: Kettlebell swings, pushups, walking lunges.",
                "Wednesday": "30-minute swimming or cycling (high intensity intervals).",
                "Thursday": "Rest day.",
                "Friday": "45-minute power walk or trail run. Lower body stretching.",
                "Saturday": "Bodyweight circuit (3 rounds: 15 squats, 10 pushups, 20 jumping jacks).",
                "Sunday": "Rest day."
            }
            
    return {
        "fitness_goal": goal,
        "risk_level": risk,
        "weekly_routine": routine,
        "safety_precautions": precautions,
        "hydration_target": "2.5 Liters daily" if risk != "High" else "2.0 Liters daily (consult doctor)"
    }

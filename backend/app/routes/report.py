import re
from io import BytesIO
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from pypdf import PdfReader
from datetime import datetime
from typing import List, Dict, Any, Optional

from .auth import get_current_user
from ..db import reports_collection

router = APIRouter()

# ─── Clinical Reference Ranges ────────────────────────────────────────────────

RANGES = {
    "glucose":      {"min": 70,   "max": 99,   "unit": "mg/dL",     "name": "Fasting Glucose"},
    "cholesterol":  {"min": 0,    "max": 199,  "unit": "mg/dL",     "name": "Total Cholesterol"},
    "ldl":          {"min": 0,    "max": 99,   "unit": "mg/dL",     "name": "LDL Cholesterol"},
    "hdl":          {"min": 40,   "max": 100,  "unit": "mg/dL",     "name": "HDL Cholesterol"},
    "triglycerides":{"min": 0,    "max": 149,  "unit": "mg/dL",     "name": "Triglycerides"},
    "systolic":     {"min": 90,   "max": 120,  "unit": "mmHg",      "name": "Systolic Blood Pressure"},
    "diastolic":    {"min": 60,   "max": 80,   "unit": "mmHg",      "name": "Diastolic Blood Pressure"},
    "hemoglobin":   {"min": 12.0, "max": 17.5, "unit": "g/dL",      "name": "Hemoglobin"},
    "wbc":          {"min": 4.5,  "max": 11.0, "unit": "x10³/uL",   "name": "White Blood Cells"},
    "rbc":          {"min": 4.0,  "max": 5.9,  "unit": "x10⁶/uL",  "name": "Red Blood Cells"},
    "heart_rate":   {"min": 60,   "max": 100,  "unit": "bpm",       "name": "Pulse / Heart Rate"},
    "spo2":         {"min": 95,   "max": 100,  "unit": "%",         "name": "SpO2 / Oxygen Saturation"},
    "weight":       {"min": 40,   "max": 120,  "unit": "kg",        "name": "Body Weight"},
}

def analyze_value(marker: str, value: float) -> Dict[str, Any]:
    cfg = RANGES.get(marker)
    if not cfg:
        return {
            "marker_name": marker.replace("_", " ").title(),
            "status": "Recorded",
            "interpretation": "Value recorded. No reference range configured.",
            "value": value,
            "unit": ""
        }

    mn, mx, unit, name = cfg["min"], cfg["max"], cfg["unit"], cfg["name"]

    if value < mn:
        status = "Low"
        if marker == "spo2" and value < 90:
            status = "Critical Low"
        msg = f"{name} is {value} {unit}, below the normal range of {mn}–{mx} {unit}."
        if marker == "hemoglobin":
            msg += " May indicate anaemia. Consult a physician."
        elif marker == "spo2":
            msg += " Low oxygen saturation — urgent medical attention advised."
        elif marker == "heart_rate":
            msg += " Bradycardia detected. Monitor pulse and consult a doctor."
    elif value > mx:
        status = "High"
        if marker == "glucose":
            if value >= 126:
                status = "Critical High"
                msg = f"Glucose {value} mg/dL — Diabetic range (≥126 mg/dL). Immediate clinical review advised."
            else:
                msg = f"Glucose {value} mg/dL — Pre-diabetic range (100–125 mg/dL). Dietary modifications recommended."
        elif marker == "systolic":
            if value >= 140:
                status = "Critical High"
                msg = f"Systolic BP {value} mmHg — Stage 2 Hypertension. Medical management required."
            elif value >= 130:
                msg = f"Systolic BP {value} mmHg — Stage 1 Hypertension. Lifestyle changes recommended."
            else:
                msg = f"Systolic BP {value} mmHg — Elevated (120–129 mmHg). Monitor closely."
        elif marker == "diastolic":
            if value >= 90:
                status = "Critical High"
                msg = f"Diastolic BP {value} mmHg — Hypertension Stage 2. Consult a cardiologist."
            else:
                msg = f"Diastolic BP {value} mmHg — Slightly elevated. Lifestyle changes advised."
        elif marker == "heart_rate":
            if value >= 120:
                status = "Critical High"
                msg = f"Pulse {value} bpm — Tachycardia detected. Clinical evaluation recommended."
            else:
                msg = f"Pulse {value} bpm — Mildly elevated. Could be due to anxiety, fever, or exertion."
        elif marker == "cholesterol":
            if value >= 240:
                status = "Critical High"
                msg = f"Cholesterol {value} mg/dL — High risk cardiovascular range."
            else:
                msg = f"Cholesterol {value} mg/dL — Borderline high. Dietary adjustments recommended."
        else:
            msg = f"{name} is {value} {unit}, above normal range of {mn}–{mx} {unit}."
    else:
        status = "Normal"
        msg = f"{name} is {value} {unit} — within the normal range ({mn}–{mx} {unit}). ✓"

    return {
        "marker_name": name,
        "status": status,
        "interpretation": msg,
        "value": value,
        "unit": unit
    }

# ─── Text Extraction ──────────────────────────────────────────────────────────

def extract_metrics_from_text(text: str) -> Dict[str, float]:
    t = text.lower()
    metrics = {}

    # Blood Pressure: 116/83 or BP: 116/83 or B.P 116/83
    bp = re.search(r'\b(?:bp|b\.?p\.?|blood\s*pressure)\s*[:\-=]?\s*(\d{2,3})\s*/\s*(\d{2,3})', t)
    if not bp:
        # standalone numbers like "116/83"
        bp = re.search(r'\b(\d{2,3})\s*/\s*(\d{2,3})\s*(?:mm\s*hg|mmhg)?', t)
    if bp:
        sys_val = float(bp.group(1))
        dia_val = float(bp.group(2))
        # sanity check: systolic > diastolic and in plausible range
        if 70 <= sys_val <= 220 and 40 <= dia_val <= 130 and sys_val > dia_val:
            metrics["systolic"] = sys_val
            metrics["diastolic"] = dia_val

    # Standalone systolic/diastolic
    if "systolic" not in metrics:
        m = re.search(r'\bsystolic\s*[:\-=]?\s*(\d{2,3})', t)
        if m: metrics["systolic"] = float(m.group(1))
    if "diastolic" not in metrics:
        m = re.search(r'\bdiastolic\s*[:\-=]?\s*(\d{2,3})', t)
        if m: metrics["diastolic"] = float(m.group(1))

    # SpO2 / Oxygen saturation
    spo2 = re.search(r'\b(?:spo2|sp02|spo\s*2|oxygen\s*sat(?:uration)?)\s*[:\-=]?\s*(\d{2,3})\s*%?', t)
    if spo2: metrics["spo2"] = float(spo2.group(1))

    # Pulse / Heart Rate / PR
    pr = re.search(r'\b(?:pr|pulse|heart\s*rate|hr)\s*[:\-=]?\s*(\d{2,3})\s*(?:bpm|b\.?p\.?m\.?)?', t)
    if pr: metrics["heart_rate"] = float(pr.group(1))

    # Weight
    wt = re.search(r'\b(?:wt|weight)\s*[:\-=]?\s*(\d{2,3}(?:\.\d)?)\s*(?:kg)?', t)
    if wt: metrics["weight"] = float(wt.group(1))

    # Glucose / Blood Sugar / FBS / RBS
    glucose = re.search(r'\b(?:fasting\s+)?(?:glucose|blood\s*sugar|fbs|rbs|bsl)\s*[:\-=]?\s*(\d+(?:\.\d+)?)', t)
    if glucose: metrics["glucose"] = float(glucose.group(1))

    # Cholesterol
    chol = re.search(r'\b(?:total\s+)?cholesterol\s*[:\-=]?\s*(\d{3})', t)
    if chol: metrics["cholesterol"] = float(chol.group(1))

    # LDL
    ldl = re.search(r'\bldl(?:\s+cholesterol)?\s*[:\-=]?\s*(\d{2,3})', t)
    if ldl: metrics["ldl"] = float(ldl.group(1))

    # HDL
    hdl = re.search(r'\bhdl(?:\s+cholesterol)?\s*[:\-=]?\s*(\d{2,3})', t)
    if hdl: metrics["hdl"] = float(hdl.group(1))

    # Triglycerides
    tri = re.search(r'\btriglycerides\s*[:\-=]?\s*(\d{2,3})', t)
    if tri: metrics["triglycerides"] = float(tri.group(1))

    # Hemoglobin
    hb = re.search(r'\b(?:hb|hemoglobin|haemoglobin)\s*[:\-=]?\s*([\d\.]+)', t)
    if hb: metrics["hemoglobin"] = float(hb.group(1))

    # WBC
    wbc = re.search(r'\bwbc\s*[:\-=]?\s*([\d\.]+)', t)
    if wbc: metrics["wbc"] = float(wbc.group(1))

    # RBC
    rbc = re.search(r'\brbc\s*[:\-=]?\s*([\d\.]+)', t)
    if rbc: metrics["rbc"] = float(rbc.group(1))

    return metrics

def build_summary(filename: str, analysis: dict, extracted: dict) -> str:
    summary = f"### Medical Report Summary — {filename}\n"
    summary += f"Analyzed: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}\n\n"

    if not analysis:
        summary += "⚠️ No standard health metrics were automatically extracted from this file.\n"
        summary += "If you uploaded a handwritten or image-based report, please use the **Manual Entry** form to enter values from the report.\n"
        return summary

    summary += "#### Extracted Vital Indicators:\n"
    abnormal = 0
    for k, v in analysis.items():
        icon = "🟢"
        if "Critical" in v["status"]: icon = "🔴"; abnormal += 1
        elif v["status"] in ("High", "Low"): icon = "🟡"; abnormal += 1
        summary += f"- **{v['marker_name']}**: {v['value']} {v['unit']} ({icon} {v['status']}) — {v['interpretation']}\n"

    summary += "\n#### Clinical Recommendation:\n"
    if abnormal == 0:
        summary += "✅ All detected parameters are within normal reference limits. Maintain your current lifestyle and schedule a routine check-up annually.\n"
    elif abnormal <= 2:
        summary += f"⚠️ {abnormal} parameter(s) are outside normal range. Monitor regularly and consider dietary or lifestyle adjustments. Consult a physician if symptoms persist.\n"
    else:
        summary += f"🚨 {abnormal} parameters require attention. Please consult a qualified healthcare provider promptly for a comprehensive clinical evaluation.\n"

    return summary

# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_report(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    filename = file.filename or "report"
    contents = await file.read()
    text = ""
    ocr_attempted = False
    ocr_error = None

    try:
        if filename.lower().endswith(".pdf"):
            reader = PdfReader(BytesIO(contents))
            for page in reader.pages:
                pt = page.extract_text()
                if pt:
                    text += pt + "\n"

        elif filename.lower().endswith((".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp")):
            ocr_attempted = True
            try:
                from PIL import Image
                import pytesseract
                # Set Tesseract path explicitly for Windows
                pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
                image = Image.open(BytesIO(contents))
                image = image.convert("L")
                text = pytesseract.image_to_string(image, config="--psm 6")
            except ImportError:
                ocr_error = "no_ocr"
                text = ""
            except Exception as e:
                ocr_error = f"OCR processing failed: {str(e)}"
                text = ""
        else:
            text = contents.decode("utf-8", errors="ignore")

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

    extracted = extract_metrics_from_text(text)
    analysis = {k: analyze_value(k, v) for k, v in extracted.items()}
    summary = build_summary(filename, analysis, extracted)

    if ocr_error and ocr_error != "no_ocr":
        summary += f"\n\n**Note:** {ocr_error}"

    report_record = {
        "user_id": user_id,
        "filename": filename,
        "raw_text": text[:2000] if text else "",
        "raw_text_length": len(text),
        "extracted_values": extracted,
        "analysis": analysis,
        "summary": summary,
        "ocr_attempted": ocr_attempted,
        "ocr_error": ocr_error,
        "timestamp": datetime.utcnow()
    }

    result = await reports_collection.insert_one(report_record)
    report_record["id"] = str(result.inserted_id)
    del report_record["_id"]
    return report_record


@router.post("/manual")
async def manual_report_entry(data: dict, current_user: dict = Depends(get_current_user)):
    """Accept manually entered vitals and analyze them — used when OCR/PDF extraction fails."""
    user_id = str(current_user["_id"])

    allowed = ["systolic", "diastolic", "heart_rate", "spo2", "weight",
               "glucose", "cholesterol", "ldl", "hdl", "triglycerides",
               "hemoglobin", "wbc", "rbc"]

    extracted = {}
    for key in allowed:
        val = data.get(key)
        if val is not None:
            try:
                extracted[key] = float(val)
            except (ValueError, TypeError):
                pass

    if not extracted:
        raise HTTPException(status_code=400, detail="No valid values provided. Please enter at least one measurement.")

    analysis = {k: analyze_value(k, v) for k, v in extracted.items()}
    filename = data.get("source_label", "Manual Entry")
    summary = build_summary(filename, analysis, extracted)

    report_record = {
        "user_id": user_id,
        "filename": filename,
        "raw_text": "",
        "raw_text_length": 0,
        "extracted_values": extracted,
        "analysis": analysis,
        "summary": summary,
        "ocr_attempted": False,
        "ocr_error": None,
        "timestamp": datetime.utcnow()
    }

    result = await reports_collection.insert_one(report_record)
    report_record["id"] = str(result.inserted_id)
    del report_record["_id"]
    return report_record


def _serialize_doc(doc: dict) -> dict:
    """Convert MongoDB doc to JSON-safe dict by removing _id and converting ObjectId fields."""
    from bson import ObjectId
    clean = {}
    for k, v in doc.items():
        if k == "_id":
            continue  # already stored as "id"
        elif isinstance(v, ObjectId):
            clean[k] = str(v)
        elif isinstance(v, dict):
            clean[k] = _serialize_doc(v)
        else:
            clean[k] = v
    return clean


@router.get("/history")
async def get_reports_history(current_user: dict = Depends(get_current_user)):
    cursor = reports_collection.find(
        {"user_id": str(current_user["_id"])}
    ).sort("timestamp", -1)
    history = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        history.append(_serialize_doc(doc))
    return history

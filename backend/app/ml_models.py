import time
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

# Dictionary to hold the trained models, scalers, and performance metrics
MODEL_REGISTRY = {}

def generate_synthetic_data(num_samples=1000, seed=42):
    """
    Generates synthetic patient health profiles and labels for:
    - Diabetes
    - Cardiovascular Disease (CVD)
    - Hypertension
    """
    np.random.seed(seed)
    
    # Feature ranges
    age = np.random.randint(18, 85, size=num_samples)
    bmi = np.random.uniform(16.0, 42.0, size=num_samples)
    systolic_bp = np.random.randint(90, 185, size=num_samples)
    diastolic_bp = np.random.randint(55, 115, size=num_samples)
    blood_sugar = np.random.randint(65, 260, size=num_samples)
    cholesterol = np.random.randint(120, 320, size=num_samples)
    active_minutes = np.random.randint(0, 120, size=num_samples)
    smoking = np.random.choice([0, 1], size=num_samples, p=[0.7, 0.3])
    alcohol = np.random.choice([0, 1], size=num_samples, p=[0.6, 0.4])
    
    # Target calculations using logistic probability scores
    
    # 1. Diabetes Probability
    # Strong correlation: blood_sugar, bmi, age. Negative correlation: active_minutes
    sugar_norm = (blood_sugar - 70) / 100
    bmi_norm = (bmi - 20) / 10
    age_norm = (age - 20) / 50
    act_norm = active_minutes / 60
    db_score = (3.5 * sugar_norm) + (1.2 * bmi_norm) + (0.5 * age_norm) - (0.8 * act_norm) - 1.5
    db_prob = 1 / (1 + np.exp(-db_score))
    diabetes = (np.random.uniform(0, 1, num_samples) < db_prob).astype(int)
    
    # 2. Cardiovascular Disease (CVD) Probability
    # Strong correlation: systolic_bp, cholesterol, age, smoking, bmi
    sbp_norm = (systolic_bp - 120) / 30
    chol_norm = (cholesterol - 180) / 60
    age_cv_norm = (age - 40) / 30
    cv_score = (2.0 * sbp_norm) + (1.8 * chol_norm) + (1.0 * age_cv_norm) + (1.5 * smoking) + (0.8 * (bmi > 28)) - 2.5
    cv_prob = 1 / (1 + np.exp(-cv_score))
    cvd = (np.random.uniform(0, 1, num_samples) < cv_prob).astype(int)
    
    # 3. Hypertension Probability
    # Strong correlation: systolic_bp, diastolic_bp, age, bmi, alcohol
    dbp_norm = (diastolic_bp - 80) / 15
    ht_score = (3.0 * sbp_norm) + (2.5 * dbp_norm) + (1.0 * bmi_norm) + (0.5 * age_norm) + (0.5 * alcohol) - 2.0
    ht_prob = 1 / (1 + np.exp(-ht_score))
    hypertension = (np.random.uniform(0, 1, num_samples) < ht_prob).astype(int)
    
    df = pd.DataFrame({
        "age": age,
        "bmi": bmi,
        "systolic_bp": systolic_bp,
        "diastolic_bp": diastolic_bp,
        "blood_sugar": blood_sugar,
        "cholesterol": cholesterol,
        "active_minutes": active_minutes,
        "smoking": smoking,
        "alcohol": alcohol,
        "diabetes": diabetes,
        "cvd": cvd,
        "hypertension": hypertension
    })
    return df

def train_models():
    """Trains Random Forest and XGBoost classifiers for Diabetes, CVD, and Hypertension."""
    print("Generating synthetic dataset and training ML models...")
    df = generate_synthetic_data()
    
    features = [
        "age", "bmi", "systolic_bp", "diastolic_bp", 
        "blood_sugar", "cholesterol", "active_minutes", 
        "smoking", "alcohol"
    ]
    
    targets = ["diabetes", "cvd", "hypertension"]
    
    X = df[features]
    
    # Train scaler on the entire feature set for simplicity
    scaler = StandardScaler()
    X_scaled = pd.DataFrame(scaler.fit_transform(X), columns=features)
    
    MODEL_REGISTRY["scaler"] = scaler
    MODEL_REGISTRY["features"] = features
    MODEL_REGISTRY["targets"] = {}
    
    for target in targets:
        y = df[target]
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)
        
        # 1. Train Random Forest
        rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
        rf_model.fit(X_train, y_train)
        
        rf_train_acc = rf_model.score(X_train, y_train)
        rf_test_acc = rf_model.score(X_test, y_test)
        
        # Get RF Feature Importances
        rf_importances = dict(zip(features, [float(i) for i in rf_model.feature_importances_]))
        
        # 2. Train XGBoost
        xgb_model = XGBClassifier(n_estimators=100, max_depth=4, learning_rate=0.1, random_state=42, eval_metric="logloss")
        xgb_model.fit(X_train, y_train)
        
        xgb_train_acc = xgb_model.score(X_train, y_train)
        xgb_test_acc = xgb_model.score(X_test, y_test)
        
        # Get XGB Feature Importances
        xgb_importances = dict(zip(features, [float(i) for i in xgb_model.feature_importances_]))
        
        # Store in registry
        MODEL_REGISTRY["targets"][target] = {
            "rf": {
                "model": rf_model,
                "train_accuracy": float(rf_train_acc),
                "test_accuracy": float(rf_test_acc),
                "importances": rf_importances
            },
            "xgb": {
                "model": xgb_model,
                "train_accuracy": float(xgb_train_acc),
                "test_accuracy": float(xgb_test_acc),
                "importances": xgb_importances
            }
        }
        print(f"Target '{target}' trained successfully.")
        print(f"  RF Test Acc: {rf_test_acc:.4f} | XGB Test Acc: {xgb_test_acc:.4f}")

def predict_health_risks(patient_data: dict):
    """
    Given patient data, scales it and runs both RF and XGBoost predictions.
    patient_data example: {
        "age": 45, "bmi": 28.5, "systolic_bp": 130, "diastolic_bp": 85,
        "blood_sugar": 105, "cholesterol": 210, "active_minutes": 30,
        "smoking": 0, "alcohol": 1
    }
    """
    if "scaler" not in MODEL_REGISTRY:
        # Fallback in case models aren't trained
        train_models()
        
    scaler = MODEL_REGISTRY["scaler"]
    features = MODEL_REGISTRY["features"]
    
    # Form input array
    input_row = [patient_data.get(f, 0.0) for f in features]
    input_df = pd.DataFrame([input_row], columns=features)
    
    # Scale
    input_scaled = pd.DataFrame(scaler.transform(input_df), columns=features)
    
    results = {}
    
    for target in MODEL_REGISTRY["targets"]:
        target_models = MODEL_REGISTRY["targets"][target]
        
        # Random Forest prediction and execution time
        start_rf = time.perf_counter()
        rf_prob = float(target_models["rf"]["model"].predict_proba(input_scaled)[0][1])
        end_rf = time.perf_counter()
        rf_time = (end_rf - start_rf) * 1000 # ms
        
        # XGBoost prediction and execution time
        start_xgb = time.perf_counter()
        xgb_prob = float(target_models["xgb"]["model"].predict_proba(input_scaled)[0][1])
        end_xgb = time.perf_counter()
        xgb_time = (end_xgb - start_xgb) * 1000 # ms
        
        results[target] = {
            "rf": {
                "probability": rf_prob,
                "time_ms": rf_time,
                "test_accuracy": target_models["rf"]["test_accuracy"],
                "importances": target_models["rf"]["importances"]
            },
            "xgb": {
                "probability": xgb_prob,
                "time_ms": xgb_time,
                "test_accuracy": target_models["xgb"]["test_accuracy"],
                "importances": target_models["xgb"]["importances"]
            }
        }
        
    return results

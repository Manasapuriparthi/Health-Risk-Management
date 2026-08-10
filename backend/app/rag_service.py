from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# A rich local knowledge base of clinical guidelines, symptoms, diets, and exercise advice
KNOWLEDGE_BASE = [
    {
        "id": "diabetes_definition",
        "category": "Diabetes",
        "keywords": "what is diabetes symptoms blood sugar glucose types definition",
        "title": "Understanding Diabetes",
        "content": "Diabetes is a chronic metabolic disease characterized by elevated levels of blood glucose (or blood sugar). It occurs either when the pancreas does not produce enough insulin (Type 1), or when the body cannot effectively use the insulin it produces (Type 2). Common symptoms include increased thirst, frequent urination, unexplained weight loss, and fatigue."
    },
    {
        "id": "diabetes_ranges",
        "category": "Diabetes",
        "keywords": "diabetes range blood sugar levels fasting post prandial random numbers hba1c",
        "title": "Healthy Blood Sugar Ranges",
        "content": "For blood glucose: Fasting levels under 100 mg/dL are normal; 100-125 mg/dL indicate prediabetes; 126 mg/dL or higher indicate diabetes. Post-prandial (2 hours after eating) levels should be under 140 mg/dL. Normal HbA1c is below 5.7%; prediabetes is 5.7%-6.4%; diabetes is 6.5% or higher."
    },
    {
        "id": "diabetes_diet",
        "category": "Diabetes",
        "keywords": "diabetes diet food eat avoid sugar carbs low glycemic index",
        "title": "Dietary Management for Diabetes",
        "content": "Focus on high-fiber, low-glycemic foods such as leafy vegetables, legumes, whole grains (oats, quinoa), and lean proteins. Limit refined carbohydrates, sugary beverages, processed foods, and trans fats. Distribute carbohydrate intake evenly throughout the day to avoid blood glucose spikes."
    },
    {
        "id": "diabetes_exercise",
        "category": "Diabetes",
        "keywords": "diabetes exercise workout active movement blood sugar control",
        "title": "Exercise Guidelines for Diabetes",
        "content": "Physical activity increases insulin sensitivity, allowing muscle cells to use glucose for energy. Aim for at least 150 minutes of moderate-intensity aerobic exercise (like brisk walking or swimming) per week, plus strength training twice weekly. Always check blood sugar levels before exercising to prevent hypoglycemia."
    },
    {
        "id": "hypertension_definition",
        "category": "Hypertension",
        "keywords": "what is hypertension blood pressure definition numbers systolic diastolic",
        "title": "Understanding Hypertension (High BP)",
        "content": "Hypertension is a chronic medical condition where the force of the blood against the artery walls is consistently too high. It is often called the 'silent killer' because it rarely has symptoms. Normal blood pressure is under 120/80 mmHg. Elevated is 120-129/<80. Stage 1 Hypertension is 130-139/80-89. Stage 2 is 140/90 or higher."
    },
    {
        "id": "hypertension_risks",
        "category": "Hypertension",
        "keywords": "hypertension risks complications high bp heart attack stroke kidney damage",
        "title": "Risks of Untreated Hypertension",
        "content": "Chronic high blood pressure damages blood vessels and organs over time. It significantly increases the risk of heart attacks, stroke, chronic kidney disease, heart failure, and vision loss. Managing BP through lifestyle and medication is vital to prevent these complications."
    },
    {
        "id": "hypertension_diet",
        "category": "Hypertension",
        "keywords": "hypertension diet dash sodium salt eat potassium magnesium low salt",
        "title": "DASH Diet for High Blood Pressure",
        "content": "The DASH (Dietary Approaches to Stop Hypertension) diet is clinically proven to lower BP. It emphasizes reducing sodium intake (aim for < 1500-2300 mg per day), and increasing potassium, calcium, and magnesium from fruits, vegetables, whole grains, nuts, and low-fat dairy. Avoid processed meats and salty snacks."
    },
    {
        "id": "hypertension_exercise",
        "category": "Hypertension",
        "keywords": "hypertension exercise workout safe lower blood pressure cardio walking",
        "title": "Safe Workouts for Hypertension",
        "content": "Cardiovascular exercise dilates blood vessels, lowering blood pressure. Engage in aerobic activities like brisk walking, cycling, or jogging for 30-45 minutes daily. Avoid heavy isometric lifting or holding your breath (valsalva maneuver), which can cause temporary dangerous spikes in blood pressure."
    },
    {
        "id": "cvd_definition",
        "category": "Cardiovascular Disease",
        "keywords": "what is cardiovascular disease cvd heart attack stroke coronary artery heart failure symptoms",
        "title": "Understanding Cardiovascular Disease (CVD)",
        "content": "Cardiovascular disease is a class of diseases that involve the heart or blood vessels. This includes coronary artery disease (plaque build-up in arteries), heart failure, heart rhythm problems (arrhythmias), and stroke. Warning signs of a heart attack include chest pain, shortness of breath, and pain in the left arm or neck."
    },
    {
        "id": "cvd_cholesterol",
        "category": "Cardiovascular Disease",
        "keywords": "cholesterol ldl hdl triglycerides lipids levels good bad normal ranges",
        "title": "Cholesterol and Heart Health",
        "content": "Cholesterol travels in the blood bound to proteins (lipoproteins). LDL (Low-Density Lipoprotein) is the 'bad' cholesterol that forms plaques. HDL (High-Density Lipoprotein) is the 'good' cholesterol that clears cholesterol from blood. Aim for Total Cholesterol < 200 mg/dL, LDL < 100 mg/dL, and HDL > 40 mg/dL (men) or > 50 mg/dL (women)."
    },
    {
        "id": "cvd_prevention",
        "category": "Cardiovascular Disease",
        "keywords": "prevent heart disease cvd smoking diet exercise stress omega 3",
        "title": "Preventative Cardiology Checklist",
        "content": "To prevent cardiovascular disease: 1. Avoid smoking and limit alcohol. 2. Eat a heart-healthy Mediterranean diet rich in olive oil, fish (omega-3 fatty acids), vegetables, and nuts. 3. Manage stress through sleep and relaxation. 4. Maintain a healthy body weight (BMI between 18.5 and 24.9)."
    },
    {
        "id": "diet_general",
        "category": "Diet",
        "keywords": "general healthy eating fruits vegetables fiber lean protein hydration water",
        "title": "Foundations of Healthy Nutrition",
        "content": "A healthy diet builds on whole, unprocessed foods. Fill half your plate with colorful vegetables and fruits, a quarter with lean protein (poultry, fish, tofu, beans), and a quarter with complex carbs (brown rice, oats). Drink at least 2 to 3 liters of water daily, depending on activity level."
    },
    {
        "id": "workout_general",
        "category": "Workout",
        "keywords": "general fitness routine strength training cardio stretching warm up frequency duration",
        "title": "Designing a Balanced Fitness Routine",
        "content": "A well-rounded fitness plan combines: 1. Aerobic exercise (cardio) to build stamina and heart health (150 min/week). 2. Resistance (strength) training to build muscle and bone density (2 days/week). 3. Flexibility and balance training (stretching, yoga) to prevent injury and maintain mobility."
    },
    {
        "id": "drug_interactions_general",
        "category": "Medication",
        "keywords": "drug interactions warnings aspirin warfarin lisinopril side effects checking",
        "title": "Understanding Drug Interactions",
        "content": "Drug interactions occur when a substance affects how a medication works. For example, taking Aspirin (blood thinner) and Warfarin together increases bleeding risk. Taking Lisinopril (ACE inhibitor) and Potassium supplements can lead to hyperkalemia (high potassium). Always review medications with a provider."
    }
]

# Initialize and train TF-IDF Vectorizer
documents = [doc["keywords"] + " " + doc["title"] + " " + doc["content"] for doc in KNOWLEDGE_BASE]
vectorizer = TfidfVectorizer(stop_words='english')
tfidf_matrix = vectorizer.fit_transform(documents)

def retrieve_knowledge(query: str, threshold=0.1, top_k=2):
    """
    Given a query, returns the top matching documents from our local knowledge base
    based on TF-IDF cosine similarity.
    """
    query_vec = vectorizer.transform([query])
    similarities = cosine_similarity(query_vec, tfidf_matrix).flatten()
    
    # Get indices of top matches
    top_indices = np.argsort(similarities)[::-1]
    
    matches = []
    for idx in top_indices:
        sim = similarities[idx]
        if sim >= threshold:
            matches.append({
                "document": KNOWLEDGE_BASE[idx],
                "similarity": float(sim)
            })
            if len(matches) >= top_k:
                break
    return matches

def generate_rag_response(query: str, user_vitals: dict = None):
    """
    Generates a personalized, context-aware health advisor response.
    Composes matching clinical entries with user's current vitals to provide highly specific guidance.
    """
    matches = retrieve_knowledge(query)
    
    # Start response block
    response_text = ""
    
    if not matches:
        # Generic fallback using rules
        response_text = "I couldn't find a direct match for your specific query in our clinical registry. However, I can help you understand blood pressure, blood sugar, healthy diet guidelines, and exercises for hypertension or diabetes. Feel free to ask about these topics!\n\n"
    else:
        response_text = "Based on our clinical guidelines registry, here is the relevant medical guidance:\n\n"
        for match in matches:
            doc = match["document"]
            response_text += f"### {doc['title']} ({doc['category']})\n{doc['content']}\n\n"
            
    # Integrate User Vitals Context (Dynamic RAG)
    if user_vitals:
        response_text += "### Your Health Profile Correlation\n"
        correlations = []
        
        # Check BP
        systolic = user_vitals.get("systolic_bp")
        diastolic = user_vitals.get("diastolic_bp")
        if systolic is not None and diastolic is not None:
            if systolic >= 140 or diastolic >= 90:
                correlations.append(f"- **Elevated Blood Pressure Detected**: Your latest reading is **{systolic}/{diastolic} mmHg** (Stage 2 Hypertension range). Based on our clinical DASH guidelines, we recommend lowering sodium intake below 1500mg daily and focusing on light aerobic exercise (like brisk walking). Avoid high-weight static training.")
            elif systolic >= 130 or diastolic >= 80:
                correlations.append(f"- **Pre-hypertension Warning**: Your blood pressure is **{systolic}/{diastolic} mmHg**. Consider reducing stress, checking caffeine levels, and keeping a daily log.")
            else:
                correlations.append(f"- **Normal Blood Pressure**: Your BP of **{systolic}/{diastolic} mmHg** is excellent! Continue your current health routine.")
                
        # Check Blood Sugar
        blood_sugar = user_vitals.get("blood_sugar")
        if blood_sugar is not None:
            if blood_sugar >= 140:
                correlations.append(f"- **High Blood Glucose**: Your glucose level is **{blood_sugar} mg/dL** (elevated). Consuming low-glycemic foods (quinoa, leafy greens) and scheduling a 20-minute walk after meals will help lower insulin spikes.")
            elif blood_sugar < 70:
                correlations.append(f"- **Low Blood Glucose Warning**: Your glucose level is **{blood_sugar} mg/dL** (hypoglycemia range). Please consume fast-acting sugars (like fruit juice or honey) immediately.")
            else:
                correlations.append(f"- **Stable Blood Glucose**: Your blood glucose of **{blood_sugar} mg/dL** is in the optimal target range.")
                
        # Check BMI
        bmi = user_vitals.get("bmi")
        if bmi is not None:
            if bmi >= 25.0:
                correlations.append(f"- **Elevated BMI Warning**: Your body mass index is **{bmi:.1f}** (Overweight/Obese). Small, consistent weight reductions (e.g. 5-10% of body weight) are clinically shown to reduce cardiovascular and diabetes risks by up to 50%.")
            elif bmi < 18.5:
                correlations.append(f"- **Low BMI Warning**: Your body mass index is **{bmi:.1f}** (Underweight). Focus on building lean muscle mass and eating nutrient-dense, high-protein foods.")
            else:
                correlations.append(f"- **Healthy BMI**: Your body mass index is **{bmi:.1f}** (Normal). Great job maintaining a balanced body composition.")
                
        if correlations:
            response_text += "\n".join(correlations) + "\n\n"
        else:
            response_text += "No active vitals deviations logged. Keep updating your daily vitals to receive personalized clinical correlations!\n\n"
            
    response_text += "> **Disclaimer**: I am an AI Health Coach running a local clinical registry. My advice is for informational and educational purposes only. Please consult a licensed medical professional for formal diagnoses and treatments."
    
    # Formulate quick suggestions/follow-ups based on match categories
    categories = list(set([m["document"]["category"] for m in matches])) if matches else ["General"]
    suggestions = []
    if "Diabetes" in categories:
        suggestions = ["What are normal fasting blood sugar ranges?", "Suggest a low-carb diet menu", "How does exercise lower blood sugar?"]
    elif "Hypertension" in categories:
        suggestions = ["Explain the DASH diet guidelines", "Is lifting weights safe with high BP?", "What are symptoms of a hypertensive crisis?"]
    elif "Cardiovascular Disease" in categories:
        suggestions = ["What is the difference between LDL and HDL cholesterol?", "How can I prevent heart attacks?", "What are warning signs of heart failure?"]
    else:
        suggestions = ["Explain blood pressure classifications", "What are the rules of healthy nutrition?", "Explain safe exercise frequencies"]
        
    return {
        "response": response_text,
        "suggestions": suggestions
    }

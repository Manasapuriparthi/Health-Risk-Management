import os
import urllib.request
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Expanded clinical & general health knowledge base covering a broad spectrum of medical queries
KNOWLEDGE_BASE = [
    {
        "id": "headache_migraine",
        "category": "Headache & Pain",
        "keywords": "headache migraines head pain throbbing tension headache cluster relief medication treatment tylenol ibuprofen aspirin headache medicine",
        "title": "Headache & Migraine Management",
        "content": "Headaches can be caused by tension, stress, dehydration, lack of sleep, or underlying conditions like migraines. Common OTC relief includes Acetaminophen (Tylenol) or NSAIDs like Ibuprofen (Advil/Motrin). For tension headaches, staying hydrated, resting in a dim room, applying a cool compress, and gentle neck stretches help. Seeking urgent medical care is necessary if a headache is sudden and severe ('thunderclap headache'), accompanied by high fever, stiff neck, confusion, numbness, or vision changes."
    },
    {
        "id": "fever_flu_cold",
        "category": "Fever & Infection",
        "keywords": "fever body temperature flu cold cough chills body ache viral infection medication paracetamol acetaminophen ibuprofen temperature 100 101 102",
        "title": "Fever & Viral Infection Care",
        "content": "A fever (body temperature above 100.4°F / 38°C) is the body's natural defense against infection. Stay hydrated with water, clear broths, or oral rehydration fluids. Rest is critical. Over-the-counter antipyretics like Acetaminophen or Paracetamol help lower fever and soothe body aches. Contact a doctor if fever exceeds 103°F (39.4°C), lasts more than 3 days, or is accompanied by difficulty breathing, chest pain, or severe lethargy."
    },
    {
        "id": "respiratory_asthma",
        "category": "Respiratory",
        "keywords": "asthma breathing shortness of breath cough wheezing lungs chest tightness allergy inhaler",
        "title": "Respiratory Health & Asthma Guidance",
        "content": "Shortness of breath or persistent coughing can stem from asthma, bronchitis, allergies, or viral respiratory infections. Asthma management involves quick-relief rescue inhalers (like Albuterol) and long-term control medications. Avoid known environmental triggers such as smoke, dust, and pet dander. Seek emergency care immediately if experiencing severe gasping, blue lips/fingernails, or inability to speak full sentences."
    },
    {
        "id": "digestive_acidity_nausea",
        "category": "Digestive Health",
        "keywords": "stomach pain heartburn acidity GERD nausea vomiting diarrhea indigestion constipation stomach ache gas stomach ulcer antacids",
        "title": "Digestive & Gastrointestinal Health",
        "content": "Heartburn and acid reflux (GERD) can be managed by avoiding spicy, greasy foods, eating smaller meals, and avoiding lying down for 2-3 hours after eating. OTC antacids or H2 blockers (like Famotidine) offer temporary relief. For mild nausea or stomach upset, try ginger tea, peppermint, or the BRAT diet (Bananas, Rice, Applesauce, Toast). Ensure adequate fluid intake to prevent dehydration during diarrhea or vomiting."
    },
    {
        "id": "allergies_skin",
        "category": "Allergies & Skin",
        "keywords": "allergy allergies skin rash itching hives sneezing runny nose antihistamine zyrtec claritin benadryl eczema dermatitis",
        "title": "Allergies & Skin Rash Care",
        "content": "Allergic reactions cause sneezing, itchy eyes, runny nose, or skin hives due to histamine release. Non-drowsy OTC antihistamines (Loratadine/Claritin, Cetirizine/Zyrtec, Fexofenadine/Allegra) relieve symptoms. For skin itching and rashes, hydrocortisone cream or calamine lotion helps. Emergency medical help (EpiPen / 911) is required for severe anaphylaxis symptoms such as swelling of the lips, tongue, throat, or wheezing."
    },
    {
        "id": "pain_medications_general",
        "category": "Medication & Pain Relief",
        "keywords": "medication pain medicine painkiller ibuprofen acetaminophen naproxen aspirin dosage safety side effects OTC over the counter",
        "title": "OTC Pain Medications & Safe Usage",
        "content": "Over-the-counter pain relievers generally fall into two categories: Acetaminophen (Tylenol), which relieves pain and fever without reducing inflammation, and NSAIDs (Ibuprofen, Naproxen, Aspirin), which lower both pain and inflammation. Always adhere to maximum daily dosage limits (e.g. max 3,000-4,000 mg Acetaminophen daily to protect the liver). Take NSAIDs with food to prevent gastric ulceration."
    },
    {
        "id": "sleep_stress_mental",
        "category": "Mental Health & Sleep",
        "keywords": "sleep insomnia stress anxiety depression mental health fatigue exhaustion restlessness sleep hygiene melatonin relaxation",
        "title": "Sleep Hygiene & Stress Management",
        "content": "Quality sleep (7-9 hours per night) and stress reduction are fundamental to immune function and cardiovascular health. Maintain a consistent sleep schedule, limit screen time 1 hour before bed, and keep the bedroom cool and dark. Deep breathing, meditation, and regular physical activity help regulate cortisol and alleviate chronic stress or mild anxiety."
    },
    {
        "id": "diabetes_definition",
        "category": "Diabetes",
        "keywords": "what is diabetes symptoms blood sugar glucose types definition insulin hba1c fasting post prandial",
        "title": "Understanding & Managing Diabetes",
        "content": "Diabetes is a chronic metabolic disease characterized by elevated blood glucose. Normal fasting glucose is <100 mg/dL; prediabetes is 100-125 mg/dL; diabetes is ≥126 mg/dL. Manage glucose with a high-fiber, low-glycemic diet (leafy greens, whole grains, lean proteins), regular aerobic exercise (150 min/week), and prescribed medications/insulin as directed by your physician."
    },
    {
        "id": "hypertension_definition",
        "category": "Hypertension",
        "keywords": "what is hypertension blood pressure definition numbers systolic diastolic dash diet sodium low salt high bp",
        "title": "Understanding & Managing Hypertension",
        "content": "Hypertension (high blood pressure) occurs when blood force against artery walls remains high. Normal BP is <120/80 mmHg; Stage 1 is 130-139/80-89; Stage 2 is ≥140/90. Lower BP using the DASH diet (reducing sodium <2300 mg/day, increasing potassium and magnesium), engaging in 30 minutes of daily cardio, limiting alcohol, and avoiding smoking."
    },
    {
        "id": "cvd_definition",
        "category": "Cardiovascular Disease",
        "keywords": "what is cardiovascular disease cvd heart attack stroke cholesterol ldl hdl triglycerides chest pain heart health",
        "title": "Cardiovascular Disease & Heart Health",
        "content": "Cardiovascular disease involves the heart and blood vessels, including coronary artery disease and stroke. Key markers include cholesterol (aim for Total <200 mg/dL, LDL <100 mg/dL, HDL >40 mg/dL). Protect heart health through a Mediterranean diet rich in omega-3 fatty acids, maintaining healthy weight, stress management, and regular exercise."
    },
    {
        "id": "first_aid_cuts_burns",
        "category": "First Aid",
        "keywords": "first aid minor cuts burns wounds bleeding sprain injury emergency ice compression elevation CPR",
        "title": "Basic First Aid Guidelines",
        "content": "For minor cuts: Wash thoroughly with mild soap and water, apply antibiotic ointment, and cover with a sterile bandage. For minor (1st degree) burns: Run cool water over the area for 10-15 minutes (never ice), apply aloe vera or burn gel, and bandage loosely. For acute joint sprains, use RICE: Rest, Ice (15 mins), Compression, and Elevation."
    }
]

# Build TF-IDF Vectorizer
documents = [doc["keywords"] + " " + doc["title"] + " " + doc["content"] for doc in KNOWLEDGE_BASE]
vectorizer = TfidfVectorizer(stop_words='english')
tfidf_matrix = vectorizer.fit_transform(documents)

MEDICAL_DISCLAIMER = "\n\n> ⚠️ **Disclaimer**: This AI assistant provides general health information for educational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for severe symptoms or medication advice."

def retrieve_knowledge(query: str, threshold=0.05, top_k=2):
    """
    Retrieves matching documents from the knowledge base using TF-IDF cosine similarity.
    """
    query_vec = vectorizer.transform([query])
    similarities = cosine_similarity(query_vec, tfidf_matrix).flatten()
    
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

def _query_openai_llm(prompt: str, user_vitals: dict = None) -> str:
    """
    Calls OpenAI API if OPENAI_API_KEY is available.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
        
    try:
        url = "https://api.openai.com/v1/chat/completions"
        system_content = (
            "You are VitalPredict's expert AI Health Assistant. Provide clear, empathetic, evidence-based general medical "
            "and health guidance. Analyze the user's health question and integrate their current vitals if provided. "
            "Never issue formal medical prescriptions. Always maintain professional medical standards."
        )
        if user_vitals:
            system_content += f"\nUser's Current Logged Vitals Context: {json.dumps(user_vitals)}"
            
        data = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": system_content},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.5,
            "max_tokens": 500
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            }
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return res_data["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"OpenAI API call failed, falling back to local RAG engine: {e}")
        return None

def generate_rag_response(query: str, user_vitals: dict = None):
    """
    Generates a context-aware medical and health response for general health queries.
    Uses OpenAI LLM API when configured, backed by local multi-category RAG semantic search.
    """
    # 1. Try OpenAI LLM if configured
    llm_response = _query_openai_llm(query, user_vitals)
    if llm_response:
        full_response = llm_response + MEDICAL_DISCLAIMER
        return {
            "response": full_response,
            "suggestions": [
                "What medication precautions should I keep in mind?",
                "What symptoms require emergency care?",
                "How do my vitals impact this condition?"
            ]
        }

    # 2. Local Semantic RAG Knowledge Pipeline
    matches = retrieve_knowledge(query)
    response_text = ""
    
    if matches:
        response_text = "Based on clinical health guidelines, here is the relevant medical guidance:\n\n"
        for match in matches:
            doc = match["document"]
            response_text += f"### {doc['title']} ({doc['category']})\n{doc['content']}\n\n"
    else:
        # Dynamic query synthesis for general health questions outside exact index matches
        response_text = (
            f"### Health & Medical Guidance: '{query.title()}'\n"
            f"Here is general medical advice regarding your query:\n\n"
            f"- **General Care**: For general discomfort, fever, or mild aches, rest, adequate hydration, and balanced nutrition are primary recovery measures.\n"
            f"- **Over-The-Counter Relief**: Common OTC medications like Acetaminophen (Tylenol) can manage mild pain or fever, while Antihistamines can soothe mild allergic reactions. Always check package dosages.\n"
            f"- **When to See a Doctor**: If you experience persistent severe pain, high fever (>103°F), shortness of breath, chest pressure, or symptoms lasting more than 3-5 days, consult a physician promptly.\n\n"
        )

    # 3. Integrate User Vitals Context Correlation if available
    if user_vitals:
        correlations = []
        systolic = user_vitals.get("systolic_bp")
        diastolic = user_vitals.get("diastolic_bp")
        if systolic is not None and diastolic is not None:
            if systolic >= 140 or diastolic >= 90:
                correlations.append(f"- **Elevated Blood Pressure**: Your latest BP is **{systolic}/{diastolic} mmHg** (Stage 2 Hypertension range). Avoid intense isometric exertion or excessive sodium while feeling unwell.")
            elif systolic >= 130 or diastolic >= 80:
                correlations.append(f"- **Elevated Blood Pressure**: Your latest BP is **{systolic}/{diastolic} mmHg**. Ensure adequate rest and hydration.")
            else:
                correlations.append(f"- **Normal Blood Pressure**: Your BP reading of **{systolic}/{diastolic} mmHg** is within healthy ranges.")

        blood_sugar = user_vitals.get("blood_sugar")
        if blood_sugar is not None:
            if blood_sugar >= 140:
                correlations.append(f"- **Elevated Blood Glucose**: Your latest blood sugar is **{blood_sugar} mg/dL**. Monitor carbohydrate intake.")
            elif blood_sugar < 70:
                correlations.append(f"- **Hypoglycemia Alert**: Your blood sugar is **{blood_sugar} mg/dL**. Consume fast-acting glucose immediately.")
            else:
                correlations.append(f"- **Stable Blood Glucose**: Your glucose level is **{blood_sugar} mg/dL** (optimal).")

        bmi = user_vitals.get("bmi")
        if bmi is not None:
            correlations.append(f"- **Body Mass Index**: Your current BMI is **{bmi:.1f}**.")

        if correlations:
            response_text += "### Your Health Profile Correlation\n" + "\n".join(correlations) + "\n\n"

    # 4. Mandatory Medical Disclaimer
    response_text += MEDICAL_DISCLAIMER

    # 5. Formulate dynamic follow-up suggestions
    categories = list(set([m["document"]["category"] for m in matches])) if matches else ["General"]
    suggestions = []
    if "Headache & Pain" in categories or "Medication" in categories:
        suggestions = ["What is the safe maximum daily dose of Tylenol?", "When is a headache considered a medical emergency?", "Difference between tension headache and migraine"]
    elif "Fever & Infection" in categories:
        suggestions = ["When should a fever be evaluated by a doctor?", "How to stay hydrated during viral fever?", "Difference between cold and flu symptoms"]
    elif "Respiratory" in categories:
        suggestions = ["What triggers asthma flare-ups?", "When should I use a rescue inhaler?", "How to improve lung capacity"]
    elif "Digestive Health" in categories:
        suggestions = ["What foods help soothe acid reflux?", "What is the BRAT diet?", "When does stomach pain require ER care?"]
    else:
        suggestions = ["What are normal vital sign ranges?", "When should I seek emergency medical care?", "How does sleep affect immune health?"]

    return {
        "response": response_text,
        "suggestions": suggestions
    }

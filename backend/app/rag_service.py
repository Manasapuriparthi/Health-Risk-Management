import os
import urllib.request
import json
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Rich clinical knowledge registry with comprehensive keywords & actionable guidance
KNOWLEDGE_BASE = [
    {
        "id": "headache_migraine",
        "category": "Headache & Pain Relief",
        "match_keys": ["headache", "head pain", "migraine", "migraines", "head ache", "headaches", "decrease headache", "relieve headache"],
        "keywords": "headache migraines head pain throbbing tension headache cluster relief medication treatment tylenol ibuprofen aspirin headache medicine decrease reduce lower stop ease remedy remedies",
        "title": "How to Relieve & Decrease Headaches",
        "content": (
            "Here are evidence-based clinical steps to relieve and decrease headache pain:\n\n"
            "1. **Hydrate Immediately**: Drink 1–2 large glasses of water. Dehydration is one of the most common causes of acute headaches.\n"
            "2. **Rest in a Quiet, Dark Room**: Lie down in a dim, quiet room to minimize light and sound sensitivity.\n"
            "3. **Apply a Cold or Warm Compress**: Place a cold gel pack on your forehead for migraines, or a warm cloth on your neck for tension headaches.\n"
            "4. **Over-The-Counter Relief**: Over-the-counter medications like **Acetaminophen (Tylenol)** or **Ibuprofen (Advil/Motrin)** reduce pain and inflammation effectively.\n"
            "5. **Gentle Neck & Temple Massage**: Gently massage your temples, neck, and shoulders to release muscle tension.\n"
            "6. **Limit Screen Time & Caffeine**: Take a break from mobile/computer screens to reduce eye strain."
        )
    },
    {
        "id": "fever_flu_cold",
        "category": "Fever & Infection Care",
        "match_keys": ["fever", "flu", "cold", "temperature", "chills", "high fever", "decrease fever", "lower fever"],
        "keywords": "fever body temperature flu cold cough chills body ache viral infection medication paracetamol acetaminophen ibuprofen temperature 100 101 102 lower decrease treat cure remedies",
        "title": "Fever & Viral Infection Care Guidelines",
        "content": (
            "Here is how to manage and decrease a fever safely:\n\n"
            "1. **Stay Hydrated**: Drink plenty of fluids (water, electrolyte solutions, herbal tea, clear soups) to replace lost fluids.\n"
            "2. **Take Fever Reducers**: Use **Acetaminophen (Paracetamol/Tylenol)** or **Ibuprofen** as directed to lower body temperature and ease body aches.\n"
            "3. **Rest & Cool Down**: Rest in a cool room with lightweight clothing. Use a lukewarm (not ice cold) damp sponge on the forehead or neck.\n"
            "4. **Monitor Temperature**: Keep track of body readings with a digital thermometer.\n\n"
            "🚨 *Consult a doctor if fever exceeds 103°F (39.4°C), lasts >3 days, or causes shortness of breath or severe lethargy.*"
        )
    },
    {
        "id": "digestive_acidity_nausea",
        "category": "Digestive & Stomach Care",
        "match_keys": ["stomach", "acidity", "nausea", "vomit", "heartburn", "indigestion", "diarrhea", "stomach pain", "gas"],
        "keywords": "stomach pain heartburn acidity GERD nausea vomiting diarrhea indigestion constipation stomach ache gas stomach ulcer antacids decrease relieve treat reduce stop",
        "title": "Managing Stomach Discomfort, Acidity & Nausea",
        "content": (
            "Steps to soothe stomach pain, acidity, and nausea:\n\n"
            "1. **Sip Clear Fluids**: Drink water, ginger tea, or peppermint tea slowly.\n"
            "2. **Follow the BRAT Diet**: Stick to bland foods — Bananas, Rice, Applesauce, and Toast.\n"
            "3. **Antacids & Reflux Control**: Take OTC antacids (Tums, Rennie) or Famotidine for acid reflux. Avoid lying down for 2-3 hours after eating.\n"
            "4. **Avoid Trigger Foods**: Skip spicy, fatty, acidic, or caffeine-heavy items."
        )
    },
    {
        "id": "respiratory_asthma",
        "category": "Respiratory Care",
        "match_keys": ["asthma", "cough", "breathing", "shortness of breath", "lungs", "wheezing"],
        "keywords": "asthma breathing shortness of breath cough wheezing lungs chest tightness allergy inhaler relief lungs decrease stop treat",
        "title": "Respiratory Health & Cough Management",
        "content": (
            "Clinical guidance for respiratory wellness:\n\n"
            "1. **Use Prescribed Inhalers**: For asthma or bronchospasm, use your Albuterol rescue inhaler as instructed.\n"
            "2. **Steam & Warm Liquids**: Inhale steam or drink warm honey-lemon tea to soothe irritated airways and clear phlegm.\n"
            "3. **Stay Away From Smoke & Irritants**: Avoid tobacco smoke, dust, and heavy outdoor pollution."
        )
    },
    {
        "id": "allergies_skin",
        "category": "Allergies & Skin Care",
        "match_keys": ["allergy", "allergies", "rash", "itching", "hives", "eczema"],
        "keywords": "allergy allergies skin rash itching hives sneezing runny nose antihistamine zyrtec claritin benadryl eczema dermatitis relieve treat decrease stop",
        "title": "Allergy & Skin Rash Relief",
        "content": (
            "Steps to reduce allergic reactions and skin irritation:\n\n"
            "1. **Take OTC Antihistamines**: Non-drowsy options like Cetirizine (Zyrtec) or Loratadine (Claritin) reduce hives, sneezing, and itching.\n"
            "2. **Topical Relief**: Apply 1% Hydrocortisone cream or Calamine lotion for localized skin itching.\n"
            "3. **Avoid Known Triggers**: Wash skin and clothes after exposure to outdoor pollen or allergens."
        )
    },
    {
        "id": "pain_medications_general",
        "category": "Medication Safety",
        "match_keys": ["pain", "painkiller", "medicine", "pill", "ibuprofen", "paracetamol", "tylenol", "aspirin"],
        "keywords": "medication pain medicine painkiller ibuprofen acetaminophen naproxen aspirin dosage safety side effects OTC over the counter",
        "title": "OTC Pain Medication Guidelines",
        "content": (
            "Key principles for safe over-the-counter pain relief:\n\n"
            "1. **Acetaminophen (Tylenol/Paracetamol)**: Excellent for headaches and fever. Do not exceed 3,000–4,000 mg daily to protect liver health.\n"
            "2. **NSAIDs (Ibuprofen/Naproxen)**: Best for inflammatory pain, joint pain, or dental aches. Always take with food to protect stomach lining."
        )
    },
    {
        "id": "sleep_stress_mental",
        "category": "Sleep & Stress Relief",
        "match_keys": ["sleep", "insomnia", "stress", "anxiety", "tired", "fatigue"],
        "keywords": "sleep insomnia stress anxiety depression mental health fatigue exhaustion restlessness sleep hygiene melatonin relaxation reduce lower decrease stop ease",
        "title": "Improving Sleep & Reducing Chronic Stress",
        "content": (
            "Evidence-based strategies to relieve stress and sleep better:\n\n"
            "1. **Consistent Schedule**: Go to bed and wake up at the exact same time every day.\n"
            "2. **Screen Detox**: Turn off phones, tablets, and TVs 60 minutes before bedtime.\n"
            "3. **Relaxation Techniques**: Practice 4-7-8 deep breathing or progressive muscle relaxation before bed."
        )
    },
    {
        "id": "diabetes_definition",
        "category": "Diabetes Management",
        "match_keys": ["diabetes", "sugar", "blood sugar", "glucose", "hba1c"],
        "keywords": "what is diabetes symptoms blood sugar glucose types definition insulin hba1c fasting post prandial lower decrease control manage",
        "title": "Blood Sugar & Diabetes Management",
        "content": (
            "How to maintain healthy blood glucose levels:\n\n"
            "1. **Target Ranges**: Fasting glucose should be <100 mg/dL (100-125 mg/dL indicates prediabetes; ≥126 mg/dL indicates diabetes).\n"
            "2. **Low-Glycemic Diet**: Eat high-fiber vegetables, oats, quinoa, and lean proteins. Limit sugary beverages and refined carbs.\n"
            "3. **Post-Meal Walking**: A 15-minute walk after meals significantly lowers postprandial glucose spikes."
        )
    },
    {
        "id": "hypertension_definition",
        "category": "Hypertension Care",
        "match_keys": ["bp", "blood pressure", "hypertension", "systolic", "diastolic", "high bp"],
        "keywords": "what is hypertension blood pressure definition numbers systolic diastolic dash diet sodium low salt high bp lower decrease manage control",
        "title": "Lowering High Blood Pressure",
        "content": (
            "Proven ways to lower and manage blood pressure:\n\n"
            "1. **DASH Diet**: Restrict sodium to <2,300 mg daily (ideally <1,500 mg). Increase potassium-rich foods (bananas, spinach, avocados).\n"
            "2. **Aerobic Exercise**: 30 minutes of brisk walking or cycling daily dilates blood vessels and lowers systolic BP by 5–8 mmHg.\n"
            "3. **Stress & Alcohol Control**: Practice daily relaxation and avoid tobacco or excess alcohol."
        )
    },
    {
        "id": "cvd_definition",
        "category": "Heart Health & Cholesterol",
        "match_keys": ["heart", "cholesterol", "cvd", "ldl", "hdl", "triglycerides"],
        "keywords": "what is cardiovascular disease cvd heart attack stroke cholesterol ldl hdl triglycerides chest pain heart health lower decrease manage",
        "title": "Cardiovascular Wellness & Cholesterol Control",
        "content": (
            "Strategies for optimal heart health:\n\n"
            "1. **Healthy Lipid Levels**: Target Total Cholesterol <200 mg/dL, LDL <100 mg/dL, and HDL >40 mg/dL.\n"
            "2. **Heart-Healthy Fats**: Consume Omega-3 fatty acids from salmon, walnuts, flaxseed, and olive oil. Eliminate trans fats.\n"
            "3. **Regular Monitoring**: Track blood pressure, resting heart rate, and lipid panels annually."
        )
    }
]

# Build TF-IDF Vectorizer
documents = [doc["keywords"] + " " + doc["title"] + " " + doc["content"] for doc in KNOWLEDGE_BASE]
vectorizer = TfidfVectorizer(stop_words='english')
tfidf_matrix = vectorizer.fit_transform(documents)

MEDICAL_DISCLAIMER = "\n\n> ⚠️ **Disclaimer**: This AI assistant provides general health information for educational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for severe symptoms or medication advice."

def retrieve_knowledge(query: str, threshold=0.01, top_k=2):
    """
    Retrieves matching documents using hybrid semantic TF-IDF similarity + direct keyword matching.
    """
    q_lower = query.lower()
    matches = []
    matched_ids = set()

    # 1. Direct Keyword Matcher
    for doc in KNOWLEDGE_BASE:
        for key in doc.get("match_keys", []):
            if key in q_lower:
                matches.append({
                    "document": doc,
                    "similarity": 1.0
                })
                matched_ids.add(doc["id"])
                break
        if len(matches) >= top_k:
            return matches

    # 2. TF-IDF Cosine Similarity Fallback
    query_vec = vectorizer.transform([query])
    similarities = cosine_similarity(query_vec, tfidf_matrix).flatten()
    top_indices = np.argsort(similarities)[::-1]

    for idx in top_indices:
        sim = similarities[idx]
        doc = KNOWLEDGE_BASE[idx]
        if sim >= threshold and doc["id"] not in matched_ids:
            matches.append({
                "document": doc,
                "similarity": float(sim)
            })
            matched_ids.add(doc["id"])
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

    # 2. Hybrid RAG Matcher
    matches = retrieve_knowledge(query)
    response_text = ""
    
    if matches:
        response_text = "Based on clinical health guidelines, here is the relevant guidance:\n\n"
        for match in matches:
            doc = match["document"]
            response_text += f"### {doc['title']} ({doc['category']})\n{doc['content']}\n\n"
    else:
        # Dynamic query synthesis for general health questions outside exact index matches
        clean_q = query.strip().capitalize()
        response_text = (
            f"### Health & Medical Guidance: '{clean_q}'\n\n"
            f"Here is general medical advice regarding your query:\n\n"
            f"- **General Care**: For general physical discomfort, fever, or mild aches, rest, adequate hydration (2–3 liters of water daily), and balanced nutrition are primary recovery measures.\n"
            f"- **Over-The-Counter Relief**: Common OTC medications like Acetaminophen (Tylenol) can manage mild pain or fever, while Antihistamines can soothe mild allergic reactions. Always check package dosages.\n"
            f"- **When to See a Doctor**: If you experience persistent severe pain, high fever (>103°F / 39.4°C), shortness of breath, chest pressure, or symptoms lasting more than 3-5 days, consult a physician promptly.\n\n"
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
    if "Headache & Pain Relief" in categories or "Medication Safety" in categories:
        suggestions = ["What is the safe maximum daily dose of Tylenol?", "When is a headache considered a medical emergency?", "Difference between tension headache and migraine"]
    elif "Fever & Infection Care" in categories:
        suggestions = ["When should a fever be evaluated by a doctor?", "How to stay hydrated during viral fever?", "Difference between cold and flu symptoms"]
    elif "Respiratory Care" in categories:
        suggestions = ["What triggers asthma flare-ups?", "When should I use a rescue inhaler?", "How to improve lung capacity"]
    elif "Digestive & Stomach Care" in categories:
        suggestions = ["What foods help soothe acid reflux?", "What is the BRAT diet?", "When does stomach pain require ER care?"]
    else:
        suggestions = ["What are normal vital sign ranges?", "When should I seek emergency medical care?", "How does sleep affect immune health?"]

    return {
        "response": response_text,
        "suggestions": suggestions
    }

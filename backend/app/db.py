from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime
from .config import settings

# Initialize AsyncIOMotorClient
client = AsyncIOMotorClient(settings.MONGODB_URI)
db = client[settings.DB_NAME]

# Collections
users_collection = db["users"]
vitals_collection = db["vitals"]
reports_collection = db["reports"]
predictions_collection = db["predictions"]
appointments_collection = db["appointments"]
otps_collection = db["otps"]

# Password hashing context (defined locally to prevent circular import with auth.py)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def check_db_health():
    try:
        # The ping command is cheap and succeeds if the client can connect
        await db.command("ping")
        return "connected"
    except Exception as e:
        print(f"MongoDB connection error: {e}")
        return "disconnected"

async def seed_database():
    try:
        # Check if there are any doctors in the database
        doctor_count = await users_collection.count_documents({"role": "doctor"})
        if doctor_count == 0:
            print("No doctors found in DB. Seeding default doctor profiles...")
            
            default_doctors = [
                {
                    "username": "Dr. Sarah Sian",
                    "email": "sarah@vitalpredict.com",
                    "role": "doctor",
                    "specialty": "General Physician",
                    "rating": "4.8",
                    "reviews": 142,
                    "experience": "12 yrs",
                    "timing": "9:00 AM - 1:00 PM",
                    "price": "$80"
                },
                {
                    "username": "Dr. Emily Davis",
                    "email": "emily@vitalpredict.com",
                    "role": "doctor",
                    "specialty": "General Physician",
                    "rating": "4.7",
                    "reviews": 98,
                    "experience": "9 yrs",
                    "timing": "2:00 PM - 6:00 PM",
                    "price": "$75"
                },
                {
                    "username": "Dr. John Smith",
                    "email": "john@vitalpredict.com",
                    "role": "doctor",
                    "specialty": "Cardiologist",
                    "rating": "4.9",
                    "reviews": 215,
                    "experience": "15 yrs",
                    "timing": "10:00 AM - 3:00 PM",
                    "price": "$120"
                },
                {
                    "username": "Dr. Robert Chen",
                    "email": "robert@vitalpredict.com",
                    "role": "doctor",
                    "specialty": "Cardiologist",
                    "rating": "4.8",
                    "reviews": 180,
                    "experience": "18 yrs",
                    "timing": "11:00 AM - 4:00 PM",
                    "price": "$130"
                },
                {
                    "username": "Dr. Michael Brown",
                    "email": "michael@vitalpredict.com",
                    "role": "doctor",
                    "specialty": "Dermatologist",
                    "rating": "4.6",
                    "reviews": 110,
                    "experience": "10 yrs",
                    "timing": "9:00 AM - 12:00 PM",
                    "price": "$90"
                },
                {
                    "username": "Dr. William Taylor",
                    "email": "william@vitalpredict.com",
                    "role": "doctor",
                    "specialty": "Orthopedic Specialist",
                    "rating": "4.7",
                    "reviews": 85,
                    "experience": "11 yrs",
                    "timing": "1:00 PM - 5:00 PM",
                    "price": "$100"
                },
                {
                    "username": "Dr. Olivia Martinez",
                    "email": "olivia@vitalpredict.com",
                    "role": "doctor",
                    "specialty": "Neurologist",
                    "rating": "4.9",
                    "reviews": 95,
                    "experience": "14 yrs",
                    "timing": "10:00 AM - 2:00 PM",
                    "price": "$140"
                }
            ]
            
            hashed_pwd = pwd_context.hash("password123")
            for doc in default_doctors:
                doc["hashed_password"] = hashed_pwd
                doc["created_at"] = datetime.utcnow()
                await users_collection.insert_one(doc)
            print("Successfully seeded default doctor profiles.")
        else:
            print("Doctors already exist. Skipping seeding.")
    except Exception as e:
        print(f"Error seeding database: {e}")


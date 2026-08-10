# NEXT TASK

Current Module:
Medical Report Upload (ReportAnalyzer)

Current Status:
95% Complete

Last Completed:
- Fixed file picker MIME/accept filter so all PDF and text documents are visible
- Implemented all 5 major features (Doctor Seeding, Auth Flows, App Lock, Health Score, Exercise Details)
- Built full FastAPI backend with MongoDB integration
- Built React frontend with premium glass-morphism UI

Next Action:
Runtime verification of upload flow end-to-end

After That:
Complete Dashboard UI polish and mobile responsiveness pass

Priority:
High

Estimated Time:
2 hours

Blockers:
None

---

## Project Overview

| Layer    | Tech Stack                        | Entry Point                     |
|----------|-----------------------------------|---------------------------------|
| Backend  | FastAPI + MongoDB + Gemini AI     | `backend/app/main.py`           |
| Frontend | React + Vite                      | `frontend/src/App.jsx`          |
| Mobile   | React Native (planned)            | `mobile/`                       |

## Completed Features
- [x] User Authentication (Register / Login / JWT)
- [x] Forgot Password + Simulated OTP + Reset
- [x] PIN-code App Lock Security
- [x] Health Dashboard with Vitals Logging
- [x] Dynamic Health Score Gauge (out of 100) with Breakdown Modal
- [x] Medical Report Analyzer (PDF upload + AI parsing)
- [x] Doctor Appointment Booking (dynamic doctor seeding from DB)
- [x] Clinical Planners (Drug Checker, Diet Planner, Workout Planner)
- [x] Exercise Details Modal with step-by-step guides
- [x] Profile Settings with theme/notification preferences

## Key API Endpoints
- `POST /api/auth/register` — User registration
- `POST /api/auth/login` — JWT login
- `POST /api/auth/forgot-password` — Generate OTP
- `POST /api/auth/verify-otp` — Validate OTP
- `POST /api/auth/reset-password` — Reset password
- `GET  /api/auth/doctors` — List seeded doctors
- `POST /api/vitals` — Log daily vitals
- `GET  /api/vitals` — Fetch vitals history
- `POST /api/report/upload` — Upload & parse medical PDF
- `GET  /api/report/history` — Past parsed reports
- `POST /api/appointments` — Book appointment
- `GET  /api/appointments` — List appointments
- `POST /api/planner/drug-check` — AI drug interaction check
- `POST /api/planner/diet` — AI diet plan generation
- `POST /api/planner/workout` — AI workout routine generation

## How to Run
```bash
# Backend
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm run dev
# Opens at http://localhost:5173
```

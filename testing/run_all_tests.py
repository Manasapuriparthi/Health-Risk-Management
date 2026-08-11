"""
VitalPredict - Complete Test Runner
Runs: Functional API tests + DAST Security tests + Baseline Load Test (100 VUs x 60s)
Generates: Excel report with all results
Auto-retries failed tests up to 2 times
"""
import threading, time, requests, json, os, statistics, traceback
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

BASE_URL    = "http://localhost:8000/api"
RESULTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "results")
os.makedirs(RESULTS_DIR, exist_ok=True)

# ─── Helpers ──────────────────────────────────────────────────────────────────
def seed_user(name, email, pw, role="patient"):
    try:
        requests.post(f"{BASE_URL}/auth/register",
            json={"username":name,"email":email,"password":pw,"role":role},
            timeout=10)
    except Exception: pass

def get_token(email, pw):
    try:
        r = requests.post(f"{BASE_URL}/auth/login",
            json={"email":email,"password":pw}, timeout=10)
        if r.status_code == 200:
            return r.json().get("access_token","")
    except Exception: pass
    return None

def do_request(method, path, token=None, body=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    url = f"{BASE_URL}{path}"
    t0 = time.time()
    try:
        if   method == "GET":    r = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":   r = requests.post(url, json=body or {}, headers=headers, timeout=10)
        elif method == "PUT":    r = requests.put(url, json=body or {}, headers=headers, timeout=10)
        elif method == "DELETE": r = requests.delete(url, headers=headers, timeout=10)
        else:                    r = requests.get(url, headers=headers, timeout=10)
        return r.status_code, round((time.time()-t0)*1000, 2)
    except Exception:
        return 0, round((time.time()-t0)*1000, 2)

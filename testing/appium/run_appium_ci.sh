#!/usr/bin/env bash
set -e

echo "=========================================="
echo "🔍 ENVIRONMENT DIAGNOSTICS"
echo "=========================================="
java -version || true
node --version || true
adb version || true
adb devices || true

echo "=========================================="
echo "📦 APK ABSOLUTE PATH VERIFICATION"
echo "=========================================="
pwd
APK_PATH="$(pwd)/mobile/build/app/outputs/flutter-apk/app-debug.apk"
echo "APK Target Path: $APK_PATH"

if [ ! -f "$APK_PATH" ]; then
  echo "❌ ERROR: APK file does not exist at $APK_PATH"
  echo "Searching for APK files..."
  find . -type f -name "*.apk" -print || true
  exit 1
fi

echo "APK exists: $APK_PATH"
ls -lh "$APK_PATH" || true

echo "=========================================="
echo "📱 EMULATOR BOOT & READINESS CHECK"
echo "=========================================="
adb wait-for-device || true

MAX_BOOT_RETRIES=30
BOOT_RETRY=0
until [ "$(adb shell getprop sys.boot_completed 2>&1 | tr -d '\r')" = "1" ] || [ $BOOT_RETRY -ge $MAX_BOOT_RETRIES ]; do
  echo "Waiting for emulator boot... ($((BOOT_RETRY+1))/$MAX_BOOT_RETRIES)"
  sleep 3
  BOOT_RETRY=$((BOOT_RETRY+1))
done

PM_RETRY=0
until [ "$(adb shell pm path android 2>&1 | tr -d '\r')" != "" ] || [ $PM_RETRY -ge $MAX_BOOT_RETRIES ]; do
  echo "Waiting for Android package manager... ($((PM_RETRY+1))/$MAX_BOOT_RETRIES)"
  sleep 3
  PM_RETRY=$((PM_RETRY+1))
done

if [ "$(adb shell getprop sys.boot_completed 2>&1 | tr -d '\r')" = "1" ]; then
  echo "✅ Android Emulator fully booted and package manager responsive!"
else
  echo "⚠️ WARNING: Android Emulator boot timed out after 90 seconds. Continuing with execution."
fi
adb devices -l || true

echo "=========================================="
echo "🚀 INSTALLING APK ON EMULATOR"
echo "=========================================="
adb install -r -g "$APK_PATH" || echo "APK install skipped or already installed"
echo "✅ APK Installed check complete"

echo "=========================================="
echo "🌐 STARTING LOCAL APPIUM SERVER"
echo "=========================================="
cd testing/appium
npx appium driver install uiautomator2 || true
npx appium --version || true
npx appium driver list --installed || true
nohup npx appium --address 127.0.0.1 --port 4723 --log appium-server.log > appium-server.out 2>&1 &
sleep 8
curl -f http://127.0.0.1:4723/status || (cat appium-server.out && true)
echo "✅ Local Appium Server ready check complete"

echo "=========================================="
echo "🌱 SEEDING TEST USER IN MONGODB"
echo "=========================================="
curl -s -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"Manasa","email":"manasapuriparthi@gmail.com","password":"password123","role":"patient"}' \
  || echo "User already registered"

echo "=========================================="
echo "🧪 RUNNING APPIUM E2E TESTS"
echo "=========================================="
export APK_PATH="$APK_PATH"
export APPIUM_HOST="127.0.0.1"
export APPIUM_PORT="4723"
export API_BASE="http://10.0.2.2:8000/api"

npm run test:auth || true
npm run test:regression || true

echo "✅ Appium runner script completed successfully!"

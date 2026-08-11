import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // Production backend on Render
  static const String baseUrl = 'https://health-risk-management.onrender.com/api';

  // Keep-alive timer to prevent Render cold starts
  static Timer? _keepAliveTimer;

  static void startKeepAlive() {
    _keepAliveTimer?.cancel();
    // Ping health endpoint immediately, then every 14 minutes
    _pingHealth();
    _keepAliveTimer = Timer.periodic(
      const Duration(minutes: 14),
      (_) => _pingHealth(),
    );
  }

  static void stopKeepAlive() {
    _keepAliveTimer?.cancel();
    _keepAliveTimer = null;
  }

  static Future<void> _pingHealth() async {
    try {
      await http.get(Uri.parse('$baseUrl/health')).timeout(
        const Duration(seconds: 10),
      );
    } catch (_) {}
  }

  // ─── Token Storage ────────────────────────────────────────────────────────

  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  static Future<void> saveUserRole(String role) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_role', role);
  }

  static Future<String?> getUserRole() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('user_role');
  }

  static Future<void> saveUserName(String name) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_name', name);
  }

  static Future<String?> getUserName() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('user_name');
  }

  static Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  static Future<Map<String, String>> _authHeaders() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static dynamic _handleResponse(http.Response response) {
    final body = jsonDecode(response.body);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    }
    final detail = body['detail'] ?? 'Something went wrong';
    throw ApiException(detail.toString(), response.statusCode);
  }

  // ─── Auth ─────────────────────────────────────────────────────────────────

  static Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    final data = _handleResponse(res) as Map<String, dynamic>;
    await saveToken(data['access_token']);
    // Fetch profile to get role
    final profile = await getMe();
    await saveUserRole(profile['role'] ?? 'patient');
    await saveUserName(profile['username'] ?? '');
    return profile;
  }

  static Future<Map<String, dynamic>> register({
    required String username,
    required String email,
    required String password,
    required String role,
    int? age,
    double? weight,
    double? height,
    String? specialty,
  }) async {
    final body = {
      'username': username,
      'email': email,
      'password': password,
      'role': role,
      if (age != null) 'age': age,
      if (weight != null) 'weight': weight,
      if (height != null) 'height': height,
      if (specialty != null) 'specialty': specialty,
    };
    final res = await http.post(
      Uri.parse('$baseUrl/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(body),
    );
    final data = _handleResponse(res) as Map<String, dynamic>;
    await saveToken(data['access_token']);
    final profile = await getMe();
    await saveUserRole(profile['role'] ?? 'patient');
    await saveUserName(profile['username'] ?? '');
    return profile;
  }

  static Future<Map<String, dynamic>> getMe() async {
    final res = await http.get(
      Uri.parse('$baseUrl/auth/me'),
      headers: await _authHeaders(),
    );
    return _handleResponse(res) as Map<String, dynamic>;
  }

  // ─── Vitals ───────────────────────────────────────────────────────────────

  static Future<Map<String, dynamic>> logVitals(Map<String, dynamic> vitals) async {
    final res = await http.post(
      Uri.parse('$baseUrl/vitals'),
      headers: await _authHeaders(),
      body: jsonEncode(vitals),
    );
    return _handleResponse(res) as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>?> getLatestVitals() async {
    final res = await http.get(
      Uri.parse('$baseUrl/vitals/latest'),
      headers: await _authHeaders(),
    );
    if (res.statusCode == 200 && res.body != 'null') {
      return jsonDecode(res.body) as Map<String, dynamic>;
    }
    return null;
  }

  static Future<List<dynamic>> getVitalsHistory() async {
    final res = await http.get(
      Uri.parse('$baseUrl/vitals'),
      headers: await _authHeaders(),
    );
    return _handleResponse(res) as List<dynamic>;
  }

  // ─── Appointments ─────────────────────────────────────────────────────────

  static Future<Map<String, dynamic>> createAppointment({
    required String doctorName,
    required String specialty,
    required String date,
    required String time,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/appointments'),
      headers: await _authHeaders(),
      body: jsonEncode({
        'doctor_name': doctorName,
        'specialty': specialty,
        'date': date,
        'time': time,
      }),
    );
    return _handleResponse(res) as Map<String, dynamic>;
  }

  static Future<List<dynamic>> getAppointments() async {
    final res = await http.get(
      Uri.parse('$baseUrl/appointments'),
      headers: await _authHeaders(),
    );
    return _handleResponse(res) as List<dynamic>;
  }

  static Future<Map<String, dynamic>> updateAppointmentStatus(
      String id, String status) async {
    final res = await http.put(
      Uri.parse('$baseUrl/appointments/$id/status'),
      headers: await _authHeaders(),
      body: jsonEncode({'status': status}),
    );
    return _handleResponse(res) as Map<String, dynamic>;
  }

  // ─── Doctors ──────────────────────────────────────────────────────────────

  static Future<List<dynamic>> getDoctors() async {
    final res = await http.get(
      Uri.parse('$baseUrl/auth/doctors'),
      headers: await _authHeaders(),
    );
    return _handleResponse(res) as List<dynamic>;
  }

  // ─── Prediction ───────────────────────────────────────────────────────────

  static Future<Map<String, dynamic>> predictRisk(Map<String, dynamic> data) async {
    final res = await http.post(
      Uri.parse('$baseUrl/prediction/predict'),
      headers: await _authHeaders(),
      body: jsonEncode(data),
    );
    return _handleResponse(res) as Map<String, dynamic>;
  }

  static Future<List<dynamic>> getPredictionHistory() async {
    final res = await http.get(
      Uri.parse('$baseUrl/prediction/history'),
      headers: await _authHeaders(),
    );
    return _handleResponse(res) as List<dynamic>;
  }

  // ─── Chat ─────────────────────────────────────────────────────────────────

  static Future<Map<String, dynamic>> chat(String message) async {
    final res = await http.post(
      Uri.parse('$baseUrl/chat'),
      headers: await _authHeaders(),
      body: jsonEncode({'message': message}),
    );
    return _handleResponse(res) as Map<String, dynamic>;
  }

  // ─── Health Twin ──────────────────────────────────────────────────────────

  static Future<Map<String, dynamic>> simulateTwin({
    double weightChange = 0.0,
    int activityChange = 0,
    bool sodiumReduction = false,
    double sleepChange = 0.0,
    int smokingChange = 0,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/twin/simulate'),
      headers: await _authHeaders(),
      body: jsonEncode({
        'weight_change': weightChange,
        'activity_change': activityChange,
        'sodium_reduction': sodiumReduction,
        'sleep_change': sleepChange,
        'smoking_change': smokingChange,
      }),
    );
    return _handleResponse(res) as Map<String, dynamic>;
  }

  // ─── Planners ─────────────────────────────────────────────────────────────

  static Future<Map<String, dynamic>> checkDrugInteractions(List<String> drugs) async {
    final res = await http.post(
      Uri.parse('$baseUrl/planner/drug-checker'),
      headers: await _authHeaders(),
      body: jsonEncode({'drugs': drugs}),
    );
    return _handleResponse(res) as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> getDietPlan({
    int calories = 2000,
    String preference = 'Vegetarian',
    List<String> conditions = const [],
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/planner/diet-planner'),
      headers: await _authHeaders(),
      body: jsonEncode({
        'calories': calories,
        'preference': preference,
        'conditions': conditions,
      }),
    );
    return _handleResponse(res) as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> getWorkoutPlan({
    String fitnessLevel = 'Beginner',
    String goal = 'General Fitness',
    int daysPerWeek = 3,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/planner/workout-planner'),
      headers: await _authHeaders(),
      body: jsonEncode({
        'fitness_level': fitnessLevel,
        'goal': goal,
        'days_per_week': daysPerWeek,
      }),
    );
    return _handleResponse(res) as Map<String, dynamic>;
  }

  // ─── Report ───────────────────────────────────────────────────────────────

  static Future<List<dynamic>> getReportHistory() async {
    final res = await http.get(
      Uri.parse('$baseUrl/report/history'),
      headers: await _authHeaders(),
    );
    return _handleResponse(res) as List<dynamic>;
  }

  static Future<Map<String, dynamic>> uploadReport(List<int> fileBytes, String filename) async {
    final token = await getToken();
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/report/upload'),
    );
    if (token != null) {
      request.headers['Authorization'] = 'Bearer $token';
    }
    request.files.add(http.MultipartFile.fromBytes(
      'file',
      fileBytes,
      filename: filename,
    ));
    final streamed = await request.send();
    final res = await http.Response.fromStream(streamed);
    return _handleResponse(res) as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> manualReport(Map<String, dynamic> data) async {
    final res = await http.post(
      Uri.parse('$baseUrl/report/manual'),
      headers: await _authHeaders(),
      body: jsonEncode(data),
    );
    return _handleResponse(res) as Map<String, dynamic>;
  }
}

// ─── Custom Exception ─────────────────────────────────────────────────────────

class ApiException implements Exception {
  final String message;
  final int statusCode;
  ApiException(this.message, this.statusCode);

  @override
  String toString() => message;
}

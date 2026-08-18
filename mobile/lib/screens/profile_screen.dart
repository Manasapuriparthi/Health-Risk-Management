import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _profile;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    setState(() { _loading = true; _error = null; });
    try {
      final profile = await ApiService.getMe();
      setState(() => _profile = profile);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _logout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Log Out',
            style: TextStyle(fontWeight: FontWeight.bold)),
        content: const Text('Are you sure you want to log out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel',
                style: TextStyle(color: Color(0xFF6B7280))),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Log Out',
                style: TextStyle(
                    color: Color(0xFFEF4444), fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
    if (confirm == true) {
      await ApiService.clearAll();
      if (!mounted) return;
      Navigator.of(context).pushNamedAndRemoveUntil('/login', (route) => false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFF10B981)),
            onPressed: _loadProfile,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
          : _error != null
              ? _buildError()
              : _buildBody(),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.wifi_off_rounded, size: 48, color: Color(0xFF9CA3AF)),
            const SizedBox(height: 12),
            Text(_error!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFF6B7280))),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: _loadProfile, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }

  Widget _buildBody() {
    final name = _profile?['username'] ?? 'User';
    final email = _profile?['email'] ?? '';
    final role = _profile?['role'] ?? 'patient';
    final age = _profile?['age'];
    final weight = _profile?['weight'];
    final height = _profile?['height'];
    final specialty = _profile?['specialty'];
    final activeMinutes = _profile?['active_minutes'] ?? 30;

    // BMI calculation
    String bmiText = '--';
    if (weight != null && height != null && height > 0) {
      final h = (height as num).toDouble() / 100.0;
      final w = (weight as num).toDouble();
      final bmi = w / (h * h);
      bmiText = bmi.toStringAsFixed(1);
    }

    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'U';
    final isDoctor = role == 'doctor';

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
      child: Column(
        children: [
          // Avatar + name
          Center(
            child: Column(
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Text(initial,
                      style: const TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF10B981))),
                ),
                const SizedBox(height: 12),
                Text(name,
                    style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF111827))),
                const SizedBox(height: 4),
                Text(email,
                    style: const TextStyle(
                        fontSize: 13, color: Color(0xFF6B7280))),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                  decoration: BoxDecoration(
                    color: isDoctor
                        ? const Color(0xFF6366F1).withValues(alpha: 0.1)
                        : const Color(0xFF10B981).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    isDoctor ? '🩺 Doctor' : '🧑‍⚕️ Patient',
                    style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: isDoctor
                            ? const Color(0xFF6366F1)
                            : const Color(0xFF10B981)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 28),

          // Stats grid — only for patients
          if (!isDoctor) ...[
            Row(
              children: [
                _buildStatCard('Age', age != null ? '$age yrs' : '--', Icons.cake_outlined),
                const SizedBox(width: 12),
                _buildStatCard('Weight', weight != null ? '${weight} kg' : '--', Icons.monitor_weight_outlined),
                const SizedBox(width: 12),
                _buildStatCard('BMI', bmiText, Icons.calculate_outlined),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                _buildStatCard('Height', height != null ? '${height} cm' : '--', Icons.height_rounded),
                const SizedBox(width: 12),
                _buildStatCard('Active', '$activeMinutes min/day', Icons.directions_run_rounded),
                const SizedBox(width: 12),
                _buildStatCard('Role', 'Patient', Icons.person_outline_rounded),
              ],
            ),
            const SizedBox(height: 24),
          ],

          // Doctor specialty
          if (isDoctor && specialty != null) ...[
            _buildInfoCard(
              icon: Icons.medical_services_outlined,
              color: const Color(0xFF6366F1),
              title: 'Specialization',
              value: specialty,
            ),
            const SizedBox(height: 12),
          ],

          // Profile sections
          _buildProfileItem(
            'Personal Information',
            'Name: $name  •  Email: $email',
            Icons.person_outline_rounded,
            const Color(0xFF10B981),
          ),
          if (!isDoctor) ...[
            _buildProfileItem(
              'Health Metrics',
              'Age: ${age ?? '--'}  •  Weight: ${weight ?? '--'} kg  •  Height: ${height ?? '--'} cm',
              Icons.monitor_heart_outlined,
              const Color(0xFF6366F1),
            ),
            _buildProfileItem(
              'Activity Profile',
              'Daily active minutes: $activeMinutes min',
              Icons.directions_run_rounded,
              const Color(0xFF3B82F6),
            ),
          ],
          _buildProfileItem(
            'Account Security',
            'Password protected  •  JWT authenticated',
            Icons.lock_outline_rounded,
            const Color(0xFFF59E0B),
          ),
          const SizedBox(height: 28),

          // Portal Switcher button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {
                if (isDoctor) {
                  Navigator.of(context).pushReplacementNamed('/home');
                } else {
                  Navigator.of(context).pushReplacementNamed('/doctor_home');
                }
              },
              icon: Icon(
                isDoctor ? Icons.person_outline_rounded : Icons.medical_services_outlined,
                color: Colors.white,
              ),
              label: Text(
                isDoctor ? 'Switch to Patient Portal' : 'Switch to Doctor Portal',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: isDoctor ? const Color(0xFF10B981) : const Color(0xFF6366F1),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Logout
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: _logout,
              icon: const Icon(Icons.logout_rounded, color: Color(0xFFEF4444)),
              label: const Text('Log Out',
                  style: TextStyle(
                      color: Color(0xFFEF4444),
                      fontWeight: FontWeight.bold,
                      fontSize: 16)),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                side: const BorderSide(color: Color(0xFFEF4444)),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFE5E7EB)),
        ),
        child: Column(
          children: [
            Icon(icon, color: const Color(0xFF10B981), size: 20),
            const SizedBox(height: 6),
            Text(value,
                style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    color: Color(0xFF111827))),
            const SizedBox(height: 2),
            Text(label,
                style: const TextStyle(
                    fontSize: 10, color: Color(0xFF9CA3AF))),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard({
    required IconData icon,
    required Color color,
    required String title,
    required String value,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title,
                  style: const TextStyle(
                      fontSize: 11, color: Color(0xFF9CA3AF))),
              Text(value,
                  style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: Color(0xFF111827))),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildProfileItem(
      String title, String subtitle, IconData icon, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: ListTile(
        leading: Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        title: Text(title,
            style: const TextStyle(
                fontWeight: FontWeight.bold, fontSize: 14)),
        subtitle: Text(subtitle,
            style: const TextStyle(
                fontSize: 11, color: Color(0xFF6B7280))),
        trailing: const Icon(Icons.arrow_forward_ios_rounded,
            size: 14, color: Color(0xFF9CA3AF)),
      ),
    );
  }
}

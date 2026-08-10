import 'package:flutter/material.dart';
import '../services/api_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<dynamic> _appointments = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadAppointments();
  }

  Future<void> _loadAppointments() async {
    setState(() => _loading = true);
    try {
      final apps = await ApiService.getAppointments();
      setState(() => _appointments = apps);
    } catch (_) {
      setState(() => _appointments = []);
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: const Text('Notifications',
            style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF111827))),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
          : RefreshIndicator(
              onRefresh: _loadAppointments,
              color: const Color(0xFF10B981),
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  _buildSectionHeader('Appointment Updates'),
                  const SizedBox(height: 12),
                  if (_appointments.isEmpty)
                    _buildEmptyCard('No appointment notifications yet.')
                  else
                    ..._appointments.map((app) => _buildAppointmentNotif(app)),

                  const SizedBox(height: 24),
                  _buildSectionHeader('Health Reminders'),
                  const SizedBox(height: 12),
                  _buildReminderCard(
                    icon: Icons.monitor_heart_rounded,
                    color: const Color(0xFF10B981),
                    title: 'Log Your Vitals',
                    subtitle: 'Keep your health data up to date for accurate predictions.',
                    time: 'Daily Reminder',
                  ),
                  _buildReminderCard(
                    icon: Icons.analytics_rounded,
                    color: const Color(0xFF6366F1),
                    title: 'Run Risk Prediction',
                    subtitle: 'Get your weekly AI health risk analysis.',
                    time: 'Weekly Reminder',
                  ),
                  _buildReminderCard(
                    icon: Icons.local_drink_rounded,
                    color: const Color(0xFF3B82F6),
                    title: 'Stay Hydrated',
                    subtitle: 'Drink at least 8 glasses of water today.',
                    time: 'Today, 12:00 PM',
                  ),
                  _buildReminderCard(
                    icon: Icons.directions_walk_rounded,
                    color: const Color(0xFFF59E0B),
                    title: 'Activity Goal',
                    subtitle: 'You\'re 15 minutes away from your daily activity goal.',
                    time: 'Today, 05:00 PM',
                  ),

                  const SizedBox(height: 24),
                  _buildSectionHeader('System'),
                  const SizedBox(height: 12),
                  _buildReminderCard(
                    icon: Icons.security_rounded,
                    color: const Color(0xFF10B981),
                    title: 'Profile Complete',
                    subtitle: 'Your health profile is set up and ready for predictions.',
                    time: 'Account',
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(title,
        style: const TextStyle(
            fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF111827)));
  }

  Widget _buildEmptyCard(String message) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Text(message,
          style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 13)),
    );
  }

  Widget _buildAppointmentNotif(Map<String, dynamic> app) {
    final status = app['status'] ?? 'pending';
    Color statusColor;
    IconData statusIcon;
    String statusMsg;

    switch (status) {
      case 'accepted':
        statusColor = const Color(0xFF10B981);
        statusIcon = Icons.check_circle_rounded;
        statusMsg = 'Your appointment with Dr. ${app['doctor_name']} has been confirmed.';
        break;
      case 'rejected':
        statusColor = const Color(0xFFEF4444);
        statusIcon = Icons.cancel_rounded;
        statusMsg = 'Your appointment with Dr. ${app['doctor_name']} was declined. Please rebook.';
        break;
      default:
        statusColor = const Color(0xFFF59E0B);
        statusIcon = Icons.pending_rounded;
        statusMsg = 'Waiting for Dr. ${app['doctor_name']} to confirm your appointment.';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: statusColor.withValues(alpha: 0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 6, offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(statusIcon, color: statusColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Appointment ${status[0].toUpperCase()}${status.substring(1)}',
                    style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                        color: Color(0xFF111827))),
                const SizedBox(height: 4),
                Text(statusMsg,
                    style: const TextStyle(
                        fontSize: 12, color: Color(0xFF4B5563), height: 1.4)),
                const SizedBox(height: 6),
                Text('${app['date']} • ${app['time']}',
                    style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF))),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReminderCard({
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    required String time,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                        color: Color(0xFF111827))),
                const SizedBox(height: 4),
                Text(subtitle,
                    style: const TextStyle(
                        fontSize: 12, color: Color(0xFF4B5563), height: 1.4)),
                const SizedBox(height: 6),
                Text(time,
                    style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF))),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

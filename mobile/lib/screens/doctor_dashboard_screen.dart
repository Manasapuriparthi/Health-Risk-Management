import 'package:flutter/material.dart';
import '../services/api_service.dart';

class DoctorDashboardScreen extends StatefulWidget {
  const DoctorDashboardScreen({super.key});

  @override
  State<DoctorDashboardScreen> createState() => _DoctorDashboardScreenState();
}

class _DoctorDashboardScreenState extends State<DoctorDashboardScreen> {
  List<dynamic> _appointments = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadAppointments();
  }

  Future<void> _loadAppointments() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await ApiService.getAppointments();
      setState(() => _appointments = data);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _updateStatus(String id, String status, int index) async {
    try {
      final updated = await ApiService.updateAppointmentStatus(id, status);
      setState(() => _appointments[index] = updated);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Appointment ${status == 'accepted' ? 'Accepted ✓' : 'Rejected ✗'}'),
          backgroundColor: status == 'accepted' ? const Color(0xFF10B981) : Colors.redAccent,
          duration: const Duration(seconds: 2),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString()),
          backgroundColor: const Color(0xFFEF4444),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final int todaysSchedule = _appointments.isNotEmpty ? _appointments.length : 5;

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: const Text('Clinical Command Center',
            style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF111827))),
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFF10B981)),
            onPressed: _loadAppointments,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
          : _error != null
              ? _buildError()
              : RefreshIndicator(
                  onRefresh: _loadAppointments,
                  color: const Color(0xFF10B981),
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // KPI Grid Row 1
                        Row(
                          children: [
                            Expanded(child: _buildKpiCard('👥 Total Patients', '5', const Color(0xFF6366F1), 'Roster')),
                            const SizedBox(width: 10),
                            Expanded(child: _buildKpiCard("📅 Today's Schedule", todaysSchedule.toString(), const Color(0xFF10B981), 'Bookings')),
                          ],
                        ),
                        const SizedBox(height: 10),
                        
                        // KPI Grid Row 2
                        Row(
                          children: [
                            Expanded(child: _buildKpiCard('🔴 High-Risk Alerts', '2', const Color(0xFFEF4444), 'Critical Vitals')),
                            const SizedBox(width: 10),
                            Expanded(child: _buildKpiCard('🟡 Needing Attention', '1', const Color(0xFFF59E0B), 'Moderate Risk')),
                          ],
                        ),
                        const SizedBox(height: 10),

                        // KPI Grid Row 3
                        Row(
                          children: [
                            Expanded(child: _buildKpiCard('📄 New Reports', '4', const Color(0xFF8B5CF6), 'Lab Submissions')),
                            const SizedBox(width: 10),
                            Expanded(child: _buildKpiCard('💬 Unread Messages', '2', const Color(0xFF3B82F6), 'Inquiries')),
                          ],
                        ),
                        const SizedBox(height: 24),

                        // High Risk Alert Banner
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEF4444).withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.3)),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.warning_amber_rounded, color: Color(0xFFEF4444)),
                              SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  '2 Patients with Critical BP (>155/95) require immediate attention!',
                                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFFDC2626)),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),

                        const Text("Today's Patient Appointments",
                            style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF111827))),
                        const SizedBox(height: 12),
                        _appointments.isEmpty
                            ? _buildEmpty()
                            : ListView.builder(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: _appointments.length,
                                itemBuilder: (context, index) {
                                  final app = _appointments[index];
                                  return _buildAppointmentCard(app, index);
                                },
                              ),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildKpiCard(String title, String value, Color color, String subtitle) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color)),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: color)),
          Text(subtitle, style: const TextStyle(fontSize: 10, color: Color(0xFF9CA3AF))),
        ],
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.wifi_off_rounded, size: 48, color: Color(0xFF9CA3AF)),
          const SizedBox(height: 12),
          Text(_error!, style: const TextStyle(color: Color(0xFF6B7280))),
          const SizedBox(height: 16),
          ElevatedButton(onPressed: _loadAppointments, child: const Text('Retry')),
        ],
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(30),
        child: Column(
          children: [
            Container(
              width: 60, height: 60,
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.calendar_today_rounded, size: 28, color: Color(0xFF10B981)),
            ),
            const SizedBox(height: 12),
            const Text('No bookings for today', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF111827))),
            const SizedBox(height: 4),
            const Text('New patient requests will be listed here', style: TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
          ],
        ),
      ),
    );
  }

  Widget _buildAppointmentCard(Map<String, dynamic> app, int index) {
    final status = app['status'] ?? 'pending';
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: const Color(0xFF6366F1).withValues(alpha: 0.1),
            child: Text(
              (app['patient_name'] ?? 'P')[0].toUpperCase(),
              style: const TextStyle(color: Color(0xFF6366F1), fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(app['patient_name'] ?? 'Patient', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                const SizedBox(height: 2),
                Text('Date: ${app['date']} • Time: ${app['time']}', style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
              ],
            ),
          ),
          if (status == 'pending') ...[
            IconButton(
              icon: const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981)),
              onPressed: () => _updateStatus(app['id'], 'accepted', index),
            ),
            IconButton(
              icon: const Icon(Icons.cancel_rounded, color: Color(0xFFEF4444)),
              onPressed: () => _updateStatus(app['id'], 'rejected', index),
            ),
          ] else ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: status == 'accepted' ? const Color(0xFF10B981).withValues(alpha: 0.1) : const Color(0xFFEF4444).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                status.toUpperCase(),
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: status == 'accepted' ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                ),
              ),
            )
          ]
        ],
      ),
    );
  }
}

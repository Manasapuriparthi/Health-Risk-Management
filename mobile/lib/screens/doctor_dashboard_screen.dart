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
          content: Text(
              'Appointment ${status == 'accepted' ? 'Accepted ✓' : 'Rejected ✗'}'),
          backgroundColor:
              status == 'accepted' ? const Color(0xFF10B981) : Colors.redAccent,
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
    final int total = _appointments.length;
    final int pending =
        _appointments.where((a) => a['status'] == 'pending').length;
    final int accepted =
        _appointments.where((a) => a['status'] == 'accepted').length;

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: const Text('Clinical Schedule',
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
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Stats row
                        Row(
                          children: [
                            Expanded(child: _buildStatCard('Total', total.toString(), const Color(0xFF6366F1))),
                            const SizedBox(width: 12),
                            Expanded(child: _buildStatCard('Pending', pending.toString(), const Color(0xFFF59E0B))),
                            const SizedBox(width: 12),
                            Expanded(child: _buildStatCard('Accepted', accepted.toString(), const Color(0xFF10B981))),
                          ],
                        ),
                        const SizedBox(height: 28),
                        const Text('Patient Requests',
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
        padding: const EdgeInsets.all(40),
        child: Column(
          children: [
            Container(
              width: 70, height: 70,
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.calendar_today_rounded,
                  size: 32, color: Color(0xFF10B981)),
            ),
            const SizedBox(height: 16),
            const Text('No appointments yet',
                style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF111827))),
            const SizedBox(height: 6),
            const Text('Patient bookings will appear here',
                style: TextStyle(fontSize: 13, color: Color(0xFF6B7280))),
          ],
        ),
      ),
    );
  }

  Widget _buildAppointmentCard(Map<String, dynamic> app, int index) {
    final status = app['status'] ?? 'pending';
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ExpansionTile(
        shape: const Border(),
        leading: CircleAvatar(
          backgroundColor: const Color(0xFF10B981).withValues(alpha: 0.08),
          child: Text(
            (app['patient_name'] as String? ?? 'P')[0].toUpperCase(),
            style: const TextStyle(
                fontWeight: FontWeight.bold, color: Color(0xFF10B981)),
          ),
        ),
        title: Text(
          app['patient_name'] ?? 'Patient',
          style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 15,
              color: Color(0xFF111827)),
        ),
        subtitle: Text(
          '${app['specialty'] ?? ''} • ${app['time'] ?? ''}',
          style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
        ),
        trailing: _buildStatusBadge(status),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Divider(color: Color(0xFFF3F4F6)),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.calendar_month_outlined,
                        size: 14, color: Color(0xFF9CA3AF)),
                    const SizedBox(width: 6),
                    Text(app['date'] ?? '',
                        style: const TextStyle(
                            fontSize: 13, color: Color(0xFF4B5563))),
                    const SizedBox(width: 16),
                    const Icon(Icons.access_time_rounded,
                        size: 14, color: Color(0xFF9CA3AF)),
                    const SizedBox(width: 6),
                    Text(app['time'] ?? '',
                        style: const TextStyle(
                            fontSize: 13, color: Color(0xFF4B5563))),
                  ],
                ),
                if (status == 'pending') ...[
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      OutlinedButton(
                        onPressed: () =>
                            _updateStatus(app['id'], 'rejected', index),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.redAccent,
                          side: const BorderSide(color: Color(0xFFFCA5A5)),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10)),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 18, vertical: 10),
                        ),
                        child: const Text('Reject',
                            style: TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 13)),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton(
                        onPressed: () =>
                            _updateStatus(app['id'], 'accepted', index),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF10B981),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10)),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 18, vertical: 10),
                          elevation: 0,
                        ),
                        child: const Text('Accept',
                            style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                                color: Colors.white)),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 4, height: 16,
            decoration: BoxDecoration(
                color: color, borderRadius: BorderRadius.circular(2)),
          ),
          const SizedBox(height: 8),
          Text(title,
              style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF9CA3AF))),
          const SizedBox(height: 4),
          Text(value,
              style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF111827))),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bg, fg;
    switch (status) {
      case 'accepted':
        bg = const Color(0xFFD1FAE5); fg = const Color(0xFF065F46); break;
      case 'rejected':
        bg = const Color(0xFFFEE2E2); fg = const Color(0xFF991B1B); break;
      default:
        bg = const Color(0xFFFEF3C7); fg = const Color(0xFF92400E);
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
          color: bg, borderRadius: BorderRadius.circular(9999)),
      child: Text(status.toUpperCase(),
          style: TextStyle(
              color: fg,
              fontWeight: FontWeight.bold,
              fontSize: 10,
              letterSpacing: 0.5)),
    );
  }
}

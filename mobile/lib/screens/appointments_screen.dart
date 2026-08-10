import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

class AppointmentsScreen extends StatefulWidget {
  const AppointmentsScreen({super.key});

  @override
  State<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends State<AppointmentsScreen> {
  List<dynamic> _appointments = [];
  List<dynamic> _doctors = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() { _loading = true; _error = null; });
    try {
      final results = await Future.wait([
        ApiService.getAppointments(),
        ApiService.getDoctors(),
      ]);
      setState(() {
        _appointments = results[0];
        _doctors = results[1];
      });
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  void _showBookSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => _BookAppointmentSheet(
        doctors: _doctors,
        onBooked: _loadData,
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'accepted': return const Color(0xFF10B981);
      case 'rejected': return const Color(0xFFEF4444);
      default:         return const Color(0xFFF59E0B);
    }
  }

  Color _statusBg(String status) {
    switch (status) {
      case 'accepted': return const Color(0xFFD1FAE5);
      case 'rejected': return const Color(0xFFFEE2E2);
      default:         return const Color(0xFFFEF3C7);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: const Text('My Appointments',
            style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF111827))),
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFF10B981)),
            onPressed: _loadData,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showBookSheet,
        backgroundColor: const Color(0xFF10B981),
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: const Text('Book Appointment',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
          : _error != null
              ? _buildError()
              : _appointments.isEmpty
                  ? _buildEmpty()
                  : _buildList(),
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
          ElevatedButton(onPressed: _loadData, child: const Text('Retry')),
        ],
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80, height: 80,
            decoration: BoxDecoration(
              color: const Color(0xFF10B981).withValues(alpha: 0.08),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.calendar_today_rounded,
                size: 36, color: Color(0xFF10B981)),
          ),
          const SizedBox(height: 16),
          const Text('No appointments yet',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF111827))),
          const SizedBox(height: 8),
          const Text('Book your first appointment below',
              style: TextStyle(fontSize: 13, color: Color(0xFF6B7280))),
          const SizedBox(height: 80),
        ],
      ),
    );
  }

  Widget _buildList() {
    return RefreshIndicator(
      onRefresh: _loadData,
      color: const Color(0xFF10B981),
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
        itemCount: _appointments.length,
        itemBuilder: (context, i) {
          final app = _appointments[i];
          final status = app['status'] ?? 'pending';
          return Container(
            margin: const EdgeInsets.only(bottom: 14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE5E7EB)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.02),
                  blurRadius: 8, offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 44, height: 44,
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.local_hospital_rounded,
                            color: Color(0xFF10B981), size: 22),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(app['doctor_name'] ?? '',
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 15,
                                    color: Color(0xFF111827))),
                            const SizedBox(height: 2),
                            Text(app['specialty'] ?? '',
                                style: const TextStyle(
                                    fontSize: 12, color: Color(0xFF6B7280))),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: _statusBg(status),
                          borderRadius: BorderRadius.circular(9999),
                        ),
                        child: Text(
                          status.toUpperCase(),
                          style: TextStyle(
                            color: _statusColor(status),
                            fontWeight: FontWeight.bold,
                            fontSize: 10,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Divider(color: Color(0xFFF3F4F6), height: 1),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Icon(Icons.calendar_month_outlined,
                          size: 14, color: Color(0xFF9CA3AF)),
                      const SizedBox(width: 6),
                      Text(app['date'] ?? '',
                          style: const TextStyle(fontSize: 13, color: Color(0xFF4B5563))),
                      const SizedBox(width: 16),
                      const Icon(Icons.access_time_rounded,
                          size: 14, color: Color(0xFF9CA3AF)),
                      const SizedBox(width: 6),
                      Text(app['time'] ?? '',
                          style: const TextStyle(fontSize: 13, color: Color(0xFF4B5563))),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

// ─── Book Appointment Bottom Sheet ────────────────────────────────────────────

class _BookAppointmentSheet extends StatefulWidget {
  final List<dynamic> doctors;
  final VoidCallback onBooked;

  const _BookAppointmentSheet({required this.doctors, required this.onBooked});

  @override
  State<_BookAppointmentSheet> createState() => _BookAppointmentSheetState();
}

class _BookAppointmentSheetState extends State<_BookAppointmentSheet> {
  Map<String, dynamic>? _selectedDoctor;
  DateTime? _selectedDate;
  String? _selectedTime;
  bool _isLoading = false;

  final List<String> _timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  ];

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: now.add(const Duration(days: 1)),
      firstDate: now,
      lastDate: now.add(const Duration(days: 60)),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.light(primary: Color(0xFF10B981)),
        ),
        child: child!,
      ),
    );
    if (picked != null) setState(() => _selectedDate = picked);
  }

  Future<void> _bookAppointment() async {
    if (_selectedDoctor == null) {
      _showSnack('Please select a doctor'); return;
    }
    if (_selectedDate == null) {
      _showSnack('Please select a date'); return;
    }
    if (_selectedTime == null) {
      _showSnack('Please select a time slot'); return;
    }

    setState(() => _isLoading = true);
    try {
      await ApiService.createAppointment(
        doctorName: _selectedDoctor!['username'],
        specialty: _selectedDoctor!['specialty'] ?? 'General Physician',
        date: DateFormat('yyyy-MM-dd').format(_selectedDate!),
        time: _selectedTime!,
      );
      if (!mounted) return;
      Navigator.of(context).pop();
      widget.onBooked();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Appointment booked successfully!'),
          backgroundColor: const Color(0xFF10B981),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      _showSnack(e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showSnack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: const Color(0xFFEF4444),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 24, right: 24, top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Book Appointment',
                    style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF111827))),
                IconButton(
                  icon: const Icon(Icons.close_rounded),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Doctor picker
            const Text('Select Doctor',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
            const SizedBox(height: 8),
            widget.doctors.isEmpty
                ? Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF3F4F6),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Text('No doctors available',
                        style: TextStyle(color: Color(0xFF9CA3AF))),
                  )
                : SizedBox(
                    height: 100,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: widget.doctors.length,
                      itemBuilder: (ctx, i) {
                        final doc = widget.doctors[i];
                        final selected = _selectedDoctor == doc;
                        return GestureDetector(
                          onTap: () => setState(() => _selectedDoctor = doc),
                          child: Container(
                            width: 130,
                            margin: const EdgeInsets.only(right: 10),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: selected
                                  ? const Color(0xFF10B981).withValues(alpha: 0.08)
                                  : Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: selected
                                    ? const Color(0xFF10B981)
                                    : const Color(0xFFE5E7EB),
                                width: selected ? 2 : 1,
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                CircleAvatar(
                                  radius: 16,
                                  backgroundColor: const Color(0xFF10B981).withValues(alpha: 0.1),
                                  child: Text(
                                    (doc['username'] as String? ?? 'D')[0].toUpperCase(),
                                    style: const TextStyle(
                                        color: Color(0xFF10B981),
                                        fontWeight: FontWeight.bold),
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(doc['username'] ?? '',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF111827))),
                                Text(doc['specialty'] ?? '',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                        fontSize: 10, color: Color(0xFF6B7280))),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),

            const SizedBox(height: 20),

            // Date picker
            const Text('Select Date',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: _pickDate,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: _selectedDate != null
                        ? const Color(0xFF10B981)
                        : const Color(0xFFE5E7EB),
                    width: _selectedDate != null ? 2 : 1,
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.calendar_month_outlined,
                        color: Color(0xFF10B981), size: 20),
                    const SizedBox(width: 12),
                    Text(
                      _selectedDate == null
                          ? 'Choose a date'
                          : DateFormat('EEE, MMM d, yyyy').format(_selectedDate!),
                      style: TextStyle(
                        color: _selectedDate == null
                            ? const Color(0xFF9CA3AF)
                            : const Color(0xFF111827),
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Time slot picker
            const Text('Select Time Slot',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _timeSlots.map((slot) {
                final selected = _selectedTime == slot;
                return GestureDetector(
                  onTap: () => setState(() => _selectedTime = slot),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                    decoration: BoxDecoration(
                      color: selected
                          ? const Color(0xFF10B981)
                          : Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: selected
                            ? const Color(0xFF10B981)
                            : const Color(0xFFE5E7EB),
                      ),
                    ),
                    child: Text(
                      slot,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: selected ? Colors.white : const Color(0xFF374151),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),

            const SizedBox(height: 28),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _bookAppointment,
                child: _isLoading
                    ? const SizedBox(
                        height: 20, width: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2.5, color: Colors.white))
                    : const Text('Confirm Booking'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import '../services/api_service.dart';

class VitalsLogScreen extends StatefulWidget {
  const VitalsLogScreen({super.key});

  @override
  State<VitalsLogScreen> createState() => _VitalsLogScreenState();
}

class _VitalsLogScreenState extends State<VitalsLogScreen> {
  final _formKey = GlobalKey<FormState>();
  final _systolicController = TextEditingController();
  final _diastolicController = TextEditingController();
  final _bloodSugarController = TextEditingController();
  final _heartRateController = TextEditingController();
  final _weightController = TextEditingController();
  final _cholesterolController = TextEditingController();
  final _sleepController = TextEditingController();
  final _activeMinutesController = TextEditingController();
  bool _isLoading = false;
  bool _submitted = false;

  @override
  void dispose() {
    _systolicController.dispose();
    _diastolicController.dispose();
    _bloodSugarController.dispose();
    _heartRateController.dispose();
    _weightController.dispose();
    _cholesterolController.dispose();
    _sleepController.dispose();
    _activeMinutesController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    try {
      final body = <String, dynamic>{};
      if (_systolicController.text.isNotEmpty)
        body['systolic_bp'] = int.parse(_systolicController.text);
      if (_diastolicController.text.isNotEmpty)
        body['diastolic_bp'] = int.parse(_diastolicController.text);
      if (_bloodSugarController.text.isNotEmpty)
        body['blood_sugar'] = int.parse(_bloodSugarController.text);
      if (_heartRateController.text.isNotEmpty)
        body['heart_rate'] = int.parse(_heartRateController.text);
      if (_weightController.text.isNotEmpty)
        body['weight'] = double.parse(_weightController.text);
      if (_cholesterolController.text.isNotEmpty)
        body['cholesterol'] = int.parse(_cholesterolController.text);
      if (_sleepController.text.isNotEmpty)
        body['sleep_hours'] = double.parse(_sleepController.text);
      if (_activeMinutesController.text.isNotEmpty)
        body['active_minutes'] = int.parse(_activeMinutesController.text);

      if (body.isEmpty) {
        _showSnack('Please fill at least one field', isError: true);
        return;
      }

      await ApiService.logVitals(body);
      if (!mounted) return;
      setState(() => _submitted = true);
      _showSnack('Vitals logged successfully!');
    } catch (e) {
      if (!mounted) return;
      _showSnack(e.toString(), isError: true);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showSnack(String msg, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: isError ? const Color(0xFFEF4444) : const Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  void _reset() {
    _formKey.currentState?.reset();
    _systolicController.clear();
    _diastolicController.clear();
    _bloodSugarController.clear();
    _heartRateController.clear();
    _weightController.clear();
    _cholesterolController.clear();
    _sleepController.clear();
    _activeMinutesController.clear();
    setState(() => _submitted = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: const Text('Log Vitals',
            style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF111827))),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: _submitted ? _buildSuccess() : _buildForm(),
      ),
    );
  }

  Widget _buildSuccess() {
    return Center(
      child: Column(
        children: [
          const SizedBox(height: 60),
          Container(
            width: 90, height: 90,
            decoration: BoxDecoration(
              color: const Color(0xFF10B981).withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.check_circle_rounded,
                color: Color(0xFF10B981), size: 48),
          ),
          const SizedBox(height: 20),
          const Text('Vitals Logged!',
              style: TextStyle(
                  fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF111827))),
          const SizedBox(height: 8),
          const Text('Your health data has been saved successfully.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: Color(0xFF6B7280))),
          const SizedBox(height: 32),
          SizedBox(
            width: 200,
            child: ElevatedButton(
              onPressed: _reset,
              child: const Text('Log More'),
            ),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Go Back',
                style: TextStyle(color: Color(0xFF6B7280))),
          ),
        ],
      ),
    );
  }

  Widget _buildForm() {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader('Blood Pressure', Icons.favorite_rounded, const Color(0xFFEF4444)),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildField(
                  controller: _systolicController,
                  label: 'Systolic',
                  hint: '120',
                  unit: 'mmHg',
                  icon: Icons.arrow_upward_rounded,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildField(
                  controller: _diastolicController,
                  label: 'Diastolic',
                  hint: '80',
                  unit: 'mmHg',
                  icon: Icons.arrow_downward_rounded,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          _buildSectionHeader('Blood Metrics', Icons.bubble_chart_rounded, const Color(0xFFF59E0B)),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildField(
                  controller: _bloodSugarController,
                  label: 'Blood Sugar',
                  hint: '95',
                  unit: 'mg/dL',
                  icon: Icons.bloodtype_outlined,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildField(
                  controller: _cholesterolController,
                  label: 'Cholesterol',
                  hint: '180',
                  unit: 'mg/dL',
                  icon: Icons.speed_rounded,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          _buildSectionHeader('Vitals', Icons.monitor_heart_rounded, const Color(0xFF10B981)),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildField(
                  controller: _heartRateController,
                  label: 'Heart Rate',
                  hint: '72',
                  unit: 'bpm',
                  icon: Icons.favorite_border_rounded,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildField(
                  controller: _weightController,
                  label: 'Weight',
                  hint: '70',
                  unit: 'kg',
                  icon: Icons.monitor_weight_outlined,
                  isDecimal: true,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          _buildSectionHeader('Lifestyle', Icons.self_improvement_rounded, const Color(0xFF6366F1)),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildField(
                  controller: _sleepController,
                  label: 'Sleep',
                  hint: '7.5',
                  unit: 'hrs',
                  icon: Icons.bedtime_outlined,
                  isDecimal: true,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildField(
                  controller: _activeMinutesController,
                  label: 'Active Mins',
                  hint: '30',
                  unit: 'min',
                  icon: Icons.directions_run_rounded,
                ),
              ),
            ],
          ),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _submit,
              child: _isLoading
                  ? const SizedBox(
                      height: 20, width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                  : const Text('Save Vitals'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon, Color color) {
    return Row(
      children: [
        Icon(icon, color: color, size: 18),
        const SizedBox(width: 8),
        Text(title,
            style: const TextStyle(
                fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF111827))),
      ],
    );
  }

  Widget _buildField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required String unit,
    required IconData icon,
    bool isDecimal = false,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: isDecimal
          ? const TextInputType.numberWithOptions(decimal: true)
          : TextInputType.number,
      decoration: InputDecoration(
        labelText: '$label ($unit)',
        hintText: hint,
        prefixIcon: Icon(icon, color: const Color(0xFF9CA3AF), size: 18),
      ),
    );
  }
}

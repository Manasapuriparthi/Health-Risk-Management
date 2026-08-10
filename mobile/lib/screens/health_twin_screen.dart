import 'package:flutter/material.dart';
import '../services/api_service.dart';

class HealthTwinScreen extends StatefulWidget {
  const HealthTwinScreen({super.key});
  @override
  State<HealthTwinScreen> createState() => _HealthTwinScreenState();
}

class _HealthTwinScreenState extends State<HealthTwinScreen> {
  // Simulation controls
  double _weightChange = 0.0;
  int _activityChange = 0;
  bool _sodiumReduction = false;
  double _sleepChange = 0.0;
  bool _quitSmoking = false;

  bool _loading = false;
  Map<String, dynamic>? _result;

  Future<void> _simulate() async {
    setState(() { _loading = true; _result = null; });
    try {
      final res = await ApiService.simulateTwin(
        weightChange: _weightChange,
        activityChange: _activityChange,
        sodiumReduction: _sodiumReduction,
        sleepChange: _sleepChange,
        smokingChange: _quitSmoking ? -1 : 0,
      );
      setState(() => _result = res);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(e.toString()),
        backgroundColor: const Color(0xFFEF4444),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('AI Health Twin')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header avatar
            Center(
              child: Column(
                children: [
                  Container(
                    width: 100, height: 100,
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withValues(alpha: 0.08),
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.2), width: 2),
                    ),
                    child: const Icon(Icons.accessibility_new_rounded,
                        color: Color(0xFF10B981), size: 52),
                  ),
                  const SizedBox(height: 10),
                  const Text('Your Virtual Biological Twin',
                      style: TextStyle(fontSize: 13, color: Color(0xFF6B7280))),
                  const SizedBox(height: 4),
                  const Text('Adjust lifestyle parameters and simulate your future health',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // Controls card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFE5E7EB)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Lifestyle Parameters',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF111827))),
                  const SizedBox(height: 18),

                  // Weight change
                  _sliderRow(
                    label: 'Weight Change',
                    value: '${_weightChange >= 0 ? '+' : ''}${_weightChange.toStringAsFixed(1)} kg',
                    icon: Icons.monitor_weight_outlined,
                    color: _weightChange < 0 ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                    child: Slider(
                      value: _weightChange,
                      min: -20, max: 20, divisions: 40,
                      activeColor: _weightChange < 0 ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                      inactiveColor: const Color(0xFFE5E7EB),
                      onChanged: (v) => setState(() => _weightChange = double.parse(v.toStringAsFixed(1))),
                    ),
                  ),
                  const Divider(color: Color(0xFFF3F4F6)),

                  // Activity change
                  _sliderRow(
                    label: 'Daily Activity Increase',
                    value: '${_activityChange >= 0 ? '+' : ''}$_activityChange min',
                    icon: Icons.directions_run_rounded,
                    color: const Color(0xFF6366F1),
                    child: Slider(
                      value: _activityChange.toDouble(),
                      min: -60, max: 120, divisions: 36,
                      activeColor: const Color(0xFF6366F1),
                      inactiveColor: const Color(0xFFE5E7EB),
                      onChanged: (v) => setState(() => _activityChange = v.round()),
                    ),
                  ),
                  const Divider(color: Color(0xFFF3F4F6)),

                  // Sleep change
                  _sliderRow(
                    label: 'Sleep Change',
                    value: '${_sleepChange >= 0 ? '+' : ''}${_sleepChange.toStringAsFixed(1)} hrs',
                    icon: Icons.bedtime_outlined,
                    color: const Color(0xFF3B82F6),
                    child: Slider(
                      value: _sleepChange,
                      min: -4, max: 4, divisions: 16,
                      activeColor: const Color(0xFF3B82F6),
                      inactiveColor: const Color(0xFFE5E7EB),
                      onChanged: (v) => setState(() => _sleepChange = double.parse(v.toStringAsFixed(1))),
                    ),
                  ),
                  const Divider(color: Color(0xFFF3F4F6)),

                  // Toggles
                  _toggleRow('Reduce Sodium (DASH Diet)', _sodiumReduction,
                      (v) => setState(() => _sodiumReduction = v), const Color(0xFF10B981)),
                  const SizedBox(height: 8),
                  _toggleRow('Quit Smoking', _quitSmoking,
                      (v) => setState(() => _quitSmoking = v), const Color(0xFFEF4444)),
                ],
              ),
            ),
            const SizedBox(height: 20),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _loading ? null : _simulate,
                icon: _loading
                    ? const SizedBox(width: 18, height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                    : const Icon(Icons.biotech_rounded, size: 20),
                label: const Text('Simulate My Health Twin'),
              ),
            ),

            if (_result != null) ...[
              const SizedBox(height: 24),
              _buildResults(_result!),
            ],
          ],
        ),
      ),
    );
  }

  Widget _sliderRow({
    required String label,
    required String value,
    required IconData icon,
    required Color color,
    required Widget child,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(children: [
                Icon(icon, color: color, size: 16),
                const SizedBox(width: 8),
                Text(label,
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF374151))),
              ]),
              Text(value,
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: color)),
            ],
          ),
          child,
        ],
      ),
    );
  }

  Widget _toggleRow(String label, bool value, ValueChanged<bool> onChanged, Color color) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF374151))),
        Switch(value: value, onChanged: onChanged, activeColor: color),
      ],
    );
  }

  Widget _buildResults(Map<String, dynamic> result) {
    final baseRisks = result['baseline_risks'] as Map<String, dynamic>? ?? {};
    final simRisks = result['simulated_risks'] as Map<String, dynamic>? ?? {};
    final baseVitals = result['baseline_vitals'] as Map<String, dynamic>? ?? {};
    final simVitals = result['simulated_vitals'] as Map<String, dynamic>? ?? {};
    final narrative = result['narrative'] as String? ?? '';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Simulation Results',
            style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Color(0xFF111827))),
        const SizedBox(height: 4),
        const Text('Baseline vs. your simulated future health',
            style: TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
        const SizedBox(height: 16),

        // Vitals comparison
        _buildCompareCard('Blood Pressure',
            '${baseVitals['systolic_bp'] ?? '--'}/${baseVitals['diastolic_bp'] ?? '--'} mmHg',
            '${simVitals['systolic_bp'] ?? '--'}/${simVitals['diastolic_bp'] ?? '--'} mmHg',
            Icons.favorite_rounded, const Color(0xFFEF4444)),
        _buildCompareCard('Blood Sugar',
            '${baseVitals['blood_sugar'] ?? '--'} mg/dL',
            '${simVitals['blood_sugar'] ?? '--'} mg/dL',
            Icons.bubble_chart_rounded, const Color(0xFFF59E0B)),
        _buildCompareCard('BMI',
            '${(baseVitals['bmi'] as num?)?.toStringAsFixed(1) ?? '--'}',
            '${(simVitals['bmi'] as num?)?.toStringAsFixed(1) ?? '--'}',
            Icons.monitor_weight_outlined, const Color(0xFF6366F1)),

        const SizedBox(height: 16),
        // Risk comparison
        const Text('Disease Risk Changes',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF111827))),
        const SizedBox(height: 10),
        ...baseRisks.entries.map((e) {
          final simEntry = simRisks[e.key] as Map<String, dynamic>? ?? {};
          final baseProb = ((e.value as Map?)?['probability'] as num?)?.toDouble() ?? 0.0;
          final simProb = (simEntry['probability'] as num?)?.toDouble() ?? 0.0;
          final diff = simProb - baseProb;
          final improved = diff < 0;
          return _buildRiskCompareRow(
            e.key.replaceAll('_', ' ').toUpperCase(),
            baseProb, simProb, improved,
          );
        }),

        if (narrative.isNotEmpty) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF10B981).withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.2)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(children: [
                  Icon(Icons.lightbulb_outline_rounded, color: Color(0xFF10B981), size: 16),
                  SizedBox(width: 6),
                  Text('AI Narrative', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF10B981))),
                ]),
                const SizedBox(height: 8),
                Text(narrative,
                    style: const TextStyle(fontSize: 12, color: Color(0xFF4B5563), height: 1.6)),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildCompareCard(String label, String baseline, String simulated,
      IconData icon, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(label,
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Color(0xFF374151))),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(baseline,
                  style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF))),
              const SizedBox(height: 2),
              Row(children: [
                const Icon(Icons.arrow_forward_rounded, size: 12, color: Color(0xFF10B981)),
                const SizedBox(width: 4),
                Text(simulated,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF111827))),
              ]),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRiskCompareRow(String label, double base, double sim, bool improved) {
    final color = improved ? const Color(0xFF10B981) : const Color(0xFFEF4444);
    final diff = ((sim - base) * 100).abs().toStringAsFixed(1);
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF374151))),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  improved ? '▼ $diff% better' : '▲ $diff% worse',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Baseline', style: TextStyle(fontSize: 10, color: Color(0xFF9CA3AF))),
                  const SizedBox(height: 4),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: base.clamp(0.0, 1.0),
                      minHeight: 8,
                      backgroundColor: const Color(0xFFE5E7EB),
                      valueColor: const AlwaysStoppedAnimation(Color(0xFF9CA3AF)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Simulated', style: TextStyle(fontSize: 10, color: Color(0xFF9CA3AF))),
                  const SizedBox(height: 4),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: sim.clamp(0.0, 1.0),
                      minHeight: 8,
                      backgroundColor: const Color(0xFFE5E7EB),
                      valueColor: AlwaysStoppedAnimation(color),
                    ),
                  ),
                ],
              ),
            ),
          ]),
        ],
      ),
    );
  }
}

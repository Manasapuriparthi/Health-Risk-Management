import 'package:flutter/material.dart';
import '../services/api_service.dart';

class RiskPredictorScreen extends StatefulWidget {
  const RiskPredictorScreen({super.key});

  @override
  State<RiskPredictorScreen> createState() => _RiskPredictorScreenState();
}

class _RiskPredictorScreenState extends State<RiskPredictorScreen> {
  final _formKey = GlobalKey<FormState>();
  final _ageController = TextEditingController();
  final _systolicController = TextEditingController();
  final _diastolicController = TextEditingController();
  final _bloodSugarController = TextEditingController();
  final _cholesterolController = TextEditingController();
  final _bmiController = TextEditingController();
  final _activeMinutesController = TextEditingController();
  bool _smoking = false;
  bool _alcohol = false;
  bool _isLoading = false;
  Map<String, dynamic>? _result;

  @override
  void dispose() {
    _ageController.dispose();
    _systolicController.dispose();
    _diastolicController.dispose();
    _bloodSugarController.dispose();
    _cholesterolController.dispose();
    _bmiController.dispose();
    _activeMinutesController.dispose();
    super.dispose();
  }

  Future<void> _predict() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _isLoading = true; _result = null; });
    try {
      final body = <String, dynamic>{
        if (_ageController.text.isNotEmpty) 'age': int.parse(_ageController.text),
        if (_systolicController.text.isNotEmpty) 'systolic_bp': int.parse(_systolicController.text),
        if (_diastolicController.text.isNotEmpty) 'diastolic_bp': int.parse(_diastolicController.text),
        if (_bloodSugarController.text.isNotEmpty) 'blood_sugar': int.parse(_bloodSugarController.text),
        if (_cholesterolController.text.isNotEmpty) 'cholesterol': int.parse(_cholesterolController.text),
        if (_bmiController.text.isNotEmpty) 'bmi': double.parse(_bmiController.text),
        if (_activeMinutesController.text.isNotEmpty) 'active_minutes': int.parse(_activeMinutesController.text),
        'smoking': _smoking ? 1 : 0,
        'alcohol': _alcohol ? 1 : 0,
      };
      final res = await ApiService.predictRisk(body);
      setState(() => _result = res);
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
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: const Text('Disease Risk Predictor',
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
        child: Column(
          children: [
            if (_result == null) _buildForm(),
            if (_result != null) ...[
              _buildResultCard(),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => setState(() => _result = null),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    side: const BorderSide(color: Color(0xFF10B981)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Run Another Prediction',
                      style: TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildForm() {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Info banner
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFF6366F1).withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF6366F1).withValues(alpha: 0.2)),
            ),
            child: const Row(
              children: [
                Icon(Icons.info_outline_rounded, color: Color(0xFF6366F1), size: 18),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Leave fields blank to use your latest logged vitals or profile data.',
                    style: TextStyle(fontSize: 12, color: Color(0xFF4B5563), height: 1.4),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          _buildSectionLabel('Basic Info'),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _buildNumField(_ageController, 'Age', '35', 'yrs')),
              const SizedBox(width: 12),
              Expanded(child: _buildNumField(_bmiController, 'BMI', '24.5', '', isDecimal: true)),
            ],
          ),
          const SizedBox(height: 20),

          _buildSectionLabel('Blood Pressure'),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _buildNumField(_systolicController, 'Systolic', '120', 'mmHg')),
              const SizedBox(width: 12),
              Expanded(child: _buildNumField(_diastolicController, 'Diastolic', '80', 'mmHg')),
            ],
          ),
          const SizedBox(height: 20),

          _buildSectionLabel('Blood Metrics'),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _buildNumField(_bloodSugarController, 'Blood Sugar', '95', 'mg/dL')),
              const SizedBox(width: 12),
              Expanded(child: _buildNumField(_cholesterolController, 'Cholesterol', '180', 'mg/dL')),
            ],
          ),
          const SizedBox(height: 20),

          _buildSectionLabel('Lifestyle'),
          const SizedBox(height: 12),
          _buildNumField(_activeMinutesController, 'Daily Active Minutes', '30', 'min'),
          const SizedBox(height: 16),

          // Toggle switches
          _buildToggleRow('Smoker', _smoking, (v) => setState(() => _smoking = v)),
          const SizedBox(height: 10),
          _buildToggleRow('Alcohol Consumption', _alcohol, (v) => setState(() => _alcohol = v)),

          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _isLoading ? null : _predict,
              icon: _isLoading
                  ? const SizedBox(
                      height: 18, width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                  : const Icon(Icons.analytics_rounded, size: 20),
              label: const Text('Predict My Risk'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionLabel(String label) {
    return Text(label,
        style: const TextStyle(
            fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF374151)));
  }

  Widget _buildNumField(
    TextEditingController controller,
    String label,
    String hint,
    String unit, {
    bool isDecimal = false,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: isDecimal
          ? const TextInputType.numberWithOptions(decimal: true)
          : TextInputType.number,
      decoration: InputDecoration(
        labelText: unit.isNotEmpty ? '$label ($unit)' : label,
        hintText: hint,
      ),
    );
  }

  Widget _buildToggleRow(String label, bool value, ValueChanged<bool> onChanged) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: const TextStyle(fontSize: 14, color: Color(0xFF374151), fontWeight: FontWeight.w500)),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: const Color(0xFF10B981),
          ),
        ],
      ),
    );
  }

  Widget _buildResultCard() {
    final predictions = _result!['predictions'] as Map<String, dynamic>? ?? {};

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Prediction Results',
            style: TextStyle(
                fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF111827))),
        const SizedBox(height: 4),
        const Text('Based on your health data and ML analysis',
            style: TextStyle(fontSize: 13, color: Color(0xFF6B7280))),
        const SizedBox(height: 16),
        ...predictions.entries.map((entry) {
          final disease = entry.key;
          final data = entry.value as Map<String, dynamic>? ?? {};
          final risk = (data['risk_level'] ?? 'Unknown').toString();
          final prob = ((data['probability'] ?? 0.0) as num).toDouble();
          return _buildDiseaseCard(disease, risk, prob);
        }),
      ],
    );
  }

  Widget _buildDiseaseCard(String disease, String riskLevel, double probability) {
    Color riskColor;
    Color riskBg;
    IconData riskIcon;

    switch (riskLevel.toLowerCase()) {
      case 'high':
        riskColor = const Color(0xFFEF4444);
        riskBg = const Color(0xFFFEE2E2);
        riskIcon = Icons.warning_rounded;
        break;
      case 'medium':
      case 'moderate':
        riskColor = const Color(0xFFF59E0B);
        riskBg = const Color(0xFFFEF3C7);
        riskIcon = Icons.info_rounded;
        break;
      default:
        riskColor = const Color(0xFF10B981);
        riskBg = const Color(0xFFD1FAE5);
        riskIcon = Icons.check_circle_rounded;
    }

    final displayName = disease.replaceAll('_', ' ').toUpperCase();

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(displayName,
                    style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        color: Color(0xFF111827))),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: riskBg,
                  borderRadius: BorderRadius.circular(9999),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(riskIcon, color: riskColor, size: 14),
                    const SizedBox(width: 4),
                    Text(riskLevel.toUpperCase(),
                        style: TextStyle(
                            color: riskColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 11)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: LinearProgressIndicator(
                    value: probability.clamp(0.0, 1.0),
                    minHeight: 10,
                    backgroundColor: const Color(0xFFE5E7EB),
                    valueColor: AlwaysStoppedAnimation<Color>(riskColor),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Text('${(probability * 100).toStringAsFixed(1)}%',
                  style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                      color: riskColor)),
            ],
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import '../main.dart';
import '../services/api_service.dart';
import 'vitals_log_screen.dart';
import 'risk_predictor_screen.dart';
import 'health_coach_screen.dart';
import 'notifications_screen.dart';
import 'report_analyzer_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? _latestVitals;
  String _userName = 'User';
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        ApiService.getLatestVitals(),
        ApiService.getUserName(),
      ]);
      setState(() {
        _latestVitals = results[0] as Map<String, dynamic>?;
        _userName = (results[1] as String?) ?? 'User';
      });
    } catch (_) {}
    finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  int _healthScore() {
    if (_latestVitals == null) return 85;
    int score = 100;
    final sys  = _latestVitals!['systolic_bp']  as int?;
    final dia  = _latestVitals!['diastolic_bp'] as int?;
    final sug  = _latestVitals!['blood_sugar']  as int?;
    final hr   = _latestVitals!['heart_rate']   as int?;
    final chol = _latestVitals!['cholesterol']  as int?;
    if (sys != null && sys > 130) score -= 10;
    if (sys != null && sys > 140) score -= 10;
    if (dia != null && dia > 85)  score -= 8;
    if (sug != null && sug > 100) score -= 8;
    if (sug != null && sug > 126) score -= 10;
    if (hr  != null && (hr < 50 || hr > 100)) score -= 8;
    if (chol != null && chol > 200) score -= 8;
    if (chol != null && chol > 240) score -= 10;
    return score.clamp(10, 100);
  }

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good Morning,';
    if (h < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  }

  @override
  Widget build(BuildContext context) {
    final score = _healthScore();
    return Scaffold(
      backgroundColor: AppColors.bgPrimary,
      appBar: AppBar(
        backgroundColor: AppColors.bgPrimary,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_greeting(),
                style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textMuted,
                    fontWeight: FontWeight.normal)),
            Text(_userName,
                style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none_rounded,
                size: 26, color: AppColors.textSecond),
            onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const NotificationsScreen())),
          ),
          const SizedBox(width: 6),
        ],
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.accent))
          : RefreshIndicator(
              onRefresh: _loadData,
              color: AppColors.accent,
              backgroundColor: AppColors.bgCard,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildHealthScoreCard(score),
                    const SizedBox(height: 24),
                    const Text('Quick Actions',
                        style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary)),
                    const SizedBox(height: 12),
                    _buildQuickActions(context),
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Physiological Markers',
                            style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary)),
                        GestureDetector(
                          onTap: () => Navigator.of(context)
                              .push(MaterialPageRoute(
                                  builder: (_) => const VitalsLogScreen()))
                              .then((_) => _loadData()),
                          child: const Text('+ Log',
                              style: TextStyle(
                                  fontSize: 13,
                                  color: AppColors.accent,
                                  fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      crossAxisSpacing: 14,
                      mainAxisSpacing: 14,
                      childAspectRatio: 1.45,
                      children: [
                        _vitalCard('Blood Pressure',
                            _latestVitals != null
                                ? '${_latestVitals!['systolic_bp'] ?? '--'}/${_latestVitals!['diastolic_bp'] ?? '--'}'
                                : '120/80',
                            'mmHg', Icons.favorite_rounded,
                            const Color(0xFFEF4444)),
                        _vitalCard('Blood Sugar',
                            '${_latestVitals?['blood_sugar'] ?? '95'}',
                            'mg/dL', Icons.bubble_chart_rounded,
                            const Color(0xFFF59E0B)),
                        _vitalCard('Heart Rate',
                            '${_latestVitals?['heart_rate'] ?? '72'}',
                            'bpm', Icons.monitor_heart_rounded,
                            AppColors.accent),
                        _vitalCard('Cholesterol',
                            '${_latestVitals?['cholesterol'] ?? '180'}',
                            'mg/dL', Icons.speed_rounded,
                            AppColors.accentIndigo),
                      ],
                    ),
                    const SizedBox(height: 24),
                    _buildWellnessTip(score),
                  ],
                ),
              ),
            ),
    );
  }

  // ─── Health Score Card ────────────────────────────────────────────────────

  Widget _buildHealthScoreCard(int score) {
    String label;
    if (score >= 85)      label = 'Excellent physiological condition';
    else if (score >= 70) label = 'Good health — keep it up!';
    else if (score >= 55) label = 'Moderate — consider lifestyle changes';
    else                  label = 'Needs attention — consult a doctor';

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.accent.withValues(alpha: 0.12),
            AppColors.accentIndigo.withValues(alpha: 0.08),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.accent.withValues(alpha: 0.2)),
        boxShadow: [
          BoxShadow(
            color: AppColors.accent.withValues(alpha: 0.06),
            blurRadius: 20,
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Overall Health Score',
                    style: TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecond,
                        fontWeight: FontWeight.w500)),
                const SizedBox(height: 6),
                Text('$score',
                    style: const TextStyle(
                        fontSize: 40,
                        fontWeight: FontWeight.w900,
                        color: AppColors.accent)),
                const SizedBox(height: 4),
                Text(label,
                    style: const TextStyle(
                        fontSize: 11, color: AppColors.textSecond)),
                if (_latestVitals == null) ...[
                  const SizedBox(height: 8),
                  GestureDetector(
                    onTap: () => Navigator.of(context)
                        .push(MaterialPageRoute(
                            builder: (_) => const VitalsLogScreen()))
                        .then((_) => _loadData()),
                    child: const Text('Log vitals for live score →',
                        style: TextStyle(
                            fontSize: 11,
                            color: AppColors.accent,
                            fontWeight: FontWeight.bold)),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 16),
          Stack(
            alignment: Alignment.center,
            children: [
              SizedBox(
                width: 76,
                height: 76,
                child: CircularProgressIndicator(
                  value: score / 100.0,
                  strokeWidth: 7,
                  backgroundColor:
                      AppColors.accent.withValues(alpha: 0.15),
                  valueColor: const AlwaysStoppedAnimation<Color>(
                      AppColors.accent),
                ),
              ),
              Text('$score%',
                  style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      color: AppColors.accent)),
            ],
          ),
        ],
      ),
    );
  }

  // ─── Quick Actions ────────────────────────────────────────────────────────

  Widget _buildQuickActions(BuildContext context) {
    final actions = [
      _QA(Icons.monitor_heart_rounded, 'Log Vitals', AppColors.accent,
          () => Navigator.of(context)
              .push(MaterialPageRoute(builder: (_) => const VitalsLogScreen()))
              .then((_) => _loadData())),
      _QA(Icons.analytics_rounded, 'Risk Check', AppColors.accentIndigo,
          () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const RiskPredictorScreen()))),
      _QA(Icons.document_scanner_rounded, 'Reports', const Color(0xFF3B82F6),
          () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const ReportAnalyzerScreen()))),
      _QA(Icons.smart_toy_rounded, 'AI Coach', const Color(0xFF8B5CF6),
          () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const HealthCoachScreen()))),
    ];

    return Row(
      children: actions.asMap().entries.map((entry) {
        final a = entry.value;
        final isLast = entry.key == actions.length - 1;
        return Expanded(
          child: GestureDetector(
            onTap: a.onTap,
            child: Container(
              margin: EdgeInsets.only(right: isLast ? 0 : 10),
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                color: a.color.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: a.color.withValues(alpha: 0.18)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(a.icon, color: a.color, size: 22),
                  const SizedBox(height: 5),
                  Text(a.label,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          color: a.color)),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  // ─── Vital Card ───────────────────────────────────────────────────────────

  Widget _vitalCard(String name, String value, String unit,
      IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.bgCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Flexible(
                child: Text(name,
                    style: const TextStyle(
                        fontSize: 11, color: AppColors.textSecond)),
              ),
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 14),
              ),
            ],
          ),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(value,
                  style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary)),
              const SizedBox(width: 3),
              Text(unit,
                  style: const TextStyle(
                      fontSize: 10, color: AppColors.textMuted)),
            ],
          ),
        ],
      ),
    );
  }

  // ─── Wellness Tip ─────────────────────────────────────────────────────────

  Widget _buildWellnessTip(int score) {
    String tip;
    if (score >= 85)
      tip = 'Your vitals look great! Keep up your active lifestyle and balanced nutrition.';
    else if (score >= 70)
      tip = 'Focus on consistent sleep (7–8 hrs), low-sodium diet, and 30 min of daily activity.';
    else if (score >= 55)
      tip = 'Some markers need attention. Reduce processed foods and log vitals regularly.';
    else
      tip = 'Risk indicators are elevated. Please consult a healthcare professional.';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.bgCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.accent.withValues(alpha: 0.2)),
        boxShadow: [
          BoxShadow(
            color: AppColors.accent.withValues(alpha: 0.05),
            blurRadius: 16,
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.accent.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.lightbulb_outline_rounded,
                color: AppColors.accent, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('AI Wellness Tip',
                    style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary)),
                const SizedBox(height: 5),
                Text(tip,
                    style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecond,
                        height: 1.5)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _QA {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _QA(this.icon, this.label, this.color, this.onTap);
}

import 'package:flutter/material.dart';
import '../services/api_service.dart';

class PlannersScreen extends StatefulWidget {
  const PlannersScreen({super.key});
  @override
  State<PlannersScreen> createState() => _PlannersScreenState();
}

class _PlannersScreenState extends State<PlannersScreen> {
  int _activeTab = 0;

  // Drug checker
  final _medAController = TextEditingController();
  final _medBController = TextEditingController();
  bool _drugLoading = false;
  Map<String, dynamic>? _drugResult;

  // Diet planner
  int _calories = 2000;
  String _preference = 'Vegetarian';
  final List<String> _conditions = [];
  bool _dietLoading = false;
  Map<String, dynamic>? _dietResult;

  // Workout planner
  String _fitnessLevel = 'Beginner';
  String _goal = 'General Fitness';
  int _daysPerWeek = 3;
  bool _workoutLoading = false;
  Map<String, dynamic>? _workoutResult;

  @override
  void dispose() {
    _medAController.dispose();
    _medBController.dispose();
    super.dispose();
  }

  void _snack(String msg, {bool error = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: error ? const Color(0xFFEF4444) : const Color(0xFF10B981),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }

  Future<void> _checkDrugs() async {
    final a = _medAController.text.trim();
    final b = _medBController.text.trim();
    if (a.isEmpty || b.isEmpty) {
      _snack('Enter both medicines', error: true);
      return;
    }
    setState(() { _drugLoading = true; _drugResult = null; });
    try {
      final res = await ApiService.checkDrugInteractions([a, b]);
      setState(() => _drugResult = res);
    } catch (e) {
      _snack(e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _drugLoading = false);
    }
  }

  Future<void> _getDiet() async {
    setState(() { _dietLoading = true; _dietResult = null; });
    try {
      final res = await ApiService.getDietPlan(
        calories: _calories,
        preference: _preference,
        conditions: List.from(_conditions),
      );
      setState(() => _dietResult = res);
    } catch (e) {
      _snack(e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _dietLoading = false);
    }
  }

  Future<void> _getWorkout() async {
    setState(() { _workoutLoading = true; _workoutResult = null; });
    try {
      final res = await ApiService.getWorkoutPlan(
        fitnessLevel: _fitnessLevel,
        goal: _goal,
        daysPerWeek: _daysPerWeek,
      );
      setState(() => _workoutResult = res);
    } catch (e) {
      _snack(e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _workoutLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Clinical Planners')),
      body: Column(
        children: [
          Container(
            margin: const EdgeInsets.fromLTRB(20, 8, 20, 0),
            decoration: BoxDecoration(
              color: const Color(0xFFF3F4F6),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(children: [
              _tab(0, 'Drug', Icons.medication_outlined),
              _tab(1, 'Diet', Icons.restaurant_outlined),
              _tab(2, 'Workout', Icons.fitness_center_rounded),
            ]),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: _activeTab == 0
                  ? _buildDrugTab()
                  : _activeTab == 1
                      ? _buildDietTab()
                      : _buildWorkoutTab(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _tab(int idx, String label, IconData icon) {
    final active = _activeTab == idx;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _activeTab = idx),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 11),
          decoration: BoxDecoration(
            color: active ? const Color(0xFF10B981) : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 15,
                  color: active ? Colors.white : const Color(0xFF4B5563)),
              const SizedBox(width: 5),
              Text(label,
                  style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: active ? Colors.white : const Color(0xFF4B5563))),
            ],
          ),
        ),
      ),
    );
  }

  // ─── DRUG TAB ────────────────────────────────────────────────────────────

  Widget _buildDrugTab() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Drug Interaction Checker',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF111827))),
        const SizedBox(height: 4),
        const Text('Enter two medicines to check for interactions',
            style: TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
        const SizedBox(height: 16),
        TextField(
          controller: _medAController,
          decoration: const InputDecoration(
            labelText: 'Medicine A',
            hintText: 'e.g. Aspirin',
            prefixIcon: Icon(Icons.medication_outlined, color: Color(0xFF9CA3AF)),
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _medBController,
          decoration: const InputDecoration(
            labelText: 'Medicine B',
            hintText: 'e.g. Warfarin',
            prefixIcon: Icon(Icons.medication_outlined, color: Color(0xFF9CA3AF)),
          ),
        ),
        const SizedBox(height: 20),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _drugLoading ? null : _checkDrugs,
            icon: _drugLoading
                ? const SizedBox(width: 18, height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                : const Icon(Icons.search_rounded, size: 20),
            label: const Text('Check Interactions'),
          ),
        ),
        if (_drugResult != null) ...[
          const SizedBox(height: 24),
          _buildDrugResult(_drugResult!),
        ],
      ],
    );
  }

  Widget _buildDrugResult(Map<String, dynamic> result) {
    final analyzed = result['drugs_analyzed'] as List<dynamic>? ?? [];
    final interactions = result['interactions'] as List<dynamic>? ?? [];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Drug Details',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF111827))),
        const SizedBox(height: 10),
        ...analyzed.map((drug) {
          final recognized = drug['status'] == 'Recognized';
          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: recognized
                    ? const Color(0xFF10B981).withValues(alpha: 0.3)
                    : const Color(0xFFE5E7EB),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(drug['name'] ?? '',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14,
                            color: Color(0xFF111827))),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: recognized ? const Color(0xFFD1FAE5) : const Color(0xFFF3F4F6),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(drug['status'] ?? '',
                          style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: recognized
                                  ? const Color(0xFF065F46)
                                  : const Color(0xFF6B7280))),
                    ),
                  ],
                ),
                if (recognized) ...[
                  const SizedBox(height: 6),
                  Text('Class: ${drug['class'] ?? '--'}',
                      style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
                  Text('Uses: ${drug['uses'] ?? '--'}',
                      style: const TextStyle(fontSize: 12, color: Color(0xFF4B5563))),
                ] else
                  const Padding(
                    padding: EdgeInsets.only(top: 4),
                    child: Text('Not found in local drug database.',
                        style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
                  ),
              ],
            ),
          );
        }),
        const SizedBox(height: 8),
        if (interactions.isEmpty)
          _banner('✅ No known interactions found between these medicines.',
              const Color(0xFF10B981), const Color(0xFFD1FAE5))
        else
          ...interactions.map((i) {
            final sev = (i['severity'] ?? 'moderate').toString().toLowerCase();
            final color = sev == 'high'
                ? const Color(0xFFEF4444)
                : sev == 'moderate'
                    ? const Color(0xFFF59E0B)
                    : const Color(0xFF10B981);
            final bg = sev == 'high'
                ? const Color(0xFFFEE2E2)
                : sev == 'moderate'
                    ? const Color(0xFFFEF3C7)
                    : const Color(0xFFD1FAE5);
            return _banner('⚠️ ${i['warning'] ?? ''}', color, bg);
          }),
      ],
    );
  }

  Widget _banner(String text, Color fg, Color bg) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
      child: Text(text, style: TextStyle(fontSize: 13, color: fg, height: 1.5)),
    );
  }

  // ─── DIET TAB ────────────────────────────────────────────────────────────

  Widget _buildDietTab() {
    final conditionOptions = ['Diabetes', 'Hypertension', 'CVD'];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Personalised Diet Planner',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF111827))),
        const SizedBox(height: 16),
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          const Text('Daily Calories',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
          Text('$_calories kcal',
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
        ]),
        Slider(
          value: _calories.toDouble(),
          min: 1000, max: 4000, divisions: 30,
          activeColor: const Color(0xFF10B981),
          inactiveColor: const Color(0xFFE5E7EB),
          onChanged: (v) => setState(() => _calories = v.round()),
        ),
        const SizedBox(height: 12),
        const Text('Diet Preference',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8, runSpacing: 8,
          children: ['Vegetarian', 'Vegan', 'Non-Vegetarian', 'Keto'].map((p) {
            final sel = _preference == p;
            return GestureDetector(
              onTap: () => setState(() => _preference = p),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: sel ? const Color(0xFF10B981) : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                      color: sel ? const Color(0xFF10B981) : const Color(0xFFE5E7EB)),
                ),
                child: Text(p,
                    style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: sel ? Colors.white : const Color(0xFF374151))),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 16),
        const Text('Health Conditions (optional)',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8, runSpacing: 8,
          children: conditionOptions.map((c) {
            final sel = _conditions.contains(c);
            return GestureDetector(
              onTap: () => setState(
                  () => sel ? _conditions.remove(c) : _conditions.add(c)),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                decoration: BoxDecoration(
                  color: sel
                      ? const Color(0xFF6366F1).withValues(alpha: 0.1)
                      : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                      color: sel ? const Color(0xFF6366F1) : const Color(0xFFE5E7EB)),
                ),
                child: Text(c,
                    style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: sel ? const Color(0xFF6366F1) : const Color(0xFF374151))),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _dietLoading ? null : _getDiet,
            icon: _dietLoading
                ? const SizedBox(width: 18, height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                : const Icon(Icons.restaurant_menu_rounded, size: 20),
            label: const Text('Generate Diet Plan'),
          ),
        ),
        if (_dietResult != null) ...[
          const SizedBox(height: 24),
          _buildDietResult(_dietResult!),
        ],
      ],
    );
  }

  Widget _buildDietResult(Map<String, dynamic> result) {
    final meals = result['meals'] as Map<String, dynamic>? ?? {};
    final notes = result['notes'] as List<dynamic>? ?? [];
    final cals = result['total_calories'] ?? _calories;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Your $cals kcal Meal Plan',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF111827))),
        const SizedBox(height: 12),
        ...meals.entries.map((e) => _mealCard(
            e.key[0].toUpperCase() + e.key.substring(1), e.value.toString())),
        if (notes.isNotEmpty) ...[
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFF6366F1).withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF6366F1).withValues(alpha: 0.2)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Dietary Notes',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13,
                        color: Color(0xFF6366F1))),
                const SizedBox(height: 8),
                ...notes.map((n) => Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Text('• $n',
                      style: const TextStyle(
                          fontSize: 12, color: Color(0xFF4B5563), height: 1.4)),
                )),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _mealCard(String name, String menu) {
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
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: const Color(0xFF10B981).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.restaurant_outlined,
                color: Color(0xFF10B981), size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name,
                    style: const TextStyle(fontWeight: FontWeight.bold,
                        fontSize: 13, color: Color(0xFF10B981))),
                const SizedBox(height: 4),
                Text(menu,
                    style: const TextStyle(fontSize: 12,
                        color: Color(0xFF4B5563), height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ─── WORKOUT TAB ─────────────────────────────────────────────────────────

  Widget _buildWorkoutTab() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('AI Workout Planner',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF111827))),
        const SizedBox(height: 16),
        const Text('Fitness Level',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8, runSpacing: 8,
          children: ['Beginner', 'Intermediate', 'Advanced'].map((lvl) {
            final sel = _fitnessLevel == lvl;
            return GestureDetector(
              onTap: () => setState(() => _fitnessLevel = lvl),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: sel ? const Color(0xFF10B981) : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                      color: sel ? const Color(0xFF10B981) : const Color(0xFFE5E7EB)),
                ),
                child: Text(lvl,
                    style: TextStyle(
                        fontSize: 12, fontWeight: FontWeight.w600,
                        color: sel ? Colors.white : const Color(0xFF374151))),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 16),
        const Text('Fitness Goal',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8, runSpacing: 8,
          children: ['General Fitness', 'Weight Loss', 'Muscle Gain', 'Heart Health'].map((g) {
            final sel = _goal == g;
            return GestureDetector(
              onTap: () => setState(() => _goal = g),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: sel
                      ? const Color(0xFF6366F1).withValues(alpha: 0.1)
                      : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                      color: sel ? const Color(0xFF6366F1) : const Color(0xFFE5E7EB)),
                ),
                child: Text(g,
                    style: TextStyle(
                        fontSize: 12, fontWeight: FontWeight.w600,
                        color: sel ? const Color(0xFF6366F1) : const Color(0xFF374151))),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 16),
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          const Text('Days Per Week',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
          Text('$_daysPerWeek days',
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
        ]),
        Slider(
          value: _daysPerWeek.toDouble(),
          min: 1, max: 7, divisions: 6,
          activeColor: const Color(0xFF10B981),
          inactiveColor: const Color(0xFFE5E7EB),
          onChanged: (v) => setState(() => _daysPerWeek = v.round()),
        ),
        const SizedBox(height: 20),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _workoutLoading ? null : _getWorkout,
            icon: _workoutLoading
                ? const SizedBox(width: 18, height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                : const Icon(Icons.fitness_center_rounded, size: 20),
            label: const Text('Generate Workout Plan'),
          ),
        ),
        if (_workoutResult != null) ...[
          const SizedBox(height: 24),
          _buildWorkoutResult(_workoutResult!),
        ],
      ],
    );
  }

  Widget _buildWorkoutResult(Map<String, dynamic> result) {
    final schedule = result['weekly_schedule'] as Map<String, dynamic>? ?? {};
    final tips = result['tips'] as List<dynamic>? ?? [];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Your Weekly Schedule',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF111827))),
        const SizedBox(height: 12),
        ...schedule.entries.map((e) {
          final exercises = e.value is List ? e.value as List : [e.value.toString()];
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
                  width: 36, height: 36,
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.calendar_today_outlined,
                      color: Color(0xFF10B981), size: 16),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(e.key,
                          style: const TextStyle(fontWeight: FontWeight.bold,
                              fontSize: 13, color: Color(0xFF111827))),
                      const SizedBox(height: 4),
                      ...exercises.map((ex) => Text('• $ex',
                          style: const TextStyle(fontSize: 12,
                              color: Color(0xFF4B5563), height: 1.4))),
                    ],
                  ),
                ),
              ],
            ),
          );
        }),
        if (tips.isNotEmpty) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF59E0B).withValues(alpha: 0.07),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                  color: const Color(0xFFF59E0B).withValues(alpha: 0.25)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Pro Tips',
                    style: TextStyle(fontWeight: FontWeight.bold,
                        fontSize: 13, color: Color(0xFFF59E0B))),
                const SizedBox(height: 8),
                ...tips.map((t) => Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Text('• $t',
                      style: const TextStyle(fontSize: 12,
                          color: Color(0xFF4B5563), height: 1.4)),
                )),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

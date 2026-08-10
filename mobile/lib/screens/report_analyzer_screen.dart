import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../main.dart';
import '../services/api_service.dart';

class ReportAnalyzerScreen extends StatefulWidget {
  const ReportAnalyzerScreen({super.key});
  @override
  State<ReportAnalyzerScreen> createState() => _ReportAnalyzerScreenState();
}

class _ReportAnalyzerScreenState extends State<ReportAnalyzerScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _picker = ImagePicker();

  // Upload
  File? _pickedFile;
  String? _pickedFileName;
  bool _uploadLoading = false;

  // Manual
  final _sourceCtrl = TextEditingController(text: 'Manual Entry');
  final Map<String, TextEditingController> _fields = {
    'systolic':      TextEditingController(),
    'diastolic':     TextEditingController(),
    'heart_rate':    TextEditingController(),
    'spo2':          TextEditingController(),
    'weight':        TextEditingController(),
    'glucose':       TextEditingController(),
    'cholesterol':   TextEditingController(),
    'hemoglobin':    TextEditingController(),
    'ldl':           TextEditingController(),
    'hdl':           TextEditingController(),
    'triglycerides': TextEditingController(),
  };
  bool _manualLoading = false;

  // Shared
  Map<String, dynamic>? _result;
  List<dynamic> _history = [];
  String? _error;

  static const List<Map<String, String>> _fieldMeta = [
    {'key': 'systolic',     'label': 'Systolic BP',   'unit': 'mmHg', 'hint': '116'},
    {'key': 'diastolic',    'label': 'Diastolic BP',  'unit': 'mmHg', 'hint': '83'},
    {'key': 'heart_rate',   'label': 'Heart Rate',    'unit': 'bpm',  'hint': '90'},
    {'key': 'spo2',         'label': 'SpO2',          'unit': '%',    'hint': '96'},
    {'key': 'weight',       'label': 'Weight',        'unit': 'kg',   'hint': '65.8'},
    {'key': 'glucose',      'label': 'Blood Sugar',   'unit': 'mg/dL','hint': '95'},
    {'key': 'cholesterol',  'label': 'Cholesterol',   'unit': 'mg/dL','hint': '180'},
    {'key': 'hemoglobin',   'label': 'Hemoglobin',    'unit': 'g/dL', 'hint': '13.5'},
    {'key': 'ldl',          'label': 'LDL',           'unit': 'mg/dL','hint': '90'},
    {'key': 'hdl',          'label': 'HDL',           'unit': 'mg/dL','hint': '55'},
    {'key': 'triglycerides','label': 'Triglycerides', 'unit': 'mg/dL','hint': '140'},
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadHistory();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _sourceCtrl.dispose();
    for (final c in _fields.values) c.dispose();
    super.dispose();
  }

  // ─── History ───────────────────────────────────────────────────────────────

  Future<void> _loadHistory() async {
    try {
      final h = await ApiService.getReportHistory();
      if (mounted) setState(() => _history = h);
    } catch (_) {}
  }

  // ─── Image Picker ──────────────────────────────────────────────────────────

  Future<void> _pick(ImageSource source) async {
    final xf = await _picker.pickImage(source: source, imageQuality: 90);
    if (xf != null) {
      setState(() {
        _pickedFile = File(xf.path);
        _pickedFileName = xf.name;
        _error = null;
      });
    }
  }

  void _showPickerSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.bgCard,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            width: 36, height: 4,
            margin: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
                color: AppColors.border, borderRadius: BorderRadius.circular(2)),
          ),
          const Padding(
            padding: EdgeInsets.only(bottom: 8),
            child: Text('Select Report', style: TextStyle(
                fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.textPrimary)),
          ),
          ListTile(
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                  color: AppColors.accent.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10)),
              child: const Icon(Icons.camera_alt_rounded, color: AppColors.accent),
            ),
            title: const Text('Take a Photo',
                style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600)),
            subtitle: const Text('Photograph your clinic report',
                style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
            onTap: () { Navigator.pop(context); _pick(ImageSource.camera); },
          ),
          ListTile(
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                  color: AppColors.accentIndigo.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10)),
              child: const Icon(Icons.photo_library_rounded, color: AppColors.accentIndigo),
            ),
            title: const Text('Choose from Gallery',
                style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600)),
            subtitle: const Text('Pick a JPG or PNG from photos',
                style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
            onTap: () { Navigator.pop(context); _pick(ImageSource.gallery); },
          ),
          const SizedBox(height: 8),
        ]),
      ),
    );
  }

  // ─── Upload Submit ─────────────────────────────────────────────────────────

  Future<void> _submitUpload() async {
    if (_pickedFile == null) {
      _snack('Please select an image first', error: true);
      return;
    }
    setState(() { _uploadLoading = true; _error = null; _result = null; });
    try {
      final bytes = await _pickedFile!.readAsBytes();
      final res = await ApiService.uploadReport(bytes.toList(), _pickedFileName!);
      setState(() { _result = res; _pickedFile = null; _pickedFileName = null; });
      _loadHistory();
      final needsManual = res['needs_manual'] == true;
      final extracted = res['extracted_values'] as Map? ?? {};
      if (needsManual || extracted.isEmpty) {
        // Auto-switch to manual entry tab with filename pre-filled
        Future.delayed(const Duration(milliseconds: 800), () {
          if (mounted) {
            _tabController.animateTo(1);
            _sourceCtrl.text = _pickedFileName ?? 'Image Report';
            _snack('Image uploaded ✓ — enter values from report in Manual Entry below.');
          }
        });
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _uploadLoading = false);
    }
  }

  // ─── Manual Submit ─────────────────────────────────────────────────────────

  Future<void> _submitManual() async {
    final payload = <String, dynamic>{
      'source_label': _sourceCtrl.text.trim().isEmpty
          ? 'Manual Entry' : _sourceCtrl.text.trim(),
    };
    for (final f in _fieldMeta) {
      final v = _fields[f['key']!]!.text.trim();
      if (v.isNotEmpty) {
        final n = double.tryParse(v);
        if (n != null) payload[f['key']!] = n;
      }
    }
    if (payload.length <= 1) { _snack('Enter at least one value', error: true); return; }
    setState(() { _manualLoading = true; _error = null; _result = null; });
    try {
      final res = await ApiService.manualReport(payload);
      setState(() => _result = res);
      for (final c in _fields.values) c.clear();
      _loadHistory();
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _manualLoading = false);
    }
  }

  void _snack(String msg, {bool error = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: error ? AppColors.danger : AppColors.accent,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }

  // ─── Status helpers ────────────────────────────────────────────────────────

  Color _statusColor(String s) {
    if (s.contains('Critical')) return AppColors.danger;
    if (s == 'High' || s == 'Low') return AppColors.warning;
    if (s == 'Normal') return AppColors.accent;
    return AppColors.accentIndigo;
  }

  Color _statusBg(String s) {
    if (s.contains('Critical')) return AppColors.danger.withValues(alpha: 0.12);
    if (s == 'High' || s == 'Low') return AppColors.warning.withValues(alpha: 0.12);
    if (s == 'Normal') return AppColors.accent.withValues(alpha: 0.12);
    return AppColors.accentIndigo.withValues(alpha: 0.12);
  }

  // ─── Build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgPrimary,
      appBar: AppBar(
        backgroundColor: AppColors.bgPrimary,
        title: const Text('Report Analyzer',
            style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
        leading: Navigator.canPop(context)
            ? IconButton(
                icon: const Icon(Icons.arrow_back_ios_new_rounded,
                    color: AppColors.textPrimary),
                onPressed: () => Navigator.of(context).pop())
            : null,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.accent,
          indicatorWeight: 3,
          labelColor: AppColors.accent,
          unselectedLabelColor: AppColors.textMuted,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          tabs: const [
            Tab(icon: Icon(Icons.upload_file_rounded, size: 18), text: 'Upload Report'),
            Tab(icon: Icon(Icons.edit_note_rounded, size: 18), text: 'Manual Entry'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [_buildUploadTab(), _buildManualTab()],
      ),
    );
  }

  // ─── UPLOAD TAB ────────────────────────────────────────────────────────────

  Widget _buildUploadTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // info banner
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.accentIndigo.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.accentIndigo.withValues(alpha: 0.2)),
          ),
          child: const Row(children: [
            Icon(Icons.info_outline_rounded, color: AppColors.accentIndigo, size: 18),
            SizedBox(width: 10),
            Expanded(child: Text(
              'Take a photo or pick from gallery. For handwritten reports use Manual Entry.',
              style: TextStyle(fontSize: 12, color: AppColors.textSecond, height: 1.5),
            )),
          ]),
        ),
        const SizedBox(height: 20),

        // pick zone
        GestureDetector(
          onTap: _showPickerSheet,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 20),
            decoration: BoxDecoration(
              color: AppColors.bgCard,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: _pickedFile != null ? AppColors.accent : AppColors.border,
                width: _pickedFile != null ? 2 : 1,
              ),
            ),
            child: _pickedFile != null
                ? Column(children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: Image.file(_pickedFile!,
                          height: 200, width: double.infinity, fit: BoxFit.cover),
                    ),
                    const SizedBox(height: 10),
                    Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                      const Icon(Icons.check_circle_rounded,
                          color: AppColors.accent, size: 16),
                      const SizedBox(width: 6),
                      Flexible(child: Text(_pickedFileName ?? '',
                          style: const TextStyle(fontSize: 12,
                              color: AppColors.accent, fontWeight: FontWeight.w600))),
                    ]),
                    const SizedBox(height: 4),
                    const Text('Tap to change',
                        style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                  ])
                : Column(children: [
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: AppColors.accent.withValues(alpha: 0.08),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.add_photo_alternate_rounded,
                          color: AppColors.accent, size: 38),
                    ),
                    const SizedBox(height: 14),
                    const Text('Tap to select report image',
                        style: TextStyle(fontSize: 14,
                            fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                    const SizedBox(height: 4),
                    const Text('Camera  ·  Gallery  •  JPG  ·  PNG',
                        style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
                  ]),
          ),
        ),
        const SizedBox(height: 14),

        // camera / gallery buttons
        Row(children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: () => _pick(ImageSource.camera),
              icon: const Icon(Icons.camera_alt_rounded, size: 18),
              label: const Text('Camera'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.accent,
                side: const BorderSide(color: AppColors.accent),
                padding: const EdgeInsets.symmetric(vertical: 13),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: OutlinedButton.icon(
              onPressed: () => _pick(ImageSource.gallery),
              icon: const Icon(Icons.photo_library_rounded, size: 18),
              label: const Text('Gallery'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.accentIndigo,
                side: const BorderSide(color: AppColors.accentIndigo),
                padding: const EdgeInsets.symmetric(vertical: 13),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
        ]),
        const SizedBox(height: 14),

        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _uploadLoading ? null : _submitUpload,
            icon: _uploadLoading
                ? const SizedBox(width: 18, height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                : const Icon(Icons.analytics_rounded, size: 20),
            label: Text(_uploadLoading ? 'Analyzing...' : 'Analyze Report'),
          ),
        ),

        if (_error != null) ...[const SizedBox(height: 12), _errorBanner(_error!)],
        if (_result != null) ...[const SizedBox(height: 24), _buildResults(_result!)],
        if (_history.isNotEmpty) ...[const SizedBox(height: 24), _buildHistory()],
      ]),
    );
  }

  // ─── MANUAL TAB ────────────────────────────────────────────────────────────

  Widget _buildManualTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Report Source', style: TextStyle(
            fontSize: 12, fontWeight: FontWeight.w600,
            color: AppColors.textMuted, letterSpacing: 0.5)),
        const SizedBox(height: 6),
        TextField(
          controller: _sourceCtrl,
          style: const TextStyle(color: AppColors.textPrimary),
          decoration: const InputDecoration(
            hintText: 'e.g. Sathish Gastro Clinic — 03/07/2026',
            prefixIcon: Icon(Icons.local_hospital_outlined,
                color: AppColors.textMuted, size: 18),
          ),
        ),
        const SizedBox(height: 18),
        const Text('Enter Vitals from Report', style: TextStyle(
            fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
        const SizedBox(height: 4),
        const Text('Leave blank if not in the report',
            style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
        const SizedBox(height: 14),

        ...List.generate((_fieldMeta.length / 2).ceil(), (i) {
          final l = _fieldMeta[i * 2];
          final rIdx = i * 2 + 1;
          final r = rIdx < _fieldMeta.length ? _fieldMeta[rIdx] : null;
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(children: [
              Expanded(child: _inputField(l)),
              if (r != null) ...[const SizedBox(width: 12), Expanded(child: _inputField(r))]
              else const Expanded(child: SizedBox()),
            ]),
          );
        }),

        const SizedBox(height: 8),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _manualLoading ? null : _submitManual,
            icon: _manualLoading
                ? const SizedBox(width: 18, height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                : const Icon(Icons.biotech_rounded, size: 20),
            label: Text(_manualLoading ? 'Analyzing...' : 'Analyze & Save'),
          ),
        ),

        if (_error != null) ...[const SizedBox(height: 12), _errorBanner(_error!)],
        if (_result != null) ...[const SizedBox(height: 24), _buildResults(_result!)],
        if (_history.isNotEmpty) ...[const SizedBox(height: 24), _buildHistory()],
      ]),
    );
  }

  Widget _inputField(Map<String, String> meta) {
    return TextField(
      controller: _fields[meta['key']!],
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
      decoration: InputDecoration(
        labelText: '${meta['label']} (${meta['unit']})',
        labelStyle: const TextStyle(fontSize: 10, color: AppColors.textMuted),
        hintText: meta['hint'],
        hintStyle: const TextStyle(fontSize: 12, color: AppColors.textMuted),
        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      ),
    );
  }

  // ─── Results ───────────────────────────────────────────────────────────────

  Widget _buildResults(Map<String, dynamic> result) {
    final analysis = result['analysis'] as Map<String, dynamic>? ?? {};
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.accent.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(Icons.bar_chart_rounded, color: AppColors.accent, size: 18),
        ),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(analysis.isEmpty ? 'No metrics found' : 'Analysis Results',
              style: const TextStyle(fontSize: 15,
                  fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          Text(result['filename']?.toString() ?? '',
              style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
        ])),
      ]),
      const SizedBox(height: 14),

      if (analysis.isEmpty)
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.warning.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.warning.withValues(alpha: 0.2)),
          ),
          child: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('No standard metrics extracted',
                style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.warning)),
            SizedBox(height: 6),
            Text('Switch to Manual Entry tab and type the values from your report.',
                style: TextStyle(fontSize: 12, color: AppColors.textSecond, height: 1.5)),
          ]),
        )
      else
        ...analysis.entries.map((e) => _markerCard(e.value as Map<String, dynamic>)),

      if ((result['summary'] as String? ?? '').isNotEmpty) ...[
        const SizedBox(height: 14),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.bgCard,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.accent.withValues(alpha: 0.2)),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Row(children: [
              Icon(Icons.lightbulb_outline_rounded, color: AppColors.accent, size: 16),
              SizedBox(width: 8),
              Text('Clinical Summary', style: TextStyle(
                  fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.accent)),
            ]),
            const SizedBox(height: 10),
            Text(
              (result['summary'] as String)
                  .replaceAll(RegExp(r'#{1,4} '), '')
                  .replaceAll('**', '').replaceAll('*', '').trim(),
              style: const TextStyle(fontSize: 12, color: AppColors.textSecond, height: 1.6),
            ),
          ]),
        ),
      ],
    ]);
  }

  Widget _markerCard(Map<String, dynamic> item) {
    final status = item['status']?.toString() ?? 'Unknown';
    final color = _statusColor(status);
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.bgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(item['marker_name']?.toString() ?? '',
              style: const TextStyle(fontWeight: FontWeight.bold,
                  fontSize: 13, color: AppColors.textPrimary)),
          const SizedBox(height: 3),
          Text(item['interpretation']?.toString() ?? '',
              style: const TextStyle(fontSize: 11, color: AppColors.textSecond, height: 1.4)),
        ])),
        const SizedBox(width: 10),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          RichText(text: TextSpan(children: [
            TextSpan(text: '${item['value'] ?? '--'}',
                style: const TextStyle(fontWeight: FontWeight.bold,
                    fontSize: 16, color: AppColors.textPrimary)),
            TextSpan(text: ' ${item['unit'] ?? ''}',
                style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
          ])),
          const SizedBox(height: 5),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
                color: _statusBg(status), borderRadius: BorderRadius.circular(20)),
            child: Text(status, style: TextStyle(
                fontSize: 10, fontWeight: FontWeight.bold, color: color)),
          ),
        ]),
      ]),
    );
  }

  Widget _buildHistory() {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('Past Reports', style: TextStyle(
          fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
      const SizedBox(height: 10),
      ..._history.take(5).map((doc) {
        final count = (doc['extracted_values'] as Map? ?? {}).length;
        final isActive = _result?['id'] == doc['id'];
        return GestureDetector(
          onTap: () => setState(() => _result = Map<String, dynamic>.from(doc)),
          child: Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: isActive ? AppColors.accent.withValues(alpha: 0.08) : AppColors.bgCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: isActive ? AppColors.accent : AppColors.border),
            ),
            child: Row(children: [
              const Icon(Icons.description_outlined, color: AppColors.accent, size: 18),
              const SizedBox(width: 10),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(doc['filename']?.toString() ?? 'Report',
                    maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 13,
                        fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                Text(doc['timestamp']?.toString().substring(0, 10) ?? '',
                    style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
              ])),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: count > 0
                      ? AppColors.accent.withValues(alpha: 0.12)
                      : AppColors.border,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(count > 0 ? '$count markers' : 'No metrics',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold,
                        color: count > 0 ? AppColors.accent : AppColors.textMuted)),
              ),
            ]),
          ),
        );
      }),
    ]);
  }

  Widget _errorBanner(String msg) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.danger.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.danger.withValues(alpha: 0.3)),
      ),
      child: Row(children: [
        const Icon(Icons.error_outline_rounded, color: AppColors.danger, size: 16),
        const SizedBox(width: 8),
        Expanded(child: Text(msg, style: const TextStyle(
            fontSize: 12, color: AppColors.danger, height: 1.4))),
      ]),
    );
  }
}

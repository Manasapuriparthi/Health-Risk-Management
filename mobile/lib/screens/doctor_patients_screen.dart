import 'package:flutter/material.dart';

class DoctorPatientsScreen extends StatelessWidget {
  const DoctorPatientsScreen({super.key});

  // Mock patient health database
  final List<Map<String, dynamic>> _patients = const [
    {
      'name': 'Marcus Vance',
      'age': '52 yrs',
      'score': 85,
      'bp': '128/82 mmHg',
      'sugar': '104 mg/dL',
      'heart': '72 bpm',
      'risk': 'Low Risk',
      'riskColor': Color(0xFF10B981)
    },
    {
      'name': 'Sarah Jenkins',
      'age': '29 yrs',
      'score': 92,
      'bp': '115/70 mmHg',
      'sugar': '95 mg/dL',
      'heart': '68 bpm',
      'risk': 'Optimal',
      'riskColor': Color(0xFF10B981)
    },
    {
      'name': 'David Miller',
      'age': '41 yrs',
      'score': 62,
      'bp': '142/90 mmHg',
      'sugar': '145 mg/dL',
      'heart': '84 bpm',
      'risk': 'Moderate Risk',
      'riskColor': Color(0xFFF59E0B)
    },
    {
      'name': 'Richard Roe',
      'age': '65 yrs',
      'score': 45,
      'bp': '158/95 mmHg',
      'sugar': '182 mg/dL',
      'heart': '91 bpm',
      'risk': 'High Risk',
      'riskColor': Color(0xFFEF4444)
    }
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: const Text('Clinical Patients', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF111827))),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(20.0),
        itemCount: _patients.length,
        itemBuilder: (context, index) {
          final patient = _patients[index];
          final int score = patient['score'];
          
          Color scoreColor;
          if (score >= 80) {
            scoreColor = const Color(0xFF10B981);
          } else if (score >= 60) {
            scoreColor = const Color(0xFFF59E0B);
          } else {
            scoreColor = const Color(0xFFEF4444);
          }

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
                )
              ],
            ),
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                // Top header: Name, Age and Health Score Circular meter
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          patient['name'],
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF111827)),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Age: ${patient['age']} • ${patient['risk']}',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: patient['riskColor'],
                          ),
                        ),
                      ],
                    ),
                    
                    // Circular Health Score indicator
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        SizedBox(
                          width: 44,
                          height: 44,
                          child: CircularProgressIndicator(
                            value: score / 100.0,
                            strokeWidth: 4,
                            backgroundColor: const Color(0xFFE5E7EB),
                            valueColor: AlwaysStoppedAnimation<Color>(scoreColor),
                          ),
                        ),
                        Text(
                          '$score',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF111827)),
                        )
                      ],
                    )
                  ],
                ),
                
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 12.0),
                  child: Divider(color: Color(0xFFF3F4F6)),
                ),

                // Metrics Row: BP, Sugar, Heart Rate
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildMetricWidget('Blood Pressure', patient['bp'], Icons.monitor_heart_outlined),
                    _buildMetricWidget('Blood Sugar', patient['sugar'], Icons.bloodtype_outlined),
                    _buildMetricWidget('Heart Rate', patient['heart'], Icons.favorite_border_rounded),
                  ],
                )
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildMetricWidget(String label, String value, IconData icon) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 14, color: const Color(0xFF9CA3AF)),
            const SizedBox(width: 4),
            Text(label, style: const TextStyle(fontSize: 10, color: Color(0xFF9CA3AF), fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF374151))),
      ],
    );
  }
}

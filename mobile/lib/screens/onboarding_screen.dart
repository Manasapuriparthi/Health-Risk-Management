import 'package:flutter/material.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentIndex = 0;

  final List<Map<String, String>> _slides = [
    {
      'title': 'Smart Report Analysis',
      'description': 'Upload medical report PDFs or text transcripts. Our natural language pipeline automatically parses biomarkers and logs reference limits.',
      'icon': '📄',
    },
    {
      'title': 'Physiological ML Models',
      'description': 'Input physiological variables like BMI, blood sugar, and active minutes. Our classifiers evaluate cardiorespiratory and diabetic risk factors.',
      'icon': '🧬',
    },
    {
      'title': 'Personalized Care Planners',
      'description': 'Check medication databases for drug-drug contraindications. Access customized diet and workout routines safely mapped to your vitals.',
      'icon': '🥗',
    }
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pushReplacementNamed('/login'),
            child: const Text(
              'Skip',
              style: TextStyle(
                color: Color(0xFF6B7280),
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: PageView.builder(
              controller: _pageController,
              onPageChanged: (index) {
                setState(() {
                  _currentIndex = index;
                });
              },
              itemCount: _slides.length,
              itemBuilder: (context, index) {
                final slide = _slides[index];
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 140,
                        height: 140,
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withValues(alpha: 0.06),
                          shape: BoxShape.circle,
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          slide['icon']!,
                          style: const TextStyle(fontSize: 60),
                        ),
                      ),
                      const SizedBox(height: 40),
                      Text(
                        slide['title']!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF111827),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        slide['description']!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 14,
                          color: Color(0xFF6B7280),
                          height: 1.6,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: List.generate(
                    _slides.length,
                    (index) => Container(
                      margin: const EdgeInsets.only(right: 6),
                      width: _currentIndex == index ? 24 : 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: _currentIndex == index ? const Color(0xFF10B981) : const Color(0xFFE5E7EB),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
                ),
                ElevatedButton(
                  onPressed: () {
                    if (_currentIndex < _slides.length - 1) {
                      _pageController.nextPage(
                        duration: const Duration(milliseconds: 300),
                        curve: Curves.easeIn,
                      );
                    } else {
                      Navigator.of(context).pushReplacementNamed('/login');
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                  ),
                  child: Text(
                    _currentIndex == _slides.length - 1 ? 'Get Started' : 'Next',
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

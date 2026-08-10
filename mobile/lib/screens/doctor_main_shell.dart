import 'package:flutter/material.dart';
import 'doctor_dashboard_screen.dart';
import 'doctor_patients_screen.dart';
import 'profile_screen.dart';

class DoctorMainShell extends StatefulWidget {
  const DoctorMainShell({super.key});

  @override
  State<DoctorMainShell> createState() => _DoctorMainShellState();
}

class _DoctorMainShellState extends State<DoctorMainShell> {
  int _selectedIndex = 0;

  final List<Widget> _screens = [
    const DoctorDashboardScreen(),
    const DoctorPatientsScreen(),
    const ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.white,
        selectedItemColor: const Color(0xFF10B981),
        unselectedItemColor: const Color(0xFF9CA3AF),
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
        unselectedLabelStyle: const TextStyle(fontSize: 12),
        elevation: 8,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard_rounded),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.people_outline_rounded),
            activeIcon: Icon(Icons.people_rounded),
            label: 'Patients',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings_outlined),
            activeIcon: Icon(Icons.settings_rounded),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

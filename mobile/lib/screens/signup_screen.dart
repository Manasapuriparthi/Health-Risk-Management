import 'package:flutter/material.dart';
import '../main.dart';
import '../services/api_service.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _ageController = TextEditingController();
  final _weightController = TextEditingController();
  final _heightController = TextEditingController();
  String _selectedRole = 'patient';
  String _selectedSpecialty = 'General Physician';
  bool _obscurePassword = true;
  bool _isLoading = false;

  final List<String> _specialties = [
    'General Physician',
    'Cardiologist',
    'Dermatologist',
    'Orthopedic Specialist',
    'Neurologist',
    'Endocrinologist',
    'Pulmonologist',
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _ageController.dispose();
    _weightController.dispose();
    _heightController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    try {
      await ApiService.register(
        username: _nameController.text.trim(),
        email: _emailController.text.trim(),
        password: _passwordController.text,
        role: _selectedRole,
        age: _ageController.text.isNotEmpty ? int.tryParse(_ageController.text) : null,
        weight: _weightController.text.isNotEmpty ? double.tryParse(_weightController.text) : null,
        height: _heightController.text.isNotEmpty ? double.tryParse(_heightController.text) : null,
        specialty: _selectedRole == 'doctor' ? _selectedSpecialty : null,
      );
      if (!mounted) return;
      Navigator.of(context).pushNamedAndRemoveUntil(
        _selectedRole == 'doctor' ? '/doctor_home' : '/home',
        (route) => false,
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      _showError(e.message);
    } catch (_) {
      if (!mounted) return;
      _showError('Unable to connect. Make sure the server is running.');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showError(String msg) {
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
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 10.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Create Profile',
                  style: TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF111827),
                  ),
                ),
                const Text(
                  'Register your physiological markers',
                  style: TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
                ),
                const SizedBox(height: 20),

                // Role toggle
                Row(
                  children: ['patient', 'doctor'].map((role) {
                    final isSelected = _selectedRole == role;
                    return Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _selectedRole = role),
                        child: Container(
                          margin: EdgeInsets.only(right: role == 'patient' ? 6 : 0, left: role == 'doctor' ? 6 : 0),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            color: isSelected ? const Color(0xFF10B981) : const Color(0xFFF3F4F6),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            role == 'patient' ? 'Patient' : 'Doctor',
                            style: TextStyle(
                              color: isSelected ? Colors.white : const Color(0xFF4B5563),
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 24),

                // Full Name
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: 'Full Name',
                    hintText: 'John Doe',
                    prefixIcon: Icon(Icons.person_outline_rounded, color: Color(0xFF9CA3AF)),
                  ),
                  validator: (v) => (v == null || v.isEmpty) ? 'Please enter name' : null,
                ),
                const SizedBox(height: 16),

                // Email
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: 'Email Address',
                    hintText: 'john@example.com',
                    prefixIcon: Icon(Icons.email_outlined, color: Color(0xFF9CA3AF)),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Please enter email';
                    if (!v.contains('@')) return 'Enter a valid email';
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Password
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  decoration: InputDecoration(
                    labelText: 'Password',
                    hintText: '••••••••',
                    prefixIcon: const Icon(Icons.lock_outline_rounded, color: Color(0xFF9CA3AF)),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                        color: const Color(0xFF9CA3AF),
                      ),
                      onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                    ),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Please enter password';
                    if (v.length < 6) return 'Password must be at least 6 characters';
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Patient-specific fields
                if (_selectedRole == 'patient') ...[
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _ageController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(labelText: 'Age (yrs)', hintText: '30'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextFormField(
                          controller: _weightController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(labelText: 'Weight (kg)', hintText: '70'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _heightController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Height (cm)',
                      hintText: '170',
                      prefixIcon: Icon(Icons.height_rounded, color: Color(0xFF9CA3AF)),
                    ),
                  ),
                ] else ...[
                  // Doctor-specific fields
                  DropdownButtonFormField<String>(
                    value: _selectedSpecialty,
                    decoration: const InputDecoration(
                      labelText: 'Specialization',
                      prefixIcon: Icon(Icons.medical_services_outlined, color: Color(0xFF9CA3AF)),
                    ),
                    items: _specialties
                        .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                        .toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => _selectedSpecialty = val);
                    },
                  ),
                ],

                const SizedBox(height: 30),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleRegister,
                    child: _isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                          )
                        : const Text('Register Profile'),
                  ),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

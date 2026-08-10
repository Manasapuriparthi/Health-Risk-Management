import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/splash_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/login_screen.dart';
import 'screens/signup_screen.dart';
import 'screens/main_shell.dart';
import 'screens/doctor_main_shell.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: Color(0xFF0D1117),
    systemNavigationBarIconBrightness: Brightness.light,
  ));
  runApp(const VitalPredictApp());
}

// ─── Design Tokens ────────────────────────────────────────────────────────────
class AppColors {
  static const bgPrimary    = Color(0xFF0A0F1E);
  static const bgCard       = Color(0xFF111827);
  static const bgCardAlt    = Color(0xFF141F35);
  static const accent       = Color(0xFF10B981);
  static const accentDark   = Color(0xFF059669);
  static const accentIndigo = Color(0xFF6366F1);
  static const textPrimary  = Color(0xFFF1F5F9);
  static const textSecond   = Color(0xFF94A3B8);
  static const textMuted    = Color(0xFF64748B);
  static const border       = Color(0x12FFFFFF);
  static const danger       = Color(0xFFEF4444);
  static const warning      = Color(0xFFF59E0B);
}

class VitalPredictApp extends StatelessWidget {
  const VitalPredictApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'VitalPredict',
      debugShowCheckedModeBanner: false,
      theme: _buildTheme(context),
      initialRoute: '/splash',
      routes: {
        '/splash':      (c) => const SplashScreen(),
        '/onboarding':  (c) => const OnboardingScreen(),
        '/login':       (c) => const LoginScreen(),
        '/signup':      (c) => const SignupScreen(),
        '/home':        (c) => const MainShell(),
        '/doctor_home': (c) => const DoctorMainShell(),
      },
    );
  }

  ThemeData _buildTheme(BuildContext context) {
    final base = GoogleFonts.outfitTextTheme(
      ThemeData.dark().textTheme,
    ).apply(
      bodyColor: AppColors.textPrimary,
      displayColor: AppColors.textPrimary,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.bgPrimary,
      primaryColor: AppColors.accent,
      colorScheme: const ColorScheme.dark(
        primary:   AppColors.accent,
        secondary: AppColors.accentIndigo,
        surface:   AppColors.bgCard,
        error:     AppColors.danger,
      ),
      textTheme: base,

      // AppBar
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.bgPrimary,
        elevation: 0,
        scrolledUnderElevation: 0,
        systemOverlayStyle: SystemUiOverlayStyle.light,
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
        titleTextStyle: GoogleFonts.outfit(
          color: AppColors.textPrimary,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),

      // Bottom Nav
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Color(0xFF0D1117),
        selectedItemColor: AppColors.accent,
        unselectedItemColor: AppColors.textMuted,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
        selectedLabelStyle: TextStyle(fontWeight: FontWeight.bold, fontSize: 10),
        unselectedLabelStyle: TextStyle(fontSize: 10),
      ),

      // Elevated Button
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.accent,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold),
        ),
      ),

      // Outlined Button
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.accent,
          side: const BorderSide(color: AppColors.accent),
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold),
        ),
      ),

      // Text Button
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.accent,
          textStyle: GoogleFonts.outfit(fontWeight: FontWeight.w600),
        ),
      ),

      // Input / Form fields
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.bgCardAlt,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.accent, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.danger),
        ),
        labelStyle: GoogleFonts.outfit(color: AppColors.textSecond),
        hintStyle: GoogleFonts.outfit(color: AppColors.textMuted),
      ),

      // Card
      cardTheme: CardThemeData(
        color: AppColors.bgCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.border),
        ),
      ),

      // Divider
      dividerTheme: const DividerThemeData(
        color: AppColors.border,
        thickness: 1,
      ),

      // Checkbox / Switch
      checkboxTheme: CheckboxThemeData(
        fillColor: WidgetStateProperty.resolveWith(
          (s) => s.contains(WidgetState.selected) ? AppColors.accent : Colors.transparent,
        ),
        side: const BorderSide(color: AppColors.textMuted),
      ),

      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith(
          (s) => s.contains(WidgetState.selected) ? AppColors.accent : AppColors.textMuted,
        ),
        trackColor: WidgetStateProperty.resolveWith(
          (s) => s.contains(WidgetState.selected)
              ? AppColors.accent.withValues(alpha: 0.4)
              : AppColors.border,
        ),
      ),

      // Slider
      sliderTheme: SliderThemeData(
        activeTrackColor: AppColors.accent,
        inactiveTrackColor: AppColors.border,
        thumbColor: AppColors.accent,
        overlayColor: AppColors.accent.withValues(alpha: 0.15),
        valueIndicatorColor: AppColors.accent,
        valueIndicatorTextStyle: GoogleFonts.outfit(color: Colors.white),
      ),

      // Progress indicator
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: AppColors.accent,
        linearTrackColor: AppColors.border,
      ),

      // Icon
      iconTheme: const IconThemeData(color: AppColors.textSecond),
    );
  }
}

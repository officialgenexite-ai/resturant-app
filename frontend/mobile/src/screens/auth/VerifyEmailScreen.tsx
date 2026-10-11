import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import type { ApiError } from "../../api/axiosInstance";
import type { RootStackParamList } from "../../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "VerifyEmail">;

const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyEmailScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const { verifyEmail, resendVerificationCode } = useAuth();

  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cooldown]);

  async function handleVerify(): Promise<void> {
    if (!code || code.length !== 6) {
      Alert.alert("Invalid code", "Please enter a 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      await verifyEmail({ email, code: code.trim() });
      Alert.alert("Success", "Email verified successfully! You will now be logged in.");
      // AuthContext will handle navigation to Home screen
    } catch (error) {
      const apiError = error as ApiError;
      Alert.alert(
        "Verification Failed",
        apiError.friendlyMessage || "Invalid or expired code."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend(): Promise<void> {
    if (cooldown > 0 || resending) return;

    setResending(true);
    try {
      await resendVerificationCode({ email });
      Alert.alert("Code Sent", "A new verification code has been sent to your email.");
      setCode("");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      const apiError = error as ApiError;
      Alert.alert(
        "Resend Failed",
        apiError.friendlyMessage || "Could not resend the code. Please try again."
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Verify Email</Text>

          <Text style={styles.subtitle}>We've sent a 6-digit code to:</Text>
          <Text style={styles.email}>{email}</Text>

          <Text style={styles.label}>Enter verification code:</Text>
          <TextInput
            style={styles.codeInput}
            placeholder="000000"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            placeholderTextColor="#ccc"
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Didn't receive the code?</Text>

            <TouchableOpacity
              onPress={handleResend}
              disabled={cooldown > 0 || resending}
            >
              {resending ? (
                <ActivityIndicator size="small" color="#f97316" />
              ) : (
                <Text
                  style={[
                    styles.resendLink,
                    cooldown > 0 && styles.resendLinkDisabled,
                  ]}
                >
                  {cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend Code"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12 }}>
              <Text style={styles.changeEmailLink}>Use a different email</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 24 },
  content: { alignItems: "center" },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
    color: "#1a1a1a",
  },
  subtitle: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 8 },
  email: { fontSize: 16, fontWeight: "600", color: "#f97316", marginBottom: 24 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 12,
    alignSelf: "flex-start",
    width: "100%",
  },
  codeInput: {
    borderWidth: 2,
    borderColor: "#f97316",
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    letterSpacing: 4,
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "600",
    width: "100%",
  },
  button: {
    backgroundColor: "#f97316",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    width: "100%",
    marginBottom: 24,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  footer: { alignItems: "center", marginTop: 16 },
  footerText: { fontSize: 14, color: "#666", marginBottom: 8 },
  resendLink: { fontSize: 14, color: "#f97316", fontWeight: "600" },
  resendLinkDisabled: { color: "#999" },
  changeEmailLink: { fontSize: 13, color: "#999", textDecorationLine: "underline" },
});

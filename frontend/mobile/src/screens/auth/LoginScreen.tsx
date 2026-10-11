import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import type { ApiError } from "../../api/axiosInstance";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import { GoogleSigninButton } from "@react-native-google-signin/google-signin";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const { login, googleSignIn } = useAuth(); // googleSignIn کو بھی یہیں سے آؤٹ پٹ یا امپورٹ کیا گیا ہو گا

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);

  async function handleLogin(): Promise<void> {
    if (!email || !password) {
      Alert.alert("Missing fields", "Please enter email and password.");
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
    } catch (error) {
      const apiError = error as ApiError;
      Alert.alert(
        "Login Failed",
        apiError.friendlyMessage || "Invalid credentials."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn(): Promise<void> {
    setGoogleLoading(true);
    try {
      await googleSignIn();
    } catch (error: any) {
      console.log("Google sign-in error:", error);
      const message =
        error?.friendlyMessage ||
        (error?.code === "SIGN_IN_CANCELLED"
          ? "Sign-in cancelled"
          : "Google sign-in failed. Please try again.");
      Alert.alert("Google Sign-In Failed", message);
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={styles.linkText}>Don't have an account? Register</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <GoogleSigninButton
        style={styles.googleButton}
        size={GoogleSigninButton.Size.Wide}
        color={GoogleSigninButton.Color.Light}
        onPress={handleGoogleSignIn}
        disabled={googleLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
    color: "#1a1a1a",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
    fontSize: 15,
  },
  button: {
    backgroundColor: "#f97316",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  linkText: {
    textAlign: "center",
    marginTop: 18,
    color: "#f97316",
    fontSize: 14,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#ddd" },
  dividerText: { marginHorizontal: 12, color: "#999", fontSize: 13 },
  googleButton: { width: "100%", height: 48, marginTop: 10 },
});
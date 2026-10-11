import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";

const ADMIN_DASHBOARD_URL = "https://mobile-apps-herr.vercel.app/admin/login"; // update to production URL later

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  function handleLogout(): void {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.infoCard}>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
      </View>

      {user?.role === "admin" && (
        <TouchableOpacity
          style={styles.adminButton}
          onPress={() => Linking.openURL(ADMIN_DASHBOARD_URL)}
        >
          <Text style={styles.adminButtonText}>Open Admin Dashboard</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 20, fontWeight: "700", color: "#1a1a1a", marginBottom: 20 },
  infoCard: { backgroundColor: "#fafafa", borderRadius: 12, padding: 16, marginBottom: 20 },
  name: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  email: { fontSize: 13, color: "#666", marginTop: 4 },
  phone: { fontSize: 13, color: "#666", marginTop: 2 },
  adminButton: { backgroundColor: "#1a1a1a", borderRadius: 10, padding: 14, alignItems: "center", marginBottom: 12 },
  adminButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  logoutButton: { borderWidth: 1, borderColor: "#dc2626", borderRadius: 10, padding: 14, alignItems: "center" },
  logoutButtonText: { color: "#dc2626", fontWeight: "700", fontSize: 13 },
});

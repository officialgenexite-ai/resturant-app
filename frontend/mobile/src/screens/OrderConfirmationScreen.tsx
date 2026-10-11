import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "OrderConfirmation">;

export default function OrderConfirmationScreen({ navigation, route }: Props) {
  const { order } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark" size={40} color="#fff" />
        </View>

        <Text style={styles.title}>Order Placed!</Text>
        <Text style={styles.subtitle}>
          {order.paymentMethod === "JazzCash"
            ? "We're verifying your payment. You'll be notified once confirmed."
            : "Your order is being prepared."}
        </Text>

        <View style={styles.orderCard}>
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Order ID</Text>
            <Text style={styles.orderValue}>#{order._id.slice(-8).toUpperCase()}</Text>
          </View>
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Payment</Text>
            <Text style={styles.orderValue}>{order.paymentMethod}</Text>
          </View>
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Status</Text>
            <Text style={styles.orderValue}>{order.status}</Text>
          </View>
          <View style={[styles.orderRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>Rs. {order.total}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] })}
        >
          <Text style={styles.buttonText}>Back to Menu</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#22c55e",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: "700", color: "#1a1a1a" },
  subtitle: { fontSize: 13, color: "#888", textAlign: "center", marginTop: 8, paddingHorizontal: 20 },
  orderCard: {
    width: "100%",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginTop: 28,
  },
  orderRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  orderLabel: { fontSize: 13, color: "#666" },
  orderValue: { fontSize: 13, fontWeight: "600", color: "#1a1a1a" },
  totalRow: { marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#eee", marginBottom: 0 },
  totalLabel: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  totalValue: { fontSize: 15, fontWeight: "700", color: "#f97316" },
  button: {
    marginTop: 32,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});

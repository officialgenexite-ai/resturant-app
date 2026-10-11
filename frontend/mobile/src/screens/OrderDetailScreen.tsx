import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getStatusColor } from "../utils/orderStatus";
import type { RootStackParamList } from "../navigation/AppNavigator";
import type { OrderItem } from "../types/order.types";

type Props = NativeStackScreenProps<RootStackParamList, "OrderDetail">;

export default function OrderDetailScreen({ navigation, route }: Props) {
  const { order } = route.params;

  function renderItem({ item }: { item: OrderItem }) {
    return (
      <View style={styles.itemRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          {item.variantName && <Text style={styles.itemVariant}>{item.variantName}</Text>}
        </View>
        <Text style={styles.itemQty}>x{item.quantity}</Text>
        <Text style={styles.itemPrice}>Rs. {item.unitPrice * item.quantity}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order._id.slice(-8).toUpperCase()}</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.statusSection}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + "20" }]}>
          <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status}</Text>
        </View>
        {order.status === "Preparing" && order.estimatedDeliveryMinutes && (
          <Text style={styles.etaText}>Estimated delivery: ~{order.estimatedDeliveryMinutes} minutes</Text>
        )}
        {order.paymentMethod === "JazzCash" && order.paymentStatus === "pending_verification" && (
          <Text style={styles.verifyingText}>We're still verifying your payment.</Text>
        )}
      </View>

      <FlatList
        data={order.items}
        keyExtractor={(item, index) => `${item.productId}-${index}`}
        renderItem={renderItem}
        contentContainerStyle={styles.itemsList}
        ListHeaderComponent={<Text style={styles.sectionLabel}>Items</Text>}
        ListFooterComponent={
          <>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>Rs. {order.subtotal}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery fee</Text>
              <Text style={styles.summaryValue}>Rs. {order.deliveryFee}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>Rs. {order.total}</Text>
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Delivery Address</Text>
            <Text style={styles.addressText}>
              {order.deliveryAddress.streetDetail}, {order.deliveryAddress.area}
            </Text>
            {order.deliveryAddress.landmark ? (
              <Text style={styles.addressSubText}>{order.deliveryAddress.landmark}</Text>
            ) : null}
            <Text style={styles.addressSubText}>{order.deliveryAddress.phone}</Text>

            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Payment</Text>
            <Text style={styles.addressText}>{order.paymentMethod}</Text>
          </>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  statusSection: { paddingHorizontal: 16, paddingBottom: 12 },
  statusBadge: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  statusText: { fontSize: 12, fontWeight: "700" },
  etaText: { fontSize: 13, color: "#3b82f6", fontWeight: "600", marginTop: 8 },
  verifyingText: { fontSize: 12, color: "#f59e0b", marginTop: 6 },
  itemsList: { paddingHorizontal: 16, paddingBottom: 30 },
  sectionLabel: { fontSize: 14, fontWeight: "700", color: "#1a1a1a", marginBottom: 10 },
  itemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f2f2f2" },
  itemTitle: { fontSize: 14, color: "#1a1a1a", fontWeight: "600" },
  itemVariant: { fontSize: 12, color: "#888" },
  itemQty: { fontSize: 13, color: "#666", marginHorizontal: 10 },
  itemPrice: { fontSize: 13, fontWeight: "700", color: "#1a1a1a" },
  divider: { height: 1, backgroundColor: "#f2f2f2", marginVertical: 12 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  summaryLabel: { fontSize: 13, color: "#666" },
  summaryValue: { fontSize: 13, color: "#1a1a1a", fontWeight: "600" },
  totalRow: { marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#f2f2f2" },
  totalLabel: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  totalValue: { fontSize: 15, fontWeight: "700", color: "#f97316" },
  addressText: { fontSize: 13, color: "#1a1a1a" },
  addressSubText: { fontSize: 12, color: "#888", marginTop: 2 },
});

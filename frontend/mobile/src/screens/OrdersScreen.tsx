import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { fetchMyOrders } from "../api/orderApi";
import { getStatusColor } from "../utils/orderStatus";
import type { Order } from "../types/order.types";
import type { RootStackParamList } from "../navigation/AppNavigator";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function OrdersScreen() {
  const navigation = useNavigation<NavProp>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadOrders = useCallback(async (isManual: boolean) => {
    try {
      const data = await fetchMyOrders();
      setOrders(data);
    } catch (error) {
      console.log("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  // Refresh every time the Orders tab comes into focus (e.g. after placing a new order)
  useFocusEffect(
    useCallback(() => {
      loadOrders(false);
    }, [loadOrders])
  );

  function handleRefresh(): void {
    setRefreshing(true);
    loadOrders(true);
  }

  function renderOrder({ item }: { item: Order }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("OrderDetail", { order: item })}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>#{item._id.slice(-8).toUpperCase()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.itemsSummary}>
          {item.items.length} item{item.items.length > 1 ? "s" : ""} • Rs. {item.total}
        </Text>
        {item.status === "Preparing" && item.estimatedDeliveryMinutes && (
          <Text style={styles.etaText}>Estimated delivery: ~{item.estimatedDeliveryMinutes} minutes</Text>
        )}
        <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleString()}</Text>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#f97316" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Your Orders</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#f97316"]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>You haven't placed any orders yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "700", color: "#1a1a1a", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { backgroundColor: "#fafafa", borderRadius: 12, padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  orderId: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: "700" },
  itemsSummary: { fontSize: 13, color: "#555" },
  etaText: { fontSize: 12, color: "#3b82f6", fontWeight: "600", marginTop: 4 },
  dateText: { fontSize: 11, color: "#999", marginTop: 6 },
  emptyContainer: { alignItems: "center", marginTop: 80 },
  emptyText: { color: "#999", fontSize: 14 },
});

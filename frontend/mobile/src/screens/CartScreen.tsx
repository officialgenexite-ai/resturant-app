import React from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCart } from "../context/CartContext";
import type { CartLineItem } from "../types/cart.types";
import type { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Cart">;

const DELIVERY_FEE = 100;

export default function CartScreen({ navigation }: Props) {
  const { items, cartTotal, updateQuantity, removeItem, clearCart } = useCart();
  const insets = useSafeAreaInsets();

  const grandTotal = cartTotal + (items.length > 0 ? DELIVERY_FEE : 0);

  function handleCheckout(): void {
  navigation.navigate("Checkout");
}

  function handleClearCart(): void {
    Alert.alert("Clear cart", "Remove all items from your cart?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: clearCart },
    ]);
  }


 function renderItem({ item }: { item: CartLineItem }) {
  return (
    <View style={styles.itemCard}>
      <Image source={{ uri: item.image }} style={styles.itemImage} />
      <View style={styles.itemContent}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
          {item.variantName && <Text style={styles.itemVariant}>{item.variantName}</Text>}
          <Text style={styles.itemPrice}>Rs. {item.unitPrice}</Text>
        </View>
        <View style={styles.stepper}>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => updateQuantity(item.lineId, item.quantity - 1)}
          >
            <Ionicons name={item.quantity === 1 ? "trash-outline" : "remove"} size={14} color="#f97316" />
          </TouchableOpacity>
          <Text style={styles.stepperValue}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => updateQuantity(item.lineId, item.quantity + 1)}
          >
            <Ionicons name="add" size={14} color="#f97316" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your cart</Text>
        {items.length > 0 ? (
          <TouchableOpacity onPress={handleClearCart}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <TouchableOpacity style={styles.browseButton} onPress={() => navigation.goBack()}>
            <Text style={styles.browseButtonText}>Browse menu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => item.lineId}
            renderItem={renderItem}
            style={{ flex: 1 }}
            contentContainerStyle={styles.list}
          />

          <View style={[styles.summary, { paddingBottom: 24 + insets.bottom }]}> 
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>Rs. {cartTotal}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery fee</Text>
              <Text style={styles.summaryValue}>Rs. {DELIVERY_FEE}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotalRow]}>
              <Text style={styles.summaryTotalLabel}>Total</Text>
              <Text style={styles.summaryTotalValue}>Rs. {grandTotal}</Text>
            </View>

            <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout} activeOpacity={0.9}>
              <Text style={styles.checkoutButtonText}>Proceed to checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  clearText: { fontSize: 13, color: "#dc2626", fontWeight: "600" },

  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10 },
  emptyText: { fontSize: 14, color: "#999" },
  browseButton: {
    marginTop: 8,
    backgroundColor: "#f97316",
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  browseButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },

list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
itemCard: {
  flexDirection: "row",
  backgroundColor: "#fafafa",
  borderRadius: 14,
  padding: 10,
  marginBottom: 12,
  gap: 12,
},
itemImage: { width: 100, height: 100, borderRadius: 12, backgroundColor: "#f2f2f2" },
itemContent: {
  flex: 1,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-end",
},
itemTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
itemVariant: { fontSize: 12, color: "#888", marginTop: 3 },
itemPrice: { fontSize: 14, fontWeight: "700", color: "#f97316", marginTop: 8 },

  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#f97316",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  stepperButton: { padding: 2 },
  stepperValue: { fontSize: 13, fontWeight: "700", color: "#1a1a1a", minWidth: 14, textAlign: "center" },

  summary: {
    borderTopWidth: 1,
    borderTopColor: "#f2f2f2",
    padding: 16,
    paddingBottom: 24,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  summaryLabel: { fontSize: 13, color: "#666" },
  summaryValue: { fontSize: 13, color: "#1a1a1a", fontWeight: "600" },
  summaryTotalRow: { marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#f2f2f2" },
  summaryTotalLabel: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  summaryTotalValue: { fontSize: 15, fontWeight: "700", color: "#f97316" },

  checkoutButton: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
  },
  checkoutButtonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});

import React, { useState } from "react";
import { pickPaymentScreenshot } from "../utils/imagePicker";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCart } from "../context/CartContext";
import { placeOrder } from "../api/orderApi";
import { MULTAN_AREAS, DELIVERY_FEE, JAZZCASH_ACCOUNT } from "../constants/config";
import type { RootStackParamList } from "../navigation/AppNavigator";
import type { ApiError } from "../api/axiosInstance";

type Props = NativeStackScreenProps<RootStackParamList, "Checkout">;

type PaymentMethod = "COD" | "JazzCash";

export default function CheckoutScreen({ navigation }: Props) {
  const { items, cartTotal, clearCart } = useCart();

  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [streetDetail, setStreetDetail] = useState<string>("");
  const [landmark, setLandmark] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [placing, setPlacing] = useState<boolean>(false);
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [pickingImage, setPickingImage] = useState<boolean>(false);

  async function handlePickScreenshot(): Promise<void> {
    setPickingImage(true);
    try {
      const base64 = await pickPaymentScreenshot();
      if (base64) {
        setScreenshotBase64(base64);
      }
    } catch (error: any) {
      Alert.alert("Permission Needed", error.message || "Could not access gallery.");
    } finally {
      setPickingImage(false);
    }
  }

  const grandTotal = cartTotal + DELIVERY_FEE;

  function validate(): string | null {
    if (!selectedArea) return "Please select your delivery area";
    if (streetDetail.trim().length < 3) return "Please provide house/street details";
    if (!phone.trim()) return "Please provide a phone number";
    if (paymentMethod === "JazzCash") {
      if (transactionId.trim().length < 4) return "Please enter a valid JazzCash Transaction ID";
      if (!screenshotBase64) return "Please upload your payment screenshot";
    }
    return null;
  }

  async function handlePlaceOrder(): Promise<void> {
    const validationError = validate();
    if (validationError) {
      Alert.alert("Missing information", validationError);
      return;
    }

    setPlacing(true);
    try {
      const order = await placeOrder({
        items: items.map((line) => ({
          productId: line.productId,
          variantName: line.variantName,
          quantity: line.quantity,
        })),
        area: selectedArea as string,
        streetDetail: streetDetail.trim(),
        landmark: landmark.trim() || undefined,
        phone: phone.trim(),
        paymentMethod,
        transactionId: paymentMethod === "JazzCash" ? transactionId.trim() : undefined,
        paymentScreenshotBase64: paymentMethod === "JazzCash" ? screenshotBase64 || undefined : undefined,
      });
      clearCart();
      navigation.replace("OrderConfirmation", { order });
    } catch (error) {
      const apiError = error as ApiError;
      Alert.alert("Order Failed", apiError.friendlyMessage || "Could not place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Delivery Address */}
          <Text style={styles.sectionLabel}>Delivery Address</Text>

          <Text style={styles.fieldLabel}>Area</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.areaScroll}>
            {MULTAN_AREAS.map((area) => (
              <TouchableOpacity
                key={area}
                style={[styles.areaChip, selectedArea === area && styles.areaChipSelected]}
                onPress={() => setSelectedArea(area)}
              >
                <Text style={[styles.areaChipText, selectedArea === area && styles.areaChipTextSelected]}>
                  {area}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.fieldLabel}>House / Street Detail</Text>
          <TextInput
            style={styles.input}
            placeholder="House #, Street, nearby reference"
            value={streetDetail}
            onChangeText={setStreetDetail}
          />

          <Text style={styles.fieldLabel}>Landmark (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Near Total petrol pump"
            value={landmark}
            onChangeText={setLandmark}
          />

          <Text style={styles.fieldLabel}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="03XXXXXXXXX"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          {/* Payment Method */}
          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Payment Method</Text>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === "COD" && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod("COD")}
          >
            <View style={styles.radioOuter}>
              {paymentMethod === "COD" && <View style={styles.radioInner} />}
            </View>
            <Ionicons name="cash-outline" size={18} color="#1a1a1a" style={{ marginHorizontal: 8 }} />
            <Text style={styles.paymentOptionText}>Cash on Delivery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === "JazzCash" && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod("JazzCash")}
          >
            <View style={styles.radioOuter}>
              {paymentMethod === "JazzCash" && <View style={styles.radioInner} />}
            </View>
            <Ionicons name="phone-portrait-outline" size={18} color="#1a1a1a" style={{ marginHorizontal: 8 }} />
            <Text style={styles.paymentOptionText}>JazzCash Transfer</Text>
          </TouchableOpacity>

          {paymentMethod === "JazzCash" && (
            <View style={styles.jazzCashBox}>
              <Text style={styles.jazzCashLabel}>Send payment to:</Text>
              <Text style={styles.jazzCashValue}>{JAZZCASH_ACCOUNT.number}</Text>
              <Text style={styles.jazzCashSubValue}>{JAZZCASH_ACCOUNT.title}</Text>
              
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Transaction ID (TID)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter TID from your JazzCash app"
                value={transactionId}
                onChangeText={setTransactionId}
              />

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Payment Screenshot</Text>
              {screenshotBase64 ? (
                <View style={styles.screenshotPreviewRow}>
                  <Image source={{ uri: screenshotBase64 }} style={styles.screenshotPreview} />
                  <TouchableOpacity onPress={handlePickScreenshot} disabled={pickingImage}>
                    <Text style={styles.changeScreenshotText}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handlePickScreenshot}
                  disabled={pickingImage}
                >
                  {pickingImage ? (
                    <ActivityIndicator color="#f97316" size="small" />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload-outline" size={18} color="#f97316" />
                      <Text style={styles.uploadButtonText}>Upload screenshot</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <Text style={styles.jazzCashNote}>
                Your order will be confirmed once we verify the transaction. This may take up to a minute.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom summary + place order */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Text style={styles.footerLabel}>Total</Text>
            <Text style={styles.footerValue}>Rs. {grandTotal}</Text>
          </View>
          <TouchableOpacity
            style={styles.placeOrderButton}
            onPress={handlePlaceOrder}
            disabled={placing}
            activeOpacity={0.9}
          >
            {placing ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <ActivityIndicator color="#fff" />
                {paymentMethod === "JazzCash" && (
                  <Text style={styles.placeOrderText}>Verifying payment...</Text>
                )}
              </View>
            ) : (
              <Text style={styles.placeOrderText}>Place Order</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
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
  scrollContent: { paddingHorizontal: 16, paddingBottom: 20 },

  sectionLabel: { fontSize: 15, fontWeight: "700", color: "#1a1a1a", marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: "#666", marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: "#fff",
  },

  areaScroll: { flexDirection: "row" },
  areaChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#f2f2f2",
    marginRight: 8,
  },
  areaChipSelected: { backgroundColor: "#f97316" },
  areaChipText: { fontSize: 12, fontWeight: "600", color: "#555" },
  areaChipTextSelected: { color: "#fff" },

  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  paymentOptionSelected: { borderColor: "#f97316", backgroundColor: "#fff8f2" },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#f97316",
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#f97316" },
  paymentOptionText: { fontSize: 14, color: "#1a1a1a", fontWeight: "600" },

  jazzCashBox: {
    backgroundColor: "#fff8f2",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  jazzCashLabel: { fontSize: 12, color: "#666" },
  jazzCashValue: { fontSize: 18, fontWeight: "700", color: "#f97316", marginTop: 4 },
  jazzCashSubValue: { fontSize: 13, color: "#555", marginTop: 2 },
  jazzCashNote: { fontSize: 11, color: "#999", marginTop: 12 },

  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#f97316",
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 14,
    backgroundColor: "#fff",
  },
  uploadButtonText: { fontSize: 13, fontWeight: "600", color: "#f97316" },
  screenshotPreviewRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  screenshotPreview: { width: 60, height: 60, borderRadius: 8, backgroundColor: "#f2f2f2" },
  changeScreenshotText: { fontSize: 13, color: "#f97316", fontWeight: "600" },

  footer: {
    borderTopWidth: 1,
    borderTopColor: "#f2f2f2",
    padding: 16,
  },
  footerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  footerLabel: { fontSize: 14, color: "#666" },
  footerValue: { fontSize: 16, fontWeight: "700", color: "#f97316" },
  placeOrderButton: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  placeOrderText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});

import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCart } from "../context/CartContext";
import type { RootStackParamList } from "../navigation/AppNavigator";
import type { ProductVariant } from "../types/menu.types";

type Props = NativeStackScreenProps<RootStackParamList, "ProductDetail">;

export default function ProductDetailScreen({ navigation, route }: Props) {
  const { product } = route.params;
  const { addItem } = useCart();

  const hasVariants = product.variants && product.variants.length > 0;
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    hasVariants ? product.variants[0] : null
  );
  const [quantity, setQuantity] = useState<number>(1);

  const unitPrice = product.basePrice + (selectedVariant?.priceModifier ?? 0);
  const totalPrice = unitPrice * quantity;

  const categoryName =
    typeof product.category === "string" ? null : product.category.name;

  function handleAddToCart(): void {
    addItem(product, selectedVariant, quantity);
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageWrapper}>
          <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#1a1a1a" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {categoryName && <Text style={styles.category}>{categoryName}</Text>}
          <Text style={styles.title}>{product.title}</Text>
          <Text style={styles.description}>{product.description}</Text>

          {!hasVariants && <Text style={styles.price}>Rs. {product.basePrice}</Text>}

          {hasVariants && (
            <>
              <Text style={styles.sectionLabel}>Choose size</Text>
              {product.variants.map((variant) => {
                const isSelected = selectedVariant?.name === variant.name;
                const price = product.basePrice + variant.priceModifier;
                return (
                  <TouchableOpacity
                    key={variant.name}
                    style={[styles.variantRow, isSelected && styles.variantRowSelected]}
                    onPress={() => setSelectedVariant(variant)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.radioOuter}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.variantName}>{variant.name}</Text>
                    <Text style={styles.variantPrice}>Rs. {price}</Text>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {!product.isAvailable && (
            <View style={styles.unavailableBanner}>
              <Text style={styles.unavailableText}>Currently unavailable</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {product.isAvailable && (
        <View style={styles.footer}>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <Ionicons name="remove" size={16} color="#f97316" />
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{quantity}</Text>
            <TouchableOpacity style={styles.stepperButton} onPress={() => setQuantity((q) => q + 1)}>
              <Ionicons name="add" size={16} color="#f97316" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.addButton} onPress={handleAddToCart} activeOpacity={0.9}>
            <Text style={styles.addButtonText}>Add to cart — Rs. {totalPrice}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { paddingBottom: 20 },

  imageWrapper: { position: "relative" },
  image: { width: "100%", height: 280, backgroundColor: "#f2f2f2" },
  backButton: {
    position: "absolute",
    top: 12,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

  content: { padding: 20 },
  category: { fontSize: 12, fontWeight: "600", color: "#f97316", marginBottom: 6 },
  title: { fontSize: 22, fontWeight: "700", color: "#1a1a1a" },
  description: { fontSize: 14, color: "#777", marginTop: 8, lineHeight: 20 },
  price: { fontSize: 20, fontWeight: "700", color: "#1a1a1a", marginTop: 16 },

  sectionLabel: { fontSize: 14, fontWeight: "700", color: "#1a1a1a", marginTop: 20, marginBottom: 10 },
  variantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f2",
  },
  variantRowSelected: {},
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
  variantName: { flex: 1, fontSize: 14, color: "#1a1a1a" },
  variantPrice: { fontSize: 13, fontWeight: "600", color: "#555" },

  unavailableBanner: {
    marginTop: 16,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    padding: 10,
  },
  unavailableText: { fontSize: 13, color: "#dc2626", fontWeight: "600", textAlign: "center" },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f2f2f2",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: "#f97316",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  stepperButton: { padding: 2 },
  stepperValue: { fontSize: 14, fontWeight: "700", color: "#1a1a1a", minWidth: 16, textAlign: "center" },
  addButton: {
    flex: 1,
    backgroundColor: "#f97316",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  addButtonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});

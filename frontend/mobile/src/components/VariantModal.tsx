import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Product, ProductVariant } from "../types/menu.types";

interface Props {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onConfirm: (variant: ProductVariant, quantity: number) => void;
}

export default function VariantModal({ visible, product, onClose, onConfirm }: Props) {
  const insets = useSafeAreaInsets();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  // Reset local state whenever a new product opens the modal
  React.useEffect(() => {
    if (visible && product && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
      setQuantity(1);
    }
  }, [visible, product]);

  if (!product) return null;

  const unitPrice = product.basePrice + (selectedVariant?.priceModifier ?? 0);
  const totalPrice = unitPrice * quantity;

  function handleConfirm(): void {
    if (!selectedVariant) return;
    onConfirm(selectedVariant, quantity);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom }]}>
          <View style={styles.header}>
            <Image source={{ uri: product.image }} style={styles.image} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>{product.title}</Text>
              <Text style={styles.description} numberOfLines={2}>{product.description}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.variantList}>
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
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Ionicons name="remove" size={16} color="#f97316" />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{quantity}</Text>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => setQuantity((q) => q + 1)}
              >
                <Ionicons name="add" size={16} color="#f97316" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.addButton} onPress={handleConfirm} activeOpacity={0.9}>
              <Text style={styles.addButtonText}>Add to cart — Rs. {totalPrice}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: {
    maxHeight: "90%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  image: { width: 56, height: 56, borderRadius: 10, backgroundColor: "#f2f2f2" },
  title: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  description: { fontSize: 12, color: "#888", marginTop: 2 },
  variantList: { flexShrink: 1 },
  sectionLabel: { fontSize: 13, fontWeight: "700", color: "#1a1a1a", marginBottom: 10 },
  variantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 4,
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
  footer: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 20 },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: "#f97316",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
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

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { fetchCategories, fetchProducts } from "../api/menuApi";
import { getCachedMenu, isCacheFresh, setCachedMenu } from "../utils/menuCache";
import { useAuth } from "../context/AuthContext";
import type { Category, Product } from "../types/menu.types";
import { useCart } from "../context/CartContext";
import VariantModal from "../components/VariantModal";
import type { ProductVariant } from "../types/menu.types";
const ALL_CHIP_ID = "__all__";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function MenuScreen() {
  const navigation = useNavigation<NavProp>();
  const { user, logout } = useAuth();
  const { cartCount, cartTotal, addItem } = useCart();
  const insets = useSafeAreaInsets();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(ALL_CHIP_ID);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);


  const loadFromNetwork = useCallback(async (isManualRefresh: boolean) => {
    try {
      const [freshCategories, freshProducts] = await Promise.all([
        fetchCategories(),
        fetchProducts(),
      ]);
      setCategories(freshCategories);
      setProducts(freshProducts);
      setIsOffline(false);
      await setCachedMenu(freshCategories, freshProducts);
    } catch (error) {
      console.log("Menu fetch failed:", error);
      setIsOffline(true);
    } finally {
      if (isManualRefresh) setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const cache = await getCachedMenu();

      if (cache) {
        setCategories(cache.categories);
        setProducts(cache.products);
        setLoading(false);
      }

      if (!cache || !isCacheFresh(cache)) {
        loadFromNetwork(false);
      } else {
        setLoading(false);
      }
    })();
  }, [loadFromNetwork]);

  function handlePullToRefresh(): void {
    setRefreshing(true);
    loadFromNetwork(true);
  }

  const [variantModalProduct, setVariantModalProduct] = useState<Product | null>(null);

function handleQuickAdd(product: Product): void {
  if (product.variants && product.variants.length > 0) {
    setVariantModalProduct(product);
  } else {
    addItem(product, null, 1);
  }
}

function handleVariantConfirm(variant: ProductVariant, quantity: number): void {
  if (variantModalProduct) {
    addItem(variantModalProduct, variant, quantity);
  }
}

 function handleViewCart(): void {
  navigation.navigate("Cart");
}

  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedCategoryId !== ALL_CHIP_ID) {
      result = result.filter((p) => {
        const catId = typeof p.category === "string" ? p.category : p.category._id;
        return catId === selectedCategoryId;
      });
    }

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(q));
    }

    return result;
  }, [products, selectedCategoryId, searchQuery]);

  function renderCategoryChip(item: { _id: string; name: string }) {
    const isSelected = selectedCategoryId === item._id;
    return (
      <TouchableOpacity
        key={item._id}
        style={[styles.chip, isSelected && styles.chipSelected]}
        onPress={() => setSelectedCategoryId(item._id)}
        activeOpacity={0.8}
      >
        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{item.name}</Text>
      </TouchableOpacity>
    );
  }

  function renderProduct({ item }: { item: Product }) {
  const priceLabel =
    item.variants && item.variants.length > 0
      ? `From Rs. ${item.basePrice}`
      : `Rs. ${item.basePrice}`;

  return (
    <View style={styles.productRow}>
      <TouchableOpacity
        style={styles.productTapArea}
        onPress={() => navigation.navigate("ProductDetail", { product: item })}
        activeOpacity={0.8}
      >
        <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
        <View style={styles.productInfo}>
          <Text style={styles.productTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <Text style={styles.productPrice}>{priceLabel}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => handleQuickAdd(item)}
        activeOpacity={0.8}
      >
        <Text style={styles.addButtonText}>Add</Text>
      </TouchableOpacity>
    </View>
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
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Hi, {user?.name?.split(" ")[0] || "there"} 👋</Text>
          <Text style={styles.subGreeting}>What would you like to eat today?</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.avatarButton}>
          <Ionicons name="person" size={18} color="#f97316" />
        </TouchableOpacity>
      </View>

      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>You're offline — showing saved menu</Text>
        </View>
      )}

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item._id}
        renderItem={renderProduct}
        contentContainerStyle={[styles.productList, { paddingBottom: 100 + insets.bottom }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handlePullToRefresh} colors={["#f97316"]} />
        }
        ListHeaderComponent={
          <>
            {/* Search bar */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={16} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for burgers, drinks..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Category chips */}
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsContainer}
              data={[{ _id: ALL_CHIP_ID, name: "All" }, ...categories]}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => renderCategoryChip(item)}
            />

            {/* Promo banner */}
            <View style={styles.promoBanner}>
              <View>
                <Text style={styles.promoTitle}>Flat Rs. 100 off</Text>
                <Text style={styles.promoSubtitle}>On orders above Rs. 999</Text>
              </View>
              <Ionicons name="pricetag" size={22} color="#f97316" />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular near you</Text>
              <Text style={styles.sectionCount}>{filteredProducts.length} items</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items found.</Text>
          </View>
        }
      />

      {/* Sticky cart bar */}
      {cartCount > 0 && (
        <TouchableOpacity
          style={[styles.cartBar, { bottom: insets.bottom + 16 }]}
          onPress={handleViewCart}
          activeOpacity={0.9}
        >
          <Text style={styles.cartBarText}>
            {cartCount} {cartCount === 1 ? "item" : "items"} | Rs. {cartTotal}
          </Text>
          <View style={styles.cartBarRight}>
            <Text style={styles.cartBarText}>View cart</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
      )}
<VariantModal
  visible={variantModalProduct !== null}
  product={variantModalProduct}
  onClose={() => setVariantModalProduct(null)}
  onConfirm={handleVariantConfirm}
/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  greeting: { fontSize: 20, fontWeight: "700", color: "#1a1a1a" },
  subGreeting: { fontSize: 13, color: "#888", marginTop: 2 },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff3e8",
    justifyContent: "center",
    alignItems: "center",
  },

  offlineBanner: { backgroundColor: "#fef3c7", paddingVertical: 6, paddingHorizontal: 20 },
  offlineText: { fontSize: 12, color: "#92400e", textAlign: "center" },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: "#1a1a1a" },

  chipsContainer: { paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f2f2f2",
    marginRight: 8,
  },
  chipSelected: { backgroundColor: "#f97316" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#555" },
  chipTextSelected: { color: "#fff" },

  promoBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff3e8",
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 12,
    padding: 14,
  },
  promoTitle: { fontSize: 13, fontWeight: "700", color: "#f97316" },
  promoSubtitle: { fontSize: 11, color: "#555", marginTop: 2 },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  sectionCount: { fontSize: 12, color: "#888" },

  productList: { paddingBottom: 100 },
  productRow: {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 16,
  paddingVertical: 10,
  gap: 12,
},
productTapArea: {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
},
  productImage: { width: 72, height: 72, borderRadius: 12, backgroundColor: "#f2f2f2" },
  productInfo: { flex: 1 },
  productTitle: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  productDescription: { fontSize: 12, color: "#888", marginTop: 3 },
  productPrice: { fontSize: 13, fontWeight: "700", color: "#1a1a1a", marginTop: 6 },

  addButton: {
    borderWidth: 1,
    borderColor: "#f97316",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  addButtonText: { fontSize: 12, fontWeight: "700", color: "#f97316" },

  emptyContainer: { alignItems: "center", marginTop: 60 },
  emptyText: { color: "#999", fontSize: 14 },

  cartBar: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cartBarText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  cartBarRight: { flexDirection: "row", alignItems: "center", gap: 4 },
});

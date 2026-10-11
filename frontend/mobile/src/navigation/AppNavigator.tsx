import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, Text, StyleSheet } from "react-native";
import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import VerifyEmailScreen from "../screens/auth/VerifyEmailScreen";
import MenuScreen from "../screens/MenuScreen";
import CartScreen from "../screens/CartScreen";
import type { Order } from "../types/order.types";
import CheckoutScreen from "../screens/CheckoutScreen";
import OrderConfirmationScreen from "../screens/OrderConfirmationScreen";
import ProductDetailScreen from "../screens/ProductDetailScreen";
import type { Product } from "../types/menu.types";
import MainTabNavigator from "./MainTabNavigator";
import OrderDetailScreen from "../screens/OrderDetailScreen";



// Central type definition for all stack routes — screens import this
// to get type-checked `navigation.navigate()` calls
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  VerifyEmail: { email: string };
  MainTabs: undefined;
  Cart: undefined;
  Checkout: undefined;
  OrderConfirmation: { order: Order };
  ProductDetail: { product: Product };
  OrderDetail: { order: Order };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
    <Stack.Screen name="Cart" component={CartScreen} />
    <Stack.Screen name="Checkout" component={CheckoutScreen} />
    <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
    <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
    <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 24,
  },
});

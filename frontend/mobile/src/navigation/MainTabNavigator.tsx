import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import MenuScreen from "../screens/MenuScreen";
import OrdersScreen from "../screens/OrdersScreen";
import ProfileScreen from "../screens/ProfileScreen";

export type MainTabParamList = {
  MenuTab: undefined;
  OrdersTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#f97316",
        tabBarInactiveTintColor: "#999",
        tabBarIcon: ({ color, size }) => {
          const iconName =
            route.name === "MenuTab"
              ? "restaurant-outline"
              : route.name === "OrdersTab"
              ? "receipt-outline"
              : "person-outline";
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="MenuTab" component={MenuScreen} options={{ title: "Menu" }} />
      <Tab.Screen name="OrdersTab" component={OrdersScreen} options={{ title: "Orders" }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}

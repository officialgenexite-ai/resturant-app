import React, { useEffect } from "react";
import { AuthProvider } from "./mobile/src/context/AuthContext";
import { CartProvider } from "./mobile/src/context/CartContext";
import AppNavigator from "./mobile/src/navigation/AppNavigator";
import { configureGoogleSignIn } from "./mobile/src/utils/googleSignInConfig";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <AppNavigator />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

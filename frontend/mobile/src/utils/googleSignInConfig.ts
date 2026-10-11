import { GoogleSignin } from "@react-native-google-signin/google-signin";

let isConfigured = false;

/**
 * Configures the native Google Sign-In SDK once when the app boots.
 * Call this from App.tsx before any sign-in attempt.
 */
export function configureGoogleSignIn(): void {
  if (isConfigured) return;

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  if (!webClientId) {
    console.warn(
      "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is missing — Google Sign-In will not work."
    );
    return;
  }

  GoogleSignin.configure({
    webClientId, // Web client ID — required to get an idToken usable by our backend
    offlineAccess: false, // we don't need refresh tokens server-side for now
  });

  isConfigured = true;
}

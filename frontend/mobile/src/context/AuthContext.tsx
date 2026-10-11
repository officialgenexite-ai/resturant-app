import { GoogleSignin } from "@react-native-google-signin/google-signin";
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import axiosInstance, { ApiError } from "../api/axiosInstance";
import storage from "../utils/storage";
import {
  User,
  AuthResponseData,
  ApiSuccessResponse,
  RegisterPayload,
  LoginPayload,
  VerifyEmailPayload,
  ResendVerificationPayload,
} from "../types/auth.types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  register: (payload: RegisterPayload) => Promise<{ user: User; requiresVerification: boolean }>;
  verifyEmail: (payload: VerifyEmailPayload) => Promise<User>;
  login: (payload: LoginPayload) => Promise<User>;
  googleSignIn: () => Promise<User>;
  logout: () => Promise<void>;
  resendVerificationCode: (payload: ResendVerificationPayload) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // On app boot, configure Google Sign-In and check stored session
  useEffect(() => {
    // 1. Google Sign-In Initialize
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    });

    // 2. Hydrate user from storage
    (async () => {
      try {
        const storedUser = await storage.getItem("authUser");
        const storedToken = await storage.getItem("authToken");
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser) as User);
        }
      } catch (err) {
        console.log("Auth hydration error:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function register(
    payload: RegisterPayload
  ): Promise<{ user: User; requiresVerification: boolean }> {
    const response = await axiosInstance.post<ApiSuccessResponse<{ user: User; token?: string }>>(
      "/auth/register",
      payload,
      { timeout: 30000 }
    );

    const { user: newUser, token } = response.data.data;

    if (!token) {
      return { user: newUser, requiresVerification: true };
    }

    await storage.setItem("authToken", token);
    await storage.setItem("authUser", JSON.stringify(newUser));
    setUser(newUser);

    return { user: newUser, requiresVerification: false };
  }

  async function verifyEmail(payload: VerifyEmailPayload): Promise<User> {
    const response = await axiosInstance.post<ApiSuccessResponse<AuthResponseData>>(
      "/auth/verify-email",
      payload
    );

    const { user: verifiedUser, token } = response.data.data;

    await storage.setItem("authToken", token);
    await storage.setItem("authUser", JSON.stringify(verifiedUser));
    setUser(verifiedUser);

    return verifiedUser;
  }

  async function resendVerificationCode(payload: ResendVerificationPayload): Promise<void> {
    await axiosInstance.post<ApiSuccessResponse<null>>(
      "/auth/resend-verification",
      payload,
      { timeout: 30000 }
    );
  }

  async function login(payload: LoginPayload): Promise<User> {
    const response = await axiosInstance.post<ApiSuccessResponse<AuthResponseData>>(
      "/auth/login",
      payload
    );

    const { user: loggedInUser, token } = response.data.data;

    await storage.setItem("authToken", token);
    await storage.setItem("authUser", JSON.stringify(loggedInUser));
    setUser(loggedInUser);

    return loggedInUser;
  }

  async function verifyGoogleTokenWithBackend(idToken: string): Promise<AuthResponseData> {
    const response = await axiosInstance.post<ApiSuccessResponse<AuthResponseData>>(
      "/auth/google",
      { idToken }
    );
    return response.data.data;
  }

  async function googleSignIn(): Promise<User> {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const response = await GoogleSignin.signIn();

    const idToken =
      (response as any)?.data?.idToken || (response as any)?.idToken;

    if (!idToken) {
      throw new Error("Google sign-in did not return a valid token");
    }

    const { user: googleUser, token } = await verifyGoogleTokenWithBackend(idToken);

    await storage.setItem("authToken", token);
    await storage.setItem("authUser", JSON.stringify(googleUser));
    setUser(googleUser);

    return googleUser;
  }

  async function logout(): Promise<void> {
    try {
      await GoogleSignin.signOut();
    } catch {
      // user might not have signed in with Google — safe to ignore
    }
    await storage.removeItem("authToken");
    await storage.removeItem("authUser");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        register,
        verifyEmail,
        login,
        googleSignIn,
        logout,
        resendVerificationCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export type { ApiError };
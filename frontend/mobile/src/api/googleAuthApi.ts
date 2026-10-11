import axiosInstance, { ApiError } from "./axiosInstance";
import { ApiSuccessResponse, AuthResponseData } from "../types/auth.types";

export async function verifyGoogleTokenWithBackend(
  idToken: string
): Promise<AuthResponseData> {
  const response = await axiosInstance.post<ApiSuccessResponse<AuthResponseData>>(
    "/auth/google",
    { idToken }
  );
  return response.data.data;
}

export type { ApiError };

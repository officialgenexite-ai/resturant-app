import { NextResponse } from "next/server";

interface SuccessResponseOptions<T> {
  message: string;
  data?: T;
  status?: number;
}

interface ErrorResponseOptions {
  message: string;
  status?: number;
  errors?: Record<string, string> | null;
}

export function successResponse<T>({
  message,
  data,
  status = 200,
}: SuccessResponseOptions<T>) {
  return NextResponse.json(
    {
      success: true,
      message,
      data: data ?? null,
    },
    { status }
  );
}

export function errorResponse({
  message,
  status = 500,
  errors = null,
}: ErrorResponseOptions) {
  return NextResponse.json(
    {
      success: false,
      message,
      errors,
    },
    { status }
  );
}

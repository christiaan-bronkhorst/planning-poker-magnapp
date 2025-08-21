import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

export function errorResponse(message: string, status = 400): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

export function notFoundResponse(resource: string): NextResponse<ApiResponse> {
  return errorResponse(`${resource} not found`, 404);
}

export function unauthorizedResponse(message = 'Unauthorized'): NextResponse<ApiResponse> {
  return errorResponse(message, 401);
}

export function conflictResponse(message: string): NextResponse<ApiResponse> {
  return errorResponse(message, 409);
}

export function serverErrorResponse(error: unknown): NextResponse<ApiResponse> {
  const message = error instanceof Error ? error.message : 'Internal server error';
  console.error('Server error:', error);
  return errorResponse(message, 500);
}
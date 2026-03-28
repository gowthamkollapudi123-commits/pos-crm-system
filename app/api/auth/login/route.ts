import { NextResponse } from 'next/server';

// This route is not used — the real handler is at /api/[tenantId]/auth/login
// Exporting a stub to satisfy Next.js module requirements
export async function POST() {
  return NextResponse.json(
    { success: false, message: 'Use /api/{tenantId}/auth/login' },
    { status: 404 }
  );
}

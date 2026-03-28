import { NextRequest, NextResponse } from 'next/server';

const MOCK_USERS: Record<string, { id: string; name: string; email: string; role: string; password: string }> = {
  'admin@demo.com': {
    id: 'user-1',
    name: 'Admin User',
    email: 'admin@demo.com',
    role: 'admin',
    password: 'admin123',
  },
  'manager@demo.com': {
    id: 'user-2',
    name: 'Manager User',
    email: 'manager@demo.com',
    role: 'manager',
    password: 'manager123',
  },
  'staff@demo.com': {
    id: 'user-3',
    name: 'Staff User',
    email: 'staff@demo.com',
    role: 'staff',
    password: 'staff123',
  },
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  const user = MOCK_USERS[email?.toLowerCase()];

  if (!user || user.password !== password) {
    return NextResponse.json(
      { success: false, message: 'Invalid email or password' },
      { status: 401 }
    );
  }

  const response = NextResponse.json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: 'demo',
      },
    },
    message: 'Login successful',
  });

  // Set a mock session cookie
  response.cookies.set('session', `mock-session-${user.id}`, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
    sameSite: 'lax',
  });

  return response;
}

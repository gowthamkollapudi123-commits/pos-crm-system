import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = request.cookies.get('session');

  if (!session?.value?.startsWith('mock-session-')) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  const userId = session.value.replace('mock-session-', '');

  const users: Record<string, object> = {
    'user-1': { id: 'user-1', name: 'Admin User', email: 'admin@demo.com', role: 'Admin', tenantId: 'demo' },
    'user-2': { id: 'user-2', name: 'Manager User', email: 'manager@demo.com', role: 'Manager', tenantId: 'demo' },
    'user-3': { id: 'user-3', name: 'Staff User', email: 'staff@demo.com', role: 'Staff', tenantId: 'demo' },
  };

  const user = users[userId];
  if (!user) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ success: true, data: { user } });
}

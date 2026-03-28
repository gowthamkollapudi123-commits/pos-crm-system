import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const session = request.cookies.get('session');

  if (!session?.value?.startsWith('mock-session-')) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  // Re-set the cookie to extend the session
  const response = NextResponse.json({ success: true, message: 'Session refreshed' });
  response.cookies.set('session', session.value, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24,
    sameSite: 'lax',
  });

  return response;
}

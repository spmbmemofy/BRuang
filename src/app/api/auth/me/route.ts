import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserById } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const fullUser = await getUserById(session.userId);

  return NextResponse.json({ 
    authenticated: true, 
    user: {
      ...session,
      contactInfo: fullUser?.contactInfo || ''
    } 
  });
}

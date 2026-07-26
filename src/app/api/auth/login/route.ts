import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByUsername } from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi.' }, { status: 400 });
    }

    const user = await getUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: 'Username atau password salah.' }, { status: 401 });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Username atau password salah.' }, { status: 401 });
    }

    await createSession({
      userId: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
      adminId: user.adminId,
    });

    return NextResponse.json({ 
      message: 'Login berhasil.',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error login:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}

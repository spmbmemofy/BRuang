import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByUsername, addUser } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { username, password, adminId } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi.' }, { status: 400 });
    }

    if (!adminId) {
      return NextResponse.json({ error: 'Instansi (Admin) tujuan wajib dipilih.' }, { status: 400 });
    }

    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return NextResponse.json({ error: 'Username sudah digunakan.' }, { status: 400 });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newUser = {
      id: 'user-' + Date.now(),
      username,
      passwordHash,
      role: 'employee' as const,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      adminId,
    };

    await addUser(newUser);

    return NextResponse.json({ message: 'Registrasi berhasil. Menunggu persetujuan Admin.' }, { status: 201 });
  } catch (error: any) {
    console.error('Error register:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}

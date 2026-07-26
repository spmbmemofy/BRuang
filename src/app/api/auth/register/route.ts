import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByUsername, addUser } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { username, password, adminId, role = 'employee', institutionName } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi.' }, { status: 400 });
    }

    if (role === 'employee' && !adminId) {
      return NextResponse.json({ error: 'Instansi tujuan wajib dipilih untuk pendaftaran anggota.' }, { status: 400 });
    }

    if (role === 'admin' && !institutionName) {
      return NextResponse.json({ error: 'Nama Instansi wajib diisi untuk pendaftaran admin.' }, { status: 400 });
    }

    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return NextResponse.json({ error: 'Username sudah digunakan.' }, { status: 400 });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newUser: any = {
      id: 'user-' + Date.now(),
      username,
      passwordHash,
      role: role,
      status: role === 'admin' ? 'active' : 'pending',
      createdAt: new Date().toISOString(),
    };

    if (role === 'employee') {
      newUser.adminId = adminId;
    } else {
      newUser.institutionName = institutionName;
      newUser.visibility = 'public';
    }

    await addUser(newUser);

    const message = role === 'admin' 
      ? 'Registrasi Admin berhasil. Silakan login.' 
      : 'Registrasi berhasil. Menunggu persetujuan Admin instansi terkait.';

    return NextResponse.json({ message }, { status: 201 });
  } catch (error: any) {
    console.error('Error register:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}

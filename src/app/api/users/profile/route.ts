import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PUT(request: Request) {
  try {
    const userSession = await getSession();
    
    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (userSession.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const { username, institutionName, contactInfo, visibility } = await request.json();

    if (!username || !institutionName) {
      return NextResponse.json({ error: 'Username dan nama instansi wajib diisi.' }, { status: 400 });
    }

    const db = await readDb();
    
    // Check if new username is taken by another user
    const existingUser = db.users.find(u => u.username === username && u.id !== userSession.userId);
    if (existingUser) {
      return NextResponse.json({ error: 'Username sudah digunakan oleh akun lain.' }, { status: 400 });
    }

    const userIndex = db.users.findIndex(u => u.id === userSession.userId);
    if (userIndex === -1) {
      return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 });
    }

    // Update user
    db.users[userIndex].username = username;
    db.users[userIndex].institutionName = institutionName;
    db.users[userIndex].contactInfo = contactInfo;
    
    if (visibility === 'public' || visibility === 'private') {
      db.users[userIndex].visibility = visibility;
    }

    await writeDb(db);

    return NextResponse.json({ message: 'Profil berhasil diperbarui.', user: db.users[userIndex] });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

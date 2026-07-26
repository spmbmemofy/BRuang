import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await readDb();
    
    // Return admins where visibility is NOT private (undefined is considered public)
    const publicAdmins = db.users
      .filter(user => user.role === 'admin' && user.visibility !== 'private')
      .map(admin => ({
        id: admin.id,
        username: admin.username,
        institutionName: admin.institutionName || 'Instansi Belum Dinamai'
      }));

    return NextResponse.json(publicAdmins);
  } catch (error) {
    console.error('Error fetching public institutions:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

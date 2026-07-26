import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await readDb();
    
    // Filter only admins and map to safe public fields
    const admins = db.users
      .filter(user => user.role === 'admin')
      .map(admin => ({
        id: admin.id,
        username: admin.username,
        institutionName: admin.institutionName || 'Instansi Belum Dinamai'
      }));

    return NextResponse.json(admins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

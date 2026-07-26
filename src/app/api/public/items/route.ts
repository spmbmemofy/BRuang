import { NextRequest, NextResponse } from 'next/server';
import { getItems, readDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');

    if (!adminId) {
      return NextResponse.json({ error: 'adminId wajib disertakan' }, { status: 400 });
    }

    const db = await readDb();
    const admin = db.users.find(u => u.id === adminId && u.role === 'admin');
    
    if (!admin || admin.visibility === 'private') {
      return NextResponse.json({ error: 'Instansi tidak ditemukan atau bersifat privat' }, { status: 404 });
    }

    const items = await getItems();
    const filteredItems = items.filter(i => i.adminId === adminId);

    return NextResponse.json(filteredItems);
  } catch (error) {
    console.error('Error fetching public items:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data barang.' },
      { status: 500 }
    );
  }
}

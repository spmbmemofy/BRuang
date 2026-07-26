import { NextRequest, NextResponse } from 'next/server';
import { getItems, readDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json({ error: 'itemId wajib disertakan' }, { status: 400 });
    }

    const items = await getItems();
    const item = items.find(i => i.id === itemId);
    if (!item) {
      return NextResponse.json({ error: 'Barang tidak ditemukan' }, { status: 404 });
    }

    // Check visibility
    const db = await readDb();
    const admin = db.users.find(u => u.id === item.adminId && u.role === 'admin');
    
    // If admin is private, deny access publicly
    if (admin && admin.visibility === 'private') {
      return NextResponse.json({ error: 'Instansi ini bersifat privat' }, { status: 403 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching public item details:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

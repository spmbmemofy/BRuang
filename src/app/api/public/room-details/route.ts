import { NextRequest, NextResponse } from 'next/server';
import { getRooms, readDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json({ error: 'roomId wajib disertakan' }, { status: 400 });
    }

    const rooms = await getRooms();
    const room = rooms.find(r => r.id === roomId);
    if (!room) {
      return NextResponse.json({ error: 'Ruangan tidak ditemukan' }, { status: 404 });
    }

    // Check visibility
    const db = await readDb();
    const admin = db.users.find(u => u.id === room.adminId && u.role === 'admin');
    
    // If admin is private, deny access publicly
    if (admin && admin.visibility === 'private') {
      return NextResponse.json({ error: 'Instansi ini bersifat privat' }, { status: 403 });
    }

    return NextResponse.json(room);
  } catch (error) {
    console.error('Error fetching public room details:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

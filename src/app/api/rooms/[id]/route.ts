import { NextRequest, NextResponse } from 'next/server';
import { updateRoom, deleteRoom, readDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, capacity, facilities, description, image } = body;

    const db = await readDb();
    const room = db.rooms.find(r => r.id === id);

    if (!room) {
      return NextResponse.json({ error: 'Ruangan tidak ditemukan' }, { status: 404 });
    }

    // Only owner admin can edit
    if (room.adminId && room.adminId !== session.userId) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const success = await updateRoom(id, { name, capacity, facilities, description, image });
    if (!success) {
      return NextResponse.json({ error: 'Gagal memperbarui ruangan' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Ruangan berhasil diperbarui' });
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json({ error: 'Gagal memperbarui ruangan' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    const db = await readDb();
    const room = db.rooms.find(r => r.id === id);

    if (!room) {
      return NextResponse.json({ error: 'Ruangan tidak ditemukan' }, { status: 404 });
    }

    // Only owner admin can delete
    if (room.adminId && room.adminId !== session.userId) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const success = await deleteRoom(id);
    if (!success) {
      return NextResponse.json({ error: 'Gagal menghapus ruangan' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Ruangan berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json({ error: 'Gagal menghapus ruangan' }, { status: 500 });
  }
}

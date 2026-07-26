import { NextRequest, NextResponse } from 'next/server';
import { updateItem, deleteItem, readDb } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, category, currentLocation, description, image } = body;

    const db = await readDb();
    const item = db.items.find(i => i.id === id);

    if (!item) {
      return NextResponse.json({ error: 'Barang tidak ditemukan' }, { status: 404 });
    }

    // Only owner admin can edit
    if (item.adminId && item.adminId !== session.userId) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const success = await updateItem(id, { name, category, currentLocation, description, image });
    if (!success) {
      return NextResponse.json({ error: 'Gagal memperbarui barang' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Barang berhasil diperbarui' });
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json({ error: 'Gagal memperbarui barang' }, { status: 500 });
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
    const item = db.items.find(i => i.id === id);

    if (!item) {
      return NextResponse.json({ error: 'Barang tidak ditemukan' }, { status: 404 });
    }

    // Only owner admin can delete
    if (item.adminId && item.adminId !== session.userId) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const success = await deleteItem(id);
    if (!success) {
      return NextResponse.json({ error: 'Gagal menghapus barang' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Barang berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ error: 'Gagal menghapus barang' }, { status: 500 });
  }
}

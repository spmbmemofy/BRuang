import { NextRequest, NextResponse } from 'next/server';
import { getItems, addItems, updateItemLocation } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const items = await getItems();
    
    // Filter items by adminId
    const targetAdminId = session.role === 'admin' ? session.userId : session.adminId;
    const filteredItems = items.filter(i => i.adminId === targetAdminId || !i.adminId);

    return NextResponse.json(filteredItems);
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data barang.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, category, currentLocation, description, image, quantity = 1 } = body;

    if (!name || !category || !currentLocation || !description) {
      return NextResponse.json(
        { error: 'Field name, category, currentLocation, dan description wajib diisi.' },
        { status: 400 }
      );
    }

    const numQty = parseInt(quantity, 10);
    if (isNaN(numQty) || numQty < 1) {
      return NextResponse.json({ error: 'Quantity tidak valid.' }, { status: 400 });
    }

    const newItems = [];
    const baseId = Date.now();
    
    for (let i = 0; i < numQty; i++) {
      const suffix = numQty > 1 ? ` - ${(i + 1).toString().padStart(2, '0')}` : '';
      newItems.push({
        id: `item-${baseId}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        name: `${name.trim()}${suffix}`,
        category: category.trim(),
        currentLocation: currentLocation.trim(),
        description: description.trim(),
        image: image || '',
        adminId: session.userId, // Set the owner
      });
    }

    await addItems(newItems);
    return NextResponse.json({ success: true, items: newItems }, { status: 201 });
  } catch (error) {
    console.error('Error adding item:', error);
    return NextResponse.json(
      { error: 'Gagal menambahkan barang.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, currentLocation } = await request.json();
    
    if (!id || !currentLocation) {
      return NextResponse.json({ error: 'ID dan lokasi baru wajib diisi.' }, { status: 400 });
    }

    const success = await updateItemLocation(id, currentLocation.trim());
    if (!success) {
      return NextResponse.json({ error: 'Barang tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Lokasi berhasil diperbarui.' });
  } catch (error) {
    console.error('Error updating item location:', error);
    return NextResponse.json({ error: 'Gagal memperbarui lokasi.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getItems, addItem } from '@/lib/db';

export async function GET() {
  try {
    const items = await getItems();
    return NextResponse.json(items);
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
    const body = await request.json();
    const { name, category, currentLocation, description, image } = body;

    if (!name || !category || !currentLocation || !description) {
      return NextResponse.json(
        { error: 'Field name, category, currentLocation, dan description wajib diisi.' },
        { status: 400 }
      );
    }

    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      category: category.trim(),
      currentLocation: currentLocation.trim(),
      description: description.trim(),
      image: image || '',
    };

    await addItem(newItem);
    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('Error adding item:', error);
    return NextResponse.json(
      { error: 'Gagal menambahkan barang.' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getRooms, addRoom } from '@/lib/db';

export async function GET() {
  try {
    const rooms = await getRooms();
    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data ruangan.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      name,
      capacity,
      facilities,
      description,
      operatingHours,
      guidelines,
    } = await request.json();

    // Validation
    if (
      !name ||
      !capacity ||
      !facilities ||
      !description ||
      !operatingHours ||
      !guidelines
    ) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi.' },
        { status: 400 }
      );
    }

    const rooms = await getRooms();
    
    // Generate a unique ID from name
    const id = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // remove special characters
      .replace(/[\s_]+/g, '-') // replace spaces and underscores with dashes
      .replace(/^-+|-+$/g, ''); // trim starting/ending dashes

    // Check if room ID already exists
    if (rooms.some(r => r.id === id)) {
      return NextResponse.json(
        { error: 'Nama ruangan sudah digunakan. Gunakan nama lain.' },
        { status: 409 }
      );
    }

    // Process facilities array
    const facilitiesList = Array.isArray(facilities)
      ? facilities.map(f => f.trim()).filter(Boolean)
      : facilities.split(',').map((f: string) => f.trim()).filter(Boolean);

    // Process guidelines array
    const guidelinesList = Array.isArray(guidelines)
      ? guidelines.map(g => g.trim()).filter(Boolean)
      : guidelines.split('\n').map((g: string) => g.trim()).filter(Boolean);

    const newRoom = {
      id,
      name,
      capacity: Number(capacity),
      facilities: facilitiesList,
      image: 'custom_room',
      description,
      operatingHours: operatingHours.trim(),
      guidelines: guidelinesList,
    };

    await addRoom(newRoom);

    return NextResponse.json(
      { success: true, room: newRoom },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Gagal menambahkan ruangan.' },
      { status: 500 }
    );
  }
}

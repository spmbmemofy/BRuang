import { NextRequest, NextResponse } from 'next/server';
import { getRooms, addRoom, getItems } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rooms = await getRooms();
    
    // Filter rooms by adminId
    // If admin, show their own rooms. If employee, show rooms belonging to their adminId
    const targetAdminId = session.role === 'admin' ? session.userId : session.adminId;
    
    // Fallback: If room has no adminId (seeded data), you might want to show it or hide it.
    // Let's hide it unless it explicitly belongs to the targetAdminId.
    const filteredRooms = rooms.filter(r => r.adminId === targetAdminId || !r.adminId);
    const items = await getItems();

    const computedRooms = filteredRooms.map(room => {
      const itemsInRoom = items.filter(i => i.currentLocation === room.name && i.adminId === room.adminId);
      return {
        ...room,
        computedFacilities: [...room.facilities, ...itemsInRoom.map(i => i.name)]
      };
    });

    return NextResponse.json(computedRooms);
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
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

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
    
    // Generate a unique ID from name, appending adminId to ensure uniqueness across instansi
    const baseId = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
      
    const id = `${baseId}-${session.userId.substring(session.userId.length - 4)}`;

    if (rooms.some(r => r.id === id)) {
      return NextResponse.json(
        { error: 'Nama ruangan sudah digunakan. Gunakan nama lain.' },
        { status: 409 }
      );
    }

    const facilitiesList = Array.isArray(facilities)
      ? facilities.map(f => f.trim()).filter(Boolean)
      : facilities.split(',').map((f: string) => f.trim()).filter(Boolean);

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
      adminId: session.userId, // Set the owner
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

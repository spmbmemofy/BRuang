import { NextRequest, NextResponse } from 'next/server';
import { getRooms, getBookings } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const date = searchParams.get('date');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');

    if (!roomId || !date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const rooms = await getRooms();
    const targetRoom = rooms.find(r => r.id === roomId);
    if (!targetRoom) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const allBookings = await getBookings();
    
    // Find rooms with similar capacity (+- 50%)
    const similarRooms = rooms.filter(r => {
      if (r.id === roomId) return false;
      const capacityDiff = Math.abs(r.capacity - targetRoom.capacity);
      return capacityDiff <= (targetRoom.capacity * 0.5);
    });

    const recommendedRooms = [];

    for (const room of similarRooms) {
      // Check if this room is free at the requested time
      const roomBookings = allBookings.filter(b => b.targetId === room.id && b.date === date);
      
      const hasConflict = roomBookings.some(b => {
        return b.startTime < endTime && b.endTime > startTime;
      });

      if (!hasConflict) {
        recommendedRooms.push(room);
        if (recommendedRooms.length >= 3) break; // Return max 3 recommendations
      }
    }

    return NextResponse.json({ recommendations: recommendedRooms });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil rekomendasi.' },
      { status: 500 }
    );
  }
}

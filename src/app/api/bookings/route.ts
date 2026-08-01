import { NextRequest, NextResponse } from 'next/server';
import { getRooms, getItems, getBookings, readDb, addBookings, deleteBooking, logActivity } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('targetId');
    const date = searchParams.get('date'); // YYYY-MM-DD

    let bookings = await getBookings();

    if (targetId) {
      bookings = bookings.filter(b => b.targetId === targetId);
    }

    if (date) {
      bookings = bookings.filter(b => b.date === date);
    }

    // Sort bookings by start time
    bookings.sort((a, b) => a.startTime.localeCompare(b.startTime));

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data booking.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      targetId,
      targetType,
      user, 
      contactInfo,
      date, 
      startTime, 
      endTime, 
      purpose, 
      recurrence = 'none', 
      recurrenceEndDate,
      isUrgent = false
    } = await request.json();

    const currentUser = await getSession();

    // Validation
    if (!targetId || !targetType || !user || !contactInfo || !date || !startTime || !endTime || !purpose) {
      return NextResponse.json(
        { error: 'Semua field booking wajib diisi (termasuk nomor kontak).' },
        { status: 400 }
      );
    }

    // Verify target exists
    if (targetType === 'room') {
      const rooms = await getRooms();
      if (!rooms.some(r => r.id === targetId)) {
        return NextResponse.json({ error: 'Ruangan tidak ditemukan.' }, { status: 404 });
      }
    } else if (targetType === 'item') {
      const items = await getItems();
      if (!items.some(i => i.id === targetId)) {
        return NextResponse.json({ error: 'Barang tidak ditemukan.' }, { status: 404 });
      }
    } else {
      return NextResponse.json({ error: 'Tipe target tidak valid.' }, { status: 400 });
    }

    // Validate times
    if (startTime >= endTime) {
      return NextResponse.json(
        { error: 'Waktu selesai harus lebih lambat dari waktu mulai.' },
        { status: 400 }
      );
    }

    // Calculate dates based on recurrence pattern
    const dates: string[] = [];
    const startDate = new Date(date);
    let endDate = recurrenceEndDate ? new Date(recurrenceEndDate) : startDate;

    // Cap recurrence to 3 months max
    const maxEndDate = new Date(startDate);
    maxEndDate.setMonth(maxEndDate.getMonth() + 3);
    if (endDate > maxEndDate) {
      endDate = maxEndDate;
    }

    if (recurrence === 'none') {
      dates.push(date);
    } else if (recurrence === 'daily') {
      const current = new Date(startDate);
      while (current <= endDate) {
        dates.push(current.toLocaleDateString('en-CA'));
        current.setDate(current.getDate() + 1);
      }
    } else if (recurrence === 'weekly') {
      const current = new Date(startDate);
      while (current <= endDate) {
        dates.push(current.toLocaleDateString('en-CA'));
        current.setDate(current.getDate() + 7);
      }
    } else if (recurrence === 'monthly') {
      const current = new Date(startDate);
      while (current <= endDate) {
        dates.push(current.toLocaleDateString('en-CA'));
        current.setMonth(current.getMonth() + 1);
      }
    }

    // Check for collision across all dates
    const allBookings = await getBookings();
    const conflicts: string[] = [];
    const conflictDetails: any[] = [];

    dates.forEach(d => {
      const collisions = allBookings.filter(b => {
        return (
          b.targetId === targetId &&
          b.date === d &&
          b.startTime < endTime &&
          b.endTime > startTime
        );
      });

      if (collisions.length > 0) {
        conflictDetails.push(...collisions);
        try {
          const formattedDate = new Date(d).toLocaleDateString('id-ID', {
            weekday: 'long', day: 'numeric', month: 'short',
          });
          if (!conflicts.includes(formattedDate)) conflicts.push(formattedDate);
        } catch {
          if (!conflicts.includes(d)) conflicts.push(d);
        }
      }
    });

    if (conflicts.length > 0) {
      if (isUrgent && currentUser?.role === 'admin') {
        // Admin overrides: delete all conflicting bookings
        for (const conflict of conflictDetails) {
          await deleteBooking(conflict.id);
          await logActivity(
            'OVERRIDE',
            'booking',
            conflict.id,
            `Booking overridden by admin ${currentUser.username} for urgent purpose: ${purpose}`,
            currentUser.username
          );
        }
      } else {
        return NextResponse.json(
          { 
            error: `Jadwal bentrok pada tanggal: ${conflicts.join(', ')}. Pemesanan dibatalkan.`,
            conflictDetails 
          },
          { status: 409 }
        );
      }
    }

    // Atomic insert
    const db = await readDb();
    const newEntries = dates.map(d => ({
      id: `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      targetId,
      targetType,
      user: user.trim(),
      contactInfo: contactInfo.trim(),
      date: d,
      startTime,
      endTime,
      purpose: purpose.trim(),
      createdAt: new Date().toISOString(),
    }));

    await addBookings(newEntries);

    // Log the successful booking creation
    if (currentUser) {
      await logActivity(
        'CREATE',
        'booking',
        newEntries[0].id,
        `Booking created for ${dates.length} schedule(s): ${purpose}`,
        currentUser.username
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: `Berhasil memesan untuk ${dates.length} jadwal.`,
        bookings: newEntries 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error making booking:', error);
    return NextResponse.json(
      { error: 'Gagal membuat booking.' },
      { status: 500 }
    );
  }
}

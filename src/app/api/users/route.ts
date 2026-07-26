import { NextResponse } from 'next/server';
import { getUsers, updateUserStatus } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  let users = await getUsers();
  
  // Filter only employees belonging to this Admin
  users = users.filter(u => u.role === 'employee' && u.adminId === session.userId);

  // Don't send password hashes to client
  const safeUsers = users.map(({ passwordHash, ...user }) => user);

  return NextResponse.json(safeUsers);
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
    }

    const success = await updateUserStatus(id, status);
    if (!success) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User status updated successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

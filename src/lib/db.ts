import fs from 'fs/promises';
import path from 'path';

export interface Room {
  id: string;
  name: string;
  capacity: number;
  facilities: string[];
  image: string;
  description: string;
  operatingHours: string; // "08:00 - 18:00"
  guidelines: string[];   // List of rules/guidelines
}

export interface Item {
  id: string;
  name: string;
  category: string;
  currentLocation: string; // Where the item is currently located
  description: string;
  image?: string;
}

export interface Booking {
  id: string;
  targetId: string; // roomId or itemId
  targetType: 'room' | 'item';
  user: string;
  contactInfo: string; // e.g., Phone Number / WhatsApp
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  purpose: string;
  createdAt: string;
}

export interface DatabaseSchema {
  rooms: Room[];
  items: Item[];
  bookings: Booking[];
}

const dbPath = path.join(process.cwd(), 'src/data/db.json');

export async function readDb(): Promise<DatabaseSchema> {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database file, returning empty schema:', error);
    return { rooms: [], items: [], bookings: [] };
  }
}

export async function writeDb(data: DatabaseSchema): Promise<void> {
  try {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing to database file:', error);
    throw new Error('Gagal menyimpan data ke database.');
  }
}

export async function getRooms(): Promise<Room[]> {
  const db = await readDb();
  return db.rooms;
}

export async function addRoom(room: Room): Promise<void> {
  const db = await readDb();
  db.rooms.push(room);
  await writeDb(db);
}

export async function getItems(): Promise<Item[]> {
  const db = await readDb();
  return db.items || [];
}

export async function addItem(item: Item): Promise<void> {
  const db = await readDb();
  if (!db.items) db.items = [];
  db.items.push(item);
  await writeDb(db);
}

export async function getBookings(): Promise<Booking[]> {
  const db = await readDb();
  return db.bookings;
}

export async function addBooking(booking: Booking): Promise<void> {
  const db = await readDb();
  db.bookings.push(booking);
  await writeDb(db);
}

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
  adminId?: string;       // ID of the Admin who owns this room
}

export interface Item {
  id: string;
  name: string;
  category: string;
  currentLocation: string; // Where the item is currently located
  description: string;
  image?: string;
  adminId?: string;        // ID of the Admin who owns this item
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

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'employee';
  status: 'pending' | 'active';
  contactInfo?: string;
  createdAt: string;
  institutionName?: string; // For Admin: The name of their institution
  adminId?: string;         // For Employee: The ID of the Admin they belong to
  visibility?: 'public' | 'private'; // For Admin: Privacy status of their institution
}

export interface DatabaseSchema {
  rooms: Room[];
  items: Item[];
  bookings: Booking[];
  users: User[];
}

const dbPath = path.join(process.cwd(), 'src/data/db.json');

export async function readDb(): Promise<DatabaseSchema> {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    const parsed = JSON.parse(data);
    if (!parsed.users) parsed.users = [];
    return parsed;
  } catch (error) {
    console.error('Error reading database file, returning empty schema:', error);
    return { rooms: [], items: [], bookings: [], users: [] };
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

export async function addItems(items: Item[]): Promise<void> {
  const db = await readDb();
  if (!db.items) db.items = [];
  db.items.push(...items);
  await writeDb(db);
}

export async function updateItemLocation(id: string, newLocation: string): Promise<boolean> {
  const db = await readDb();
  if (!db.items) return false;
  
  const index = db.items.findIndex(i => i.id === id);
  if (index === -1) return false;
  
  db.items[index].currentLocation = newLocation;
  await writeDb(db);
  return true;
}

export async function getUsers(): Promise<User[]> {
  const db = await readDb();
  return db.users || [];
}

export async function getUserById(id: string): Promise<User | undefined> {
  const db = await readDb();
  return db.users?.find(u => u.id === id);
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const db = await readDb();
  return db.users?.find(u => u.username === username);
}

export async function addUser(user: User): Promise<void> {
  const db = await readDb();
  if (!db.users) db.users = [];
  db.users.push(user);
  await writeDb(db);
}

export async function updateUserStatus(id: string, status: 'pending' | 'active'): Promise<boolean> {
  const db = await readDb();
  if (!db.users) return false;
  
  const index = db.users.findIndex(u => u.id === id);
  if (index === -1) return false;
  
  db.users[index].status = status;
  await writeDb(db);
  return true;
}

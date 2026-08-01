import { supabase } from './supabase';

export interface Room {
  id: string;
  name: string;
  capacity: number;
  facilities: string[];
  computedFacilities?: string[];
  image: string;
  description: string;
  operatingHours: string;
  guidelines: string[];
  adminId?: string;
}

export interface Item {
  id: string;
  name: string;
  category: string;
  currentLocation: string;
  description: string;
  image?: string;
  adminId?: string;
}

export interface Booking {
  id: string;
  targetId: string;
  targetType: 'room' | 'item';
  user: string;
  contactInfo: string;
  date: string;
  startTime: string;
  endTime: string;
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
  institutionName?: string;
  adminId?: string;
  visibility?: 'public' | 'private';
}

export interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  performed_by: string;
  created_at: string;
}

export interface DatabaseSchema {
  rooms: Room[];
  items: Item[];
  bookings: Booking[];
  users: User[];
  activity_logs?: ActivityLog[];
}

export async function readDb(): Promise<DatabaseSchema> {
  const [
    { data: rooms },
    { data: items },
    { data: bookings },
    { data: users }
  ] = await Promise.all([
    supabase.from('rooms').select('*'),
    supabase.from('items').select('*'),
    supabase.from('bookings').select('*'),
    supabase.from('users').select('*')
  ]);
  
  return {
    rooms: rooms || [],
    items: items || [],
    bookings: bookings || [],
    users: users || []
  };
}

export async function getRooms(): Promise<Room[]> {
  const { data } = await supabase.from('rooms').select('*');
  return data || [];
}

export async function addRoom(room: Room): Promise<void> {
  const { error } = await supabase.from('rooms').insert([room]);
  if (error) throw new Error(error.message);
}

export async function updateRoom(id: string, updatedData: Partial<Room>): Promise<boolean> {
  const { error } = await supabase.from('rooms').update(updatedData).eq('id', id);
  return !error;
}

export async function deleteRoom(id: string): Promise<boolean> {
  await supabase.from('bookings').delete().eq('targetId', id);
  const { error } = await supabase.from('rooms').delete().eq('id', id);
  return !error;
}

export async function getItems(): Promise<Item[]> {
  const { data } = await supabase.from('items').select('*');
  return data || [];
}

export async function addItem(item: Item): Promise<void> {
  const { error } = await supabase.from('items').insert([item]);
  if (error) throw new Error(error.message);
}

export async function getBookings(): Promise<Booking[]> {
  const { data } = await supabase.from('bookings').select('*');
  return data || [];
}

export async function addBooking(booking: Booking): Promise<void> {
  const { error } = await supabase.from('bookings').insert([booking]);
  if (error) throw new Error(error.message);
}

export async function addBookings(bookings: Booking[]): Promise<void> {
  const { error } = await supabase.from('bookings').insert(bookings);
  if (error) throw new Error(error.message);
}

export async function deleteBooking(id: string): Promise<boolean> {
  const { error } = await supabase.from('bookings').delete().eq('id', id);
  return !error;
}

export async function addItems(items: Item[]): Promise<void> {
  const { error } = await supabase.from('items').insert(items);
  if (error) throw new Error(error.message);
}

export async function updateItemLocation(id: string, newLocation: string): Promise<boolean> {
  const { error } = await supabase.from('items').update({ currentLocation: newLocation }).eq('id', id);
  return !error;
}

export async function updateItem(id: string, updatedData: Partial<Item>): Promise<boolean> {
  const { error } = await supabase.from('items').update(updatedData).eq('id', id);
  return !error;
}

export async function deleteUser(id: string): Promise<boolean> {
  const { error } = await supabase.from('users').delete().eq('id', id);
  return !error;
}

export async function logActivity(action: string, entity_type: string, entity_id: string, details: string, performed_by: string): Promise<void> {
  const { error } = await supabase.from('activity_logs').insert([{
    action,
    entity_type,
    entity_id,
    details,
    performed_by
  }]);
  if (error) {
    console.error('Failed to log activity:', error);
  }
}

export async function getActivityLogs(): Promise<ActivityLog[]> {
  const { data, error } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Failed to get activity logs:', error);
    return [];
  }
  return data || [];
}

export async function deleteItem(id: string): Promise<boolean> {
  await supabase.from('bookings').delete().eq('targetId', id);
  const { error } = await supabase.from('items').delete().eq('id', id);
  return !error;
}

export async function getUsers(): Promise<User[]> {
  const { data } = await supabase.from('users').select('*');
  return data || [];
}

export async function getUserById(id: string): Promise<User | undefined> {
  const { data } = await supabase.from('users').select('*').eq('id', id).single();
  return data || undefined;
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const { data } = await supabase.from('users').select('*').eq('username', username).maybeSingle();
  return data || undefined;
}

export async function addUser(user: User): Promise<void> {
  const { error } = await supabase.from('users').insert([user]);
  if (error) throw new Error(error.message);
}

export async function updateUserStatus(id: string, status: 'pending' | 'active'): Promise<boolean> {
  const { error } = await supabase.from('users').update({ status }).eq('id', id);
  return !error;
}

export async function updateUserProfile(id: string, updatedData: Partial<User>): Promise<boolean> {
  const { error } = await supabase.from('users').update(updatedData).eq('id', id);
  return !error;
}

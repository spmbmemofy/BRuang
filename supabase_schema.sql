-- Skrip SQL untuk inisialisasi tabel Supabase untuk Aplikasi BRuang
-- Jalankan skrip ini di SQL Editor di dalam Dashboard Supabase Anda

-- 1. Buat Tabel Users
CREATE TABLE IF NOT EXISTS public.users (
  "id" text PRIMARY KEY,
  "username" text NOT NULL,
  "passwordHash" text NOT NULL,
  "role" text NOT NULL,
  "status" text NOT NULL,
  "contactInfo" text,
  "createdAt" text NOT NULL,
  "institutionName" text,
  "adminId" text,
  "visibility" text
);

-- 2. Buat Tabel Rooms
CREATE TABLE IF NOT EXISTS public.rooms (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "capacity" integer NOT NULL,
  "facilities" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "image" text NOT NULL,
  "description" text NOT NULL,
  "operatingHours" text NOT NULL,
  "guidelines" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "adminId" text
);

-- 3. Buat Tabel Items
CREATE TABLE IF NOT EXISTS public.items (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "category" text NOT NULL,
  "currentLocation" text NOT NULL,
  "description" text NOT NULL,
  "image" text,
  "adminId" text
);

-- 4. Buat Tabel Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  "id" text PRIMARY KEY,
  "targetId" text NOT NULL,
  "targetType" text NOT NULL,
  "user" text NOT NULL,
  "contactInfo" text NOT NULL,
  "date" text NOT NULL,
  "startTime" text NOT NULL,
  "endTime" text NOT NULL,
  "purpose" text NOT NULL,
  "createdAt" text NOT NULL
);

-- 5. Aktifkan RLS (Row Level Security) - Biarkan semuanya terbuka (public)
-- Karena aplikasi ini mengelola security di level API (Next.js server-side)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;

'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RoomCard from '@/components/RoomCard';
import ItemCard from '@/components/ItemCard';
import ThemeToggle from '@/components/ThemeToggle';
import { Room, Item } from '@/lib/db';

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default function PublicInstitutionPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const adminId = resolvedParams.id;

  const [activeTab, setActiveTab] = useState<'rooms' | 'items'>('rooms');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [selectedGroupItems, setSelectedGroupItems] = useState<any[]>([]);
  
  const [institutionName, setInstitutionName] = useState('Memuat Instansi...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [session, setSession] = useState<any>(null);

  const todayStr = new Date().toLocaleDateString('en-CA');

  useEffect(() => {
    // Check session
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setSession(data.user);
        }
      })
      .catch(() => {});

    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [roomsRes, itemsRes, bookingsRes, adminsRes] = await Promise.all([
          fetch(`/api/public/rooms?adminId=${adminId}`),
          fetch(`/api/public/items?adminId=${adminId}`),
          fetch(`/api/bookings?date=${todayStr}`),
          fetch('/api/public/institutions')
        ]);

        if (!roomsRes.ok || !itemsRes.ok) {
          throw new Error('Gagal memuat data instansi. Instansi mungkin bersifat privat atau tidak ditemukan.');
        }

        const roomsData = await roomsRes.json();
        const itemsData = await itemsRes.json();
        const bookingsData = await bookingsRes.json();
        const adminsData = await adminsRes.json();

        const currentInst = adminsData.find((a: any) => a.id === adminId);
        if (currentInst) {
          setInstitutionName(currentInst.institutionName);
        } else {
          setInstitutionName('Fasilitas Instansi');
        }

        setRooms(roomsData);
        setItems(itemsData);
        setBookings(bookingsData);
        setError(null);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Terjadi kesalahan saat memuat data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [adminId, todayStr]);

  const filteredRooms = rooms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedFilteredItems = Array.from(filteredItems.reduce((acc, item) => {
    const baseName = item.name.replace(/\s*-\s*\d+$/, '');
    const key = `${baseName}-${item.currentLocation}`;
    if (!acc.has(key)) {
      acc.set(key, { ...item, name: baseName, originalItems: [item] });
    } else {
      const group = acc.get(key);
      group.originalItems.push(item);
    }
    return acc;
  }, new Map()).values());

  const handleExpandGroup = (itemsToExpand: any[]) => {
    setSelectedGroupItems(itemsToExpand);
    setIsGroupModalOpen(true);
  };

  const getCurrentBookingForTarget = (targetId: string) => {
    const now = new Date();
    const currentTimeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
    return bookings.find(b => 
      b.targetId === targetId &&
      b.startTime <= currentTimeStr &&
      b.endTime > currentTimeStr
    );
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header glass-panel">
        <div className="brand-logo-container">
          <Link href="/" className="logo-icon" style={{ textDecoration: 'none' }}>⬅️</Link>
          <h1 className="logo-text">{institutionName}</h1>
          <span className="logo-tag">Etalase Publik</span>
        </div>
        
        <div className="header-actions">
          <ThemeToggle />
          {session ? (
            <Link href="/dashboard" className="btn-neon-outline" style={{ zIndex: 50, position: 'relative' }}>
              Buka Dashboard
            </Link>
          ) : (
            <Link href="/login" className="btn-neon-outline" style={{ zIndex: 50, position: 'relative' }}>
              Masuk / Daftar
            </Link>
          )}
        </div>
      </header>

      <main className="dashboard-main">
        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'rooms' ? 'active' : ''}`}
            onClick={() => { setActiveTab('rooms'); setSearchQuery(''); }}
          >
            🏢 Daftar Ruangan
          </button>
          <button 
            className={`tab-btn ${activeTab === 'items' ? 'active' : ''}`}
            onClick={() => { setActiveTab('items'); setSearchQuery(''); }}
          >
            📦 Daftar Barang
          </button>
        </div>

        <section className="dashboard-content">
          <div className="search-stats-section">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input 
                type="text" 
                placeholder={activeTab === 'rooms' ? 'Cari nama ruangan atau fasilitas...' : 'Cari nama barang atau kategori...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="spinner"></div>
            </div>
          ) : error ? (
            <div className="alert alert-danger glass-panel">{error}</div>
          ) : (
            <div className="cards-grid">
              {activeTab === 'rooms' && filteredRooms.map(room => {
                const currentBooking = getCurrentBookingForTarget(room.id);
                return (
                  <RoomCard
                    key={room.id}
                    room={room}
                    isOccupied={!!currentBooking}
                    occupiedUntil={currentBooking?.endTime}
                    onViewQR={() => {}}
                  />
                );
              })}
              
              {activeTab === 'items' && groupedFilteredItems.map(itemGroup => {
                if (itemGroup.originalItems.length > 1) {
                  return (
                    <ItemCard
                      key={itemGroup.id}
                      item={itemGroup}
                      isOccupied={false}
                      onViewLocation={() => {}}
                      isGroup={true}
                      groupCount={itemGroup.originalItems.length}
                      onExpandGroup={() => handleExpandGroup(itemGroup.originalItems)}
                    />
                  );
                } else {
                  const item = itemGroup.originalItems[0];
                  const currentBooking = getCurrentBookingForTarget(item.id);
                  return (
                    <ItemCard
                      key={item.id}
                      item={item}
                      isOccupied={!!currentBooking}
                      occupiedUntil={currentBooking?.endTime}
                      onViewLocation={() => {}}
                    />
                  );
                }
              })}

              {activeTab === 'rooms' && filteredRooms.length === 0 && (
                <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', gridColumn: '1 / -1' }}>
                  <p>Tidak ada ruangan yang tersedia.</p>
                </div>
              )}
              {activeTab === 'items' && filteredItems.length === 0 && (
                <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', gridColumn: '1 / -1' }}>
                  <p>Tidak ada barang yang tersedia.</p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Group Expansion Modal */}
      {isGroupModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsGroupModalOpen(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%', zIndex: 100 }}>
            <div className="modal-header">
              <h3>📋 Daftar Unit {selectedGroupItems.length > 0 ? selectedGroupItems[0].name.replace(/\s*-\s*\d+$/, '') : ''}</h3>
              <button className="close-btn" onClick={() => setIsGroupModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div className="cards-grid">
                {selectedGroupItems.map(item => {
                  const currentBooking = getCurrentBookingForTarget(item.id);
                  return (
                    <ItemCard
                      key={item.id}
                      item={item}
                      isOccupied={!!currentBooking}
                      occupiedUntil={currentBooking?.endTime}
                      onViewLocation={() => {}}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .dashboard-container { min-height: 100vh; display: flex; flex-direction: column; padding: 16px; max-width: 1200px; margin: 0 auto; gap: 20px; }
        .dashboard-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; }
        .brand-logo-container { display: flex; align-items: center; gap: 12px; }
        .logo-icon { font-size: 1.8rem; cursor: pointer; }
        .logo-text { font-size: 1.4rem; font-weight: 800; color: var(--foreground); letter-spacing: -0.5px; margin: 0; }
        .logo-tag { background: rgba(99, 102, 241, 0.15); color: var(--primary); padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; display: none; }
        @media (min-width: 640px) { .logo-tag { display: inline-block; } }
        .header-actions { display: flex; align-items: center; gap: 12px; }
        .dashboard-main { flex-grow: 1; }
        .tabs-container { display: flex; gap: 4px; background: var(--bg-card); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glow); margin-bottom: 16px; }
        .tab-btn { flex: 1; padding: 10px 16px; font-size: 0.95rem; font-weight: 600; color: var(--text-muted); background: transparent; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; }
        .tab-btn:hover { color: var(--foreground); background: rgba(255,255,255,0.05); }
        .tab-btn.active { background: var(--primary); color: white; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }
        .search-stats-section { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
        .search-box { position: relative; width: 100%; border-radius: 8px; overflow: hidden; background: var(--bg-card); border-color: var(--border-glow); box-shadow: 0 2px 10px var(--shadow-color); }
        .search-box input { width: 100%; padding: 14px 14px 14px 44px; font-size: 0.95rem; background: transparent; color: var(--foreground); border: 1px solid transparent; outline: none; }
        .search-box input:focus { border-color: var(--primary); }
        .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 1.2rem; }
        .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
      `}</style>
    </div>
  );
}

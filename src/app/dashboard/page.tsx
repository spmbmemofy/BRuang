'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import RoomCard from '@/components/RoomCard';
import ItemCard from '@/components/ItemCard';
import QRCodeModal from '@/components/QRCodeModal';
import ThemeToggle from '@/components/ThemeToggle';
import { Room, Item } from '@/lib/db';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'rooms' | 'items' | 'users'>('rooms');
  
  const [session, setSession] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  // Add Room Modal State
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [capacity, setCapacity] = useState(10);
  const [operatingHours, setOperatingHours] = useState('08:00 - 17:00');
  const [facilities, setFacilities] = useState('');
  const [roomGuidelines, setRoomGuidelines] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  
  // Add Item Modal State
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemLocation, setItemLocation] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);

  // Submit States
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // QR Modal State
  const [qrModal, setQrModal] = useState<{
    isOpen: boolean;
    target: Room | null;
    url: string;
  }>({
    isOpen: false,
    target: null,
    url: '',
  });

  const todayStr = new Date().toLocaleDateString('en-CA'); 

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [roomsRes, itemsRes, bookingsRes, meRes] = await Promise.all([
        fetch('/api/rooms'),
        fetch('/api/items'),
        fetch(`/api/bookings?date=${todayStr}`),
        fetch('/api/auth/me')
      ]);

      if (!roomsRes.ok || !itemsRes.ok || !bookingsRes.ok || !meRes.ok) {
        throw new Error('Gagal memuat data');
      }

      const roomsData = await roomsRes.json();
      const itemsData = await itemsRes.json();
      const bookingsData = await bookingsRes.json();
      const meData = await meRes.json();
      
      setSession(meData.user);

      if (meData.user?.role === 'admin') {
        const usersRes = await fetch('/api/users');
        if (usersRes.ok) setUsers(await usersRes.json());
      }

      setRooms(roomsData);
      setItems(itemsData);
      setBookings(bookingsData);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Terjadi kesalahan saat memuat data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayStr]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const handleApproveUser = async (userId: string, status: 'active' | 'pending') => {
    try {
      await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, status })
      });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!roomName.trim() || !roomDescription.trim() || !operatingHours.trim() || !roomGuidelines.trim()) {
      setSubmitError('Semua field ruangan wajib diisi.');
      setSubmitLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roomName.trim(),
          capacity,
          description: roomDescription,
          operatingHours: operatingHours.trim(),
          guidelines: roomGuidelines,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal menyimpan ruangan.');

      setSubmitSuccess(true);
      setRoomName(''); setCapacity(10); setOperatingHours('08:00 - 17:00'); setFacilities(''); setRoomGuidelines(''); setRoomDescription('');
      await fetchData();
      setTimeout(() => { setIsAddRoomOpen(false); setSubmitSuccess(false); }, 1500);
    } catch (err: any) {
      setSubmitError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAddItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!itemName.trim() || !itemCategory.trim() || !itemLocation.trim() || !itemDescription.trim()) {
      setSubmitError('Semua field barang wajib diisi.');
      setSubmitLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: itemName.trim(),
          category: itemCategory.trim(),
          currentLocation: itemLocation.trim(),
          description: itemDescription.trim(),
          quantity: itemQuantity,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal menyimpan barang.');

      setSubmitSuccess(true);
      setItemName(''); setItemCategory(''); setItemLocation(''); setItemDescription(''); setItemQuantity(1);
      await fetchData();
      setTimeout(() => { setIsAddItemOpen(false); setSubmitSuccess(false); }, 1500);
    } catch (err: any) {
      setSubmitError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getCurrentBookingForTarget = (targetId: string) => {
    const now = new Date();
    const currentHourMin = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return bookings.find(
      b => b.targetId === targetId && currentHourMin >= b.startTime && currentHourMin <= b.endTime
    );
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = 
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (room.computedFacilities || room.facilities).some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.currentLocation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenQR = (target: Room | Item) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    // Use target.category as a proxy to check if it's an Item since Item has category, Room has facilities
    const isItem = 'category' in target;
    const url = `${baseUrl}/${isItem ? 'items' : 'rooms'}/${target.id}`;
    
    setQrModal({ isOpen: true, target: target as Room, url }); // Casting to Room to reuse existing modal prop
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header glass-panel">
        <div className="brand-logo-container">
          <span className="logo-icon">🏢</span>
          <h1 className="logo-text">AsetInstansi</h1>
          <span className="logo-tag">Manajemen Ruang & Barang</span>
        </div>
        
        <div className="header-actions">
          <span className="user-greeting">Hai, {session?.username}</span>
          <ThemeToggle />
          
          {session?.role === 'admin' && (
            <Link href="/profile" className="btn-neon-outline" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
              Profil Instansi
            </Link>
          )}

          <button type="button" onClick={handleLogout} className="btn-neon-outline cancel-btn" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
            Logout
          </button>


          {session?.role === 'admin' && activeTab === 'rooms' && (
            <button type="button" onClick={() => setIsAddRoomOpen(true)} className="btn-neon add-btn-header">
              ➕ Tambah Ruangan
            </button>
          )}
          {session?.role === 'admin' && activeTab === 'items' && (
            <button type="button" onClick={() => setIsAddItemOpen(true)} className="btn-neon add-btn-header bg-emerald-600 hover:bg-emerald-700 border-emerald-500">
              ➕ Tambah Barang
            </button>
          )}
        </div>
      </header>

      <main className="dashboard-main">
        {/* Custom Tabs */}
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
          {session?.role === 'admin' && (
            <button 
              className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
            >
              👥 Manajemen Karyawan
            </button>
          )}
        </div>

        {activeTab !== 'users' && (
          <section className="search-stats-section mt-4">
            <div className="search-box glass-panel">
              <span className="search-icon">🔍</span>
              <input 
                type="text" 
                placeholder={`Cari nama ${activeTab === 'rooms' ? 'ruangan, fasilitas' : 'barang, kategori, lokasi'}...`} 
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="compact-stats-bar">
              {activeTab === 'rooms' ? (
                <>
                  <span className="stat-pill pill-purple">🔑 <strong>{rooms.length}</strong> Ruangan</span>
                  <span className="stat-pill pill-teal">🟢 <strong>{rooms.length - rooms.filter(r => !!getCurrentBookingForTarget(r.id)).length}</strong> Tersedia</span>
                </>
              ) : (
                <>
                  <span className="stat-pill pill-purple">📦 <strong>{items.length}</strong> Barang</span>
                  <span className="stat-pill pill-teal">🟢 <strong>{items.length - items.filter(i => !!getCurrentBookingForTarget(i.id)).length}</strong> Tersedia</span>
                </>
              )}
              <span className="stat-pill pill-blue">📅 <strong>{bookings.length}</strong> Booking Aktif Hari Ini</span>
            </div>
          </section>
        )}

        <section className="listing-section">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Sedang memuat data...</p>
            </div>
          ) : error ? (
            <div className="error-state glass-panel">
              <span className="error-icon">⚠️</span>
              <p>{error}</p>
            </div>
          ) : activeTab === 'rooms' && filteredRooms.length === 0 ? (
            <div className="empty-state glass-panel">
              <span className="empty-search-icon">🔍</span>
              <h3>Ruangan Tidak Ditemukan</h3>
            </div>
          ) : activeTab === 'items' && filteredItems.length === 0 ? (
            <div className="empty-state glass-panel">
              <span className="empty-search-icon">📦</span>
              <h3>Barang Tidak Ditemukan</h3>
            </div>
          ) : (
            <div className="grid-container">
              {activeTab === 'rooms' && filteredRooms.map(room => {
                const currentBooking = getCurrentBookingForTarget(room.id);
                return (
                  <RoomCard
                    key={room.id}
                    room={room}
                    isOccupied={!!currentBooking}
                    occupiedUntil={currentBooking?.endTime}
                    onViewQR={() => handleOpenQR(room)}
                  />
                );
              })}
              
              {activeTab === 'items' && filteredItems.map(item => {
                const currentBooking = getCurrentBookingForTarget(item.id);
                return (
                  <ItemCard
                    key={item.id}
                    item={item}
                    isOccupied={!!currentBooking}
                    occupiedUntil={currentBooking?.endTime}
                    onViewLocation={() => handleOpenQR(item)}
                  />
                );
              })}

              {activeTab === 'users' && users.map(user => (
                <div key={user.id} className="glass-panel" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ color: 'var(--foreground)' }}>{user.username}</h4>
                      <span className={`stat-pill ${user.status === 'active' ? 'pill-teal' : 'pill-pink'}`}>
                        {user.status === 'active' ? 'Aktif' : 'Menunggu Persetujuan'}
                      </span>
                      <span className="stat-pill pill-purple" style={{ marginLeft: '8px' }}>Role: {user.role}</span>
                    </div>
                    {user.status === 'pending' && (
                      <button 
                        className="btn-neon" 
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={() => handleApproveUser(user.id, 'active')}
                      >
                        Setujui
                      </button>
                    )}
                    {user.status === 'active' && user.role !== 'admin' && (
                      <button 
                        className="btn-neon-outline cancel-btn" 
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={() => handleApproveUser(user.id, 'pending')}
                      >
                        Tangguhkan
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Add Room Modal */}
      {isAddRoomOpen && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel animate-slide-up">
            <div className="modal-header">
              <h3>➕ Tambahkan Ruangan Baru</h3>
              <button className="close-btn" onClick={() => setIsAddRoomOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleAddRoomSubmit} className="modal-body-form">
              {submitSuccess && <div className="alert alert-success">✅ Berhasil disimpan!</div>}
              {submitError && <div className="alert alert-danger">❌ {submitError}</div>}

              <div className="form-group">
                <label className="form-label">Nama Ruangan</label>
                <input type="text" className="form-input" value={roomName} onChange={(e) => setRoomName(e.target.value)} required />
              </div>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">Kapasitas</label>
                  <input type="number" min="1" className="form-input" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} required />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Jam Operasional</label>
                  <input type="text" className="form-input" value={operatingHours} onChange={(e) => setOperatingHours(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Peraturan (Tulis per baris)</label>
                <textarea className="form-input textarea-input" rows={2} value={roomGuidelines} onChange={(e) => setRoomGuidelines(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Deskripsi</label>
                <textarea className="form-input textarea-input" rows={2} value={roomDescription} onChange={(e) => setRoomDescription(e.target.value)} required />
              </div>

              <div className="modal-footer-btn">
                <button type="button" className="btn-neon-outline cancel-btn" onClick={() => setIsAddRoomOpen(false)}>Batal</button>
                <button type="submit" disabled={submitLoading} className="btn-neon">{submitLoading ? 'Menyimpan...' : '💾 Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {isAddItemOpen && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel animate-slide-up">
            <div className="modal-header">
              <h3>➕ Daftarkan Barang Baru</h3>
              <button className="close-btn" onClick={() => setIsAddItemOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleAddItemSubmit} className="modal-body-form">
              {submitSuccess && <div className="alert alert-success">✅ Berhasil disimpan!</div>}
              {submitError && <div className="alert alert-danger">❌ {submitError}</div>}

              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">Nama Barang</label>
                  <input type="text" placeholder="Contoh: Proyektor Infocus" className="form-input" value={itemName} onChange={(e) => setItemName(e.target.value)} required />
                </div>
                <div className="form-group" style={{ width: '120px' }}>
                  <label className="form-label">Jumlah</label>
                  <input type="number" min="1" max="100" className="form-input" value={itemQuantity} onChange={(e) => setItemQuantity(Number(e.target.value))} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">Kategori</label>
                  <select className="form-input" value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} required>
                    <option value="">-- Pilih Kategori --</option>
                    <option value="Elektronik">Elektronik</option>
                    <option value="Mebel & Furnitur">Mebel & Furnitur</option>
                    <option value="Alat Tulis & Kantor">Alat Tulis & Kantor</option>
                    <option value="Perangkat IT">Perangkat IT</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">Lokasi Penyimpanan (Pilih Ruangan)</label>
                  <select className="form-input" value={itemLocation} onChange={(e) => setItemLocation(e.target.value)} required>
                    <option value="">-- Pilih Ruangan --</option>
                    {rooms.map(room => (
                      <option key={room.id} value={room.name}>{room.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Deskripsi / Catatan Tambahan</label>
                <textarea placeholder="Kondisi kelengkapan barang..." className="form-input textarea-input" rows={3} value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} required />
              </div>

              <div className="modal-footer-btn">
                <button type="button" className="btn-neon-outline cancel-btn" onClick={() => setIsAddItemOpen(false)}>Batal</button>
                <button type="submit" disabled={submitLoading} className="btn-neon bg-emerald-600 border-emerald-500 hover:bg-emerald-700">{submitLoading ? 'Menyimpan...' : '💾 Simpan Barang'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {qrModal.target && (
        <QRCodeModal
          isOpen={qrModal.isOpen}
          onClose={() => setQrModal({ isOpen: false, target: null, url: '' })}
          roomName={qrModal.target.name}
          roomUrl={qrModal.url}
        />
      )}

      <style jsx>{`
        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px 16px 40px 16px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 20px;
          margin-bottom: 16px;
          background: var(--bg-card);
          flex-wrap: wrap;
          gap: 12px;
        }

        .brand-logo-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .logo-icon { font-size: 1.5rem; }
        .logo-text {
          font-size: 1.4rem; font-weight: 800; letter-spacing: -0.03em;
          background: linear-gradient(135deg, var(--foreground) 40%, var(--primary) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .logo-tag {
          font-size: 0.7rem; color: var(--text-muted); background: var(--bg-slate);
          padding: 2px 6px; border-radius: 4px; font-weight: 600; display: none;
        }

        @media (min-width: 640px) { .logo-tag { display: inline-block; } }

        .header-actions { display: flex; align-items: center; gap: 12px; }
        .add-btn-header { padding: 6px 14px; font-size: 0.8rem; border-radius: 6px; }

        .user-greeting {
          font-size: 0.9rem;
          color: var(--text-muted);
          font-weight: 500;
          display: none;
        }

        @media (min-width: 640px) { .user-greeting { display: block; } }

        .dashboard-main { flex-grow: 1; }

        /* Tabs Styling */
        .tabs-container {
          display: flex;
          gap: 4px;
          background: var(--bg-card);
          padding: 4px;
          border-radius: 12px;
          border: 1px solid var(--border-glow);
          margin-bottom: 16px;
        }

        .tab-btn {
          flex: 1;
          padding: 10px 16px;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-muted);
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tab-btn:hover { color: var(--foreground); background: rgba(255,255,255,0.05); }
        .tab-btn.active {
          background: var(--primary);
          color: white;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .search-stats-section { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
        .search-box {
          position: relative; width: 100%; border-radius: 8px; overflow: hidden;
          background: var(--bg-card); border-color: var(--border-glow); box-shadow: 0 2px 10px var(--shadow-color);
        }
        .search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-size: 1rem; color: var(--text-muted); }
        .search-input { width: 100%; padding: 12px 16px 12px 44px; background: transparent; border: none; color: var(--foreground); font-family: var(--font-jakarta); font-size: 0.95rem; }
        .search-input:focus { outline: none; }

        .compact-stats-bar { display: flex; gap: 8px; flex-wrap: wrap; }
        .stat-pill { font-size: 0.72rem; font-weight: 500; padding: 4px 10px; border-radius: 12px; border: 1px solid var(--border-glow); background: var(--bg-card); color: var(--text-light); }
        .stat-pill strong { color: var(--foreground); }
        .pill-purple { border-color: rgba(168, 85, 247, 0.2); }
        .pill-teal { border-color: rgba(20, 184, 166, 0.2); }
        .pill-pink { border-color: rgba(239, 68, 68, 0.2); }
        .pill-blue { border-color: rgba(99, 102, 241, 0.2); }

        .listing-section { margin-top: 10px; }
        .loading-state, .error-state, .empty-state { text-align: center; padding: 30px 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        
        .spinner { width: 32px; height: 32px; border: 3px solid rgba(99, 102, 241, 0.1); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s infinite linear; margin-bottom: 10px; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .error-icon, .empty-search-icon { font-size: 2rem; margin-bottom: 10px; }
        .empty-state h3 { font-size: 1.1rem; color: var(--foreground); margin-bottom: 4px; }

        .modal-backdrop {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(8, 7, 17, 0.85); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s ease-out; padding: 20px;
        }
        .modal-content {
          width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; padding: 24px;
          background: var(--modal-bg); border: 1px solid var(--border-glow-hover); box-shadow: 0 20px 50px var(--shadow-hover-color);
        }
        .modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(148, 163, 184, 0.1); padding-bottom: 12px; margin-bottom: 16px; }
        .modal-header h3 { font-size: 1.25rem; color: var(--foreground); }
        .close-btn { background: none; border: none; color: var(--text-muted); font-size: 1.75rem; cursor: pointer; transition: color 0.2s; }
        .close-btn:hover { color: var(--error); }
        .modal-body-form { display: flex; flex-direction: column; }
        .form-row { display: flex; gap: 16px; }
        .flex-1 { flex: 1; }
        .textarea-input { resize: vertical; }
        
        .modal-footer-btn { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(148, 163, 184, 0.1); }
        .modal-footer-btn :global(.btn-neon), .modal-footer-btn :global(.btn-neon-outline) { padding: 10px 20px; font-size: 0.85rem; }

        .alert { padding: 12px 16px; border-radius: 8px; font-size: 0.85rem; margin-bottom: 16px; line-height: 1.5; }
        .alert-success { background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); color: var(--success); }
        .alert-danger { background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); color: var(--error); }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }

        @media (max-width: 640px) {
          .dashboard-header { flex-direction: column; gap: 12px; padding: 12px; align-items: flex-start; }
          .header-actions { width: 100%; justify-content: space-between; }
          .form-row { flex-direction: column; gap: 0; }
        }
      `}</style>
    </div>
  );
}

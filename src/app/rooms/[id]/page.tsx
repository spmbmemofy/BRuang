'use client';

import React, { useState, useEffect, use } from 'react';
import LinkItem from 'next/link';
import MonthlyCalendar from '@/components/MonthlyCalendar';
import ThemeToggle from '@/components/ThemeToggle';
import { Room, Booking } from '@/lib/db';

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default function RoomDetailPage({ params }: PageProps) {
  // Unwrap params
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const roomId = resolvedParams.id;

  const [room, setRoom] = useState<Room | null>(null);
  const [allBookings, setAllBookings] = useState<Booking[]>([]); // All bookings for this room
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'booking' | 'settings'>('booking');

  // Edit/Delete States
  const [editLoading, setEditLoading] = useState(false);
  const [editMsg, setEditMsg] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Calendar State
  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const bookedDates = Array.from(new Set(allBookings.map(b => b.date)));

  // Filter bookings for the selected date
  const bookingsForSelectedDate = allBookings.filter(b => b.date === selectedDate).sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Modal Booking State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [purpose, setPurpose] = useState('');
  
  // Recurrence Form State
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState('weekly'); // daily, weekly, monthly
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  // Form Status State
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitConflicts, setSubmitConflicts] = useState<Booking[]>([]);


  // Calculate maximum recurrence date (3 months from current selected date)
  const getMaxRecurrenceDate = () => {
    try {
      const d = new Date(selectedDate);
      d.setMonth(d.getMonth() + 3);
      return d.toLocaleDateString('en-CA');
    } catch {
      return '';
    }
  };

  // Fetch Room & All Bookings
  const fetchRoomAndBookings = async () => {
    try {
      setLoading(true);
      
      const roomRes = await fetch(`/api/public/room-details?roomId=${roomId}`);
      if (!roomRes.ok) throw new Error('Gagal mengambil data ruangan atau ruangan bersifat privat.');
      const currentRoom: Room = await roomRes.json();
      
      setRoom(currentRoom);

      // Fetch all bookings for this room (not just for one date)
      const [bookingsRes, meRes] = await Promise.all([
        fetch(`/api/bookings?targetId=${roomId}`),
        fetch('/api/auth/me')
      ]);

      if (!bookingsRes.ok) throw new Error('Gagal mengambil jadwal pemakaian.');
      const bookingsData = await bookingsRes.json();
      setAllBookings(bookingsData);
      
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.user) {
          setUserName(meData.user.username);
          setContactInfo(meData.user.contactInfo || '');
        }
      }

      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomAndBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // Set default recurrence end date when recurrence toggled
  useEffect(() => {
    if (isRecurring && !recurrenceEndDate) {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 14); // 2 weeks default
      setRecurrenceEndDate(d.toLocaleDateString('en-CA'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecurring]);

  // Edit Handlers
  const handleEditRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;
    setEditLoading(true);
    setEditMsg('');
    try {
      const res = await fetch(`/api/rooms/${room.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: room.name,
          description: room.description,
          capacity: room.capacity,
          facilities: room.facilities,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan perubahan');
      setEditMsg('✅ Perubahan berhasil disimpan!');
      fetchRoomAndBookings();
    } catch (err: any) {
      setEditMsg(`❌ ${err.message}`);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!room) return;
    if (!confirm('Apakah Anda yakin ingin menghapus ruangan ini beserta seluruh riwayat peminjamannya? Tindakan ini tidak dapat dibatalkan.')) return;
    
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/rooms/${room.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus ruangan');
      window.location.href = '/dashboard';
    } catch (err: any) {
      alert(`Error: ${err.message}`);
      setDeleteLoading(false);
    }
  };

  // Form submission handler
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitSuccess(null);
    setSubmitError(null);
    setSubmitConflicts([]);

    if (!userName.trim() || !contactInfo.trim() || !purpose.trim()) {
      setSubmitError('Nama pemesan, kontak, dan keperluan wajib diisi.');
      setSubmitLoading(false);
      return;
    }

    if (startTime >= endTime) {
      setSubmitError('Waktu selesai harus lebih lambat dari waktu mulai.');
      setSubmitLoading(false);
      return;
    }

    if (isRecurring && !recurrenceEndDate) {
      setSubmitError('Harap tentukan batas akhir tanggal pengulangan.');
      setSubmitLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetId: roomId,
          targetType: 'room',
          user: userName,
          contactInfo,
          date: selectedDate,
          startTime,
          endTime,
          purpose,
          recurrence: isRecurring ? recurrence : 'none',
          recurrenceEndDate: isRecurring ? recurrenceEndDate : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitError(data.error || 'Gagal membuat booking.');
        if (data.conflictDetails) {
          // Remove duplicate conflicts by ID just in case
          const uniqueConflicts = data.conflictDetails.filter((v: Booking, i: number, a: Booking[]) => a.findIndex(t => (t.id === v.id)) === i);
          setSubmitConflicts(uniqueConflicts);
        }
        setSubmitLoading(false);
        return;
      }

      setSubmitSuccess(data.message || 'Booking berhasil dibuat!');
      setPurpose('');
      setIsRecurring(false);
      setRecurrenceEndDate('');
      setContactInfo('');
      
      // Refresh bookings
      await fetchRoomAndBookings();
      
      setTimeout(() => {
        setSubmitSuccess(null);
        setIsBookingModalOpen(false); // Auto close modal after success
      }, 2000);
    } catch (err: any) {
      setSubmitError('Terjadi kesalahan koneksi. Silakan coba lagi.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getGradient = (id: string) => {
    switch (id) {
      case 'ruang-kreatif': return 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)';
      case 'ruang-kolaborasi': return 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)';
      case 'ruang-fokus': return 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)';
      case 'auditorium': return 'linear-gradient(135deg, #f59e0b 0%, #e11d48 100%)';
      default:
        const charSum = id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const hue1 = charSum % 360;
        const hue2 = (hue1 + 60) % 360;
        return `linear-gradient(135deg, hsl(${hue1}, 75%, 60%) 0%, hsl(${hue2}, 75%, 50%) 100%)`;
    }
  };

  const formatIndonesianDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  if (loading && !room) {
    return (
      <div className="room-detail-container loading-container">
        <ThemeToggle />
        <div className="spinner"></div>
        <p>Sedang memuat data ruangan...</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="room-detail-container">
        <div className="error-card glass-panel">
          <span className="error-icon">⚠️</span>
          <h2>Gagal Memuat Ruangan</h2>
          <p>{error || 'Ruangan yang Anda cari tidak terdaftar.'}</p>
          <LinkItem href="/" className="btn-neon mt-4">kembali ke Dashboard</LinkItem>
        </div>
      </div>
    );
  }

  return (
    <div className="room-detail-container">
      <div className="detail-header-nav">
        <LinkItem href="/" className="back-link">⬅️ Kembali ke Dashboard</LinkItem>
        <ThemeToggle />
      </div>

      <div className="layout-grid">
        {/* Left Column: Room Profile */}
        <div className="layout-col-left">
          <section className="glass-panel room-profile-card hero-section">
            <div className="room-visual-banner" style={{ background: getGradient(room.id) }}>
              <span className="banner-logo">BRuang</span>
            </div>
            
            <div className="profile-content">
              <h2 className="profile-name">{room.name}</h2>
              <p className="profile-desc">{room.description}</p>
              
              <div className="profile-specs-grid">
                <div className="spec-box">
                  <span className="spec-label">👥 Kapasitas:</span>
                  <span className="spec-val">{room.capacity} Orang</span>
                </div>
                <div className="spec-box">
                  <span className="spec-label">🕒 Operasional:</span>
                  <span className="spec-val">{room.operatingHours}</span>
                </div>
              </div>

              <div className="profile-facilities">
                <h5>Fasilitas Ruangan:</h5>
                <div className="facility-tags">
                  {(room.computedFacilities || room.facilities).map((fac, idx) => (
                    <span key={idx} className="facility-pill">{fac}</span>
                  ))}
                </div>
              </div>

              <div className="profile-guidelines">
                <h5>⚠️ Peraturan / Aturan Ruangan:</h5>
                <ul className="guidelines-list">
                  {room.guidelines.map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Calendar & Booking List OR Settings */}
        <div className="layout-col-right">
          {/* Tabs for Room Actions */}
          <div className="tabs-container">
            <button 
              className={`tab-btn ${activeTab === 'booking' ? 'active' : ''}`}
              onClick={() => setActiveTab('booking')}
            >
              📅 Jadwal Peminjaman
            </button>
            <button 
              className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              ⚙️ Pengaturan Ruangan
            </button>
          </div>

          <div style={{ display: activeTab === 'booking' ? 'block' : 'none' }}>
            <MonthlyCalendar 
              selectedDate={selectedDate} 
              onSelectDate={setSelectedDate} 
              bookedDates={bookedDates} 
            />

            <div className="glass-panel booking-list-panel mt-4">
              <div className="list-header">
              <div>
                <h3>📅 Jadwal Pemakaian</h3>
                <p className="selected-date-text">{formatIndonesianDate(selectedDate)}</p>
              </div>
              <button className="btn-neon" onClick={() => setIsBookingModalOpen(true)}>
                ➕ Buat Peminjaman
              </button>
            </div>

            {bookingsForSelectedDate.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🟢</span>
                <p>Ruangan kosong dan tersedia sepanjang hari.</p>
              </div>
            ) : (
              <div className="timeline-list">
                {bookingsForSelectedDate.map(booking => (
                  <div key={booking.id} className="timeline-item">
                    <div className="time-badge">
                      {booking.startTime} - {booking.endTime}
                    </div>
                    <div className="booking-details">
                      <strong>{booking.user}</strong>
                      <p>{booking.purpose}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>
          
          {activeTab === 'settings' && (
            <div className="settings-panel animate-slide-up mt-4">
              <div className="glass-panel p-6">
                <h3 className="mb-4">Edit Data Ruangan</h3>
                <form onSubmit={handleEditRoom} className="edit-form">
                  <div className="form-group mb-4">
                    <label className="form-label text-sm text-muted">Nama Ruangan</label>
                    <input type="text" className="form-input" value={room.name} onChange={e => setRoom({...room, name: e.target.value})} required />
                  </div>
                  <div className="form-group mb-4">
                    <label className="form-label text-sm text-muted">Kapasitas</label>
                    <input type="number" className="form-input" value={room.capacity} onChange={e => setRoom({...room, capacity: parseInt(e.target.value) || 0})} required />
                  </div>
                  <div className="form-group mb-4">
                    <label className="form-label text-sm text-muted">Deskripsi</label>
                    <textarea className="form-input" rows={3} value={room.description} onChange={e => setRoom({...room, description: e.target.value})} required></textarea>
                  </div>
                  <div className="form-group mb-4">
                    <label className="form-label text-sm text-muted">Fasilitas (pisahkan dengan koma)</label>
                    <input type="text" className="form-input" value={room.facilities.join(', ')} onChange={e => setRoom({...room, facilities: e.target.value.split(',').map(f => f.trim()).filter(Boolean)})} required />
                  </div>
                  <button type="submit" disabled={editLoading} className="btn-neon w-full">
                    {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                  {editMsg && <p className={`mt-2 text-sm ${editMsg.startsWith('✅') ? 'text-emerald-400' : 'text-red-400'}`}>{editMsg}</p>}
                </form>
              </div>

              <div className="glass-panel p-6 mt-6 border-red-500" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
                <h3 className="text-red-400 mb-2">Zona Berbahaya</h3>
                <p className="text-sm text-muted mb-4">Tindakan menghapus ruangan akan menghapus semua jadwal secara permanen.</p>
                <button type="button" onClick={handleDeleteRoom} disabled={deleteLoading} className="btn-neon-outline w-full" style={{ color: '#ef4444', borderColor: '#ef4444' }}>
                  {deleteLoading ? 'Menghapus...' : '🗑️ Hapus Ruangan Ini'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel animate-slide-up">
            <div className="modal-header">
              <h3>📝 Form Booking: {room.name}</h3>
              <button className="close-btn" onClick={() => setIsBookingModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleBookingSubmit} className="modal-body-form">
              <div className="booking-date-display mb-4">
                Tanggal: <strong>{formatIndonesianDate(selectedDate)}</strong>
              </div>

              {submitSuccess && (
                <div className="alert alert-success">✅ <strong>Berhasil!</strong> {submitSuccess}</div>
              )}
              {submitError && (
                <div className="alert alert-danger">
                  ❌ {submitError}
                  {submitConflicts.length > 0 && (
                    <div className="conflict-list mt-3">
                      <strong>Detail Jadwal yang Bentrok:</strong>
                      {submitConflicts.map(conflict => (
                        <div key={conflict.id} className="conflict-item">
                          <p>👤 <strong>{conflict.user}</strong> (Kegiatan: {conflict.purpose})</p>
                          <p>🕒 {conflict.date} | {conflict.startTime} - {conflict.endTime}</p>
                          <a 
                            href={`https://wa.me/${conflict.contactInfo.replace(/[^0-9]/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn-wa mt-2"
                          >
                            💬 Hubungi via WA
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label" htmlFor="user-name">Nama Pemesan</label>
                  <input id="user-name" type="text" className="form-input" value={userName} onChange={(e) => setUserName(e.target.value)} required readOnly />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label" htmlFor="contact-info">No. WhatsApp</label>
                  <input id="contact-info" type="text" placeholder="08123..." className="form-input" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label" htmlFor="start-time">Jam Mulai</label>
                  <input id="start-time" type="time" className="form-input" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label" htmlFor="end-time">Jam Selesai</label>
                  <input id="end-time" type="time" className="form-input" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                </div>
              </div>

              <div className="recurrence-section">
                <label className="checkbox-container">
                  <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
                  <span className="checkbox-checkmark"></span>
                  <span className="checkbox-label">🔄 Jadwalkan Berulang (Recurring Booking)</span>
                </label>

                {isRecurring && (
                  <div className="recurrence-panel glass-panel animate-slide-down">
                    <div className="form-row">
                      <div className="form-group flex-1">
                        <label className="form-label">Pola</label>
                        <select className="form-input select-input" value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
                          <option value="daily">Setiap Hari</option>
                          <option value="weekly">Setiap Minggu</option>
                          <option value="monthly">Setiap Bulan</option>
                        </select>
                      </div>
                      <div className="form-group flex-1">
                        <label className="form-label">Batas Akhir Pengulangan (Tanggal)</label>
                        <input type="date" className="form-input" value={recurrenceEndDate} onChange={(e) => setRecurrenceEndDate(e.target.value)} min={selectedDate} max={getMaxRecurrenceDate()} required />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Keperluan / Agenda</label>
                <input type="text" placeholder="Contoh: Rapat Evaluasi..." className="form-input" value={purpose} onChange={(e) => setPurpose(e.target.value)} required />
              </div>

              <div className="modal-footer-btn">
                <button type="button" className="btn-neon-outline cancel-btn" onClick={() => setIsBookingModalOpen(false)}>Batal</button>
                <button type="submit" disabled={submitLoading} className="btn-neon submit-btn">
                  {submitLoading ? 'Memproses...' : '🚀 Booking Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .room-detail-container {
          max-width: 1200px; margin: 0 auto; padding: 24px 16px 80px 16px; min-height: 100vh;
        }

        .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .spinner { width: 45px; height: 45px; border: 3px solid rgba(99, 102, 241, 0.1); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s infinite linear; margin-bottom: 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .error-card { text-align: center; padding: 48px; max-width: 500px; margin: 100px auto 0 auto; border-color: rgba(239, 68, 68, 0.2); }
        .error-icon { font-size: 3rem; margin-bottom: 16px; display: block; }

        .mt-4 { margin-top: 1rem; }
        .mb-4 { margin-bottom: 1rem; }
        
        .detail-header-nav { margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
        .back-link { font-family: var(--font-outfit); color: var(--text-light); font-size: 0.95rem; font-weight: 600; transition: color 0.2s; display: inline-flex; align-items: center; }
        .back-link:hover { color: var(--foreground); text-decoration: underline; }

        .layout-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 900px) {
          .layout-grid { grid-template-columns: 1fr; }
        }

        .room-profile-card { overflow: hidden; height: 100%; }
        .room-visual-banner { height: 120px; display: flex; align-items: center; padding: 0 24px; }
        .banner-logo { font-family: var(--font-outfit); font-size: 2.2rem; font-weight: 800; color: rgba(255, 255, 255, 0.25); letter-spacing: -0.04em; }
        
        .profile-content { padding: 24px; }
        .profile-name { font-size: 1.8rem; color: var(--foreground); margin-bottom: 12px; line-height: 1.2; }
        .profile-desc { font-size: 0.9rem; color: var(--text-light); line-height: 1.6; margin-bottom: 20px; }
        
        .profile-specs-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-bottom: 20px; background: var(--bg-slate); padding: 14px; border-radius: 12px; border: 1px solid rgba(148, 163, 184, 0.1); }
        .spec-box { display: flex; flex-direction: column; gap: 4px; }
        .spec-label { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }
        .spec-val { font-size: 0.9rem; font-weight: 700; color: var(--foreground); }
        
        .profile-facilities h5, .profile-guidelines h5 { font-size: 0.9rem; color: var(--foreground); margin-bottom: 10px; }
        .facility-tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .facility-pill { background: var(--bg-slate); border: 1px solid rgba(148, 163, 184, 0.15); color: var(--text-light); padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 500; }
        
        .profile-guidelines { margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(148, 163, 184, 0.1); }
        .guidelines-list { margin-top: 12px; padding-left: 20px; font-size: 0.85rem; color: var(--text-muted); line-height: 1.6; }
        .guidelines-list li { margin-bottom: 6px; }

        .tabs-container { display: flex; gap: 4px; background: var(--bg-slate); padding: 4px; border-radius: 12px; border: 1px solid rgba(148, 163, 184, 0.1); margin-bottom: 24px; }
        .tab-btn { flex: 1; padding: 10px; font-size: 0.9rem; font-weight: 600; color: var(--text-muted); background: transparent; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
        .tab-btn:hover { color: var(--foreground); }
        .tab-btn.active { background: var(--bg-card); color: var(--foreground); box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
        
        .p-6 { padding: 24px; }
        .mb-4 { margin-bottom: 16px; }
        .mb-2 { margin-bottom: 8px; }
        .mt-6 { margin-top: 24px; }
        .text-sm { font-size: 0.875rem; }
        .text-red-400 { color: #f87171; }
        .text-emerald-400 { color: #34d399; }
        .w-full { width: 100%; }

        .booking-list-panel { padding: 20px; }
        .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid rgba(148, 163, 184, 0.1); padding-bottom: 16px;}
        .list-header h3 { font-size: 1.2rem; color: var(--foreground); }
        .selected-date-text { font-size: 0.9rem; color: var(--primary); font-weight: 600; }

        .empty-state { text-align: center; padding: 32px 0; color: var(--text-muted); font-size: 0.9rem; }
        .empty-icon { font-size: 2rem; margin-bottom: 8px; display: block; }

        .timeline-list { display: flex; flex-direction: column; gap: 12px; }
        .timeline-item { display: flex; align-items: center; gap: 16px; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px; border-left: 3px solid var(--primary); }
        .time-badge { font-weight: 700; color: var(--primary); font-family: var(--font-outfit); font-size: 0.9rem; min-width: 100px; }
        .booking-details strong { color: var(--foreground); font-size: 0.95rem; display: block; }
        .booking-details p { color: var(--text-muted); font-size: 0.85rem; margin-top: 2px; }

        .modal-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(8, 7, 17, 0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal-content { width: 100%; max-width: 550px; max-height: 90vh; overflow-y: auto; padding: 24px; background: var(--modal-bg); border: 1px solid var(--border-glow-hover); box-shadow: 0 20px 50px var(--shadow-hover-color); }
        .modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(148, 163, 184, 0.1); padding-bottom: 12px; margin-bottom: 16px; }
        .modal-header h3 { font-size: 1.25rem; color: var(--foreground); }
        .close-btn { background: none; border: none; color: var(--text-muted); font-size: 1.75rem; cursor: pointer; transition: color 0.2s; }
        .close-btn:hover { color: var(--error); }
        .modal-body-form { display: flex; flex-direction: column; }
        
        .booking-date-display { background: var(--primary-glow); color: var(--primary); padding: 8px 12px; border-radius: 6px; font-size: 0.9rem; border: 1px solid var(--border-glow); }

        .form-row { display: flex; gap: 16px; }
        .flex-1 { flex: 1; }
        @media (max-width: 480px) { .form-row { flex-direction: column; gap: 0; } }

        .select-input { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; background-size: 16px; padding-right: 40px; }

        .recurrence-section { margin-bottom: 20px; }
        .checkbox-container { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; }
        .checkbox-label { font-size: 0.88rem; font-weight: 600; color: var(--foreground); }
        .recurrence-panel { margin-top: 12px; padding: 16px; background: var(--bg-slate); border: 1px solid rgba(148, 163, 184, 0.1); animation: slideDown 0.25s ease-out; }

        .modal-footer-btn { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(148, 163, 184, 0.1); }
        
        .alert { padding: 12px 16px; border-radius: 8px; font-size: 0.85rem; margin-bottom: 16px; line-height: 1.5; }
        .alert-success { background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); color: var(--success); }
        .alert-danger { background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); color: var(--error); }

        .conflict-list { background: rgba(0,0,0,0.15); padding: 12px; border-radius: 8px; border: 1px solid rgba(239,68,68,0.2); }
        .conflict-item { margin-top: 12px; padding-top: 12px; border-top: 1px dashed rgba(239,68,68,0.3); }
        .conflict-item p { margin-bottom: 4px; color: var(--foreground); }
        .btn-wa { display: inline-block; background: #25D366; color: white; padding: 6px 12px; border-radius: 6px; font-weight: 600; text-decoration: none; font-size: 0.8rem; transition: background 0.2s; }
        .btn-wa:hover { background: #1ebd57; }

        .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

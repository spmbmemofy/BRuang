'use client';

import React, { useState, useEffect, use } from 'react';
import LinkItem from 'next/link';
import MonthlyCalendar from '@/components/MonthlyCalendar';
import ThemeToggle from '@/components/ThemeToggle';
import { Item, Booking } from '@/lib/db';

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default function ItemDetailPage({ params }: PageProps) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const itemId = resolvedParams.id;

  const [item, setItem] = useState<Item | null>(null);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs for Item specifics
  const [activeTab, setActiveTab] = useState<'booking' | 'location'>('booking');
  const [newLocation, setNewLocation] = useState('');
  const [updateLocLoading, setUpdateLocLoading] = useState(false);
  const [updateLocMsg, setUpdateLocMsg] = useState('');
  const [rooms, setRooms] = useState<any[]>([]);

  // Calendar State
  const todayStr = new Date().toLocaleDateString('en-CA');
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
  
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState('weekly');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitConflicts, setSubmitConflicts] = useState<Booking[]>([]);


  const getMaxRecurrenceDate = () => {
    try {
      const d = new Date(selectedDate);
      d.setMonth(d.getMonth() + 3);
      return d.toLocaleDateString('en-CA');
    } catch {
      return '';
    }
  };

  const fetchItemAndBookings = async () => {
    try {
      setLoading(true);
      
      const itemRes = await fetch(`/api/public/item-details?itemId=${itemId}`);
      if (!itemRes.ok) throw new Error('Gagal mengambil data barang atau barang bersifat privat.');
      const currentItem: Item = await itemRes.json();
      
      setItem(currentItem);
      if (!newLocation) setNewLocation(currentItem.currentLocation);

      // Fetch all bookings for this item
      const [bookingsRes, meRes] = await Promise.all([
        fetch(`/api/bookings?targetId=${itemId}`),
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

        // Fetch rooms for location dropdown
        if (currentItem.adminId) {
          const roomsRes = await fetch(`/api/public/rooms?adminId=${currentItem.adminId}`);
          if (roomsRes.ok) {
            const roomsData = await roomsRes.json();
            setRooms(roomsData);
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
    fetchItemAndBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  useEffect(() => {
    if (isRecurring && !recurrenceEndDate) {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 14);
      setRecurrenceEndDate(d.toLocaleDateString('en-CA'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecurring]);

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: itemId,
          targetType: 'item',
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
      
      await fetchItemAndBookings();
      
      setTimeout(() => {
        setSubmitSuccess(null);
        setIsBookingModalOpen(false);
      }, 2000);
    } catch (err: any) {
      setSubmitError('Terjadi kesalahan koneksi. Silakan coba lagi.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateLocLoading(true);
    setUpdateLocMsg('');

    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentLocation: newLocation })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal update lokasi');
      
      setUpdateLocMsg('✅ Lokasi berhasil diperbarui!');
      await fetchItemAndBookings();
    } catch (err: any) {
      setUpdateLocMsg(`❌ ${err.message}`);
    } finally {
      setUpdateLocLoading(false);
    }
  };

  const getGradient = (id: string) => {
    const charSum = id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const hue1 = (charSum * 13) % 360;
    const hue2 = (hue1 + 45) % 360;
    return `linear-gradient(135deg, hsl(${hue1}, 70%, 55%) 0%, hsl(${hue2}, 70%, 45%) 100%)`;
  };

  const formatIndonesianDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  if (loading && !item) {
    return (
      <div className="item-detail-container loading-container">
        <ThemeToggle />
        <div className="spinner"></div>
        <p>Sedang memuat data barang...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="item-detail-container">
        <div className="error-card glass-panel">
          <span className="error-icon">⚠️</span>
          <h2>Gagal Memuat Barang</h2>
          <p>{error || 'Barang yang Anda cari tidak terdaftar.'}</p>
          <LinkItem href="/" className="btn-neon mt-4">kembali ke Dashboard</LinkItem>
        </div>
      </div>
    );
  }

  return (
    <div className="item-detail-container">
      <div className="detail-header-nav">
        <LinkItem href="/" className="back-link">⬅️ Kembali ke Dashboard</LinkItem>
        <ThemeToggle />
      </div>

      <div className="layout-grid">
        {/* Left Column: Item Profile & Location Update */}
        <div className="layout-col-left">
          <section className="glass-panel item-profile-card hero-section">
            <div className="item-visual-banner" style={{ background: getGradient(item.id) }}>
              <span className="banner-logo">📦</span>
            </div>
            
            <div className="profile-content">
              <h2 className="profile-name">{item.name}</h2>
              <p className="profile-desc">{item.description}</p>
              
              <div className="profile-specs-grid">
                <div className="spec-box">
                  <span className="spec-label">📑 Kategori:</span>
                  <span className="spec-val">{item.category}</span>
                </div>
                <div className="spec-box">
                  <span className="spec-label">🔢 Jumlah:</span>
                  <span className="spec-val">1 Unit (ID Tunggal)</span>
                </div>
              </div>

              {/* Tabs for Item actions */}
              <div className="tabs-container">
                <button 
                  className={`tab-btn ${activeTab === 'booking' ? 'active' : ''}`}
                  onClick={() => setActiveTab('booking')}
                >
                  📅 Pinjam Barang
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'location' ? 'active' : ''}`}
                  onClick={() => setActiveTab('location')}
                >
                  📍 Pindah Lokasi
                </button>
              </div>

              {activeTab === 'location' && (
                <div className="location-update-panel animate-slide-up mt-4">
                  <h5>Update Lokasi Barang Saat Ini</h5>
                  <p className="loc-helper">Lokasi tercatat: <strong>{item.currentLocation}</strong></p>
                  
                  <form onSubmit={handleUpdateLocation} className="loc-form">
                    <select
                      className="form-input select-input"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      required
                    >
                      <option value="">-- Pilih Ruangan --</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.name}>{room.name}</option>
                      ))}
                    </select>
                    <button type="submit" disabled={updateLocLoading} className="btn-neon mt-2">
                      {updateLocLoading ? 'Menyimpan...' : 'Update Lokasi'}
                    </button>
                  </form>
                  {updateLocMsg && <p className={`loc-msg ${updateLocMsg.startsWith('✅') ? 'success' : 'error'}`}>{updateLocMsg}</p>}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Calendar & Booking List */}
        <div className="layout-col-right" style={{ display: activeTab === 'booking' ? 'flex' : 'none', flexDirection: 'column', gap: '24px' }}>
          <MonthlyCalendar 
            selectedDate={selectedDate} 
            onSelectDate={setSelectedDate} 
            bookedDates={bookedDates} 
          />

          <div className="glass-panel booking-list-panel">
            <div className="list-header">
              <div>
                <h3>📅 Jadwal Peminjaman</h3>
                <p className="selected-date-text">{formatIndonesianDate(selectedDate)}</p>
              </div>
              <button className="btn-neon" onClick={() => setIsBookingModalOpen(true)}>
                ➕ Pinjam Barang
              </button>
            </div>

            {bookingsForSelectedDate.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🟢</span>
                <p>Barang tidak sedang dipinjam dan tersedia sepanjang hari.</p>
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
      </div>

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel animate-slide-up">
            <div className="modal-header">
              <h3>📝 Form Pinjam: {item.name}</h3>
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
                  <label className="form-label" htmlFor="user-name">Nama Peminjam</label>
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
                <label className="form-label">Keperluan / Tujuan Peminjaman</label>
                <input type="text" placeholder="Contoh: Dibawa ke Ruang Rapat B..." className="form-input" value={purpose} onChange={(e) => setPurpose(e.target.value)} required />
              </div>

              <div className="modal-footer-btn">
                <button type="button" className="btn-neon-outline cancel-btn" onClick={() => setIsBookingModalOpen(false)}>Batal</button>
                <button type="submit" disabled={submitLoading} className="btn-neon submit-btn bg-emerald-600 border-emerald-500 hover:bg-emerald-700">
                  {submitLoading ? 'Memproses...' : '🚀 Pinjam Barang Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .item-detail-container { max-width: 1200px; margin: 0 auto; padding: 24px 16px 80px 16px; min-height: 100vh; }

        .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .spinner { width: 45px; height: 45px; border: 3px solid rgba(99, 102, 241, 0.1); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s infinite linear; margin-bottom: 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .error-card { text-align: center; padding: 48px; max-width: 500px; margin: 100px auto 0 auto; border-color: rgba(239, 68, 68, 0.2); }
        .error-icon { font-size: 3rem; margin-bottom: 16px; display: block; }

        .mt-2 { margin-top: 0.5rem; }
        .mt-4 { margin-top: 1rem; }
        .mb-4 { margin-bottom: 1rem; }
        
        .detail-header-nav { margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
        .back-link { font-family: var(--font-outfit); color: var(--text-light); font-size: 0.95rem; font-weight: 600; transition: color 0.2s; display: inline-flex; align-items: center; }
        .back-link:hover { color: var(--foreground); text-decoration: underline; }

        .layout-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        @media (max-width: 900px) { .layout-grid { grid-template-columns: 1fr; } }

        .item-profile-card { overflow: hidden; height: 100%; }
        .item-visual-banner { height: 120px; display: flex; align-items: center; justify-content: center; padding: 0 24px; }
        .banner-logo { font-size: 4rem; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); }
        
        .profile-content { padding: 24px; }
        .profile-name { font-size: 1.8rem; color: var(--foreground); margin-bottom: 12px; line-height: 1.2; }
        .profile-desc { font-size: 0.9rem; color: var(--text-light); line-height: 1.6; margin-bottom: 20px; }
        
        .profile-specs-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-bottom: 20px; background: var(--bg-slate); padding: 14px; border-radius: 12px; border: 1px solid rgba(148, 163, 184, 0.1); }
        .spec-box { display: flex; flex-direction: column; gap: 4px; }
        .spec-label { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }
        .spec-val { font-size: 0.9rem; font-weight: 700; color: var(--foreground); }

        .tabs-container { display: flex; gap: 4px; background: var(--bg-slate); padding: 4px; border-radius: 12px; border: 1px solid rgba(148, 163, 184, 0.1); margin-top: 24px; }
        .tab-btn { flex: 1; padding: 10px; font-size: 0.9rem; font-weight: 600; color: var(--text-muted); background: transparent; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
        .tab-btn:hover { color: var(--foreground); }
        .tab-btn.active { background: var(--bg-card); color: var(--foreground); box-shadow: 0 2px 8px rgba(0,0,0,0.15); }

        .location-update-panel { padding: 16px; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(148,163,184,0.1); }
        .location-update-panel h5 { margin-bottom: 4px; color: var(--foreground); }
        .loc-helper { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px; }
        .loc-form { display: flex; flex-direction: column; gap: 8px; }
        .loc-msg { font-size: 0.85rem; margin-top: 8px; font-weight: 500; }
        .loc-msg.success { color: var(--success); }
        .loc-msg.error { color: var(--error); }

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
        
        .booking-date-display { background: rgba(16,185,129,0.1); color: var(--success); padding: 8px 12px; border-radius: 6px; font-size: 0.9rem; border: 1px solid rgba(16,185,129,0.3); }

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

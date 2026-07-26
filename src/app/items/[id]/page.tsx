'use client';

import React, { useState, useEffect, use } from 'react';
import LinkItem from 'next/link';
import BookingCalendar from '@/components/BookingCalendar';
import ThemeToggle from '@/components/ThemeToggle';
import { Item, Booking } from '@/lib/db';

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default function ItemDetailPage({ params }: PageProps) {
  // Unwrap params
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const itemId = resolvedParams.id;

  const [item, setItem] = useState<Item | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking Form State
  const todayStr = new Date().toLocaleDateString('en-CA');
  const [selectedDate, setSelectedDate] = useState(todayStr);
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

  const timeOptions: string[] = [];
  for (let hour = 8; hour <= 20; hour++) {
    const hh = hour.toString().padStart(2, '0');
    timeOptions.push(`${hh}:00`);
    if (hour < 20) timeOptions.push(`${hh}:30`);
  }

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
      
      const itemsRes = await fetch('/api/items');
      if (!itemsRes.ok) throw new Error('Gagal mengambil data barang.');
      const itemsData: Item[] = await itemsRes.json();
      const currentItem = itemsData.find(i => i.id === itemId);
      
      if (!currentItem) {
        throw new Error('Barang tidak ditemukan.');
      }
      setItem(currentItem);

      const bookingsRes = await fetch(`/api/bookings?targetId=${itemId}&date=${selectedDate}`);
      if (!bookingsRes.ok) throw new Error('Gagal mengambil jadwal pemakaian.');
      const bookingsData = await bookingsRes.json();
      setBookings(bookingsData);
      
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
  }, [itemId, selectedDate]);

  useEffect(() => {
    if (isRecurring && !recurrenceEndDate) {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 14);
      setRecurrenceEndDate(d.toLocaleDateString('en-CA'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecurring]);

  const handleSelectTimeSlot = (start: string, end: string) => {
    setStartTime(start);
    setEndTime(end);

    const formElement = document.getElementById('booking-form-element');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      formElement.classList.add('form-highlight-flash');
      setTimeout(() => formElement.classList.remove('form-highlight-flash'), 1000);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitSuccess(null);
    setSubmitError(null);

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
        setSubmitLoading(false);
        return;
      }

      setSubmitSuccess(data.message || 'Booking berhasil dibuat!');
      setPurpose('');
      setIsRecurring(false);
      setRecurrenceEndDate('');
      setContactInfo('');
      
      await fetchItemAndBookings();
      setTimeout(() => setSubmitSuccess(null), 5000);
    } catch (err: any) {
      setSubmitError('Terjadi kesalahan koneksi. Silakan coba lagi.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getGradient = (id: string) => {
    const charSum = id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const hue1 = charSum % 360;
    const hue2 = (hue1 + 60) % 360;
    return `linear-gradient(135deg, hsl(${hue1}, 75%, 60%) 0%, hsl(${hue2}, 75%, 50%) 100%)`;
  };

  if (loading && !item) {
    return (
      <div className="room-detail-container loading-container">
        <ThemeToggle />
        <div className="spinner"></div>
        <p>Sedang memuat data barang...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="room-detail-container">
        <div className="error-card glass-panel">
          <span className="error-icon">⚠️</span>
          <h2>Gagal Memuat Barang</h2>
          <p>{error || 'Barang yang Anda cari tidak terdaftar.'}</p>
          <LinkItem href="/" className="btn-neon mt-4">
             kembali ke Dashboard
          </LinkItem>
        </div>
      </div>
    );
  }

  return (
    <div className="room-detail-container">
      <div className="detail-header-nav">
        <LinkItem href="/" className="back-link">
          ⬅️ Kembali ke Dashboard
        </LinkItem>
        <ThemeToggle />
      </div>

      <div className="detail-grid">
        <div className="left-column">
          <section className="glass-panel room-profile-card">
            <div className="room-visual-banner" style={{ background: getGradient(item.id) }}>
              <span className="banner-logo">BRuang Barang</span>
            </div>
            
            <div className="profile-content">
              <h2 className="profile-name">{item.name}</h2>
              <p className="profile-desc">{item.description}</p>
              
              <div className="profile-specs-grid">
                <div className="spec-box">
                  <span className="spec-label">📁 Kategori:</span>
                  <span className="spec-val">{item.category}</span>
                </div>
                <div className="spec-box">
                  <span className="spec-label">📍 Lokasi Penyimpanan:</span>
                  <span className="spec-val">{item.currentLocation}</span>
                </div>
              </div>
            </div>
          </section>

          <section id="booking-form-element" className="glass-panel booking-form-card">
            <h3>📅 Formulir Peminjaman Barang</h3>
            <p className="form-sub">Masukkan jadwal peminjaman Anda.</p>
            
            {submitSuccess && (
              <div className="alert alert-success">✅ <strong>Berhasil!</strong> {submitSuccess}</div>
            )}
            {submitError && (
              <div className="alert alert-danger">❌ {submitError}</div>
            )}

            <form onSubmit={handleBookingSubmit} className="booking-form">
              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label" htmlFor="user-name">Nama Peminjam</label>
                  <input id="user-name" type="text" placeholder="Masukkan nama lengkap..." className="form-input" value={userName} onChange={(e) => setUserName(e.target.value)} required />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label" htmlFor="contact-info">No. WhatsApp / Ekstensi</label>
                  <input id="contact-info" type="text" placeholder="08123xxx untuk koordinasi..." className="form-input" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label" htmlFor="booking-date">Tanggal</label>
                  <input id="booking-date" type="date" className="form-input" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} min={todayStr} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label" htmlFor="start-time">Jam Mulai</label>
                  <select id="start-time" className="form-input select-input" value={startTime} onChange={(e) => setStartTime(e.target.value)}>
                    {timeOptions.slice(0, -1).map(time => <option key={time} value={time}>{time}</option>)}
                  </select>
                </div>
                <div className="form-group flex-1">
                  <label className="form-label" htmlFor="end-time">Jam Selesai</label>
                  <select id="end-time" className="form-input select-input" value={endTime} onChange={(e) => setEndTime(e.target.value)}>
                    {timeOptions.slice(1).map(time => <option key={time} value={time}>{time}</option>)}
                  </select>
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
                        <label className="form-label">Pola Pengulangan</label>
                        <select className="form-input select-input" value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
                          <option value="daily">Setiap Hari</option>
                          <option value="weekly">Setiap Minggu</option>
                          <option value="monthly">Setiap Bulan</option>
                        </select>
                      </div>
                      <div className="form-group flex-1">
                        <label className="form-label">Ulangi Hingga</label>
                        <input type="date" className="form-input" value={recurrenceEndDate} onChange={(e) => setRecurrenceEndDate(e.target.value)} min={selectedDate} max={getMaxRecurrenceDate()} required />
                        <span className="helper-text-date">Maksimal 3 bulan</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="purpose">Tujuan Peminjaman</label>
                <input id="purpose" type="text" placeholder="Contoh: Digunakan untuk Rapat Eksternal..." className="form-input" value={purpose} onChange={(e) => setPurpose(e.target.value)} required />
              </div>

              <button type="submit" disabled={submitLoading} className="btn-neon submit-booking-btn">
                {submitLoading ? 'Sedang Memproses...' : '🚀 Pinjam Barang Sekarang'}
              </button>
            </form>
          </section>
        </div>

        <div className="right-column">
          <div className="glass-panel date-selector-panel">
            <label htmlFor="calendar-date">Tampilkan Jadwal Tanggal:</label>
            <input id="calendar-date" type="date" className="form-input" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>

          <BookingCalendar 
            bookings={bookings} 
            selectedDate={selectedDate} 
            selectedStartTime={startTime}
            selectedEndTime={endTime}
            onSelectTimeSlot={handleSelectTimeSlot}
          />
        </div>
      </div>

      <style jsx>{`
        .room-detail-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 16px 80px 16px;
          min-height: 100vh;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .spinner {
          width: 45px;
          height: 45px;
          border: 3px solid rgba(99, 102, 241, 0.1);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s infinite linear;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-card {
          text-align: center;
          padding: 48px;
          max-width: 500px;
          margin: 100px auto 0 auto;
          border-color: rgba(239, 68, 68, 0.2);
        }

        .error-icon {
          font-size: 3rem;
          margin-bottom: 16px;
          display: block;
        }

        .mt-4 { margin-top: 1.5rem; }

        .detail-header-nav {
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .back-link {
          font-family: var(--font-outfit);
          color: var(--text-light);
          font-size: 0.95rem;
          font-weight: 600;
          transition: color 0.2s;
          display: inline-flex;
          align-items: center;
        }

        .back-link:hover {
          color: var(--foreground);
          text-decoration: underline;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 24px;
        }

        @media (max-width: 900px) {
          .detail-grid {
            grid-template-columns: 1fr;
          }
        }

        .left-column, .right-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .room-profile-card {
          overflow: hidden;
        }

        .room-visual-banner {
          height: 120px;
          display: flex;
          align-items: center;
          padding: 0 24px;
        }

        .banner-logo {
          font-family: var(--font-outfit);
          font-size: 2.2rem;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.25);
          letter-spacing: -0.04em;
        }

        .profile-content {
          padding: 24px;
        }

        .profile-name {
          font-size: 1.8rem;
          color: var(--foreground);
          margin-bottom: 12px;
          line-height: 1.2;
        }

        .profile-desc {
          font-size: 0.9rem;
          color: var(--text-light);
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .profile-specs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
          background: var(--bg-slate);
          padding: 14px;
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.1);
        }

        .spec-box {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .spec-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
        }

        .spec-val {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--foreground);
        }

        .booking-form-card {
          padding: 24px;
          transition: all 0.3s ease;
        }

        :global(.form-highlight-flash) {
          border-color: var(--primary) !important;
          box-shadow: 0 0 20px var(--primary-glow) !important;
          transform: scale(1.01);
        }

        .booking-form-card h3 {
          font-size: 1.25rem;
          color: var(--foreground);
          margin-bottom: 4px;
        }

        .form-sub {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 24px;
        }

        .booking-form {
          display: flex;
          flex-direction: column;
        }

        .form-row {
          display: flex;
          gap: 16px;
        }

        @media (max-width: 480px) {
          .form-row {
            flex-direction: column;
            gap: 0;
          }
        }

        .flex-1 {
          flex: 1;
        }

        .select-input {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          background-size: 16px;
          padding-right: 40px;
        }

        .recurrence-section {
          margin-bottom: 20px;
        }

        .checkbox-container {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
        }

        .checkbox-label {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--foreground);
        }

        .recurrence-panel {
          margin-top: 12px;
          padding: 16px;
          background: var(--bg-slate);
          border: 1px solid rgba(148, 163, 184, 0.1);
          animation: slideDown 0.25s ease-out;
        }

        .helper-text-date {
          font-size: 0.72rem;
          color: var(--text-muted);
          margin-top: 4px;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .submit-booking-btn {
          margin-top: 12px;
          padding: 14px 20px;
          width: 100%;
          border-radius: 8px;
        }

        .alert {
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.85rem;
          margin-bottom: 20px;
          line-height: 1.5;
        }

        .alert-success {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: var(--success);
        }

        .alert-danger {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: var(--error);
        }
      `}</style>
    </div>
  );
}

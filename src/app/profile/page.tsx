'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  const [username, setUsername] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.user) {
          router.push('/login');
          return;
        }
        if (data.user.role !== 'admin') {
          router.push('/dashboard');
          return;
        }
        setUser(data.user);
        setUsername(data.user.username || '');
        setInstitutionName(data.user.institutionName || '');
        setContactInfo(data.user.contactInfo || '');
        setVisibility(data.user.visibility || 'public');
        setLoading(false);
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          institutionName,
          contactInfo,
          visibility
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Gagal menyimpan profil.');
      } else {
        setMessage('Profil berhasil diperbarui!');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deep">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <nav className="navbar glass-panel">
        <div className="nav-brand">
          <Link href="/">BRuang</Link>
        </div>
        <div className="nav-actions">
          <ThemeToggle />
          <Link href="/dashboard" className="btn-neon-outline">Dashboard</Link>
        </div>
      </nav>

      <main className="main-content">
        <div className="glass-panel profile-card animate-slide-up">
          <div className="card-header">
            <h2>Pengaturan Profil Admin</h2>
            <p>Atur nama instansi dan identitas agar karyawan dapat mencari dan bergabung dengan grup Anda.</p>
          </div>

          <form onSubmit={handleSave} className="profile-form">
            <div className="form-group">
              <label>Username Admin</label>
              <input 
                type="text" 
                className="form-input" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                required 
              />
              <small className="help-text">Digunakan untuk login dan pencarian instansi.</small>
            </div>

            <div className="form-group">
              <label>Nama Instansi / Perusahaan</label>
              <input 
                type="text" 
                className="form-input" 
                value={institutionName}
                onChange={e => setInstitutionName(e.target.value)}
                placeholder="Contoh: PT. Bintang Ruang / Universitas Merdeka"
                required 
              />
              <small className="help-text">Nama instansi Anda akan muncul di daftar pilihan saat karyawan baru mendaftar.</small>
            </div>

            <div className="form-group">
              <label>Nomor Kontak / WA (Opsional)</label>
              <input 
                type="text" 
                className="form-input" 
                value={contactInfo}
                onChange={e => setContactInfo(e.target.value)}
                placeholder="0812xxxxxx"
              />
            </div>

            <div className="form-group">
              <label>Status Instansi</label>
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="visibility" 
                    value="public" 
                    checked={visibility === 'public'} 
                    onChange={() => setVisibility('public')} 
                  />
                  Public (Tampil di Beranda Publik)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="visibility" 
                    value="private" 
                    checked={visibility === 'private'} 
                    onChange={() => setVisibility('private')} 
                  />
                  Private (Tersembunyi)
                </label>
              </div>
              <small className="help-text">Jika Public, siapa pun dapat melihat ruangan dan langsung memesan. Jika Private, hanya terlihat di Dashboard internal.</small>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {message && <div className="alert alert-success">{message}</div>}

            <button type="submit" className="btn-neon submit-btn" disabled={isSaving}>
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>
        </div>
      </main>

      <style jsx>{`
        .profile-container {
          min-height: 100vh;
          padding: 24px;
        }
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          margin-bottom: 40px;
        }
        .nav-brand {
          font-weight: 800;
          font-size: 1.5rem;
          color: var(--primary);
        }
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .main-content {
          max-width: 600px;
          margin: 0 auto;
        }
        .profile-card {
          padding: 32px;
        }
        .card-header {
          margin-bottom: 24px;
          border-bottom: 1px solid var(--border-glow);
          padding-bottom: 16px;
        }
        .card-header h2 {
          margin-bottom: 8px;
          color: var(--foreground);
        }
        .card-header p {
          color: var(--text-muted);
          font-size: 0.95rem;
        }
        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .help-text {
          display: block;
          margin-top: 4px;
          color: var(--text-muted);
          font-size: 0.85rem;
        }
        .submit-btn {
          margin-top: 12px;
          align-self: flex-start;
          min-width: 150px;
        }
        .alert {
          padding: 12px 16px;
          border-radius: 8px;
          font-weight: 500;
          font-size: 0.9rem;
        }
        .alert-error {
          background: rgba(239, 68, 68, 0.1);
          color: var(--error);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .alert-success {
          background: rgba(16, 185, 129, 0.1);
          color: var(--success);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
      `}</style>
    </div>
  );
}

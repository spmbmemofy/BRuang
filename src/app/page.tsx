'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

export default function PublicDirectory() {
  const router = useRouter();
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [session, setSession] = useState<any>(null);

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

    // Fetch institutions
    fetch('/api/public/institutions')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setInstitutions(data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredInstitutions = institutions.filter(inst => 
    inst.institutionName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="directory-container">
      <nav className="navbar glass-panel">
        <div className="nav-brand">
          <Link href="/">BRuang</Link>
        </div>
        <div className="nav-actions">
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
      </nav>

      <main className="main-content">
        <div className="hero-section">
          <h1 className="hero-title">Temukan Fasilitas Terbaik</h1>
          <p className="hero-subtitle">Cari instansi atau perusahaan yang menyediakan ruangan dan fasilitas untuk Anda gunakan.</p>
          
          <div className="search-bar glass-panel">
            <input 
              type="text" 
              placeholder="Cari nama instansi..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="institutions-grid">
            {filteredInstitutions.length === 0 ? (
              <div className="glass-panel text-center p-8 w-full col-span-full">
                <p className="text-muted">Tidak ada instansi publik yang ditemukan.</p>
              </div>
            ) : (
              filteredInstitutions.map(inst => (
                <Link href={`/instansi/${inst.id}`} key={inst.id} className="institution-card glass-panel">
                  <div className="inst-icon">🏢</div>
                  <h3 className="inst-name">{inst.institutionName}</h3>
                  <p className="inst-admin text-muted text-sm">Dikelola oleh: {inst.username}</p>
                </Link>
              ))
            )}
          </div>
        )}
      </main>

      <style jsx>{`
        .directory-container {
          min-height: 100vh;
          padding: 24px;
        }
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
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
          max-width: 1000px;
          margin: 0 auto;
          padding-top: 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .hero-section {
          text-align: center;
          width: 100%;
          animation: slideUp 0.5s ease-out;
          margin-bottom: 48px;
        }
        .hero-title {
          font-size: 3rem;
          font-weight: 800;
          color: var(--foreground);
          margin-bottom: 16px;
          letter-spacing: -0.02em;
        }
        .hero-subtitle {
          font-size: 1.2rem;
          color: var(--text-muted);
          max-width: 600px;
          margin: 0 auto;
        }
        .search-bar {
          max-width: 600px;
          margin: 32px auto 0;
          padding: 16px;
          border-radius: 12px;
          width: 100%;
        }
        .institutions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
          width: 100%;
          margin-top: 24px;
        }
        .loading-container {
          display: flex;
          justify-content: center;
          margin: 48px 0;
          width: 100%;
        }
        .institution-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 32px 24px;
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .institution-card:hover {
          transform: translateY(-4px);
          border-color: var(--primary);
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .inst-icon {
          font-size: 3rem;
          margin-bottom: 16px;
        }
        .inst-name {
          color: var(--foreground);
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 8px;
        }
      `}</style>
    </div>
  );
}

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
      <nav className="navbar">
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
          <h1 className="hero-title">Temukan <span>Fasilitas Terbaik</span></h1>
          <p className="hero-subtitle">Cari instansi atau perusahaan yang menyediakan ruangan dan fasilitas untuk Anda gunakan.</p>
          
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Cari nama instansi..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
              <div className="empty-state text-center w-full col-span-full">
                <p>Tidak ada instansi publik yang ditemukan.</p>
              </div>
            ) : (
              filteredInstitutions.map(inst => (
                <Link href={`/instansi/${inst.id}`} key={inst.id} className="institution-card">
                  <div className="inst-icon-wrapper">🏢</div>
                  <div className="inst-info">
                    <h3 className="inst-name">{inst.institutionName}</h3>
                    <p className="inst-admin"><span className="inst-admin-icon">👤</span> Dikelola oleh: {inst.username}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </main>

      <style jsx>{`
        .directory-container {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
        }
        .directory-container::before {
          content: '';
          position: absolute;
          top: -20%; left: -10%;
          width: 50vw; height: 50vw;
          background: radial-gradient(circle, rgba(99,102,241,0.08) 0%, rgba(0,0,0,0) 70%);
          z-index: -1;
        }
        .directory-container::after {
          content: '';
          position: absolute;
          bottom: -20%; right: -10%;
          width: 60vw; height: 60vw;
          background: radial-gradient(circle, rgba(16,185,129,0.05) 0%, rgba(0,0,0,0) 70%);
          z-index: -1;
        }
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 28px;
          max-width: 1200px;
          margin: 24px auto;
          border-radius: 100px;
          background: var(--bg-card);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border-glow);
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          z-index: 100;
        }
        @media (max-width: 768px) {
          .navbar { margin: 12px; padding: 12px 20px; }
        }
        .nav-brand {
          font-weight: 900;
          font-size: 1.5rem;
        }
        .nav-brand a {
          background: linear-gradient(135deg, var(--primary) 0%, #a855f7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.05em;
          text-decoration: none;
        }
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .main-content {
          max-width: 1000px;
          margin: 0 auto;
          padding: 80px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .hero-section {
          text-align: center;
          width: 100%;
          animation: slideUp 0.5s ease-out;
          margin-bottom: 64px;
        }
        .hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          color: var(--foreground);
          margin-bottom: 20px;
          letter-spacing: -0.03em;
          line-height: 1.2;
        }
        @media (max-width: 768px) {
          .hero-title { font-size: 2.5rem; }
        }
        .hero-title span {
          background: linear-gradient(135deg, var(--primary) 0%, #10b981 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-subtitle {
          font-size: 1.2rem;
          color: var(--text-muted);
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }
        .search-bar {
          max-width: 650px;
          margin: 40px auto 0;
          position: relative;
        }
        .search-bar input {
          width: 100%;
          padding: 18px 24px 18px 56px;
          border-radius: 100px;
          border: 1px solid var(--border-glow);
          background: var(--bg-card);
          color: var(--foreground);
          font-size: 1.1rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
          outline: none;
        }
        .search-bar input:focus {
          border-color: var(--primary);
          box-shadow: 0 10px 40px rgba(99, 102, 241, 0.15);
        }
        .search-icon {
          position: absolute;
          left: 24px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1.2rem;
          color: var(--text-muted);
          z-index: 10;
        }
        .institutions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
          width: 100%;
        }
        .institution-card {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px;
          border-radius: 20px;
          background: var(--bg-card);
          border: 1px solid var(--border-glow);
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .institution-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%);
          pointer-events: none;
        }
        .institution-card:hover {
          transform: translateY(-5px) scale(1.02);
          border-color: var(--primary);
          box-shadow: 0 20px 40px rgba(99, 102, 241, 0.1);
        }
        .inst-icon-wrapper {
          width: 64px; height: 64px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(16,185,129,0.1) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          border: 1px solid rgba(255,255,255,0.05);
          flex-shrink: 0;
        }
        .inst-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }
        .inst-name {
          color: var(--foreground);
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 4px;
          letter-spacing: -0.01em;
        }
        .inst-admin {
          color: var(--text-muted);
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .inst-admin-icon {
          font-size: 0.8rem;
          color: var(--primary);
        }
        .empty-state {
          padding: 40px;
          color: var(--text-muted);
          font-size: 1.1rem;
        }
      `}</style>
    </div>
  );
}

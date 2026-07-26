'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

export default function PendingPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="pending-container">
      <div className="theme-toggle-wrapper">
        <ThemeToggle />
      </div>

      <div className="glass-panel pending-card">
        <div className="icon-wrapper">
          <span className="hourglass-icon">⏳</span>
        </div>
        <h2>Menunggu Persetujuan Admin</h2>
        <p>Akun Karyawan Anda telah berhasil didaftarkan, namun saat ini masih berstatus <strong>Pending</strong>.</p>
        <p>Silakan hubungi Administrator (Tim Sarpras/Umum) untuk mengaktifkan akun Anda agar dapat melihat daftar ruangan dan barang.</p>
        
        <button onClick={handleLogout} className="btn-neon mt-6">
          Keluar (Logout)
        </button>
      </div>

      <style jsx>{`
        .pending-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
        }

        .theme-toggle-wrapper {
          position: absolute;
          top: 24px;
          right: 24px;
        }

        .pending-card {
          max-width: 500px;
          text-align: center;
          padding: 48px 32px;
          animation: scaleUp 0.4s ease-out;
        }

        .icon-wrapper {
          font-size: 4rem;
          margin-bottom: 24px;
          animation: float 3s ease-in-out infinite;
        }

        h2 {
          color: var(--foreground);
          font-family: var(--font-outfit);
          margin-bottom: 16px;
        }

        p {
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 12px;
        }

        .mt-6 {
          margin-top: 32px;
        }

        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}

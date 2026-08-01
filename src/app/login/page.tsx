'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  
  // States for registration
  const [admins, setAdmins] = useState<any[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [registerRole, setRegisterRole] = useState<'employee' | 'admin'>('employee');
  const [institutionName, setInstitutionName] = useState('');
  const [hasSelectedRole, setHasSelectedRole] = useState(false);

  // Fetch admins list when tab switches to Register
  React.useEffect(() => {
    if (!isLogin) {
      fetch('/api/users/admins')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setAdmins(data);
          }
        })
        .catch(err => console.error('Failed to fetch admins:', err));
    }
  }, [isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const bodyPayload: any = { username, password };
      
      if (!isLogin) {
        bodyPayload.role = registerRole;
        if (registerRole === 'employee') {
          if (!selectedAdminId) {
            setError('Silakan pilih instansi tujuan terlebih dahulu.');
            setLoading(false);
            return;
          }
          bodyPayload.adminId = selectedAdminId;
        } else {
          if (!institutionName) {
            setError('Silakan masukkan nama instansi.');
            setLoading(false);
            return;
          }
          bodyPayload.institutionName = institutionName;
        }
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan.');
      }

      if (isLogin) {
        // Redirect to dashboard or pending depending on role/status
        router.push('/dashboard');
        router.refresh();
      } else {
        setSuccess(data.message);
        setUsername('');
        setPassword('');
        // Switch to login tab after brief delay
        setTimeout(() => setIsLogin(true), 3000);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="theme-toggle-wrapper">
        <ThemeToggle />
      </div>

      <div className="glass-panel login-card">
        <div className="login-header">
          <h1 className="logo-text">BRuang</h1>
          <p className="subtitle">Manajemen Aset & Ruangan Terpadu</p>
        </div>

        <div className="auth-tabs">
          <button type="button" className={`auth-tab ${isLogin ? 'active' : ''}`} onClick={() => {setIsLogin(true); setError(''); setSuccess('');}}>Masuk</button>
          <button type="button" className={`auth-tab ${!isLogin ? 'active' : ''}`} onClick={() => {setIsLogin(false); setError(''); setSuccess(''); setHasSelectedRole(false);}}>Daftar</button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {!isLogin && !hasSelectedRole ? (
          <div className="role-selection animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <h3 style={{ textAlign: 'center', color: 'var(--foreground)', fontSize: '1.2rem', marginBottom: '8px' }}>Pilih Jenis Akun</h3>
            <button 
              type="button"
              className="role-btn"
              onClick={() => { setRegisterRole('employee'); setHasSelectedRole(true); }}
            >
              <span className="role-icon">👤</span>
              <div className="role-text">
                <strong>Pengguna / Staf</strong>
                <span>Mendaftar ke dalam instansi yang sudah ada</span>
              </div>
            </button>
            <button 
              type="button"
              className="role-btn"
              onClick={() => { setRegisterRole('admin'); setHasSelectedRole(true); }}
            >
              <span className="role-icon">🏢</span>
              <div className="role-text">
                <strong>Admin Instansi</strong>
                <span>Mendaftarkan dan mengelola instansi baru</span>
              </div>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form animate-fade-in">
            {!isLogin && (
              <button 
                type="button" 
                className="back-btn" 
                onClick={() => setHasSelectedRole(false)}
              >
                ← Kembali pilih jenis akun
              </button>
            )}
            
            <div className="form-group">
              <label className="form-label">Username</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Masukkan username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Masukkan password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {!isLogin && registerRole === 'employee' && (
              <div className="form-group animate-fade-in">
                <label className="form-label">Pilih Instansi Tujuan</label>
                <select 
                  className="form-input" 
                  value={selectedAdminId} 
                  onChange={(e) => setSelectedAdminId(e.target.value)}
                  required={!isLogin && registerRole === 'employee'}
                >
                  <option value="">-- Pilih Instansi --</option>
                  {admins.map(admin => (
                    <option key={admin.id} value={admin.id}>
                      {admin.institutionName} (Admin: {admin.username})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {!isLogin && registerRole === 'admin' && (
              <div className="form-group animate-fade-in">
                <label className="form-label">Nama Instansi</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Contoh: PT. Sukses Makmur" 
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  required={!isLogin && registerRole === 'admin'}
                />
              </div>
            )}

            <button type="submit" className="btn-neon submit-btn" disabled={loading}>
              {loading ? 'Memproses...' : (isLogin ? 'Masuk ke Sistem' : 'Daftar Sekarang')}
            </button>
          </form>
        )}
      </div>

      <style jsx>{`
        .login-container {
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

        .login-card {
          width: 100%;
          max-width: 420px;
          padding: 40px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          animation: slideUp 0.5s ease-out;
        }

        .login-header {
          text-align: center;
        }

        .logo-text {
          font-family: var(--font-outfit);
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--primary);
          margin-bottom: 8px;
        }

        .subtitle {
          color: var(--text-muted);
          font-size: 0.95rem;
        }

        .auth-tabs {
          display: flex;
          gap: 8px;
          background: var(--bg-slate);
          padding: 4px;
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.1);
        }

        .auth-tab {
          flex: 1;
          padding: 10px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: var(--text-muted);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .auth-tab.active {
          background: var(--bg-card);
          color: var(--foreground);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .submit-btn {
          width: 100%;
          margin-top: 8px;
          padding: 12px;
          font-size: 1rem;
        }

        .role-btn {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: var(--bg-deep);
          border: 1px solid var(--border-glow);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }
        
        .role-btn:hover {
          background: var(--bg-card-hover);
          border-color: var(--primary);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
        }
        
        .role-icon {
          font-size: 2rem;
        }
        
        .role-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .role-text strong {
          color: var(--foreground);
          font-size: 1.05rem;
        }
        
        .role-text span {
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        .back-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 0.9rem;
          cursor: pointer;
          padding: 0;
          margin-bottom: 20px;
          transition: color 0.2s;
          display: inline-block;
        }

        .back-btn:hover {
          color: var(--primary);
        }

        .alert {
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.85rem;
          line-height: 1.5;
        }

        .alert-danger {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: var(--error);
        }

        .alert-success {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: var(--success);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

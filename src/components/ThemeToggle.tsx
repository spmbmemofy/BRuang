'use client';

import React, { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Load theme preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <button 
      type="button" 
      onClick={toggleTheme} 
      className="theme-toggle-btn glass-panel"
      title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
      aria-label="Toggle Theme"
    >
      <span className="theme-toggle-icon">
        {theme === 'dark' ? '☀️' : '🌙'}
      </span>
      <span className="theme-toggle-text">
        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      </span>

      <style jsx>{`
        .theme-toggle-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: var(--bg-card);
          border: 1px solid var(--border-glow);
          color: var(--foreground);
          cursor: pointer;
          font-family: var(--font-outfit);
          font-weight: 600;
          font-size: 0.85rem;
          border-radius: 20px;
          box-shadow: 0 4px 10px var(--shadow-color);
          transition: all 0.25s ease;
        }

        .theme-toggle-btn:hover {
          border-color: var(--primary);
          transform: scale(1.03);
        }

        .theme-toggle-icon {
          font-size: 1.05rem;
          animation: spin-soft 4s infinite linear;
        }

        .theme-toggle-text {
          display: none;
        }

        @media (min-width: 640px) {
          .theme-toggle-text {
            display: inline;
          }
        }

        @keyframes spin-soft {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}

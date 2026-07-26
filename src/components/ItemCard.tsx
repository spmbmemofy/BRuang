'use client';

import React from 'react';
import Link from 'next/link';
import { Item } from '@/lib/db';

interface ItemCardProps {
  item: Item;
  isOccupied: boolean;
  occupiedUntil?: string;
  onViewLocation: (item: Item) => void;
}

export default function ItemCard({ item, isOccupied, occupiedUntil, onViewLocation }: ItemCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="glass-panel item-card animate-fade-in">
      <div className="item-card-content">
        <div className="item-header-top">
          <div className="item-initials-box">
            {getInitials(item.name)}
          </div>
          <div className="status-badge-container">
            {isOccupied ? (
               <span className="badge badge-busy">
                 🔴 Dipinjam {occupiedUntil ? `s/d ${occupiedUntil}` : ''}
               </span>
            ) : (
              <span className="badge badge-available">🟢 Tersedia</span>
            )}
          </div>
        </div>

        <div className="item-header-text">
          <h3 className="item-name">{item.name}</h3>
        </div>

        <p className="item-description">{item.description}</p>

        {/* Stats and facilities row */}
        <div className="item-meta-row">
          <div className="stat-item">
            <span className="stat-icon">📦</span>
            <span className="stat-text">Kategori: <strong>{item.category}</strong></span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">📍</span>
            <span className="stat-text">Lokasi: <strong>{item.currentLocation}</strong></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="item-actions">
          <button 
            type="button" 
            className="btn-neon-outline qr-btn"
            onClick={() => onViewLocation(item)}
            title="Tampilkan Detail / QR Lokasi"
          >
            📷 Detail
          </button>
          
          <Link href={`/items/${item.id}`} className="btn-neon book-btn">
            📅 Jadwal & Pinjam
          </Link>
        </div>
      </div>

      <style jsx>{`
        .item-card {
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .item-card-content {
          padding: 24px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          gap: 16px;
        }

        .item-header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .item-initials-box {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: var(--bg-deep);
          border: 1px solid var(--border-glow);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-outfit);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--primary);
        }

        .item-header-text {
          margin-bottom: 4px;
        }

        .item-name {
          font-size: 1.25rem;
          color: var(--foreground);
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .item-description {
          font-size: 0.9rem;
          color: var(--text-muted);
          line-height: 1.5;
          margin-bottom: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .item-meta-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: 16px;
          margin-top: auto;
          border-top: 1px solid var(--border-glow);
          font-size: 0.85rem;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-muted);
        }
        
        .stat-item strong {
          color: var(--foreground);
        }

        .stat-icon {
          font-size: 1rem;
        }

        .item-actions {
          display: flex;
          gap: 12px;
          margin-top: 12px;
        }

        .qr-btn {
          flex: 1;
          padding: 10px;
        }

        .book-btn {
          flex: 3;
          padding: 10px;
        }
      `}</style>
    </div>
  );
}

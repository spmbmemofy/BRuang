'use client';

import React from 'react';
import Link from 'next/link';
import { Room } from '@/lib/db';

interface RoomCardProps {
  room: Room;
  isOccupied: boolean;
  occupiedUntil?: string;
  onViewQR: (room: Room) => void;
}

export default function RoomCard({ room, isOccupied, occupiedUntil, onViewQR }: RoomCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="glass-panel room-card animate-fade-in">
      <div className="room-card-content">
        <div className="room-header-top">
          <div className="room-initials-box">
            {getInitials(room.name)}
          </div>
          <div className="status-badge-container">
            {isOccupied ? (
               <span className="badge badge-busy">
                 🔴 Terpakai {occupiedUntil ? `s/d ${occupiedUntil}` : ''}
               </span>
            ) : (
              <span className="badge badge-available">🟢 Tersedia</span>
            )}
          </div>
        </div>

        <div className="room-header-text">
          <h3 className="room-name">{room.name}</h3>
        </div>

        <p className="room-description">{room.description}</p>

        {/* Stats and facilities row */}
        <div className="room-meta-row">
          <div className="stat-item">
            <span className="stat-icon">👥</span>
            <span className="stat-text">Kapasitas <strong>{room.capacity}</strong> Orang</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">🕒</span>
            <span className="stat-text">Buka: <strong>{room.operatingHours}</strong></span>
          </div>
        </div>

        {/* Facilities display */}
        {((room as any).computedFacilities || room.facilities) && ((room as any).computedFacilities || room.facilities).length > 0 && (
          <div className="room-card-facilities" style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {((room as any).computedFacilities || room.facilities).slice(0, 3).map((fac: string, idx: number) => (
              <span key={idx} style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: '#aaa', border: '1px solid rgba(255,255,255,0.2)' }}>
                {fac}
              </span>
            ))}
            {((room as any).computedFacilities || room.facilities).length > 3 && (
              <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#888' }}>
                +{((room as any).computedFacilities || room.facilities).length - 3} lainnya
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="room-actions">
          <button 
            type="button" 
            className="btn-neon-outline qr-btn"
            onClick={() => onViewQR(room)}
            title="Tampilkan QR Code"
          >
            📷 QR
          </button>
          
          <Link href={`/rooms/${room.id}`} className="btn-neon book-btn">
            📅 Jadwal & Book
          </Link>
        </div>
      </div>

      <style jsx>{`
        .room-card {
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .room-card-content {
          padding: 24px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          gap: 16px;
        }

        .room-header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .room-initials-box {
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

        .room-header-text {
          margin-bottom: 4px;
        }

        .room-name {
          font-size: 1.25rem;
          color: var(--foreground);
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .room-description {
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

        .room-meta-row {
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

        .room-actions {
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

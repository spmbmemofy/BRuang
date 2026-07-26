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
  // Generate gradient based on room ID
  const getGradient = (id: string) => {
    switch (id) {
      case 'ruang-kreatif':
        return 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)';
      case 'ruang-kolaborasi':
        return 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)';
      case 'ruang-fokus':
        return 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)';
      case 'auditorium':
        return 'linear-gradient(135deg, #f59e0b 0%, #e11d48 100%)';
      default:
        const charSum = id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const hue1 = charSum % 360;
        const hue2 = (hue1 + 60) % 360;
        return `linear-gradient(135deg, hsl(${hue1}, 75%, 60%) 0%, hsl(${hue2}, 75%, 50%) 100%)`;
    }
  };

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
      {/* Compact Visual Header */}
      <div className="room-visual-header" style={{ background: getGradient(room.id) }}>
        <span className="room-initials">{getInitials(room.name)}</span>
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

      <div className="room-card-content">
        <div className="room-header-text">
          <h3 className="room-name">{room.name}</h3>
        </div>

        <p className="room-description">{room.description}</p>

        {/* Compact stats and facilities row */}
        <div className="room-meta-row">
          <div className="stat-item">
            <span className="stat-icon">👥</span>
            <span className="stat-text"><strong>{room.capacity}</strong> Orang</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">🕒</span>
            <span className="stat-text"><strong>{room.operatingHours}</strong></span>
          </div>
        </div>

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
          transition: all 0.25s ease;
        }

        .room-visual-header {
          height: 70px; /* Reduced from 140px */
          position: relative;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding-left: 16px;
          border-bottom: 1px solid var(--border-glow);
        }

        .room-initials {
          font-family: var(--font-outfit);
          font-size: 1.6rem; /* Reduced from 3rem */
          font-weight: 800;
          color: rgba(255, 255, 255, 0.35);
          letter-spacing: -0.05em;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .status-badge-container {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          right: 12px;
        }

        .room-card-content {
          padding: 14px; /* Reduced padding */
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          gap: 10px;
        }

        .room-header-text {
          margin-bottom: 0;
        }

        .room-name {
          font-size: 1.2rem; /* Compact size */
          color: var(--foreground);
          font-weight: 700;
        }

        .room-description {
          font-size: 0.8rem;
          color: var(--text-muted);
          line-height: 1.4;
          margin-bottom: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2; /* Truncated to 2 lines */
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          height: 2.8em; /* Force height to keep grid aligned */
        }

        .room-meta-row {
          display: flex;
          justify-content: space-between;
          padding-top: 8px;
          border-top: 1px solid rgba(148, 163, 184, 0.08);
          font-size: 0.8rem;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--text-light);
        }

        .stat-icon {
          font-size: 0.85rem;
        }

        .room-actions {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }

        .qr-btn {
          flex: 1;
          padding: 8px;
          font-size: 0.8rem;
        }

        .book-btn {
          flex: 2.2;
          padding: 8px;
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
}

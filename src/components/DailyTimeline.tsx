import React, { useMemo } from 'react';
import { Room, Booking } from '@/lib/db';

interface DailyTimelineProps {
  date: string;
  rooms: Room[];
  bookings: Booking[];
  onDateChange: (newDate: string) => void;
}

export default function DailyTimeline({ date, rooms, bookings, onDateChange }: DailyTimelineProps) {
  const startHour = 7;
  const endHour = 18;
  const totalHours = endHour - startHour;
  
  const hours = Array.from({ length: totalHours + 1 }, (_, i) => startHour + i);

  const getPositionStyle = (startTime: string, endTime: string) => {
    const parseTime = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h + m / 60;
    };
    
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    
    const clampedStart = Math.max(startHour, start);
    const clampedEnd = Math.min(endHour, end);
    
    if (clampedStart >= endHour || clampedEnd <= startHour) {
      return { display: 'none' };
    }
    
    const left = ((clampedStart - startHour) / totalHours) * 100;
    const width = ((clampedEnd - clampedStart) / totalHours) * 100;
    
    return {
      left: `${left}%`,
      width: `${width}%`,
    };
  };

  const filteredBookings = bookings.filter(b => b.date === date && b.targetType === 'room');

  return (
    <div className="daily-timeline glass-panel p-6">
      <div className="timeline-header flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Timeline Jadwal Ruangan</h2>
        <input 
          type="date" 
          value={date} 
          onChange={(e) => onDateChange(e.target.value)}
          className="form-input w-auto"
        />
      </div>

      <div className="timeline-container">
        {/* Time Header */}
        <div className="timeline-time-header">
          <div className="room-label-placeholder"></div>
          <div className="time-slots">
            {hours.map(hour => (
              <div key={hour} className="time-slot-label">
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>
        </div>

        {/* Room Rows */}
        <div className="timeline-rows">
          {rooms.map(room => {
            const roomBookings = filteredBookings.filter(b => b.targetId === room.id);
            return (
              <div key={room.id} className="timeline-row">
                <div className="room-label">
                  <strong>{room.name}</strong>
                  <span className="text-xs text-muted block">Kap: {room.capacity}</span>
                </div>
                <div className="timeline-track">
                  {/* Grid Lines */}
                  {hours.map(hour => (
                    <div key={hour} className="timeline-grid-line" style={{ left: `${((hour - startHour) / totalHours) * 100}%` }}></div>
                  ))}
                  
                  {/* Bookings */}
                  {roomBookings.map(booking => (
                    <div 
                      key={booking.id} 
                      className="timeline-booking-block"
                      style={getPositionStyle(booking.startTime, booking.endTime)}
                      title={`${booking.purpose} (${booking.startTime} - ${booking.endTime})\nOleh: ${booking.user}`}
                    >
                      <div className="booking-inner">
                        <span className="booking-title">{booking.purpose}</span>
                        <span className="booking-user">{booking.user}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .timeline-container {
          overflow-x: auto;
          background: var(--bg-slate);
          border-radius: 12px;
          border: 1px solid var(--border-glow);
          padding: 16px;
        }

        .timeline-time-header {
          display: flex;
          border-bottom: 2px solid var(--border-glow);
          padding-bottom: 8px;
          margin-bottom: 12px;
        }

        .room-label-placeholder {
          width: 200px;
          flex-shrink: 0;
        }

        .time-slots {
          flex: 1;
          display: flex;
          position: relative;
        }

        .time-slot-label {
          flex: 1;
          text-align: left;
          font-size: 0.8rem;
          color: var(--text-muted);
          position: relative;
          transform: translateX(-50%);
        }
        
        .time-slot-label:first-child {
          transform: translateX(0);
        }

        .timeline-rows {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .timeline-row {
          display: flex;
          align-items: center;
          height: 60px;
        }

        .room-label {
          width: 200px;
          flex-shrink: 0;
          padding-right: 16px;
          color: var(--foreground);
        }

        .timeline-track {
          flex: 1;
          height: 100%;
          position: relative;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
          overflow: hidden;
        }

        .timeline-grid-line {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 1px;
          background: rgba(148, 163, 184, 0.1);
        }

        .timeline-booking-block {
          position: absolute;
          top: 4px;
          bottom: 4px;
          background: var(--primary);
          border-radius: 6px;
          padding: 4px 8px;
          color: white;
          font-size: 0.75rem;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
          cursor: pointer;
          transition: transform 0.2s, z-index 0.2s;
          white-space: nowrap;
          z-index: 10;
        }

        .timeline-booking-block:hover {
          transform: scale(1.02);
          z-index: 20;
          background: var(--primary-hover);
        }

        .booking-inner {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .booking-title {
          font-weight: 600;
          text-overflow: ellipsis;
          overflow: hidden;
        }

        .booking-user {
          opacity: 0.8;
          font-size: 0.65rem;
          text-overflow: ellipsis;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

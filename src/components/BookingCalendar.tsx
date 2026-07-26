'use client';

import React from 'react';
import { Booking } from '@/lib/db';

interface BookingCalendarProps {
  bookings: Booking[];
  selectedDate: string;
  selectedStartTime?: string;
  selectedEndTime?: string;
  onSelectTimeSlot?: (startTime: string, endTime: string) => void;
}

export default function BookingCalendar({ 
  bookings, 
  selectedDate, 
  selectedStartTime, 
  selectedEndTime, 
  onSelectTimeSlot 
}: BookingCalendarProps) {
  // Define active hours (08:00 - 20:00)
  const startHour = 8;
  const endHour = 20;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  // Helper to check if a specific hour segment (e.g. 09:00 - 10:00) is occupied
  const getBookingForHour = (hour: number) => {
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    const nextTimeStr = `${(hour + 1).toString().padStart(2, '0')}:00`;

    // Find any booking that overlaps with this hour segment
    return bookings.find(b => b.startTime < nextTimeStr && b.endTime > timeStr);
  };

  // Check if a segment is currently selected in the parent form
  const isSegmentSelectedInForm = (hour: number) => {
    if (!selectedStartTime || !selectedEndTime) return false;
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    const nextTimeStr = `${(hour + 1).toString().padStart(2, '0')}:00`;
    return selectedStartTime <= timeStr && selectedEndTime >= nextTimeStr;
  };

  // Format YYYY-MM-DD to readable Indonesian date
  const formatIndonesianDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    } catch {
      return dateStr;
    }
  };

  const handleHourClick = (hour: number) => {
    if (getBookingForHour(hour)) return; // occupied, do nothing
    
    if (onSelectTimeSlot) {
      const startT = `${hour.toString().padStart(2, '0')}:00`;
      const endT = `${(hour + 1).toString().padStart(2, '0')}:00`;
      onSelectTimeSlot(startT, endT);
    }
  };

  return (
    <div className="glass-panel calendar-panel animate-fade-in">
      <div className="calendar-header">
        <h3>📅 Jadwal Hari Ini</h3>
        <span className="selected-date-badge">{formatIndonesianDate(selectedDate)}</span>
      </div>

      <p className="calendar-instruction-text">
        💡 *Pilih slot jam kosong langsung pada daftar di bawah untuk mengisi formulir.*
      </p>

      {/* Visual Interactive Timeline Grid */}
      <div className="interactive-hours-list">
        {hours.map(hour => {
          const booking = getBookingForHour(hour);
          const isSelected = isSegmentSelectedInForm(hour);
          const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
          const nextTimeLabel = `${(hour + 1).toString().padStart(2, '0')}:00`;

          return (
            <div
              key={hour}
              className={`hour-slot-row ${
                booking ? 'slot-occupied' : isSelected ? 'slot-form-selected' : 'slot-free-clickable'
              }`}
              onClick={() => handleHourClick(hour)}
            >
              <div className="slot-time-indicator">
                {timeLabel} - {nextTimeLabel}
              </div>
              
              <div className="slot-status-indicator">
                {booking ? (
                  <div className="slot-occupied-info">
                    <div className="occupant-details">
                      <span className="occupant-badge">👤 {booking.user}</span>
                      <span className="purpose-text" title={booking.purpose}>{booking.purpose}</span>
                    </div>
                    {booking.contactInfo && (
                      <a 
                        href={`https://wa.me/${booking.contactInfo.replace(/[^0-9]/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="contact-btn"
                        title={`Hubungi ${booking.contactInfo}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        📞 Hubungi
                      </a>
                    )}
                  </div>
                ) : isSelected ? (
                  <span className="selected-text-indicator">🎯 Pilihan Anda di Form</span>
                ) : (
                  <span className="free-text-indicator">🟢 Kosong (Klik untuk booking)</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .calendar-panel {
          padding: 20px;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.08);
          padding-bottom: 12px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .calendar-header h3 {
          font-size: 1.1rem;
          color: var(--foreground);
        }

        .selected-date-badge {
          background: var(--primary-glow);
          border: 1px solid var(--border-glow);
          color: var(--primary);
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 0.78rem;
          font-weight: 700;
        }

        .calendar-instruction-text {
          font-size: 0.72rem;
          color: var(--text-muted);
          margin-bottom: 16px;
          font-style: italic;
        }

        /* Interactive list of slots */
        .interactive-hours-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 480px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .hour-slot-row {
          display: flex;
          align-items: center;
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid rgba(148, 163, 184, 0.1);
          background: rgba(8, 7, 17, 0.2);
          transition: all 0.2s ease;
          font-size: 0.85rem;
        }

        .slot-time-indicator {
          font-family: var(--font-outfit);
          font-weight: 700;
          color: var(--text-light);
          min-width: 110px;
        }

        .slot-status-indicator {
          flex-grow: 1;
          display: flex;
          align-items: center;
          font-size: 0.8rem;
        }

        /* Free / Clickable style */
        .slot-free-clickable {
          cursor: pointer;
          border-color: rgba(16, 185, 129, 0.15);
          background: rgba(16, 185, 129, 0.02);
        }

        .slot-free-clickable:hover {
          border-color: var(--success);
          background: rgba(16, 185, 129, 0.08);
          transform: translateX(2px);
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.1);
        }

        .free-text-indicator {
          color: var(--success);
          font-weight: 500;
        }

        /* Selected in form style */
        .slot-form-selected {
          cursor: pointer;
          border-color: var(--primary);
          background: var(--primary-glow);
          box-shadow: 0 0 10px var(--primary-glow);
        }

        .selected-text-indicator {
          color: var(--foreground);
          font-weight: 700;
        }

        /* Occupied style */
        .slot-occupied {
          border-color: rgba(239, 68, 68, 0.12);
          background: rgba(239, 68, 68, 0.03);
          opacity: 0.75;
        }

        .slot-occupied-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          gap: 12px;
        }

        .occupant-details {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .contact-btn {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s;
          white-space: nowrap;
        }
        
        .contact-btn:hover {
          background: rgba(34, 197, 94, 0.2);
          transform: translateY(-1px);
        }

        .occupant-badge {
          background: rgba(239, 68, 68, 0.12);
          color: var(--error);
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 700;
          font-size: 0.75rem;
        }

        .purpose-text {
          color: var(--text-muted);
          font-size: 0.75rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 180px;
        }
      `}</style>
    </div>
  );
}

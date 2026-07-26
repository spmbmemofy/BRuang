'use client';

import React, { useState, useEffect } from 'react';

interface MonthlyCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  bookedDates: string[]; // Array of dates in YYYY-MM-DD format that have at least one booking
}

export default function MonthlyCalendar({ selectedDate, onSelectDate, bookedDates }: MonthlyCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate || new Date()));

  useEffect(() => {
    if (selectedDate) {
      const d = new Date(selectedDate);
      if (d.getMonth() !== currentMonth.getMonth() || d.getFullYear() !== currentMonth.getFullYear()) {
        setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const renderCells = () => {
    const cells = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-cell empty"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected = dateStr === selectedDate;
      const isToday = dateStr === new Date().toLocaleDateString('en-CA');
      const hasBooking = bookedDates.includes(dateStr);

      cells.push(
        <div 
          key={dateStr} 
          className={`calendar-cell day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
          onClick={() => onSelectDate(dateStr)}
          title="Lihat Jadwal"
        >
          <span className="day-number">{d}</span>
          {hasBooking && <span className="booking-dot"></span>}
        </div>
      );
    }
    return cells;
  };

  return (
    <div className="monthly-calendar glass-panel">
      <div className="calendar-header">
        <button onClick={handlePrevMonth} className="nav-btn">&lt;</button>
        <h4 className="month-title">{monthNames[month]} {year}</h4>
        <button onClick={handleNextMonth} className="nav-btn">&gt;</button>
      </div>

      <div className="calendar-grid">
        {daysOfWeek.map(d => (
          <div key={d} className="calendar-cell header-cell">{d}</div>
        ))}
        {renderCells()}
      </div>

      <style jsx>{`
        .monthly-calendar {
          width: 100%;
          padding: 24px;
          border-radius: 12px;
          background: var(--bg-card);
          border: 1px solid var(--border-glow);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding: 0 10px;
        }

        .month-title {
          font-family: var(--font-outfit);
          color: var(--foreground);
          font-weight: 700;
          font-size: 1.25rem;
          letter-spacing: -0.01em;
        }

        .nav-btn {
          background: var(--bg-deep);
          border: 1px solid var(--border-glow);
          color: var(--foreground);
          width: 36px;
          height: 36px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1rem;
        }

        .nav-btn:hover {
          background: var(--bg-card-hover);
          border-color: var(--text-muted);
        }

        .nav-btn:active {
          transform: scale(0.95);
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }

        .calendar-cell {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .header-cell {
          font-weight: 600;
          color: var(--text-muted);
          font-size: 0.8rem;
          aspect-ratio: auto;
          padding-bottom: 12px;
          text-transform: uppercase;
          text-align: center;
        }

        .day {
          cursor: pointer;
          background: transparent;
          border-radius: 8px;
          border: 1px solid transparent;
          transition: all 0.2s ease;
        }

        .day-number {
          font-size: 1rem;
          font-weight: 500;
          z-index: 2;
          color: var(--foreground);
        }

        .day:hover {
          background: var(--bg-card-hover);
          border-color: var(--border-glow-hover);
        }

        .day:active {
          transform: scale(0.95);
          background: var(--border-glow-hover);
        }

        .today {
          border-color: var(--primary);
        }
        
        .today .day-number {
          color: var(--primary);
          font-weight: 700;
        }

        .selected {
          background: var(--primary) !important;
          border-color: var(--primary) !important;
        }

        .selected .day-number {
          font-weight: 600;
          color: white;
        }

        .booking-dot {
          width: 4px;
          height: 4px;
          background-color: var(--primary);
          border-radius: 50%;
          position: absolute;
          bottom: 6px;
        }

        .selected .booking-dot {
          background-color: white;
        }
      `}</style>
    </div>
  );
}

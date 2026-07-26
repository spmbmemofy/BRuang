'use client';

import React from 'react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  roomUrl: string;
}

export default function QRCodeModal({ isOpen, onClose, roomName, roomUrl }: QRCodeModalProps) {
  if (!isOpen) return null;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(roomUrl)}&color=080711&bgcolor=ffffff`;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Cetak QR Code - ${roomName}</title>
            <style>
              body {
                font-family: 'Outfit', sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                text-align: center;
                background-color: #ffffff;
                color: #080711;
              }
              .card {
                border: 4px solid #080711;
                border-radius: 24px;
                padding: 40px;
                max-width: 400px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
              }
              h1 { font-size: 2.2rem; margin: 0 0 10px 0; font-weight: 800; text-transform: uppercase; letter-spacing: -0.02em; }
              h2 { font-size: 1.2rem; margin: 0 0 30px 0; color: #555; font-weight: 500; }
              img { width: 250px; height: 250px; margin-bottom: 25px; }
              p { font-size: 0.95rem; color: #666; margin-top: 15px; max-width: 320px; font-weight: 400; line-height: 1.5; }
              .logo { font-size: 1.5rem; font-weight: 800; color: #6366f1; margin-bottom: 5px; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="logo">BRuang</div>
              <h1>${roomName}</h1>
              <h2>SCAN UNTUK BOOKING RUANGAN</h2>
              <img src="${qrImageUrl}" alt="QR Code ${roomName}" />
              <p>Pindai kode QR di atas untuk melihat jadwal ketersediaan dan membooking ruangan ini secara langsung dari smartphone Anda.</p>
            </div>
            <script>
              window.onload = function() {
                window.print();
                // Close window after print dialog is closed
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h3>QR Code Ruangan</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="room-info-label">
            <h4>{roomName}</h4>
            <p>Tempelkan cetakan QR Code ini di dekat pintu ruangan.</p>
          </div>
          
          <div className="qr-container">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={qrImageUrl} 
              alt={`QR Code untuk ${roomName}`} 
              className="qr-image"
            />
          </div>

          <div className="url-container">
            <span>Link Ruangan:</span>
            <a href={roomUrl} target="_blank" rel="noopener noreferrer" className="room-link">
              {roomUrl}
            </a>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-neon-outline" onClick={handlePrint}>
            🖨️ Cetak / Unduh Label QR
          </button>
          <a href={roomUrl} className="btn-neon">
            🔗 Buka Jadwal Ruangan
          </a>
        </div>
      </div>

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(8, 7, 17, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
        }

        .modal-content {
          width: 90%;
          max-width: 480px;
          padding: 24px;
          background: rgba(20, 24, 46, 0.95);
          border: 1px solid rgba(99, 102, 241, 0.3);
          box-shadow: 0 20px 50px rgba(99, 102, 241, 0.2);
          transform: translateY(0);
          animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 12px;
          margin-bottom: 16px;
        }

        .modal-header h3 {
          font-size: 1.25rem;
          color: #cbd5e1;
        }

        .close-btn {
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 1.75rem;
          cursor: pointer;
          transition: color 0.2s;
        }

        .close-btn:hover {
          color: #ef4444;
        }

        .room-info-label {
          text-align: center;
          margin-bottom: 20px;
        }

        .room-info-label h4 {
          font-size: 1.4rem;
          color: white;
          margin-bottom: 6px;
        }

        .room-info-label p {
          font-size: 0.85rem;
          color: #94a3b8;
        }

        .qr-container {
          display: flex;
          justify-content: center;
          align-items: center;
          background: white;
          padding: 16px;
          border-radius: 12px;
          width: 250px;
          height: 250px;
          margin: 0 auto 20px auto;
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
        }

        .qr-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .url-container {
          background: rgba(8, 7, 17, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.8rem;
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 20px;
          word-break: break-all;
        }

        .url-container span {
          color: #94a3b8;
          font-weight: 500;
        }

        .room-link {
          color: #6366f1;
          text-decoration: underline;
        }

        .room-link:hover {
          color: #a855f7;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 16px;
        }

        .modal-footer :global(.btn-neon),
        .modal-footer :global(.btn-neon-outline) {
          padding: 10px 18px;
          font-size: 0.85rem;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @media (max-width: 480px) {
          .modal-footer {
            flex-direction: column;
          }
          .modal-footer :global(.btn-neon),
          .modal-footer :global(.btn-neon-outline) {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}

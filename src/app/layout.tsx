import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BRuang - Booking Ruangan Mudah & Cepat',
  description: 'Pindai QR Code untuk melihat jadwal pemakaian dan membooking ruangan rapat secara instan.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        {children}
      </body>
    </html>
  );
}

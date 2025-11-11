'use client';

import './globals.css';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { usePathname } from 'next/navigation';
import Analytics from './components/Analytics'; // ✅ RUTA CORRECTA

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNavbarFooter = pathname.startsWith('/admin');

  return (
    <html lang="es">
      <head>
        {/* Fuentes */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;600&display=swap"
          rel="stylesheet"
        />

        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-V6GMHK8MXP"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-V6GMHK8MXP', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </head>
      <body className="flex flex-col min-h-screen">
        <Analytics />
        {!hideNavbarFooter && <Navbar />}
        <main className="flex-grow">{children}</main>
        {!hideNavbarFooter && <Footer />}
      </body>
    </html>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.gtag !== 'undefined') {
      window.gtag('config', 'G-V6GMHK8MXP', {
        page_path: pathname,
      });
    }
  }, [pathname]);

  return null;
}

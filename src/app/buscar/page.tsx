'use client';

import { Suspense } from 'react';
import BuscarContent from './content';

export default function BuscarPage() {
  return (
    <Suspense fallback={<div>Cargando resultados…</div>}>
      <BuscarContent />
    </Suspense>
  );
}

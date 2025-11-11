import { Suspense } from 'react';
import VistaNewArrivals from './VistaNewArrivals';

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <VistaNewArrivals />
    </Suspense>
  );
}

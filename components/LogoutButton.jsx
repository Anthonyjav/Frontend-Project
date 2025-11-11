'use client';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    // Eliminar cookie
    document.cookie = 'usuario=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    // Redirigir al login
    router.push('/login');
  };

  return (
    <button onClick={handleLogout} className="text-red-600 hover:underline">
      Cerrar sesión
    </button>
  );
}

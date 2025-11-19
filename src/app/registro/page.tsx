'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegistroPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre || !apellido || !email || !password) {
      setMensaje('Todos los campos son obligatorios.');
      return;
    }

    setLoading(true);
    setMensaje('');

    try {
      const response = await fetch('https://backend-project-677e.onrender.com/usuarios/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          apellido,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMensaje(data?.error || 'Error al registrar el usuario');
      } else {
        setMensaje('Registro exitoso ✅');

        // Limpia los campos
        setNombre('');
        setApellido('');
        setEmail('');
        setPassword('');

        // Redirige al login
        setTimeout(() => {
          router.push('/login');
        }, 500);
      }
    } catch (error) {
      console.error('Error en el registro:', error);
      setMensaje('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-white pt-24">
      <div className="w-full max-w-md bg-white shadow-lg p-8 rounded-lg border">
        <h2 className="font-[Beige] text-2xl text-center text-black mb-6">
          Crear cuenta
        </h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-sm text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              id="name"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black text-black"
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label htmlFor="apellido" className="block text-sm text-gray-700 mb-1">Apellido</label>
            <input
              type="text"
              id="apellido"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black text-black"
              placeholder="Tu apellido"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm text-gray-700 mb-1">Correo electrónico</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black text-black"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black text-black"
              placeholder="********"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-animated"
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        {mensaje && (
          <p className={`mt-4 text-center text-sm ${mensaje.includes('exitoso') ? 'text-green-600' : 'text-red-500'}`}>
            {mensaje}
          </p>
        )}

        <div className="mt-4 text-center text-sm text-gray-600">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" className="text-black hover:underline">
            Inicia sesión
          </Link>
        </div>
      </div>
    </main>
  );
}

// admin/dashboard/components/CrearCategoriaForm.jsx
'use client';

import { useState } from 'react';

export default function CrearCategoriaForm({ onCategoriaCreada }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nombre.trim()) {
      setMensaje('El nombre de la categoría es requerido');
      return;
    }

    try {
      const res = await fetch('https://api.sgstudio.shop/categorias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre, descripcion }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMensaje(data.error || 'Error al crear categoría');
        return;
      }

      setMensaje(`Categoría "${data.nombre}" creada con éxito`);
      setNombre('');
      setDescripcion('');

      // Si el padre pasó la función, la llamamos para que recargue la lista
      if (typeof onCategoriaCreada === 'function') {
        onCategoriaCreada(data);
      }
    } catch (error) {
      console.error(error);
      setMensaje('Error al conectar con el servidor');
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-md w-full max-w-md mx-auto">
      <h3 className="text-2xl font-semibold mb-4 text-gray-900">
        Crear Nueva Categoría
      </h3>
 
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre de la categoría"
          className="w-full px-4 py-2 rounded-md border border-gray-200 bg-gray-100 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
        <input
          type="text"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Descripción de la categoría"
          className="w-full px-4 py-2 rounded-md border border-gray-200 bg-gray-100 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
        />

        <button
          type="submit"
          className="w-full py-2 px-4 bg-gray-800 text-white rounded-md shadow hover:bg-gray-700 transition"
        >
          Crear Categoría
        </button>

        {mensaje && <p className="text-center mt-2 text-sm text-gray-700">{mensaje}</p>}
      </form>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';

export default function ListarProductosEmployee() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProductos() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos`);
        if (!res.ok) throw new Error('Error al obtener productos');
        const data = await res.json();
        setProductos(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProductos();
  }, []);

  if (loading) return <p className="text-center text-gray-600">Cargando productos...</p>;
  if (error) return <p className="text-center text-red-600">{error}</p>;

  return (
    <>
      <h2 className="text-2xl font-bold text-gray-800 mb-8">Productos (solo lectura)</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {productos.map((producto) => (
          <div key={producto.id} className="bg-white rounded-lg shadow p-4">
            <div className="w-full h-40 overflow-hidden rounded-md bg-gray-100 mb-4">
              <img
                src={Array.isArray(producto.imagen) && producto.imagen.length > 0 ? producto.imagen[0] : '/placeholder.jpg'}
                alt={producto.nombre}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 truncate">{producto.nombre}</h3>
            <p className="text-sm font-bold text-gray-800">S/ {producto.precio}</p>
            <p className="text-sm text-gray-700 mt-2 truncate">{producto.descripcion}</p>
          </div>
        ))}
      </div>
    </>
  );
}

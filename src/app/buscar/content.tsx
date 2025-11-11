'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type Producto = {
  id: number;
  nombre: string;
  imagen: string[];
  precio: number;
  seleccionado: boolean;
};

export default function BuscarContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('query') ?? '';
  const [allProducts, setAllProducts] = useState<Producto[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('https://api.sgstudio.shop/productos')
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar productos');
        return res.json();
      })
      .then((data: Producto[]) => {
        setAllProducts(data);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      setProductos([]);
    } else {
      const filtered = allProducts.filter(p =>
        p.nombre.toLowerCase().includes(term)
      );
      setProductos(filtered);
    }
  }, [query, allProducts]);

  return (
    <main className="px-8 py-6 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center pt-14">
        Resultados para “<span className="text-black">{query}</span>”
      </h1>

      {loading && (
        <p className="text-center text-lg text-gray-600">Cargando productos…</p>
      )}

      {error && (
        <p className="text-center text-red-600">{error}</p>
      )}

      {!loading && !error && productos.length === 0 && (
        <p className="text-center text-gray-600">No se encontraron productos.</p>
      )}

      {!loading && !error && productos.length > 0 && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {productos.map(p => (
            <Link
              key={p.id}
              href={`/producto/${p.id}`}
              className="group block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="relative w-full h-48">
                <Image
                  src={p.imagen[0]}
                  alt={p.nombre}
                  fill
                  unoptimized
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                    p.imagen[1] ? 'group-hover:opacity-0' : ''
                  }`}
                />
                {p.imagen[1] && (
                  <Image
                    src={p.imagen[1]}
                    alt={`${p.nombre} alternativa`}
                    fill
                    unoptimized
                    className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                )}
                {p.seleccionado && (
                  <div className="absolute top-2 left-2 z-10">
                    <span className="inline-block bg-black text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
                      New Arrivals
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4 text-center">
                <h2 className="text-gray-800 font-semibold truncate">{p.nombre}</h2>
                <p className="text-black font-bold mt-1">PEN {p.precio.toFixed(2)}</p>
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}

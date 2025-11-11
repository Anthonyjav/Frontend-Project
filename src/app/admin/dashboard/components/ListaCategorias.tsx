'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';

type Categoria = {
  id: number;
  nombre: string;
};

export default function ListaCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);

  /* ──────────────── cargar categorías ──────────────── */
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await fetch('https://api.sgstudio.shop/categorias');
        const data = await res.json();
        setCategorias(data);
      } catch (err) {
        console.error('Error al obtener categorías:', err);
      }
    };
    fetchCategorias();
  }, []);

  /* ──────────────── eliminar categoría ──────────────── */
  const handleEliminar = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar esta categoría?')) return;

    const copia = categorias;
    setCategorias((prev) => prev.filter((c) => c.id !== id));
    setEliminandoId(id);

    try {
      const res = await fetch(
        `https://api.sgstudio.shop/categorias/${id}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg = data?.mensaje || 'No se pudo eliminar la categoría.';
        throw new Error(msg);
      }

      alert('Categoría eliminada correctamente'); // Opcional
    } catch (err: any) {
      setCategorias(copia); // Deshacer eliminación optimista
      alert(err.message);   // ← Aquí se mostrará: "No se puede eliminar la categoría porque tiene productos asociados."
    } finally {
      setEliminandoId(null);
    }
  };


  /* ─────────────────── UI ─────────────────── */
  return (
    <ul className="space-y-2">
      {categorias.map((categoria) => (
        <li
          key={categoria.id}
          className="bg-gray-100 p-3 rounded shadow-sm hover:shadow transition flex items-center justify-between"
        >
          <span className="font-bold">{categoria.nombre}</span>
          <button
            onClick={() => handleEliminar(categoria.id)}
            disabled={eliminandoId === categoria.id}
            className="p-1 rounded hover:bg-red-100 disabled:opacity-50"
            title="Eliminar"
          >
            <Trash2 className="w-5 h-5 text-red-600" />
          </button>
        </li>
      ))}
      {categorias.length === 0 && (
        <p className="text-center text-gray-500">No hay categorías.</p>
      )}
    </ul>
  );
}

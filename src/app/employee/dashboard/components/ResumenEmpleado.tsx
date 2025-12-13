'use client';

import { useEffect, useState } from 'react';
import { Package, Layers3 } from 'lucide-react';
import GraficoOrdenes from '@/app/admin/dashboard/components/GraficoOrdenes';

export default function ResumenEmpleado() {
  const [productos, setProductos] = useState(0);
  const [categorias, setCategorias] = useState(0);
  const [ordenes, setOrdenes] = useState(0);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos`)
      .then(res => res.json())
      .then(data => setProductos(Array.isArray(data) ? data.length : 0))
      .catch(() => setProductos(0));

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/categorias`)
      .then(res => res.json())
      .then(data => setCategorias(Array.isArray(data) ? data.length : 0))
      .catch(() => setCategorias(0));

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/ordenes`)
      .then(res => res.json())
      .then(data => setOrdenes(Array.isArray(data) ? data.length : 0))
      .catch(() => setOrdenes(0));
  }, []);

  return (
    <section className="mb-8 p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-3xl font-extrabold mb-2">Panel Empleado</h2>
      <p className="text-gray-600 mb-6">Vista reducida del panel administrativo con funciones permitidas</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card titulo="Productos" valor={productos} Icon={Package} />
        <Card titulo="Categorías" valor={categorias} Icon={Layers3} />
        <Card titulo="Órdenes" valor={ordenes} Icon={Package} />
      </div>

      {/* Reutilizamos el gráfico de órdenes, pero de forma informativa */}
      <GraficoOrdenes />
    </section>
  );
}

function Card({ titulo, valor, Icon }: { titulo: string; valor: number; Icon: any }) {
  return (
    <div className="bg-gray-100 rounded-lg p-5 flex items-center shadow-sm hover:shadow-md transition">
      <Icon className="text-gray-800 w-8 h-8 mr-4" />
      <div>
        <p className="text-sm text-gray-700 font-bold">{titulo}</p>
        <p className="text-2xl font-extrabold text-gray-900">{valor}</p>
      </div>
    </div>
  );
}

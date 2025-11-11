'use client';
import {
  Package, Tags, LogOut, LayoutList, DollarSign   ,Layers3, PlusCircle,AlertCircle,
} from 'lucide-react';

export default function Sidebar({
  onSelect,
  onLogout,
}: {
  onSelect: (view: string) => void;
  onLogout: () => void;
}) {
  return (
    <aside className="w-72 p-6 flex flex-col justify-between bg-white border-r border-gray-200 shadow-sm">
      <div>
        <h1 className="text-3xl font-extrabold mb-8 text-center">Panel Admin</h1>
        <nav className="flex flex-col gap-3">
          {[
            { label: 'Dashboard', icon: Package, view: 'dashboard' },
            { label: 'Categorías', icon: Tags, view: 'categorias' },
            { label: 'Ver Productos', icon: LayoutList, view: 'productos' },
            { label: 'Crear Producto', icon: PlusCircle, view: 'crear-producto' },
            { label: 'Usuarios', icon: Layers3, view: 'usuarios' },
            { label: 'Órdenes', icon: Package, view: 'ordenes' }, 
            { label: 'Ventas',         icon: DollarSign, view: 'ventas' },
            { label: 'Reclamos', icon: AlertCircle, view: 'reclamos' },
          ].map(({ label, icon: Icon, view }) => (
            <button
              key={view}
              onClick={() => onSelect(view)}
              className="flex items-center gap-2 py-2 px-3 rounded hover:bg-gray-100 transition"
            >
              <Icon className="w-5 h-5 text-gray-700" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>
      <button
        onClick={onLogout}
        className="mt-10 py-2 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        <span>Cerrar sesión</span>
      </button>
    </aside>
  );
}

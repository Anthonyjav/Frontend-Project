'use client';

import React, { useEffect, useState } from 'react';

type Orden = {
  id: number;
  usuarioId: number;
  nombre?: string;
  apellido?: string;
  estado: string;
  total: number;
  createdAt: string;
};

type OrdenItem = {
  id: number;
  ordenId: number;
  productoId: number;
  cantidad: number;
  precio: number;
};

type Producto = {
  id: number;
  nombre: string;
  precio: number; // <-- Asumo que tienes precio en producto para usarlo
};

export default function VistaOrdenes() {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [loading, setLoading] = useState(true);
  const [ordenItems, setOrdenItems] = useState<OrdenItem[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ordenSeleccionadaId, setOrdenSeleccionadaId] = useState<number | null>(null);

  const [productoParaAgregar, setProductoParaAgregar] = useState<number | null>(null);
  const [agregandoProducto, setAgregandoProducto] = useState(false);

  const calcularTotal = (items: OrdenItem[]) => {
    return items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [ordenesRes, productosRes] = await Promise.all([
          fetch('https://backend-project-677e.onrender.com/ordenes'),
          fetch('https://backend-project-677e.onrender.com/productos'),
        ]);

        const ordenesData = await ordenesRes.json();
        const productosData = await productosRes.json();

        setOrdenes(ordenesData);
        setProductos(productosData);
      } catch (error) {
        console.error('Error al obtener datos:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const fetchOrdenItems = async (ordenId: number) => {
    try {
      const res = await fetch('https://backend-project-677e.onrender.com/orden-items');
      const data: OrdenItem[] = await res.json();
      const filtrados = data.filter((item) => item.ordenId === ordenId);
      setOrdenItems(filtrados);
    } catch (error) {
      console.error('Error al obtener los items:', error);
    }
  };

  const cambiarEstado = async (id: number, estado: string) => {
    try {
      const res = await fetch(`https://backend-project-677e.onrender.com/ordenes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      });

      if (!res.ok) throw new Error('Error al actualizar estado');

      setOrdenes((prev) =>
        prev.map((orden) =>
          orden.id === editandoId ? { ...orden, estado } : orden
        )
      );
      setEditandoId(null);
      setOrdenItems([]);
      setOrdenSeleccionadaId(null);
    } catch (err) {
      console.error(err);
      alert('Error al actualizar estado');
    }
  };

  const eliminarOrden = async (id: number) => {
    if (!confirm('¿Deseas eliminar esta orden?')) return;

    try {
      const res = await fetch(`https://backend-project-677e.onrender.com/ordenes/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error al eliminar orden');

      setOrdenes((prev) => prev.filter((orden) => orden.id !== id));
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar la orden');
    }
  };

  // Validación: no eliminar último item
  const eliminarItem = async (id: number) => {
    if (ordenItems.length <= 1) {
      alert('La orden debe tener al menos un producto, no puedes eliminar este item.');
      return;
    }

    if (!confirm('¿Deseas eliminar este producto de la orden?')) return;

    try {
      const res = await fetch(`https://backend-project-677e.onrender.com/orden-items/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('No se pudo eliminar el item');

      const nuevosItems = ordenItems.filter((item) => item.id !== id);
      setOrdenItems(nuevosItems);

      // Recalcular y actualizar total
      const nuevoTotal = calcularTotal(nuevosItems);

      await fetch(`https://backend-project-677e.onrender.com/ordenes/${editandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total: nuevoTotal }),
      });

      setOrdenes((prev) =>
        prev.map((orden) =>
          orden.id === editandoId ? { ...orden, total: nuevoTotal } : orden
        )
      );

    } catch (error) {
      console.error(error);
      alert('Error al eliminar item');
    }
  };

  const guardarItemActualizado = async (item: OrdenItem) => {
    try {
      const res = await fetch(`api.sgstudio.shop/orden-items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cantidad: item.cantidad }),
      });

      if (!res.ok) throw new Error('No se pudo actualizar el item');

      // Actualizar total después de guardar el item
      const nuevoTotal = calcularTotal(ordenItems);
      await fetch(`https://backend-project-677e.onrender.com/ordenes/${editandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total: nuevoTotal }),
      });

      setOrdenes((prev) =>
        prev.map((orden) =>
          orden.id === editandoId ? { ...orden, total: nuevoTotal } : orden
        )
      );

      alert('Item actualizado');
      setEditandoId(null);
      setOrdenItems([]);
      setOrdenSeleccionadaId(null);
    } catch (error) {
      console.error(error);
      alert('Error al actualizar item');
    }
  };

  // Función para agregar producto nuevo a la orden, con POST a backend para crear item
  const agregarProducto = async () => {
    if (productoParaAgregar === null) return alert('Selecciona un producto para agregar');

    // Verificar que no exista ya el producto en la orden
    if (ordenItems.some(item => item.productoId === productoParaAgregar)) {
      return alert('Este producto ya está en la orden');
    }

    const producto = productos.find(p => p.id === productoParaAgregar);
    if (!producto) return alert('Producto no encontrado');

    try {
      // Crear item nuevo en backend
      const res = await fetch('https://backend-project-677e.onrender.com/orden-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ordenId: editandoId,
          productoId: producto.id,
          cantidad: 1,
          precio: producto.precio, // asumimos que tienes el precio en producto
        }),
      });

      if (!res.ok) throw new Error('No se pudo agregar el producto');

      const nuevoItem: OrdenItem = await res.json();

      const nuevosItems = [...ordenItems, nuevoItem];
      setOrdenItems(nuevosItems);
      setAgregandoProducto(false);
      setProductoParaAgregar(null);

      // Actualizar total en backend y frontend
      const nuevoTotal = calcularTotal(nuevosItems);
      await fetch(`https://backend-project-677e.onrender.com/ordenes/${editandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total: nuevoTotal }),
      });

      setOrdenes((prev) =>
        prev.map((orden) =>
          orden.id === editandoId ? { ...orden, total: nuevoTotal } : orden
        )
      );

    } catch (error) {
      console.error(error);
      alert('Error al agregar producto');
    }
  };

  const getNombreProducto = (id: number) => {
    const producto = productos.find((p) => p.id === id);
    return producto ? producto.nombre : `ID ${id}`;
  };

  if (loading) return <p className="text-center text-gray-600">Cargando órdenes...</p>;

  return (
    <div className="p-6 space-y-10">
      <h2 className="text-2xl font-bold mb-4 text-black">Órdenes Registradas</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-black text-sm">
          <thead className="bg-black text-white uppercase">
            <tr>
              <th className="px-4 py-2 border border-black">ID</th>
              <th className="px-4 py-2 border border-black">Usuario</th>
              <th className="px-4 py-2 border border-black">Total</th>
              <th className="px-4 py-2 border border-black">Estado</th>
              <th className="px-4 py-2 border border-black">Fecha</th>
              <th className="px-4 py-2 border border-black">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ordenes.map((orden) => (
              <tr
                key={orden.id}
                className="hover:bg-gray-100"
                onClick={() => {
                  if (!editandoId) {
                    setOrdenSeleccionadaId(
                      ordenSeleccionadaId === orden.id ? null : orden.id
                    );
                    fetchOrdenItems(orden.id);
                  }
                }}
              >
                <td className="px-4 py-2 border border-black">{orden.id}</td>
                <td className="px-4 py-2 border border-black">
                  {orden.nombre} {orden.apellido}
                </td>
                <td className="px-4 py-2 border border-black">
                  PEN {orden.total.toFixed(2)}
                </td>
                <td className="px-4 py-2 border border-black">
                  {editandoId === orden.id ? (
                    <select
                      value={nuevoEstado}
                      onChange={(e) => setNuevoEstado(e.target.value)}
                      className="border border-black px-2 py-1 rounded"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="completado">Completado</option>
                    </select>
                  ) : (
                    <span className="capitalize">{orden.estado}</span>
                  )}
                </td>
                <td className="px-4 py-2 border border-black">
                  {new Date(orden.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-2 border border-black space-x-2">
                  {editandoId === orden.id ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cambiarEstado(orden.id, nuevoEstado);
                        }}
                        className="px-2 py-1 border border-black text-black hover:bg-black hover:text-white rounded text-xs"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditandoId(null);
                        }}
                        className="px-2 py-1 border border-black text-black hover:bg-black hover:text-white rounded text-xs"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        disabled={editandoId !== null}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditandoId(orden.id);
                          setOrdenSeleccionadaId(null);
                          setNuevoEstado(orden.estado);
                          fetchOrdenItems(orden.id);
                        }}
                        className={`px-2 py-1 border border-black rounded text-xs ${
                          editandoId !== null
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-black hover:bg-black hover:text-white'
                        }`}
                      >
                        Editar
                      </button>
                      <button
                        disabled={editandoId !== null}
                        onClick={(e) => {
                          e.stopPropagation();
                          eliminarOrden(orden.id);
                        }}
                        className={`px-2 py-1 border border-black rounded text-xs ${
                          editandoId !== null
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-black hover:bg-black hover:text-white'
                        }`}
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ordenSeleccionadaId && editandoId === null && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-3 text-black">
            Detalles de la orden #{ordenSeleccionadaId}
          </h3>
          <table className="min-w-full border border-black text-sm">
            <thead className="bg-black text-white">
              <tr>
                <th className="px-4 py-2 border border-black">Producto</th>
                <th className="px-4 py-2 border border-black">Cantidad</th>
                <th className="px-4 py-2 border border-black">Precio</th>
              </tr>
            </thead>
            <tbody>
              {ordenItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-100">
                  <td className="px-4 py-2 border border-black">
                    {getNombreProducto(item.productoId)}
                  </td>
                  <td className="px-4 py-2 border border-black">{item.cantidad}</td>
                  <td className="px-4 py-2 border border-black">
                    PEN {item.precio.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editandoId && (
        <div className="mt-8 bg-gray-50 border border-black p-4 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-3 text-black">
            Editar Productos de la orden #{editandoId}
          </h3>

          {/* Botón y select para añadir producto */}
          <div className="mb-4 flex items-center space-x-2">
            {agregandoProducto ? (
              <>
                <select
                  value={productoParaAgregar ?? ''}
                  onChange={(e) => setProductoParaAgregar(Number(e.target.value))}
                  className="border border-black rounded px-2 py-1"
                >
                  <option value="">Selecciona un producto</option>
                  {productos.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.nombre}
                    </option>
                  ))}
                </select>
                <button
                  onClick={agregarProducto}
                  className="px-2 py-1 border border-black text-black hover:bg-black hover:text-white rounded text-xs"
                >
                  Agregar
                </button>
                <button
                  onClick={() => {
                    setAgregandoProducto(false);
                    setProductoParaAgregar(null);
                  }}
                  className="px-2 py-1 border border-black text-black hover:bg-black hover:text-white rounded text-xs"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                onClick={() => setAgregandoProducto(true)}
                className="px-2 py-1 border border-black text-black hover:bg-black hover:text-white rounded text-xs"
              >
                Añadir Producto
              </button>
            )}
          </div>

          <table className="min-w-full border border-black text-sm">
            <thead className="bg-black text-white">
              <tr>
                <th className="px-4 py-2 border border-black">Producto</th>
                <th className="px-4 py-2 border border-black">Cantidad</th>
                <th className="px-4 py-2 border border-black">Precio</th>
                <th className="px-4 py-2 border border-black">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-100">
                  <td className="px-4 py-2 border border-black">
                    {getNombreProducto(item.productoId)}
                  </td>
                  <td className="px-4 py-2 border border-black">
                    <input
                      type="number"
                      min={1}
                      value={item.cantidad}
                      onChange={(e) => {
                        const nuevaCantidad = parseInt(e.target.value);
                        setOrdenItems((prev) =>
                          prev.map((i) =>
                            i.id === item.id ? { ...i, cantidad: nuevaCantidad } : i
                          )
                        );
                      }}
                      className="w-16 border border-black rounded px-2 py-1"
                    />
                  </td>
                  <td className="px-4 py-2 border border-black">
                    PEN {item.precio.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 border border-black space-x-2">
                    <button
                      onClick={() => guardarItemActualizado(item)}
                      className="px-2 py-1 border border-black text-black hover:bg-black hover:text-white rounded text-xs"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => eliminarItem(item.id)}
                      className="px-2 py-1 border border-black text-black hover:bg-black hover:text-white rounded text-xs"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
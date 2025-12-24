'use client';

import React, { useEffect, useState } from 'react';

type Orden = {
  id: number;
  usuarioId: number;
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  pais?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  direccion?: string;
  referencia?: string;
  metodoEnvio?: string;
  estado: string;
  total: number;
  subtotal?: number;
  envio?: number;
  transactionId?: string;
  paymentStatus?: string;
  paymentDate?: string;
  orderIdIzipay?: string;
  shippingMethod?: string;
  paymentResponse?: any;
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
  const [modalDetalle, setModalDetalle] = useState<Orden | null>(null);

  const calcularTotal = (items: OrdenItem[]) => {
    return items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [ordenesRes, productosRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/ordenes`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos`),
        ]);

        const ordenesData = await ordenesRes.json();
        const productosData = await productosRes.json();

        setOrdenes(ordenesData.map((o: any) => ({
          ...o,
          total: typeof o.total === 'string' ? parseFloat(o.total) : Number(o.total || 0),
        })));
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orden-items`);
      const data: OrdenItem[] = await res.json();
      const filtrados = data.filter((item) => item.ordenId === ordenId);
      setOrdenItems(filtrados);
      return filtrados;
    } catch (error) {
      console.error('Error al obtener los items:', error);
      return [];
    }
  }; 

  const abrirModalDetalle = async (orden: Orden) => {
    try {
      let ordenCompleta: Orden;
      
      // Si no tenemos los detalles completos, traerlos del backend
      if (!orden.email) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ordenes/${orden.id}`);
        ordenCompleta = await res.json();
      } else {
        ordenCompleta = orden;
      }
      
      // Extraer metadata del paymentResponse
      const metadata: any = extractMetadata(ordenCompleta);
      
      // Agregar datos de metadata a la orden si existen
      if (metadata) {
        if (metadata.shippingMethod) ordenCompleta.shippingMethod = metadata.shippingMethod;
        if (metadata.referencia) ordenCompleta.referencia = metadata.referencia;
        if (metadata.orderId) ordenCompleta.orderIdIzipay = metadata.orderId;
        if (typeof metadata.shippingCost !== 'undefined') ordenCompleta.envio = Number(metadata.shippingCost);
      }
      
      // Obtener items y calcular subtotal
      const items = await fetchOrdenItems(ordenCompleta.id);
      const subtotal = calcularTotal(items);

      // Determinar envío (prioriza metadata, luego campo envio o método)
      const shippingMethodFromMeta = metadata?.shippingMethod || ordenCompleta.shippingMethod;
      const envioComputed = typeof ordenCompleta.envio === 'number' && ordenCompleta.envio > 0
        ? ordenCompleta.envio
        : (shippingMethodFromMeta === 'olva' ? 20 : (shippingMethodFromMeta === 'recojo' ? 0 : Number(ordenCompleta.envio) || 0));

      ordenCompleta.subtotal = subtotal;
      ordenCompleta.envio = envioComputed;
      ordenCompleta.total = subtotal + envioComputed;

      setModalDetalle(ordenCompleta);
    } catch (error) {
      console.error('Error al obtener detalles:', error);
    }
  }; 

  const cerrarModalDetalle = () => {
    setModalDetalle(null);
  };

  // Función auxiliar para verificar si un valor es válido
  const hasValue = (value: any): boolean => {
    return value !== null && value !== undefined && value !== '';
  };

  // Función para extraer metadata del paymentResponse
  const extractMetadata = (orden: Orden) => {
    try {
      if (!orden.paymentResponse) return {};
      const response = typeof orden.paymentResponse === 'string' 
        ? JSON.parse(orden.paymentResponse) 
        : orden.paymentResponse;
      
      const tx = response.transactions?.[0];
      if (tx?.metadata) {
        return typeof tx.metadata === 'string' ? JSON.parse(tx.metadata) : tx.metadata;
      }
      return {};
    } catch (e) {
      console.error('Error extracting metadata:', e);
      return {};
    }
  };

  // Determinar costo de envío basado en metadata o método
  const determineEnvioForOrder = (orden?: Orden) => {
    const metadata: any = orden ? extractMetadata(orden) : {};
    if (metadata && typeof metadata.shippingCost !== 'undefined') return Number(metadata.shippingCost) || 0;
    const method = metadata?.shippingMethod || orden?.shippingMethod || orden?.metodoEnvio;
    if (method === 'olva') return 20;
    if (method === 'recojo') return 0;
    return Number(orden?.envio) || 0;
  };
  

  const cambiarEstado = async (id: number, estado: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ordenes/${id}`, {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ordenes/${id}`, {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orden-items/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('No se pudo eliminar el item');

      const nuevosItems = ordenItems.filter((item) => item.id !== id);
      setOrdenItems(nuevosItems);

      // Recalcular subtotal, envío y total
      const nuevoSubtotal = calcularTotal(nuevosItems);
      const ordenActual = ordenes.find(o => o.id === editandoId);
      const envioToSend = determineEnvioForOrder(ordenActual);
      const nuevoTotal = nuevoSubtotal + envioToSend;

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ordenes/${editandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total: nuevoTotal, subtotal: nuevoSubtotal, envio: envioToSend }),
      });

      setOrdenes((prev) =>
        prev.map((orden) =>
          orden.id === editandoId ? { ...orden, total: nuevoTotal, subtotal: nuevoSubtotal, envio: envioToSend } : orden
        )
      );

    } catch (error) {
      console.error(error);
      alert('Error al eliminar item');
    }
  };

  const guardarItemActualizado = async (item: OrdenItem) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/orden-items/${item.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cantidad: item.cantidad }),
        }
      );
      
      if (!res.ok) throw new Error('No se pudo actualizar el item');

      // Actualizar subtotal, envío y total después de guardar el item
      const nuevoSubtotal = calcularTotal(ordenItems);
      const ordenActual = ordenes.find(o => o.id === editandoId);
      const envioToSend = determineEnvioForOrder(ordenActual);
      const nuevoTotal = nuevoSubtotal + envioToSend;

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ordenes/${editandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total: nuevoTotal, subtotal: nuevoSubtotal, envio: envioToSend }),
      });

      setOrdenes((prev) =>
        prev.map((orden) =>
          orden.id === editandoId ? { ...orden, total: nuevoTotal, subtotal: nuevoSubtotal, envio: envioToSend } : orden
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orden-items`, {
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

      // Actualizar subtotal, envío y total en backend y frontend
      const nuevoSubtotal = calcularTotal(nuevosItems);
      const ordenActual = ordenes.find(o => o.id === editandoId);
      const envioToSend = determineEnvioForOrder(ordenActual);
      const nuevoTotal = nuevoSubtotal + envioToSend;

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ordenes/${editandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total: nuevoTotal, subtotal: nuevoSubtotal, envio: envioToSend }),
      });

      setOrdenes((prev) =>
        prev.map((orden) =>
          orden.id === editandoId ? { ...orden, total: nuevoTotal, subtotal: nuevoSubtotal, envio: envioToSend } : orden
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
                  PEN {Number(orden.total ?? 0).toFixed(2)}
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
                      <option value="Enviado">Enviado</option>

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
                          abrirModalDetalle(orden);
                        }}
                        className={`px-2 py-1 border border-black rounded text-xs ${
                          editandoId !== null
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-black hover:bg-black hover:text-white'
                        }`}
                      >
                        Ver Detalles
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
                    PEN {Number(item.precio ?? 0).toFixed(2)}
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
                    PEN {Number(item.precio ?? 0).toFixed(2)}
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

      {/* PANEL DETALLE EN LA PARTE INFERIOR */}
      {modalDetalle && (
        <div className="mt-8 border-2 border-black rounded-lg overflow-hidden shadow-lg">
          {/* Encabezado del panel */}
          <div className="bg-black text-white p-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold">Detalles Orden #{modalDetalle.id}</h2>
            <button
              onClick={cerrarModalDetalle}
              className="text-3xl font-bold hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          {/* Contenido del panel */}
          <div className="p-6 bg-white space-y-6">
            {/* FILA 1: Cliente y contacto */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Nombre</p>
                <p className="text-black text-lg">{modalDetalle.nombre} {modalDetalle.apellido}</p>
              </div>
              {hasValue(modalDetalle.email) && (
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Email</p>
                  <p className="text-black text-lg">{modalDetalle.email}</p>
                </div>
              )}
              {hasValue(modalDetalle.telefono) && (
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Teléfono</p>
                  <p className="text-black text-lg">{modalDetalle.telefono}</p>
                </div>
              )}
              {hasValue(modalDetalle.usuarioId) && (
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Usuario ID</p>
                  <p className="text-black text-lg">{modalDetalle.usuarioId}</p>
                </div>
              )}
            </div>

            {/* FILA 2: Dirección */}
            {(hasValue(modalDetalle.pais) || hasValue(modalDetalle.departamento) || hasValue(modalDetalle.provincia) || hasValue(modalDetalle.distrito) || hasValue(modalDetalle.direccion)) && (
              <div className="border-t pt-4">
                <p className="text-black font-bold mb-3"> Dirección de Envío</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {hasValue(modalDetalle.pais) && (
                    <div>
                      <p className="text-gray-600 text-sm">País</p>
                      <p className="text-black">{modalDetalle.pais}</p>
                    </div>
                  )}
                  {hasValue(modalDetalle.departamento) && (
                    <div>
                      <p className="text-gray-600 text-sm">Departamento</p>
                      <p className="text-black">{modalDetalle.departamento}</p>
                    </div>
                  )}
                  {hasValue(modalDetalle.provincia) && (
                    <div>
                      <p className="text-gray-600 text-sm">Provincia</p>
                      <p className="text-black">{modalDetalle.provincia}</p>
                    </div>
                  )}
                  {hasValue(modalDetalle.distrito) && (
                    <div>
                      <p className="text-gray-600 text-sm">Distrito</p>
                      <p className="text-black">{modalDetalle.distrito}</p>
                    </div>
                  )}
                </div>
               
                {hasValue(modalDetalle.referencia) && (
                  <div className="mt-2">
                    <p className="text-gray-600 text-sm">Referencia</p>
                    <p className="text-black">{modalDetalle.referencia}</p>
                  </div>
                )}
              </div>
            )}

            {/* FILA 3: Envío y Pago */}
            {(() => {
              const metadata = extractMetadata(modalDetalle);
              const shippingMethodFromMeta = metadata?.shippingMethod || modalDetalle.shippingMethod;
              const referenciaFromMeta = metadata?.referencia || modalDetalle.referencia;
              
              return (hasValue(modalDetalle.metodoEnvio) || hasValue(shippingMethodFromMeta) || hasValue(modalDetalle.paymentStatus) || hasValue(modalDetalle.paymentDate) || hasValue(modalDetalle.transactionId) || hasValue(modalDetalle.orderIdIzipay) || hasValue(referenciaFromMeta)) ? (
                <div className="border-t pt-4">
                  <p className="text-black font-bold mb-3"> Envío y Pago</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {hasValue(modalDetalle.metodoEnvio) && (
                      <div>
                        <p className="text-gray-600 text-sm">Método de Envío (BD)</p>
                        <p className="text-black capitalize">{modalDetalle.metodoEnvio}</p>
                      </div>
                    )}
                    {hasValue(shippingMethodFromMeta) && (
                      <div>
                        <p className="text-gray-600 text-sm">Método de Envío (Pago)</p>
                        <p className="text-black capitalize">{shippingMethodFromMeta}</p>
                      </div>
                    )}
                    {hasValue(modalDetalle.paymentStatus) && (
                      <div>
                        <p className="text-gray-600 text-sm">Estado de Pago</p>
                        <p className="text-black capitalize">{modalDetalle.paymentStatus}</p>
                      </div>
                    )}
                    {hasValue(modalDetalle.paymentDate) && (
                      <div>
                        <p className="text-gray-600 text-sm">Fecha de Pago</p>
                        <p className="text-black">
                          {modalDetalle.paymentDate && new Date(modalDetalle.paymentDate).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hasValue(modalDetalle.transactionId) && (
                      <div>
                        <p className="text-gray-600 text-sm">ID de Transacción</p>
                        <p className="text-black text-xs break-all">{modalDetalle.transactionId}</p>
                      </div>
                    )}
                    {hasValue(modalDetalle.orderIdIzipay) && (
                      <div>
                        <p className="text-gray-600 text-sm">Order ID IziPay</p>
                        <p className="text-black text-xs break-all">{modalDetalle.orderIdIzipay}</p>
                      </div>
                    )}
                  </div>
                  {hasValue(referenciaFromMeta) && (
                    <div className="mt-4">
                      <p className="text-gray-600 text-sm">Referencia</p>
                      <p className="text-black">{referenciaFromMeta}</p>
                    </div>
                  )}
                </div>
              ) : null;
            })()}

            {/* FILA 4: Productos */}
            <div className="border-t pt-4">
              <p className="text-black font-bold mb-3">Productos de la Orden</p>
              <table className="w-full border border-gray-300 text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-4 py-2 border text-left">Producto</th>
                    <th className="px-4 py-2 border text-center">Cantidad</th>
                    <th className="px-4 py-2 border text-right">Precio Unit.</th>
                    <th className="px-4 py-2 border text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenItems.length > 0 ? (
                    ordenItems.map((item) => (
                      <tr key={item.id} className="border hover:bg-gray-50">
                        <td className="px-4 py-2 border">
                          {getNombreProducto(item.productoId)}
                        </td>
                        <td className="px-4 py-2 border text-center">{item.cantidad}</td>
                        <td className="px-4 py-2 border text-right">
                          PEN {Number(item.precio ?? 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-2 border text-right font-semibold">
                          PEN {(Number(item.precio ?? 0) * Number(item.cantidad ?? 0)).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-2 border text-center text-gray-500">
                        No hay productos en esta orden
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* FILA 5: Resumen financiero */}
            <div className="border-t pt-4 bg-gray-100 p-4 rounded">
              <p className="text-black font-bold mb-3">Resumen Financiero</p>
              <div className="space-y-2 text-right">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-black font-semibold">
                    PEN {(Number(modalDetalle.subtotal) || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Envío:</span>
                  <span className="text-black font-semibold">
                    PEN {(Number(modalDetalle.envio) || 0).toFixed(2)}
                  </span>
                </div>
                <div className="border-t-2 pt-2 flex justify-between text-lg">
                  <span className="text-black font-bold">Total:</span>
                  <span className="text-black font-bold text-xl">
                    PEN {Number(modalDetalle.total).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* FILA 6: Estado y Fecha */}
            <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Estado de Orden</p>
                <p className="text-black text-lg font-bold capitalize">{modalDetalle.estado}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm font-semibold">Fecha de Creación</p>
                <p className="text-black">{new Date(modalDetalle.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-end">
                <button
                  onClick={cerrarModalDetalle}
                  className="w-full px-4 py-2 bg-black text-white rounded hover:bg-gray-800 font-semibold"
                >
                  Cerrar Detalles
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
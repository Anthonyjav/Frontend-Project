'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaTrash } from 'react-icons/fa';

type Usuario = {
  id: number;
  nombre: string;
  email: string;
  rol: string;
};

type Producto = {
  id: number;
  nombre: string;
  precio: number;
  imagen: string[];
};

type ItemCarrito = {
  id: number;
  cantidad: number;
  talla: string;
  color: string;
  producto: Producto;
};
type Orden = {
  id: number;
  estado: string;
  total: number;
  createdAt: string;
  orderId?: string;
  orderIdIzipay?: string;
  shippingMethod?: string;
  paymentResponse?: any;
};

export default function PerfilUsuario() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [loadingCarrito, setLoadingCarrito] = useState(true);
  const [mensajeCompra, setMensajeCompra] = useState('');
  const [comprando, setComprando] = useState(false);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [mensajeReclamo, setMensajeReclamo] = useState('');
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<Orden | null>(null);
  const [mostrarFormularioReclamo, setMostrarFormularioReclamo] = useState(false);
  const [reclamos, setReclamos] = useState<any[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any | null>(null);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  const [showRawOrder, setShowRawOrder] = useState(false);


  const router = useRouter();
 
  useEffect(() => {
    async function fetchOrdenes() {
      if (!usuario?.id) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ordenes`);
        const data = await res.json();

        // Filtrar órdenes del usuario
        const ordenesUsuario = data
          .filter((orden: any) => orden.usuarioId === usuario.id)
          .map((orden: any) => ({
            ...orden,
            total: typeof orden.total === 'string' ? parseFloat(orden.total) : Number(orden.total || 0),
            createdAt: orden.createdAt || orden.created_at || orden.date || null,
          }));
        setOrdenes(ordenesUsuario);
      } catch (err) {
        console.error(err);
      }
    }

    fetchOrdenes();
  }, [usuario]);

  useEffect(() => {
    async function fetchReclamos() {
      if (!usuario?.id) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reclamos`);
        const data = await res.json();
        const reclamosUsuario = data.filter((r: any) => r.usuarioId === usuario.id);
        setReclamos(reclamosUsuario);
      } catch (err) {
        console.error('Error al obtener reclamos:', err);
      }
    }

    fetchReclamos();
  }, [usuario]);



  useEffect(() => {
    const storedUser = localStorage.getItem('usuario');
    const isLoggedIn = localStorage.getItem('isLoggedIn');

    if (storedUser && isLoggedIn === 'true') {
      setUsuario(JSON.parse(storedUser));
    } else {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    async function fetchCarrito() {
      if (!usuario?.id) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/carrito/${usuario.id}`);
        const data = await res.json();
        setCarrito(data.items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCarrito(false);
      }
    }

    fetchCarrito();
  }, [usuario]);

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('role');
    router.push('/');
    setTimeout(() => {
      window.location.reload();
    }, 100); 
  };

  const mostrarToast = (mensaje: string) => {
    setToastMessage(mensaje);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1500);
  };

  const handleEliminarItem = async (itemId: number) => {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/carrito/item/${itemId}`, {
      method: 'DELETE',
    });

    // Eliminar del estado local
    setCarrito((prev) => prev.filter((item) => item.id !== itemId));

    // Recargar la página
    window.location.reload();
  } catch (err) {
    console.error('Error al eliminar el producto del carrito:', err);
  }
  };


  const handleEliminarOrden = async (ordenId: number) => {
    const confirmacion = confirm('¿Estás seguro de que deseas eliminar esta orden?');
    if (!confirmacion) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ordenes/${ordenId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Error al eliminar la orden');
      }

      // Eliminar del estado local
      setOrdenes((prev) => prev.filter((orden) => orden.id !== ordenId));
    } catch (error) {
      console.error('Error:', error);
      alert('Hubo un problema al eliminar la orden.');
    }
  };

  const openOrderDetails = async (ordenId: number) => {
    try {
      setLoadingOrderDetails(true);
      setShowRawOrder(false);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ordenes/${ordenId}`);
      if (!res.ok) throw new Error('Error al obtener detalle de la orden');
      let data = await res.json();
      // Normalizar paymentResponse si viene como string
      try {
        if (data.paymentResponse && typeof data.paymentResponse === 'string') {
          try {
            data.paymentResponse = JSON.parse(data.paymentResponse);
          } catch (e) {
            // limpiar comillas escapadas y reintentar
            const cleaned = data.paymentResponse.replace(/\\"/g, '"');
            data.paymentResponse = JSON.parse(cleaned);
          }
        }
      } catch (e) {
        // ignore
      }

      // Normalizar orderId y shippingMethod si vienen en paymentResponse metadata
      try {
        const resp = data.paymentResponse && typeof data.paymentResponse === 'string' ? (() => { try { return JSON.parse(data.paymentResponse); } catch { return data.paymentResponse; } })() : (data.paymentResponse || {});
        const meta = resp?.transactions?.[0]?.metadata || resp?.metadata || {};
        data.orderId = data.orderId || data.orderIdIzipay || meta?.orderId || meta?.order_id || resp.orderId || resp.order_id || data.orderId;
        data.shippingMethod = data.shippingMethod || meta?.shippingMethod || meta?.metodoEnvio || resp.shippingMethod || data.shippingMethod || null;
      } catch (e) {
        // ignore
      }
      // Debug log removed: 'DETALLE ORDEN RAW'
      // Normalize a few commonly used fields
      data.total = typeof data.total === 'string' ? parseFloat(data.total) : Number(data.total || 0);
      data.createdAt = data.createdAt || data.created_at || data.date || null;
      setOrderDetails(data);
      setShowOrderModal(true);
    } catch (err) {
      console.error('Error fetching order details', err);
      mostrarToast('No se pudo cargar los detalles de la orden');
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  const extractPaymentMethod = (d: any) => {
    if (!d) return 'N/D';
    const resp = d.paymentResponse && typeof d.paymentResponse === 'string'
      ? (() => { try { return JSON.parse(d.paymentResponse); } catch { return d.paymentResponse; } })()
      : (d.paymentResponse || d);
    return (
      d.paymentMethod ||
      resp?.paymentMethod ||
      resp?.transactions?.[0]?.paymentMethod ||
      resp?.method ||
      (d.metadata && (d.metadata.paymentMethod || d.metadata.method)) ||
      'N/D'
    );
  };

  const getPaymentInfo = (d: any) => {
    if (!d) return { label: 'N/D' };
    const resp = d.paymentResponse && typeof d.paymentResponse === 'string'
      ? (() => { try { return JSON.parse(d.paymentResponse); } catch { return d.paymentResponse; } })()
      : (d.paymentResponse || d);
    const tx = resp?.transactions?.[0] || d.transactions?.[0] || null;
    const brand = tx?.transactionDetails?.cardDetails?.effectiveBrand || tx?.transactionDetails?.paymentMethodDetails?.effectiveBrand || d.paymentResponse?.card?.brand || d.paymentResponse?.paymentMethod || null;
    // try to find last4
    const pan = tx?.transactionDetails?.cardDetails?.cardHolderPan || resp?.card?.last4 || resp?.card?.last_digits || null;
    const last = pan ? String(pan).slice(-4) : null;
    const type = tx?.paymentMethodType || tx?.paymentMethod || resp?.paymentMethodType || d.paymentMethodType || null;
    const label = brand ? `${brand}${last ? ' • ****' + last : ''}` : (type || extractPaymentMethod(d) || 'N/D');
    return { brand, last, type, label };
  };

  const extractShippingMethod = (d: any) => {
    if (!d) return 'N/D';
    const resp = d.paymentResponse && typeof d.paymentResponse === 'string'
      ? (() => { try { return JSON.parse(d.paymentResponse); } catch { return d.paymentResponse; } })()
      : (d.paymentResponse || d);
    return (
      d.metodoEnvio ||
      d.shippingMethod ||
      d.shipping?.method ||
      resp?.transactions?.[0]?.metadata?.metodoEnvio ||
      resp?.transactions?.[0]?.metadata?.shippingMethod ||
      resp?.customer?.shippingDetails?.shippingMethod ||
      (d.metadata && (d.metadata.metodoEnvio || d.metadata.shippingMethod)) ||
      'N/D'
    );
  };

  // Devuelve un objeto con campos de envío normalizados: metodoEnvio, referencia, distrito, direccion, telefono
  const getShippingInfo = (d: any) => {
    if (!d) return {};
    const resp = d.paymentResponse && typeof d.paymentResponse === 'string'
      ? (() => { try { return JSON.parse(d.paymentResponse); } catch { return d.paymentResponse; } })()
      : (d.paymentResponse || d);
    const metaTx = resp?.transactions?.[0]?.metadata || (d.transactions && d.transactions[0] && d.transactions[0].metadata) || {};
    const customerShip = resp?.customer?.shippingDetails || d.customer?.shippingDetails || {};

    const metodoEnvio = d.metodoEnvio || d.shippingMethod || metaTx.metodoEnvio || metaTx.shippingMethod || customerShip.shippingMethod || (d.metadata && (d.metadata.metodoEnvio || d.metadata.shippingMethod)) || null;
    const referencia = d.referencia || metaTx.referencia || customerShip.reference || d.reference || (d.metadata && d.metadata.referencia) || null;
    const distrito = d.distrito || metaTx.distrito || customerShip.district || d.shippingAddress?.district || null;
    const direccion = d.direccion || d.address || customerShip.address || d.shippingAddress?.address || d.customer?.billingDetails?.address || null;
    const telefono = d.telefono || customerShip.phoneNumber || d.customer?.billingDetails?.phoneNumber || null;

    return { metodoEnvio, referencia, distrito, direccion, telefono };
  };

  const getItemColor = (it: any) => {
    // Prioridad: item directo -> producto -> metadata.items (transacción) -> atributos varios
    const direct = it.color || it.colour || it.colorName || it.attributes?.color;
    if (direct) return direct;

    const prodColor = (it.producto as any)?.color;
    if (prodColor) {
      if (typeof prodColor === 'string') return prodColor.split(',')[0];
      return prodColor;
    }

    // Buscar en metadata.items parseada
    const metaItems = parseMetadataItems(orderDetails || {});
    if (metaItems && metaItems.length) {
      const found = metaItems.find((mi: any) => String(mi.productoId || mi.producto_id || mi.id) === String(it.productoId || it.producto?.id || it.productoId));
      if (found) {
        return found.color || found.colour || found.colorName || null;
      }
    }

    // Otros campos posibles
    if (it.metadata && it.metadata.color) return it.metadata.color;
    return 'N/D';
  };

  const colorNameToHex = (name: string | null) => {
    if (!name) return null;
    const map: Record<string, string> = {
      negro: '#000000',
      blanco: '#FFFFFF',
      rojo: '#FF0000',
      azul: '#0000FF',
      verde: '#008000',
      amarillo: '#FFFF00',
      gris: '#808080',
      naranja: '#FFA500',
      marron: '#8B4513',
      beige: '#F5F5DC',
      rosa: '#FFC0CB',
      morado: '#800080',
      fucsia: '#FF00FF',
      camel: '#C19A6B'
    };
    const key = String(name).trim().toLowerCase();
    if (map[key]) return map[key];
    // If name is already a color (hex or rgb), return as-is
    return key.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i) ? name : null;
  };

  const normalizeColorForStyle = (raw: string | null) => {
    if (!raw) return null;
    // try map
    const mapped = colorNameToHex(raw);
    if (mapped) return mapped;
    // try using browser to validate
    try {
      const el = document.createElement('div');
      el.style.backgroundColor = '';
      el.style.backgroundColor = raw as string;
      // some browsers normalize values; check if set
      if (el.style.backgroundColor) return raw;
    } catch (e) {
      // ignore
    }
    return null;
  };

  const getItemSize = (it: any) => {
    return (
      it.talla ||
      it.size ||
      it.attributes?.size ||
      (it.producto as any)?.talla?.split?.(',')?.[0] ||
      (it.metadata && it.metadata.size) ||
      'N/D'
    );
  };

  const parseMetadataItems = (order: any) => {
    try {
      // Normalize paymentResponse structure and try several places for metadata
      let transSource: any = null;
      if (order?.paymentResponse) {
        try {
          const resp = typeof order.paymentResponse === 'string' ? JSON.parse(order.paymentResponse) : order.paymentResponse;
          transSource = resp?.transactions?.[0]?.metadata || resp?.metadata || null;
        } catch (e) {
          transSource = order.paymentResponse?.transactions?.[0]?.metadata || order.paymentResponse?.metadata || null;
        }
      }
      const txMeta = transSource || order?.transactions?.[0]?.metadata || order?.metadata;
      if (!txMeta) return [];
      const rawItems = txMeta.items;
      if (!rawItems) return [];
      if (Array.isArray(rawItems)) return rawItems;
      // puede venir como stringified JSON
      if (typeof rawItems === 'string') {
        try {
          return JSON.parse(rawItems);
        } catch (e) {
          // a veces metadata.items es una cadena con comillas escapadas
          try {
            const cleaned = rawItems.replace(/\\"/g, '"');
            return JSON.parse(cleaned);
          } catch (ee) {
            return [];
          }
        }
      }
      return [];
    } catch (err) {
      return [];
    }
  };

  const getItemImage = (it: any) => {
    // 1) si el item trae imagen directa
    if (it.imagen) return Array.isArray(it.imagen) ? it.imagen[0] : it.imagen;
    if (it.producto && it.producto.imagen && it.producto.imagen[0]) return it.producto.imagen[0];

    // 2) intentar extraer desde orderDetails.paymentResponse.transactions[0].metadata.items
    const metaItems = parseMetadataItems(orderDetails || {});
    if (metaItems && metaItems.length) {
      const found = metaItems.find((mi: any) => String(mi.productoId || mi.producto_id || mi.id) === String(it.productoId || it.producto?.id || it.productoId));
      if (found) {
        // varios nombres posibles: imagen, image, imagenUrl
        const f = found.imagen || found.image || found.imagenUrl || found.imageUrl || null;
        return Array.isArray(f) ? f[0] : f;
      }
    }

    // 3) intentar otras rutas en el item
    if (it.image) return it.image;
    if (it.imageUrl) return it.imageUrl;

    return null;
  };


  const handleIrACheckout = () => {
  if (carrito.length === 0) {
    mostrarToast('Tu carrito está vacío.');
    return;
  }
  router.push('/checkout');
  };


  if (!usuario) {
    return <p className="text-center mt-10 text-gray-600">Cargando datos del usuario...</p>;
  }

  return (
    <section className="min-h-screen pt-24 px-4 md:px-8 bg-white text-black">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="flex justify-between items-center border-b border-gray-300 pb-6">
          <h1 className="text-3xl font-bold tracking-tight uppercase">Mi cuenta</h1>
          <button
            onClick={handleLogout}
            className="btn-animated"
          >
            Cerrar sesión
          </button>
        </div>

        <div>
          <p className="text-gray-700 text-lg">
            ¡Hola <span className="font-semibold">{usuario.nombre}</span>! Aquí puedes gestionar tu
            cuenta y ver tus productos en el carrito.
          </p>
        </div>

        {mensajeCompra && (
          <div className="p-4 text-center bg-green-100 text-green-800 rounded-md">
            {mensajeCompra}
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-semibold uppercase">Carrito de compras</h2>
          {loadingCarrito ? (
            <p className="text-gray-500">Cargando productos...</p>
          ) : carrito.length === 0 ? (
            <>
              <p className="text-gray-600">Tu carrito está vacío.</p>
              <a
                href="/"
                className="inline-block mt-2 px-4 py-2 border border-black rounded hover:bg-black hover:text-white transition text-sm"
              >
                Seguir comprando
              </a>
            </>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                {carrito.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition"
                  >
                    <img
                      src={item.producto.imagen[0]}
                      alt={item.producto.nombre}
                      className="w-24 h-24 object-cover rounded-md"
                    />
                    <div className="flex-1 space-y-1">
                      <h3 className="text-lg font-semibold">{item.producto.nombre}</h3>
                      <p className="text-sm text-gray-700">PEN {item.producto.precio}</p>
                      <p className="text-sm text-gray-500">
                        Talla: {item.talla} | Color: {item.color}
                      </p>
                      <p className="text-sm text-gray-500">Cantidad: {item.cantidad}</p>

                      <div className="flex items-center gap-4 mt-2">
                        <button
                          onClick={() => handleEliminarItem(item.id)}
                          className="text-gray-600 text-sm hover:underline"
                        >
                          Eliminar producto
                        </button>

                        <button
                          onClick={() => handleEliminarItem(item.id)}
                          className="text-red-500 hover:text-gray-700 text-lg"
                          title="Eliminar producto"
                        >
                          <FaTrash className='text-black' />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleIrACheckout}
                className="mt-4 px-4 py-2 rounded text-sm bg-black text-white hover:bg-gray-800 transition"
              >
                Ir al Checkout
              </button>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold uppercase">Mis órdenes</h2>
          {ordenes.length === 0 ? (
            <p className="text-gray-600">Aún no has realizado ninguna orden.</p>
          ) : (
            <div className="space-y-4">
              {ordenes.map((orden, index) => (
           <div
             key={orden.id}
             className="p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition relative"
           >
             {orden.estado === 'completado' ? (
               <button
                 onClick={() => {
                   setOrdenSeleccionada(orden);
                   setMostrarFormularioReclamo(true);
                 }}
                 className="absolute top-2 right-2 text-blue-600 hover:text-blue-800 text-sm"
               >
                 Reclamos o quejas
               </button>
             ) : (
               <button
                 onClick={() => handleEliminarOrden(orden.id)}
                 className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm"
               >
                 Eliminar
               </button>
             )}

            <div className="mt-4">
              <button
                onClick={() => openOrderDetails(orden.id)}
                className="inline-block px-3 py-1 text-sm border rounded hover:bg-gray-100"
              >
                Ver detalles
              </button>
            </div>

             <p className="text-sm text-gray-600">Orden {orden.orderId ? orden.orderId : `#${index + 1}`}</p>
             <p className="text-lg font-semibold">Total: PEN {Number(orden.total ?? 0).toFixed(2)}</p>
             <p className="text-sm text-gray-500">
               Estado: <span className="font-medium">{orden.estado}</span>
             </p>
             <p className="text-sm text-gray-400">
               Fecha: {new Date(orden.createdAt).toLocaleString()}
             </p>
           </div>
         ))}

            </div>

          )}
        </div>

        <div className="border-t border-gray-300 pt-6">
          <h2 className="text-xl font-semibold uppercase mb-4">Mis reclamos</h2>

          {reclamos.length === 0 ? (
            <p className="text-gray-600">Aún no has registrado ningún reclamo.</p>
          ) : (
            <div className="space-y-4">
              {reclamos.map((r) => (
                <div
                  key={r.id}
                  className="p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition"
                >
                  <p className="text-sm text-gray-600">Reclamo #{r.id} - Orden #{r.ordenId}</p>
                  <p className="text-sm text-gray-800 mt-2">{r.mensaje}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Enviado: {new Date(r.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>


        <div className="border-t border-gray-300 pt-6 pb-15">
          <h2 className="text-xl font-semibold uppercase mb-4">Información de la cuenta</h2>
          <div className="space-y-2 text-sm text-gray-800">
            <p>
              <strong>Nombre:</strong> {usuario.nombre}
            </p>
            <p>
              <strong>Email:</strong> {usuario.email}
            </p>
          </div>
        </div>
      </div>
      
      {showToast && (
        <div className="fixed top-15 right-6 z-50 bg-black text-white px-6 py-3 rounded shadow-lg animate-fade-in-out transition-all">
          <p className="text-sm">{toastMessage}</p>
          <div className="mt-2 h-1 bg-white/30 relative overflow-hidden rounded">
            <div className="absolute inset-0 bg-white animate-toast-progress" />
          </div>
        </div>
      )}

      {mostrarFormularioReclamo && ordenSeleccionada && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Enviar reclamo para la orden #{ordenSeleccionada.id}</h2>
            <textarea
              value={mensajeReclamo}
              onChange={(e) => setMensajeReclamo(e.target.value)}
              className="w-full h-32 border border-gray-300 p-2 rounded"
              placeholder="Escribe aquí tu reclamo o solicitud..."
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setMostrarFormularioReclamo(false);
                  setMensajeReclamo('');
                  setOrdenSeleccionada(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!mensajeReclamo.trim()) {
                    mostrarToast('El mensaje no puede estar vacío.');
                    return;
                  }

                  try {
                    const res = await fetch('${process.env.NEXT_PUBLIC_API_URL}/reclamos', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        usuarioId: usuario?.id,
                        ordenId: ordenSeleccionada.id,
                        mensaje: mensajeReclamo,
                      }),
                    });

                    if (!res.ok) {
                      const err = await res.json();
                      throw new Error(err.error || 'Error al enviar reclamo');
                    }

                    mostrarToast('Reclamo enviado correctamente');
                    setMostrarFormularioReclamo(false);
                    setMensajeReclamo('');
                    setOrdenSeleccionada(null);
                  } catch (error) {
                    console.error(error);
                    alert('Error al registrar el reclamo.');
                  }
                  setTimeout(() => {
                    window.location.reload();
                  }, 1500);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Enviar reclamo
              </button>
            </div>
          </div>
        </div>
      )}

      {showOrderModal && orderDetails && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-16">
          <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg p-6 mx-4 overflow-auto max-h-[80vh]">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">
                  {orderDetails.orderId || orderDetails.orderIdIzipay
                    ? `Detalle Orden ${orderDetails.orderId || orderDetails.orderIdIzipay}`
                    : `Detalle Orden #${orderDetails.id || '—'}`}
                </h3>
                <p className="text-sm text-gray-600">Estado: <span className="font-medium">{orderDetails.estado || orderDetails.status || 'N/D'}</span></p>
                <p className="text-sm text-gray-600">Total: PEN {Number(orderDetails.total || orderDetails.amount || 0).toFixed(2)}</p>
                <p className="text-sm text-gray-500">Fecha: {orderDetails.createdAt ? new Date(orderDetails.createdAt).toLocaleString() : (orderDetails.date ? new Date(orderDetails.date).toLocaleString() : 'N/D')}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setShowOrderModal(false); setOrderDetails(null); }} className="px-3 py-1 bg-red-50 text-red-600 border rounded">Cerrar</button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold">Método de pago</h4>
                {(() => {
                  const p = getPaymentInfo(orderDetails);
                  return (
                    <div>
                      <p className="text-sm text-gray-700">{p.label}</p>
                      {p.brand && (
                        <div className="mt-2 text-sm text-gray-600 flex items-center gap-3">
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">{p.brand}</span>
                          {p.last && <span className="text-xs text-gray-500">••••{p.last}</span>}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div>
                <h4 className="font-semibold">Método de envío</h4>
                {(() => {
                  const s = getShippingInfo(orderDetails);
                  return (
                    <div>
                      <p className="text-sm text-gray-700">{s.metodoEnvio || orderDetails.shippingMethod || orderDetails.metodoEnvio || 'N/D'}</p>
                      <div className="mt-2 text-sm text-gray-600">
                        {s.direccion && <p>{s.direccion}</p>}
                        {(s.direccion || s.distrito) && <p>{s.distrito ? `Distrito: ${s.distrito}` : null}</p>}
                        {s.referencia && <p>Referencia: {s.referencia}</p>}
                        {s.telefono && <p>Tel: {s.telefono}</p>}
                        {!s.direccion && !s.distrito && !s.referencia && !s.telefono && (
                          <p className="text-sm text-gray-500">No hay detalles de envío disponibles</p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-semibold">Productos</h4>
              <div className="mt-2 space-y-3">
                {((orderDetails.items && orderDetails.items.length) ? orderDetails.items : (orderDetails.ordenItems || orderDetails.itemsDetalle || orderDetails.orderItems || [])).map((it: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 border p-3 rounded">
                    {(() => {
                      const img = getItemImage(it);
                      return img ? (
                        <img src={img} alt={it.nombre || it.producto?.nombre || 'Producto'} className="w-16 h-16 object-cover rounded" />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded text-xs text-gray-500">Sin imagen</div>
                      );
                    })()}
                    <div className="flex-1">
                      <p className="font-medium">{it.nombre || it.producto?.nombre || it.title || 'Producto'}</p>
                      <p className="text-sm text-gray-600">Cantidad: {it.cantidad || it.quantity || 1}</p>
                      <p className="text-sm text-gray-600">Talla: {getItemSize(it)}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-600">Color: {getItemColor(it)}</p>
                        {(() => {
                          const rawColor = getItemColor(it);
                          const cssColor = normalizeColorForStyle(rawColor === 'N/D' ? null : rawColor);
                          if (cssColor) {
                            return <span className="w-5 h-5 rounded-full" style={{ backgroundColor: cssColor, border: '1px solid #ddd' }} />;
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                    <div className="text-sm text-gray-700">PEN {Number(it.precio || it.price || it.unitPrice || 0).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {showRawOrder && (
              <div className="mt-6 bg-gray-50 p-3 rounded text-xs overflow-auto">
                <pre className="whitespace-pre-wrap">{JSON.stringify(orderDetails, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}

    </section>
    
  );
}
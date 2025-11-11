'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import SplashScreen from '../../../../components/SplashScreen';

export default function ProductoDetalle() {
  const params = useParams();
  const router = useRouter();

  const initialId = Array.isArray(params?.id) ? params.id[0] : params?.id ?? '';
  const [producto, setProducto] = useState<any>(null);
  const [idActual, setIdActual] = useState(initialId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imagenSeleccionada, setImagenSeleccionada] = useState<string | null>(null);
  const [recomendados, setRecomendados] = useState<any[]>([]);
  const [loadingRec, setLoadingRec] = useState(true);
  const [cantidad, setCantidad] = useState(1);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [mostrarCuidado, setMostrarCuidado] = useState(false);
  const [mostrarDescripcion, setMostrarDescripcion] = useState(false);
  const [mostrarComposicion, setMostrarComposicion] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setZoomPosition({ x, y });
  };

  const mostrarToast = (mensaje: string) => {
    setToastMessage(mensaje);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1500);
  };

  const fetchProducto = async (id: string | number) => {
    try {
      setLoading(true);
      setIsLoading(true);
      const res = await fetch(`https://api.sgstudio.shop/productos/${id}`);
      if (!res.ok) throw new Error('Error al obtener el producto');

      const data = await res.json();
      const ajustarURL = (url: string) => {
        if (!url.startsWith('http')) {
          return `https://api.sgstudio.shop${url.startsWith('/') ? '' : '/'}${url}`;
        }
        return url;
      };

      const imagenesAjustadas = Array.isArray(data.imagen)
        ? data.imagen.map(ajustarURL)
        : [];

      setProducto({ ...data, imagen: imagenesAjustadas });
      setImagenSeleccionada(imagenesAjustadas?.[0] || null);
      setCantidad(1);
      setError(null);
    } catch (error: any) {
      setError(error.message);
      setProducto(null);
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setShowSplash(false), 500);
      return () => clearTimeout(timer);
    } else {
      setShowSplash(true);
    }
  }, [isLoading]);

  useEffect(() => {
    if (idActual) fetchProducto(idActual);
  }, [idActual]);

  useEffect(() => {
    async function fetchRecomendados() {
      try {
        const res = await fetch('https://api.sgstudio.shop/productos');
        if (!res.ok) throw new Error('Error al obtener recomendados');
        const datos = await res.json();
        const otros = datos.filter((p: any) => String(p.id) !== String(idActual));
        const shuffled = otros.sort(() => 0.5 - Math.random());
        setRecomendados(shuffled.slice(0, 4));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRec(false);
      }
    }

    if (!loading) fetchRecomendados();
  }, [loading, idActual]);

  const handleAgregarAlCarrito = async () => {
    const usuarioStr = typeof window !== 'undefined' ? localStorage.getItem('usuario') : null;
    const usuario = usuarioStr ? JSON.parse(usuarioStr) : null;
    const userId = usuario?.id;

    if (!userId) {
      mostrarToast('Debe iniciar sesión para agregar productos al carrito');
      router.push('/login');
      return;
    }

    if (cantidad < 1) {
      mostrarToast('La cantidad debe ser al menos 1');
      return;
    }

    try {
      const res = await fetch('https://api.sgstudio.shop/carrito/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: userId,
          productoId: producto.id,
          cantidad,
          talla: 'M',
          color: producto.color || 'negro',
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error al agregar al carrito: ${errorText}`);
      }

      mostrarToast('Producto agregado al carrito');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error(err);
      mostrarToast('Hubo un error al agregar al carrito');
    }
  };

  const { nombre, precio, imagen = [], color, talla } = producto || {};

  return (
    <>
      {showSplash && (
        <div
          className={`fixed inset-0 z-50 bg-white flex items-center justify-center transition-opacity duration-500 ${
            isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <SplashScreen fadeOut={!isLoading} />
        </div>
      )}

      {!isLoading && error && <p className="p-12 text-center text-red-600">{error}</p>}

      {!isLoading && !error && !producto && (
        <p className="p-12 text-center">Producto no encontrado</p>
      )}

      {!isLoading && producto && (
        <div className="bg-white min-h-screen px-6 md:px-12 pt-24 md:pt-32 pb-12">
          {showToast && (
            <div className="fixed top-15 right-6 z-50 bg-black text-white px-6 py-3 rounded shadow-lg animate-fade-in-out transition-all">
              <p className="text-sm">{toastMessage}</p>
              <div className="mt-2 h-1 bg-white/30 relative overflow-hidden rounded">
                <div className="absolute inset-0 bg-white animate-toast-progress" />
              </div>
            </div>
          )}

          <div className="max-w-6xl mx-auto flex flex-col lg:grid lg:grid-cols-[auto_500px_1fr] gap-6">
            <div className="order-1 lg:order-1 flex flex-row lg:flex-col gap-3 items-center lg:items-start">
              {imagen.map((img: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setImagenSeleccionada(img)}
                  className={`border rounded overflow-hidden w-[60px] h-[80px] hover:opacity-80 transition ${
                    imagenSeleccionada === img ? 'ring-2 ring-black' : ''
                  }`}
                >
                  <Image
                    src={img}
                    alt={`Vista ${index + 1}`}
                    width={60}
                    height={80}
                    unoptimized
                    className="object-cover"
                  />
                </button>
              ))}
            </div>

            <div
              className="order-0 lg:order-2 relative w-full h-[800px] shadow-md rounded-lg overflow-hidden flex items-center justify-center bg-gray-100"
              style={{ cursor: isHovering ? 'zoom-in' : 'default' }}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              {producto.seleccionado && (
                <div className="absolute top-4 left-4 z-10">
                  <span className="bg-black text-white text-xs font-semibold px-3 py-1 rounded-full shadow uppercase tracking-wider">
                    New Arrivals
                  </span>
                </div>
              )}

              {imagenSeleccionada && (
                <Image
                  src={imagenSeleccionada}
                  alt="Imagen seleccionada"
                  fill
                  unoptimized
                  style={{
                    objectFit: 'contain',
                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    transform: isHovering ? 'scale(2)' : 'scale(1)',
                    transition: 'transform 0.2s ease',
                  }}
                  className="rounded-lg pointer-events-none select-none"
                />
              )}
            </div>

            <div className="order-2 lg:order-3 space-y-4 text-gray-800">
              <h1 className="font-[Montserrat] text-6xl mb-1">{nombre}</h1>
              <p className="font-[Montserrat] text-2xl">PEN {precio}</p>
              <hr />
              <h5 className="font-[Montserrat] text-sm">{color}</h5>
              <h5 className="font-[Montserrat] text-sm">Tallas disponibles {talla}</h5>


              <div className="mb-4">
                <label className="block text-sm font-[Montserrat] mb-1">Cantidad:</label>
                {producto.cantidad === 0 ? (
                  <p className="text-red-500 text-sm">Sin stock disponible</p>
                ) : (
                  <div className="flex items-center border rounded w-fit overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                      className="px-4 py-2 text-xl text-gray-600 hover:bg-gray-100"
                      disabled={cantidad <= 1}
                    >
                      –
                    </button>
                    <span className="px-6 py-2 text-center text-xl">{cantidad}</span>
                    <button
                      type="button"
                      onClick={() => setCantidad(Math.min(producto.cantidad, cantidad + 1))}
                      className="px-4 py-2 text-xl text-gray-600 hover:bg-gray-100"
                      disabled={cantidad >= producto.cantidad}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleAgregarAlCarrito}
                className="px-6 py-2 bg-black text-white rounded hover:opacity-80"
                disabled={producto.cantidad === 0}
              >
                Agregar al carrito
              </button> 
              {/* DESCRIPCIÓN */}
                <div className="border-t pt-4">
                  <button
                    onClick={() => setMostrarDescripcion(!mostrarDescripcion)}
                    className="flex items-center justify-between w-full text-left text-black font-medium text-lg hover:underline"
                  >
                    Descripción
                    <span className="text-xl">{mostrarDescripcion ? '▲' : '▼'}</span>
                  </button>

                  {mostrarDescripcion && (
                    <div className="mt-2 text-gray-700 text-sm leading-relaxed space-y-4">
                      {/* Descripción */}
                      <div>
                        <p className="font-[Montserrat]">
                          {producto.descripcion || 'Descripción no disponible para este producto.'}
                        </p>
                      </div>
                  
                      {/* Información */}
                      <div>
                        <p className="font-[Montserrat]">
                          {producto.info || 'Información no disponible para este producto.'}
                        </p>
                      </div>
                    </div>
                  )}
                 </div>
                <div className="border-t pt-4">
                  <button
                    onClick={() => setMostrarComposicion(!mostrarComposicion)}
                    className="flex items-center justify-between w-full text-left text-black font-medium text-lg hover:underline"
                  >
                    Composición
                    <span className="text-xl">{mostrarComposicion ? '▲' : '▼'}</span>
                  </button>

                  {mostrarComposicion && (
                    <div className="mt-2 text-gray-700 text-sm leading-relaxed">
                      <p className="font-[Montserrat]">
                        {producto.composicion || 'Composición no disponible para este producto.'}
                      </p>
                    </div>
                  )}
                </div>
                {/* Cuidado */}
                <div className="border-t pt-4">
                  <button
                    onClick={() => setMostrarCuidado(!mostrarCuidado)}
                    className="flex items-center justify-between w-full text-left text-black font-medium text-lg hover:underline"
                  >
                    Cuidado del producto
                    <span className="text-xl">{mostrarCuidado ? '▲' : '▼'}</span>
                  </button>

                  {mostrarCuidado && (
                    <div className="mt-2 text-gray-700 text-sm leading-relaxed">
                      <p className="font-[Montserrat] whitespace-pre-line">
                        {producto.cuidados
                          ? producto.cuidados
                              .split(' - ')
                              .filter((item) => item.trim() !== '')
                              .map((linea, index) => (
                                <span key={index}>
                                  {linea.trim()}
                                  <br />
                                </span>
                              ))
                          : 'No se especificaron cuidados para este producto.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
          </div>

          {/* Recomendaciones */}
          <div className="max-w-6xl mx-auto mt-16">
            <h5 className="text-2xl mb-4 text-black">Te puede interesar</h5>
            {loadingRec ? (
              <p>Cargando recomendaciones...</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {recomendados.map((item: any) => (
                  <div
                    key={item.id}
                    className="cursor-pointer hover:shadow-lg transition p-4 border rounded relative"
                    onClick={() => {
                      setIdActual(String(item.id));
                      router.push(`/producto/${item.id}`);
                    }}
                  >
                    <div className="w-full h-48 relative">
                      {item.imagen?.[0] && (
                        <Image
                          src={item.imagen[0]}
                          alt={item.nombre}
                          fill
                          unoptimized
                          style={{ objectFit: 'cover' }}
                          className="rounded"
                        />
                      )}
                      {item.seleccionado && (
                        <div className="absolute top-2 left-2 z-10">
                          <span className="bg-black text-white text-xs font-semibold px-3 py-1 rounded-full shadow uppercase tracking-wider">
                            New Arrivals
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="mt-2 text-black font-medium truncate">{item.nombre}</h3>
                    <p className="font-['Montserrat'] text-sm text-black">PEN {item.precio}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

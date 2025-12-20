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

  // Selección de opciones del producto
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

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

  const isValidCssColor = (value: string | null) => {
    if (!value) return false;
    try {
      const s = value.trim();
      const el = document.createElement('div');
      el.style.color = '';
      el.style.color = s;
      return !!el.style.color;
    } catch (e) {
      return false;
    }
  };

  const fetchProducto = async (id: string | number) => {
    try {
      setLoading(true);
      setIsLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos/${id}`);
      if (!res.ok) throw new Error('Error al obtener el producto');

      const data = await res.json();
      // Si el producto no está activo, mostrar como no disponible
      if (!(data && (data.activo === true || data.activo === '1' || data.activo === 1))) {
        setProducto(null);
        setError('Producto no disponible');
        setLoading(false);
        setIsLoading(false);
        return;
      }

      const ajustarURL = (url: string) => {
        if (!url.startsWith('http')) {
          return `https://api.sgstudio.shop${url.startsWith('/') ? '' : '/'}${url}`;
        }
        return url;
      };

      const imagenesAjustadas = Array.isArray(data.imagen)
        ? data.imagen.map(ajustarURL)
        : [];

      const prod = { ...data, imagen: imagenesAjustadas };
      setProducto(prod);
      try {
        const colorsRaw = prod.color || '';
        const sizesRaw = prod.talla || '';
        const colors = Array.isArray(colorsRaw)
          ? colorsRaw
          : String(colorsRaw).split(',').map((s: string) => s.trim()).filter((s: string) => s);
        const sizes = Array.isArray(sizesRaw)
          ? sizesRaw
          : String(sizesRaw).split(',').map((s: string) => s.trim()).filter((s: string) => s);
        if (colors.length) setSelectedColor(colors[0]);
        if (sizes.length) setSelectedSize(sizes[0]);
      } catch (e) {
        setSelectedColor(null);
        setSelectedSize(null);
      }
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
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos`);
        if (!res.ok) throw new Error('Error al obtener recomendados');
        const datos = await res.json();
        // Usar sólo productos activos como recomendados
        const activos = (datos || []).filter((p: any) => p && (p.activo === true || p.activo === '1' || p.activo === 1));
        const otros = activos.filter((p: any) => String(p.id) !== String(idActual));
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/carrito/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: userId,
          productoId: producto.id,
            cantidad,
            talla: selectedSize || 'M',
            color: selectedColor || (Array.isArray(producto?.color) ? producto.color[0] : String(producto?.color || 'negro').split(',')[0]),
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

          <div className="max-w-6xl mx-auto flex flex-col lg:grid lg:grid-cols-[auto_500px_1fr] gap-6 lg:gap-x-15">
            <div className="order-1 lg:order-1 flex flex-row lg:flex-col gap-3 items-center lg:items-start">
              {imagen.map((img: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setImagenSeleccionada(img)}
                  className={`w-[60px] h-[80px] overflow-hidden hover:opacity-80 transition ${
                    imagenSeleccionada === img ? 'border border-black' : 'border-none'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`Vista ${index + 1}`}
                    width={60}
                    height={80}
                    unoptimized
                    className="object-cover w-full h-full"
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
                    objectFit: 'cover',
                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    transform: isHovering ? 'scale(2)' : 'scale(1)',
                    transition: 'transform 0.2s ease',
                  }}
                  className="rounded-lg pointer-events-none select-none"
                />
              )}
            </div>

            <div className="order-2 lg:order-3 space-y-6">
              <h3 className="font-light text-4xl mb-3">{nombre}</h3>
              <p className="font-medium text-2xl text-gray-500 mb-10">S/ {precio}</p>
              
              <div className="flex flex-col gap-3">
                <div>
                  {/*<p className="text-sm font-medium mb-2">Color</p>*/}
                  <div className="flex items-center gap-2 mb-6">
                    {(() => {
                      const colorsRaw = producto?.color || '';
                      const colors = Array.isArray(colorsRaw)
                        ? colorsRaw
                        : String(colorsRaw).split(',').map((s: string) => s.trim()).filter((s: string) => s);
                      if (!colors.length) return <p className="text-sm text-gray-500">Sin opciones</p>;
                      return colors.map((c: string, i: number) => {
                        const valid = isValidCssColor(c);
                        const isSelected = selectedColor === c;
                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedColor(c)}
                            title={c}
                            className={`w-8 h-8 rounded-sm flex items-center justify-center cursor-pointer border-3 border-white bg-white shadow-[0_1px_3px_rgba(0,0,0,0.40)] ${isSelected ? 'shadow-[0_4px_8px_rgba(0,0,0,0.50)]' : ''} transition-all duration-200'}`}
                            style={{ backgroundColor: valid ? c : 'transparent' }}
                          >
                            {!valid && <span className="text-xs text-gray-700">{c}</span>}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>

                <div className='mb-5'>
                  <p className="text-sm font-medium mb-6">Talla:</p>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const sizesRaw = producto?.talla || '';
                      const sizes = Array.isArray(sizesRaw)
                        ? sizesRaw
                        : String(sizesRaw).split(',').map((s: string) => s.trim()).filter((s: string) => s);
                      if (!sizes.length) return <p className="text-sm text-gray-500">Sin tallas</p>;
                      return sizes.map((s: string, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedSize(s)}
                          className={`w-12 px-0 py-3 border rounded-none text-sm cursor-pointer transition-all duration-200 ${selectedSize === s ? 'bg-black text-white' : 'bg-white text-gray-700 hover:bg-black hover:text-white'}`}
                        >
                          {s}
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              </div>

              <div className="mb-10">
                <label className="block text-sm font-medium mb-2">{/*Cantidad:*/}</label>
                {producto.cantidad === 0 ? (
                  <p className="text-red-500 text-sm">Sin stock disponible</p>
                ) : (
                  <div className="flex items-center border border-gray-300 w-fit overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                      className="px-4 py-2 text-xl text-gray-600 hover:text-gray-400 cursor-pointer"
                      disabled={cantidad <= 1}
                    >
                      –
                    </button>
                    <span className="w-15 py-2 text-center text-sm font-medium">{cantidad}</span>
                    <button
                      type="button"
                      onClick={() => setCantidad(Math.min(producto.cantidad, cantidad + 1))}
                      className="px-4 py-2 text-xl text-gray-600 hover:text-gray-400 cursor-pointer" 
                      disabled={cantidad >= producto.cantidad}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleAgregarAlCarrito}
                className="btn-animated w-full rounded"
                disabled={producto.cantidad === 0}
              >
                Agregar al carrito
              </button> 
                {/* Descripción */}
                <div className="border-t pt-4">
                  <button
                    onClick={() => setMostrarDescripcion(!mostrarDescripcion)}
                    className="flex items-center justify-between w-full text-left text-black font-medium text-normal"
                  >
                    Descripción

                    {/* Ícono animado */}
                    <span
                      className={`transition-transform duration-300 ${
                        mostrarDescripcion ? 'rotate-180' : 'rotate-0'
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m19.5 8.25-7.5 7.5-7.5-7.5"
                        />
                      </svg>
                    </span>
                  </button>

                  {/* Contenido con transición */}
                  <div
                    className={`
                      overflow-hidden transition-all duration-300 
                      ${mostrarDescripcion ? 'max-h-[1000px] opacity-100 mt-3' : 'max-h-0 opacity-0'}
                    `}
                  >
                    <div className="text-gray-700 text-sm leading-relaxed space-y-4">

                      <div>
                        <p className="font-[Montserrat]">
                          {producto.descripcion || 'Descripción no disponible para este producto.'}
                        </p>
                      </div>

                      <div>
                        <p className="font-[Montserrat]">
                          {producto.info || 'Información no disponible para este producto.'}
                        </p>
                      </div>

                    </div>
                  </div>
                </div>
                {/* Composición */}
                <div className="border-t pt-4">
                  <button
                    onClick={() => setMostrarComposicion(!mostrarComposicion)}
                    className="flex items-center justify-between w-full text-left text-black font-medium text-normal"
                  >
                    Composición

                    {/* Ícono animado */}
                    <span
                      className={`transition-transform duration-300 ${
                        mostrarComposicion ? "rotate-180" : "rotate-0"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m19.5 8.25-7.5 7.5-7.5-7.5"
                        />
                      </svg>
                    </span>
                  </button>

                  {/* Contenido animado */}
                  <div
                    className={`
                      overflow-hidden transition-all duration-300 
                      ${mostrarComposicion ? "max-h-[1000px] opacity-100 mt-3" : "max-h-0 opacity-0"}
                    `}
                  >
                    <div className="text-gray-700 text-sm leading-relaxed">
                      <p className="font-[Montserrat]">
                        {producto.composicion || "Composición no disponible para este producto."}
                      </p>
                    </div>
                  </div>
                </div>
                {/* Cuidado */}
                <div className="border-t pt-4">
                  <button
                    onClick={() => setMostrarCuidado(!mostrarCuidado)}
                    className="flex items-center justify-between w-full text-left text-black font-medium text-normal"
                  >
                    Cuidado del producto

                    {/* Ícono animado */}
                    <span
                      className={`transition-transform duration-300 ${
                        mostrarCuidado ? "rotate-180" : "rotate-0"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m19.5 8.25-7.5 7.5-7.5-7.5"
                        />
                      </svg>
                    </span>
                  </button>

                  {/* Contenido animado */}
                  <div
                    className={`
                      overflow-hidden transition-all duration-300 
                      ${mostrarCuidado ? "max-h-[1000px] opacity-100 mt-3" : "max-h-0 opacity-0"}
                    `}
                  >
                    <div className="text-gray-700 text-sm leading-relaxed">
                      <p className="font-[Montserrat] whitespace-pre-line">
                        {producto.cuidados
                          ? producto.cuidados
                              .split(" - ")
                              .filter((item) => item.trim() !== "")
                              .map((linea, index) => (
                                <span key={index}>
                                  {linea.trim()}
                                  <br />
                                </span>
                              ))
                          : "No se especificaron cuidados para este producto."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
          </div>
          {/* Línea separadora */}
            <div className="flex justify-center mt-20">
              <div className="w-full h-[2px] bg-gray-300"></div>
            </div>
          {/* Recomendaciones */}
          <div className="max-w-6xl mx-auto mt-20">
          
            <h5 className="text-2xl font-medium text-center mb-10 justify-center">TAMBIÉN PODRÍA GUSTARTE</h5>
            {loadingRec ? (
              <p>Cargando recomendaciones...</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-10">
                {recomendados.map((item: any) => (
                  <div
                    key={item.id}
                    className="bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                    onClick={() => {
                      setIdActual(String(item.id));
                      router.push(`/producto/${item.id}`);
                    }}
                  >
                    <div className="w-full h-70 relative">
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
                    <div className="p-3 sm:p-4 text-center">
                      <h3 className="mt-2 text-black font-medium truncate">{item.nombre}</h3>
                      <p className="text-sm font-normal text-gray-500">S/ {item.precio}</p>
                    </div>
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

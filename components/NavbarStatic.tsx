'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaUser, FaSearch, FaShoppingBag, FaTimes,
  FaTrash, FaBars, FaChevronRight, FaChevronLeft
} from 'react-icons/fa';

// Tipos

type Categoria = {
  id: number;
  nombre: string;
  slug?: string;
};

type ProductoCarrito = {
  id: number;
  talla: string;
  color: string;
  cantidad: number;
  producto: {
    nombre: string;
    imagen: string[];
    precio: number;
  };
};

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carrito, setCarrito] = useState<ProductoCarrito[]>([]);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([]);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [submenuAbierto, setSubmenuAbierto] = useState<'woman' | 'new' | ''>('');
  const [isHoveringWoman, setIsHoveringWoman] = useState(false);
  const [isHoveringNewArrivals, setIsHoveringNewArrivals] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);
  

  const router = useRouter();
  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim().length > 2) {
      router.push(`/buscar?query=${encodeURIComponent(searchTerm.trim())}`);
      setShowSearch(false);
    }
  };

  const clearSearch = () => setSearchTerm('');
  // EFECTOS
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await fetch('https://api.sgstudio.shop/categorias');
        const data = await response.json();
        setCategorias(data);
      } catch (error) {
        console.error('Error al cargar las categorías:', error);
      }
    };
    fetchCategorias();
  }, []);

  useEffect(() => {
    const fetchCategoriasSeleccionadas = async () => {
      try {
        const res = await fetch('https://api.sgstudio.shop/productos/seleccionados');
        const data: Producto[] = await res.json();
      
        const categoriasFiltradas = data
          .map((p) => p.categoria)
          .filter((cat, i, self) =>
            cat && self.findIndex((c) => c.id === cat.id) === i
          )
          .slice(0, 4); // limitar a 4 categorías
        
        setCategoriasSeleccionadas(categoriasFiltradas);
      } catch (err) {
        console.error('Error cargando categorías seleccionadas', err);
      }
    };
  
    fetchCategoriasSeleccionadas();
  }, []);


  useEffect(() => {
    const handleClickOutsideMenu = (e: MouseEvent) => {
      if (menuAbierto && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAbierto(false);
        setSubmenuAbierto('');
      }
    };
    document.addEventListener('mousedown', handleClickOutsideMenu);
    return () => document.removeEventListener('mousedown', handleClickOutsideMenu);
  }, [menuAbierto]);

  useEffect(() => {
    const fetchCarrito = async () => {
      const storedUser = localStorage.getItem('usuario');
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

      if (isLoggedIn && storedUser) {
        const user = JSON.parse(storedUser);
        try {
          const response = await fetch(`https://api.sgstudio.shop/carrito/${user.id}`);
          if (!response.ok) throw new Error('No se pudo obtener el carrito');
          const data = await response.json();
          setCarrito(data.items);
        } catch (error) {
          console.error('Error al obtener carrito del backend:', error);
        }
      } else {
        const savedCart = localStorage.getItem('carrito');
        if (savedCart) {
          setCarrito(JSON.parse(savedCart));
        }
      }
    };

    fetchCarrito();
  }, []);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      localStorage.setItem('carrito', JSON.stringify(carrito));
    }
  }, [carrito]);

  
  useEffect(() => {
    const fetchCategoriasConProductos = async () => {
      try {
        const resCat = await fetch('https://api.sgstudio.shop/categorias');
        const categoriasData = await resCat.json();

        const resProd = await fetch('https://api.sgstudio.shop/productos');
        const productosData: Producto[] = await resProd.json();

        const categoriasConProductos = categoriasData.filter((cat: Categoria) =>
          productosData.some((prod) => prod.categoria?.id === cat.id)
        );

        setCategorias(categoriasConProductos.slice(0, 10)); // solo 4
      } catch (err) {
        console.error('Error al obtener categorías con productos:', err);
      }
    };

    fetchCategoriasConProductos();
  }, []);
  useEffect(() => {
    const handleClickOutsideSearch = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowSearch(false);
      }
    };
    if (showSearch) {
      document.addEventListener('mousedown', handleClickOutsideSearch);
    }
    return () => document.removeEventListener('mousedown', handleClickOutsideSearch);
  }, [showSearch]);

  useEffect(() => {
    const handleClickOutsideCart = (event: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setShowCart(false);
      }
    };
    if (showCart) {
      document.addEventListener('mousedown', handleClickOutsideCart);
    }
    return () => document.removeEventListener('mousedown', handleClickOutsideCart);
  }, [showCart]);

  // ACCIONES
  const menuRef = useRef<HTMLDivElement>(null);
  const cerrarMenu = () => {
    setMenuAbierto(false);
    setSubmenuAbierto('');
  };


  const handleUserClick = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const role = localStorage.getItem('role')?.toLowerCase();
    
    if (isLoggedIn === 'true') {
      if (role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/usuario/perfil');
      }
    } else {
      router.push('/login');
    }
  };

  const aumentarCantidad = (id: number) => {
    setCarrito((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, cantidad: item.cantidad + 1 } : item
      )
    );
  };

  const disminuirCantidad = (id: number) => {
    setCarrito((prev) =>
      prev.map((item) =>
        item.id === id && item.cantidad > 1
          ? { ...item, cantidad: item.cantidad - 1 }
          : item
      )
    );
  };

  const eliminarProducto = async (itemId: number) => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const storedUser = localStorage.getItem('usuario');

    const nuevoCarrito = carrito.filter((item) => item.id !== itemId);

    if (isLoggedIn && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const response = await fetch(
          `https://api.sgstudio.shop/carritoIitem/${itemId}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          console.error('Error al eliminar del backend:', await response.text());
        }
      } catch (error) {
        console.error('Error al eliminar el producto del backend:', error);
      }
    }

    localStorage.setItem('carrito', JSON.stringify(nuevoCarrito));
    setCarrito(nuevoCarrito);

    if (window.location.pathname === '/checkout') {
      window.location.href = '/';
    } else {
      window.location.reload();
    }
  };


let hoverTimeout: NodeJS.Timeout;

  const handleHoverEnter = () => {
    clearTimeout(hoverTimeout);
    setIsHoveringWoman(true);
  };

  const handleHoverLeave = () => {
    hoverTimeout = setTimeout(() => setIsHoveringWoman(false), 300); // 200ms de retardo
  };

  let hoverTimeoutNewArrivals: NodeJS.Timeout;

  const handleHoverEnterNewArrivals = () => {
    clearTimeout(hoverTimeoutNewArrivals);
    setIsHoveringNewArrivals(true);
  };

  const handleHoverLeaveNewArrivals = () => {
    hoverTimeoutNewArrivals = setTimeout(() => setIsHoveringNewArrivals(false), 300); // retardo de salida
  };

const bgClassnot = 'bg-white text-black shadow-md border-b border-gray-300';

const bgClass = scrolled || hovered || showSearch
    ? 'bg-white text-black shadow-md border-b border-gray-300'
    : 'bg-transparent text- border-b border-transparent';

  return (
    <>
      <nav className={`fixed top-0 left-0 w-full z-50 px-8 py-4 transition-all duration-300 ${bgClassnot}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        
        {/* Responsive - Barra para móviles */}
        <div className="md:hidden flex justify-between items-center">
          <button
            onClick={() => setMenuAbierto(true)}
            aria-label="Menú"
            className="text-2xl hover:text-gray-500"
          >
            <FaBars />
          </button>
          <Link href="/" className="text-2xl font-bold hover:opacity-80 transition-colors duration-300">
            SG STUDIO
          </Link>
          <div className="flex gap-4 text-xl">
            <button ref={buttonRef} onClick={() => setShowSearch(v => !v)} aria-label="Buscar" className="hover:text-gray-400">
              <FaSearch />
            </button>
            <button onClick={() => setShowCart(true)} aria-label="Carrito" className="hover:text-gray-400 relative w-6 h-6">
              <FaShoppingBag />
              {carrito.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gray-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {carrito.reduce((t, i) => t + i.cantidad, 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Menú lateral animado y scrollable */}
        <div
          ref={menuRef}
          className={`menu-lateral fixed top-0 left-0 w-64 h-full bg-white shadow-lg z-50 transform transition-transform duration-300 md:hidden
            ${menuAbierto ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="h-full flex flex-col">
            {/* Encabezado */}
            <div className="flex justify-end items-center p-6 border-b border-gray-800">
              <button
                onClick={cerrarMenu}
                className="text-black text-xl hover:text-gray-500"
                aria-label="Cerrar"
              >
                <FaTimes />
              </button>
            </div>

            {/* Contenido con scroll */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {/* WOMAN con subcategorías */}
              <div>
                <button
                  onClick={() => setSubmenuAbierto(prev => prev === 'woman' ? '' : 'woman')}
                  className="flex justify-between items-center w-full text-left text-black font-medium text-sm hover:text-gray-700 transition-colors"
                >
                  WOMAN
                  <span className="ml-2 text-base">
                    {submenuAbierto === 'woman' ? <FaChevronLeft /> : <FaChevronRight />}
                  </span>
                </button>

                <ul
                  className={`ml-2 text-sm text-gray-700 overflow-hidden transition-all duration-500 ease-out
                    ${submenuAbierto === 'woman' ? 'max-h-screen opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}`}
                >
                  {categorias.map((c, i) => (
                    <li
                      key={c.id}
                      className="transition-opacity duration-300"
                      style={{ transitionDelay: `${i * 40}ms` }}
                    >
                      <Link
                        href={`/woman?categoria=${encodeURIComponent(c.nombre)}`}
                        className="block hover:text-black"
                        onClick={() => setMenuAbierto(false)}
                      >
                        {c.nombre}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* NEW ARRIVALS con subcategorías */}
              <div>
                <button
                  onClick={() => setSubmenuAbierto(prev => prev === 'new' ? '' : 'new')}
                  className="flex justify-between items-center w-full text-left text-black font-medium text-sm hover:text-gray-700 transition-colors"
                >
                  NEW ARRIVALS
                  <span className="ml-2 text-base">
                    {submenuAbierto === 'new' ? <FaChevronLeft /> : <FaChevronRight />}
                  </span>
                </button>

                <ul
                  className={`ml-2 text-sm text-gray-700 overflow-hidden transition-all duration-500 ease-out
                    ${submenuAbierto === 'new' ? 'max-h-screen opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}`}
                >
                  {categoriasSeleccionadas.map((c, i) => (
                    <li
                      key={c.id}
                      className="transition-opacity duration-300"
                      style={{ transitionDelay: `${i * 40}ms` }}
                    >
                      <Link
                        href={`/newarrivals?categoria=${encodeURIComponent(c.nombre)}`}
                        className="block hover:text-black"
                        onClick={() => setMenuAbierto(false)}
                      >
                        {c.nombre}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* PERFIL */}
              <button
                onClick={() => {
                  handleUserClick();
                  setMenuAbierto(false);
                }}
                className="block w-full text-left text-sm font-medium text-black hover:text-gray-700 transition-opacity duration-300"
              >
                Perfil
              </button>
            </div>
          </div>
        </div>
        {/* ------------------------- */}
        <div className="hidden md:flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold hover:opacity-80 transition-colors duration-300">
            SG STUDIO
          </Link>

          <ul className="flex gap-6 text-sm font-medium items-center">
            {/* WOMAN */}
            <li
              className="relative group"
              onMouseEnter={handleHoverEnter}
              onMouseLeave={handleHoverLeave}
            >
              <Link href="/woman" className={`underline-hover transition ${
                hovered || scrolled 
                ? 'text-black hover:text-gray-600' 
                : 'text-black hover:text-gray-300'
              }`}>
                WOMAN
              </Link>

              <div className={`absolute left-0 top-full mt-5 w-64 bg-white shadow-lg p-4 pt-6 text-sm z-10
                transition-opacity duration-300 ease-out
                ${isHoveringWoman ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
              >
                {/* Línea superior animada */}
                <div className={`absolute top-0 left-0 h-[3px] bg-gray-800 transition-all duration-500 origin-left
                  ${isHoveringWoman ? 'w-full' : 'w-0'}`}
                ></div>

                <ul className="space-y-5 text-black">
                  {categorias.length > 0 ? (
                    categorias.map((cat, i) => (
                      <li
                        key={cat.id}
                        className={`transition duration-500 ease-out transform ${
                          isHoveringWoman ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                        }`}
                        style={{ transitionDelay: `${i * 80}ms` }}
                      >
                        <Link
                          href={`/woman?categoria=${encodeURIComponent(cat.nombre)}`}
                          className="block hover:text-gray-700 transition-colors"
                        >
                          {cat.nombre}
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500">Cargando...</li>
                  )}
                </ul>
              </div>
            </li>

            {/* NEW ARRIVALS */}
            <li
              className="relative group"
              onMouseEnter={handleHoverEnterNewArrivals}
              onMouseLeave={handleHoverLeaveNewArrivals}
            >
              <Link href="/newarrivals" className={`underline-hover transition ${
                hovered || scrolled
                  ? 'text-black hover:text-gray-600'
                  : 'text-black hover:text-gray-300'
              }`}>
                NEW ARRIVALS
              </Link>

              <div className={`absolute left-0 top-full mt-5 w-64 bg-white shadow-lg p-4 pt-6 text-sm z-10
                transition-opacity duration-300 ease-out
                ${isHoveringNewArrivals ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
              >
                {/* Línea superior animada */}
                <div className={`absolute top-0 left-0 h-[3px] bg-gray-800 transition-all duration-500 origin-left
                  ${isHoveringNewArrivals ? 'w-full' : 'w-0'}`}
                ></div>

                <ul className="space-y-5 text-black">
                  {categoriasSeleccionadas.length > 0 ? (
                    categoriasSeleccionadas.map((cat, i) => (
                      <li
                        key={cat.id}
                        className={`transition duration-500 ease-out transform ${
                          isHoveringNewArrivals ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                        }`}
                        style={{ transitionDelay: `${i * 80}ms` }}
                      >
                        <Link
                          href={`/newarrivals?categoria=${encodeURIComponent(cat.nombre)}`}
                          className="block hover:text-gray-700 transition-colors"
                        >
                          {cat.nombre}
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500">Cargando...</li>
                  )}
                </ul>
              </div>
            </li>
          </ul>

                  

          <div className="flex gap-4 text-xl transition-colors duration-300">
            <button onClick={handleUserClick} aria-label="Perfil" className="hover:text-gray-400">
              <FaUser />
            </button>
            <button ref={buttonRef} onClick={() => setShowSearch(!showSearch)} aria-label="Buscar" className="hover:text-gray-400">
              <FaSearch />
            </button>
            <button onClick={() => setShowCart(true)} aria-label="Carrito" className="hover:text-gray-400 relative w-6 h-6">
              <FaShoppingBag />
              {Array.isArray(carrito) && carrito.length > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-gray-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {carrito.reduce((total, item) => total + item.cantidad, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {showSearch && (
        <div
          ref={searchRef}
          className="fixed top-[64px] left-0 w-full bg-white z-40 shadow-md border-b px-8 py-3 flex items-center max-w-full"
        >
          <FaSearch className="text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (searchTerm.trim() !== '') {
                  router.push(`/buscar?query=${encodeURIComponent(searchTerm.trim())}`);
                  setShowSearch(false); // opcional: cierra la barra
                  setSearchTerm('');    // opcional: limpia el campo
                }
              }
            }}
            className="flex-grow px-2 py-2 text-black placeholder-gray-400 focus:outline-none"
            autoFocus
          />
          {searchTerm && (
            <button onClick={clearSearch} aria-label="Limpiar búsqueda" className="text-gray-500 hover:text-gray-700 ml-3">
              <FaTimes size={20} />
            </button>
          )}
        </div>
      )}

      <div
        ref={cartRef}
        className={`fixed top-0 right-0 h-full max-w-sm w-full bg-white shadow-lg z-50 transform transition-transform duration-300 ${showCart ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex justify-between items-center p-6 border-b mt-4">
          <h2 className="text-lg font-bold text-black">Tu carrito</h2>
          <button onClick={() => setShowCart(false)} aria-label="Cerrar">
            <FaTimes className="text-black" />
          </button>
        </div>

<div className="p-6 space-y-4 overflow-y-auto h-[calc(100%-150px)]">
  {Array.isArray(carrito) && carrito.length === 0 ? (
    <p className="text-black">Tu carrito está vacío.</p>
  ) : (
    carrito.map((item) => (
      <div key={item.id} className="flex gap-4 items-center border-b pb-4 relative">
        <img
          src={item.producto.imagen[0]}
          alt={item.producto.nombre}
          className="w-16 h-16 object-cover rounded"
        />
        <div className="flex flex-col flex-1">
          <span className="text-sm font-semibold text-black">{item.producto.nombre}</span>
          <span className="text-xs text-gray-600">Talla: {item.talla} | Color: {item.color}</span>

          <div className="flex items-center mt-2">
            <button
              onClick={() => disminuirCantidad(item.id)}
              disabled={item.cantidad <= 1}
              className="p-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-40"
            >
              <svg fill="none" width="14" height="14" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.5" className='text-black'>
                <path d="M0 6h12" />
              </svg>
            </button>
            <span className="mx-3 text-sm text-black">{item.cantidad}</span>
            <button
              onClick={() => aumentarCantidad(item.id)}
              className="p-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              <svg fill="none" width="14" height="14" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.5" className='text-black'>
                <path d="M6 0v12M0 6h12" />
              </svg>
            </button>
          </div>

          <span className="mt-1 text-sm text-gray-800 font-bold">PEN {item.producto.precio}</span>
        </div>

        <button
          onClick={() => eliminarProducto(item.id)}
          className="absolute top-0 right-0 text-gray-400 hover:text-red-600 p-1"
          aria-label="Eliminar producto"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M3 6h18" />
            <path d="M8 6v14c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M5 6l1-2h12l1 2" />
          </svg>
        </button>
      </div>
    ))
  )}
</div>
{carrito.length > 0 && (
  <div className="p-6 border-t bg-white shadow-md sticky bottom-0">
    <div className="flex justify-between text-sm font-semibold text-black mb-4">
      <span>Total:</span>
      <span>
        PEN{' '}
        {carrito.reduce(
          (acc, item) => acc + item.cantidad * item.producto.precio,
          0
        ).toFixed(2)}
      </span>
    </div>
    <button
      onClick={() => {
        router.push('/checkout');
        setShowCart(false);
      }}
      className="btn-animated w-full rounded"
    >
      Seguir con la compra
    </button>
  </div>
)}

      </div>
    </>
  );
}
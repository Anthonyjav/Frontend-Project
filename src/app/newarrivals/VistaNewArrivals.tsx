'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function NewArrivalsPage() {
  const searchParams = useSearchParams()
  const categoriaSeleccionada = searchParams.get('categoria') || ''

  const [productos, setProductos] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [vista, setVista] = useState<'grande' | 'compacta' | 'lista'>('grande')
  const [categoriasAbiertas, setCategoriasAbiertas] = useState(false)
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([])

  useEffect(() => {
    const fetchSeleccionados = async () => {
      try {
        const res = await fetch('https://backend-project-677e.onrender.com/productos/seleccionados')
        const data = await res.json()
        setProductos(data)

        const categoriasUnicas = Array.from(
          new Map(
            data
              .filter((p: any) => p.categoria)
              .map((p: any) => [p.categoria.id, p.categoria])
          ).values()
        )
        setCategorias(categoriasUnicas)
      } catch (err) {
        console.error('Error cargando productos seleccionados', err)
      }
    }

    fetchSeleccionados()
  }, [])

  useEffect(() => {
    if (categoriaSeleccionada && categorias.length > 0) {
      const existe = categorias.find(c => c.nombre === categoriaSeleccionada)
      if (existe) {
        setCategoriasSeleccionadas([categoriaSeleccionada])
        setCategoriasAbiertas(true)
      }
    }
  }, [categoriaSeleccionada, categorias])

  const toggleCategoria = (nombre: string) => {
    setCategoriasSeleccionadas(prev =>
      prev.includes(nombre)
        ? prev.filter(cat => cat !== nombre)
        : [...prev, nombre]
    )
  }

  const productosFiltrados = productos.filter(
    p =>
      (categoriasSeleccionadas.length === 0 ||
        categoriasSeleccionadas.includes(p.categoria?.nombre)) &&
      Array.isArray(p.imagen) &&
      p.imagen.length > 0
  )

  const columnas =
    vista === 'lista'
      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
      : vista === 'compacta'
      ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'

  return (
    <main className="bg-white min-h-screen p-4 pt-24 flex flex-col lg:flex-row">
      {/* Sidebar de categorías (arriba en móvil, lateral en escritorio) */}
      <aside className="w-full lg:w-64 lg:pr-6 border-b lg:border-b-0 lg:border-r border-gray-300 mb-4 lg:mb-0">
        <h2 className="font-[Montserrat] text-xl lg:text-2xl font-bold mb-4 text-black">Categorías</h2>
        <div
          className="border-t border-b py-2 cursor-pointer flex justify-between items-center"
          onClick={() => setCategoriasAbiertas(!categoriasAbiertas)}
        >
          <span className="font-semibold text-gray-700 text-sm lg:text-base">Filtrar por categoría</span>
          <span className="text-lg font-bold">{categoriasAbiertas ? '−' : '+'}</span>
        </div>
        {categoriasAbiertas && (
          <ul className="space-y-2 mt-3">
            {categorias.map((cat: any) => {
              const cantidad = productos.filter(p => p.categoria?.nombre === cat.nombre).length
              const isChecked = categoriasSeleccionadas.includes(cat.nombre)

              return (
                <li key={cat.id}>
                  <label className="flex justify-between items-center text-sm font-[Montserrat] cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCategoria(cat.nombre)}
                        className="accent-black w-4 h-4"
                      />
                      <span className={isChecked ? 'text-black font-bold' : 'text-gray-600'}>
                        {cat.nombre}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">({cantidad})</span>
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </aside>

      {/* Sección principal */}
      <section className="flex-1 pl-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
          <h2 className="font-[Montserrat] text-xl lg:text-2xl font-bold text-gray-800">NEW ARRIVALS</h2>
          <div className="flex items-center space-x-2">
            {(['grande', 'compacta', 'lista'] as const).map(tipo => (
              <button
                key={tipo}
                onClick={() => setVista(tipo)}
                className="focus:outline-none"
                title={`Vista ${tipo}`}
              >
                {tipo === 'grande' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" style={{ color: vista === 'grande' ? '#000' : '#9ca3af' }}>
                    <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
                  </svg>
                )}
                {tipo === 'compacta' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" style={{ color: vista === 'compacta' ? '#000' : '#9ca3af' }}>
                    <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z" />
                  </svg>
                )}
                {tipo === 'lista' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" style={{ color: vista === 'lista' ? '#000' : '#9ca3af' }}>
                    <path d="M3 4h18v2H3V4zm0 4h18v2H3V8zm0 4h18v2H3v-2zm0 4h18v2H3v-2zm0 4h18v2H3v-2z" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {productosFiltrados.length === 0 ? (
          <p className="text-gray-500">No hay productos que coincidan con los filtros.</p>
        ) : (
          <div className={`grid gap-4 sm:gap-6 ${
            vista === 'lista' 
            ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6' 
            : vista === 'compacta' 
            ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4' 
            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
          }`}>
            {productosFiltrados.map((producto: any) => (
              <Link key={producto.id} href={`/producto/${producto.id}`} className="group block">
                <div className="bg-white border rounded-lg shadow hover:shadow-lg transition overflow-hidden">
                  <div className="relative w-full h-64 sm:h-72">
                    <Image
                      src={producto.imagen[0]}
                      alt={producto.nombre}
                      fill
                      unoptimized
                      className={`object-cover transition-opacity duration-300 ${producto.imagen[1] ? 'group-hover:opacity-0' : ''}`}
                    />
                    {producto.imagen[1] && (
                      <Image
                        src={producto.imagen[1]}
                        alt={`${producto.nombre} alternativa`}
                        fill
                        unoptimized
                        className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      />
                    )}
                    {producto.seleccionado && (
                      <div className="absolute top-2 left-2 z-10">
                        <span className="inline-block bg-black text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-md uppercase tracking-wider">
                          New
                        </span>
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-white rounded-full w-10 h-10 flex items-center justify-center shadow hover:rotate-90 transform transition-transform duration-300 ease-in-out">
                        <span className="text-2xl font-bold text-gray-800">+</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 text-center">
                    <p className="text-sm font-medium text-gray-700 truncate">{producto.nombre}</p>
                    <p className="text-base sm:text-lg text-black">S/ {producto.precio}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import TextWithIcons from './components/TextWithIcons'
import WhatsappBubble from '../../components/WhatsappBubble'
import SplashScreen from '../../components/SplashScreen'
import { useRouter } from 'next/navigation'

function optimizeImage(url: string) {
  if (!url.includes("/upload/")) return url
  return url.replace("/upload/", "/upload/f_auto,q_auto,w_600/")
}

const slides = ['/images/LOGO.jpg', '/images/LOGO.jpg']

function Slideshow({ slides, interval = 5000 }: { slides: string[]; interval?: number }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length)
    }, interval)
    return () => clearInterval(timer)
  }, [interval, slides.length])

  return (
    <div className="relative">
    <section className="w-full h-screen relative overflow-hidden">
      <Image
        src={slides[current]}
        alt={`Slide ${current + 1}`}
        fill
        className="object-cover transition-all duration-500"
        priority
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
        <h5 className="text-white text-4xl font-bold drop-shadow-lg"></h5>
      </div> 
    </section>

    <button
        onClick={() => {
          const seccion = document.getElementById('novedades')
          if (seccion) {
            const offset = 60
            const y = seccion.getBoundingClientRect().top + window.pageYOffset - offset
            window.scrollTo({ top: y, behavior: 'smooth' })
          }
        }}
        className="group absolute -bottom-6 left-1/2 transform -translate-x-1/2 z-20
             w-12 h-12 flex items-center justify-center 
             rounded-full bg-white text-black 
             text-xl font-bold transition shadow-[0_1px_5px_rgba(0,0,0,0.5)]"
      >
      {/* Flecha original que baja y desaparece */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 absolute transition-all duration-300 group-hover:translate-y-2 group-hover:opacity-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>

      {/* Flecha nueva que aparece desde arriba */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 absolute opacity-0 -translate-y-2 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
      </button>
    </div>
  )
}


type Producto = {
  id: number
  nombre: string
  precio: number
  descripcion: string
  imagen: string[]
  seleccionado: boolean
}

export default function Home() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [showSplash, setShowSplash] = useState(true)
  const [fadeSplash, setFadeSplash] = useState(false)
  const [showOverlaySplash, setShowOverlaySplash] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setFadeSplash(true), 1000)
    return () => clearTimeout(t1)
  }, [])

  useEffect(() => {
    async function fetchProductos() {
      try {
        const res = await fetch('https://backend-project-677e.onrender.com/productos')
        if (!res.ok) throw new Error('Error al obtener productos')
        const data = await res.json()
        setProductos(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProductos()
  }, [])

  useEffect(() => {
    if (!loading && fadeSplash) {
      const t2 = setTimeout(() => setShowSplash(false), 500)
      return () => clearTimeout(t2)
    }
  }, [loading, fadeSplash])

  const items = productos.filter(p => Array.isArray(p.imagen) && p.imagen.length > 0)
  const perPage = 4
  const pageCount = Math.ceil(items.length / perPage)
  const start = page * perPage
  const currentItems = items.slice(start, start + perPage)
  const prevPage = () => setPage(p => (p - 1 + pageCount) % pageCount)
  const nextPage = () => setPage(p => (p + 1) % pageCount)
  const router = useRouter()

  return (
    <div className="relative">
      <main className={`transition-filter duration-700 ${showSplash ? 'filter blur-sm pointer-events-none' : ''}`}>
        <Slideshow slides={slides} />

        {error && <p className="p-12 text-center text-red-600">{error}</p>}
        {!error && loading && <p className="p-12 text-center text-lg">Cargando productos...</p>}

        {!loading && !error && (
          <>
            <section id='novedades' className="py-8 bg-white">
              <h1 className="text-xs text-gray-800 text-center mb-6 mt-8">¡SHOP NOW!</h1>
              <h1 className="text-2xl font-bold text-gray-800 text-center mb-4">NOVEDADES</h1>
              <div className="flex justify-between items-center px-4 mb-4">
                <h2 className="text-lg font-bold text-gray-800 mb-4"></h2>
                <div className="flex space-x-2">
                  <button
                    onClick={prevPage}
                    className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition text-2xl leading-none"
                    aria-label="Página anterior"
                  >
                    ❮
                  </button>
                  <button
                    onClick={nextPage}
                    className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition text-2xl leading-none"
                    aria-label="Página siguiente"
                  >
                    ❯
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                {currentItems.map(({ id, imagen, nombre, precio, descripcion, seleccionado }) => (
                    <Link
                      key={id}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        setShowOverlaySplash(true)
                        setTimeout(() => router.push(`/producto/${id}`), 600)
                      }}
                    >
                    <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition duration-300">
                      <div className="relative w-full h-150 group">
                      <img
                        src={optimizeImage(imagen[0])}
                        alt={nombre}
                        loading="lazy"
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                          imagen[1] ? 'group-hover:opacity-0' : ''
                        }`}
                      />

                      {imagen[1] && (
                        <img
                          src={optimizeImage(imagen[1])}
                          alt={`${nombre} alternativa`}
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        />
                      )}

                        {seleccionado && (
                          <div className="absolute top-2 left-2 z-10">
                            <span className="inline-block bg-black text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
                              New Arrivals
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-4 text-center">
                        <p className="text-gray-700 text-sm font-semibold truncate">{nombre}</p>
                        <p className="text-black text-base font-bold mt-1">S/ {precio}</p>
                        {/*<p className="text-gray-500 text-xs mt-2 truncate">{descripcion}</p>*/}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              {/* Botón al final */}
              <div className="flex justify-center mt-12">
                <a
                  href="/woman"
                  className="relative inline-block px-9 py-3 border border-black bg-black text-white text-sm overflow-hidden transition-colors duration-300 group"
                >
                  <span className="relative z-10 transition-colors duration-300 group-hover:text-black">
                    VER TODO
                  </span>
                  <span className="absolute inset-0 bg-white transform translate-x-full group-hover:translate-x-0 origin-right transition-transform duration-300 ease-in-out"></span>
                </a>
              </div>
            </section>

            <TextWithIcons />

            <section className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden">
              <Link href="/components/nosotros" className="block w-full h-full">
                <picture>
                  <source
                    media="(max-width: 699px)"
                    srcSet="/images/_DSC7353.jpg"
                  />
                  <img
                    src="/images/_DSC7353.jpg"
                    alt="Visítanos en nuestras tiendas"
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </picture>

                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-center">
                  <h2 className="text-2xl md:text-4xl font-bold drop-shadow-lg">
                    Visítanos en nuestras tiendas
                  </h2>
                </div>
              </Link>
            </section>

            <WhatsappBubble />
          </>
        )}
      </main>

      {showSplash && (
        <div
          className={`fixed inset-0 z-50 bg-white flex items-center justify-center transition-opacity duration-1500 ${
            fadeSplash ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <SplashScreen fadeOut={fadeSplash} />
        </div>
      )}
      {showOverlaySplash && (
        <div className="fixed inset-0 z-50 bg-white flex items-center justify-center transition-opacity duration-700">
          <SplashScreen fadeOut={false} />
        </div>
      )}
    </div>
  )
}

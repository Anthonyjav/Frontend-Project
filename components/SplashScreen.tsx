// app/components/SplashScreen.tsx
'use client'

import Image from 'next/image'
import './SplashScreen.css'


export default function SplashScreen({ fadeOut = false }: { fadeOut?: boolean }) {
  return (
    <div className={`fixed inset-0 z-50 bg-white flex items-center justify-center transition-opacity ${fadeOut ? 'fade-out' : ''}`}>
      <div className="flex flex-col items-center">
        <Image src="/images/logo.png" alt="Logo" width={150} height={150} />
        <div className="mt-4 text-gray-800 font-semibold text-lg flex items-center space-x-1">
          <span>Cargando</span>
          <span className="dots-loader">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>
      </div>
    </div>
  )
}
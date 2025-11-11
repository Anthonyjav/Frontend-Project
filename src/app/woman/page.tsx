'use client'

import { Suspense } from 'react'
import WomanContent from './content'

export default function WomanPage() {
  return (
    <Suspense fallback={<div>Cargando prendas...</div>}>
      <WomanContent />
    </Suspense>
  )
}

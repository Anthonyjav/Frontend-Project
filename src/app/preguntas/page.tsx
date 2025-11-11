'use client'

import { useState } from 'react'

type FAQ = {
  question: string
  answer: string
}

const faqs: FAQ[] = [
  {
    question: '¿Cuál es el horario de atención?',
    answer: 'Nuestro horario de atención es:\n• Lunes a sábado: 9:00 am a 08:30 pm\n• Domingo: 1:00 pm a 6:30 pm',
  },
  {
    question: '¿Hacen envíos a todo el país?',
    answer: 'Sí, realizamos envíos a todo el país a través de Olva Courier.',
  },
  {
    question: '¿Qué formas de pago aceptan?',
    answer: 'Aceptamos tarjetas de crédito, débito, transferencias bancarias y pagos por Yape o Plin.',
  },
  {
    question: '¿Puedo cambiar o devolver un producto?',
    answer: `Querida sg lover, tu satisfacción es nuestra prioridad, por ello puedes solicitar un cambio de producto siempre que:\n
    • Este no haya sido utilizado, lavado o esté en su empaque original con todas las etiquetas intactas tal cual lo recibiste.\n
    • No tenga marcas sucias o de maquillaje.\n
    • No tenga olor a perfume, desodorante, cosméticos u olor a lavado.\n
    Revisaremos todos los artículos al recibirlos. cualquier producto que no cumpla con las condiciones anteriores será devuelto al cliente.\n
    En caso de notar que el producto ha sido manipulado, no se podrá realizar el cambio. no aceptamos productos que no estén en las condiciones originales de venta.\n
    Además, el costo del delivery de cambio es responsabilidad del cliente.\n
    Para solicitar un cambio, deberás escribirnos por whatsapp o enviar un correo a sgstudio1606@gmail.com dentro de las 36 horas posteriores a la recepción de tu pedido.\n
    Por favor incluye: tus datos personales, dni, correo electrónico, celular, número de pedido, motivo del cambio y el nuevo producto que quisieras.\n
    Una vez recibido tu mensaje, nos contactaremos contigo y te enviaremos la dirección a la cual deberás enviar el producto. el cambio se realizará al precio vigente del producto.\n
    Finalmente, no realizamos devoluciones de dinero. si deseas cambiar un producto, puedes solicitar una giftcard (tarjeta de regalo) para usar en una nueva compra. esta no tiene fecha de caducidad.\n
    No se aceptan cambios de productos en oferta.
    \n`,
  },
]

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-7 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-10 text-gray-800">Preguntas Frecuentes</h1>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white border rounded-lg shadow-sm">
              <button
                onClick={() => toggle(index)}
                className="w-full text-left px-6 py-4 text-lg font-medium text-gray-800 focus:outline-none flex justify-between items-center"
              >
                {faq.question}
                <span>{openIndex === index ? '−' : '+'}</span>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 text-gray-600 whitespace-pre-line">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

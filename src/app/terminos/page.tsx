export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-20">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded shadow">
        <h1 className="text-2xl text-black font-bold mb-4">Términos y Condiciones</h1>
        <p className="mb-4 text-black">
          Al realizar una compra en nuestra tienda, aceptas los siguientes términos:
        </p>
        <ul className="list-disc pl-5 text-gray-700 space-y-2">
          <li>
            Para cambios y devoluciones, revisar nuestra{' '}
            <a href="/preguntas" className="text-blue-600 underline hover:text-blue-800">
              política de cambios y devoluciones
            </a>.
          </li>
          <li>El cliente es responsable de verificar los datos de envío antes de confirmar la orden.</li>
          <li>En caso de retiro en tienda, el cliente debe presentar su documento de identidad.</li>
          <li>Los productos adquiridos son para uso personal, no comercial.</li>
        </ul>
        <p className="mt-6 text-sm text-gray-500">Última actualización: Junio 2025</p>
      </div>
    </div>
  );
}

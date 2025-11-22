export default function PagoFallido() {
  return (
    <div className="min-h-screen flex items-center justify-center p-10">
      <div className="bg-white p-8 rounded shadow max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Pago Rechazado</h1>

        <p>El pago no pudo completarse.</p>

        <a href="/checkout" className="mt-5 inline-block bg-black text-white px-4 py-2 rounded">
          Intentar nuevamente
        </a>
      </div>
    </div>
  );
}

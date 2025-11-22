'use client';

import { useEffect, useState, FormEvent } from 'react';
import axios from 'axios';

export default function CheckoutPage() {

  const [carrito, setCarrito] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    district: '',
    department: '',
    reference: '',
    shippingMethod: '',
    identityType: 'DNI',
    identityCode: '',
    address: '',
    country: 'PE',
    state: '',
    city: '',
    zipCode: '15021',
    orderId: `SG-${new Date().toISOString().replace(/\D/g,'')}-${Math.floor(Math.random()*1000)}`,
    amount: 0,
    currency: 'PEN',
  });

  const [formToken, setFormToken] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // =====================================
  // CARRITO
  // =====================================
  useEffect(() => {
    const fetchCarrito = async () => {
      const storedUser = localStorage.getItem('usuario');
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

      if (isLoggedIn && storedUser) {
        const user = JSON.parse(storedUser);
        try {
          const response = await fetch(
            `https://backend-project-677e.onrender.com/carrito/${user.id}`
          );
          const data = await response.json();
          setCarrito(data);
        } catch (error) {
          console.error(error);
        }
      } else {
        const savedCart = localStorage.getItem('carrito');
        if (savedCart) setCarrito({ items: JSON.parse(savedCart) });
      }

      setLoading(false);
    };

    fetchCarrito();
  }, []);

  // =====================================
  // TOTAL
  // =====================================
  useEffect(() => {
    if (carrito?.items) {
      const total = carrito.items.reduce(
        (acc: number, item: any) => acc + item.cantidad * item.producto.precio,
        0
      );
      setForm((prev) => ({ ...prev, amount: total }));
    }
  }, [carrito]);

  // Ubigeos: cargar lista plana desde la API pública y preparar selects dependientes
  const [ubigeos, setUbigeos] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<string[]>([]);
  const [provincias, setProvincias] = useState<string[]>([]);
  const [distritos, setDistritos] = useState<string[]>([]);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetch('https://free.e-api.net.pe/ubigeos.json', { cache: 'no-store' })
      .then(res => res.json())
      .then(raw => {
        const lista: any[] = [];
        Object.entries(raw).forEach(([departamento, provinciasObj]) => {
          Object.entries(provinciasObj as object).forEach(([provincia, distritosObj]) => {
            Object.keys(distritosObj as object).forEach((distrito) => {
              lista.push({ departamento, provincia, distrito });
            });
          });
        });
        setUbigeos(lista);
        const deps = Array.from(new Set(lista.map(u => u.departamento))).filter(Boolean);
        setDepartamentos(deps);
      })
      .catch((err) => {
        console.warn('Error cargando ubigeos:', err);
      });
  }, []);

  const mostrarToast = (mensaje: string) => {
    setToastMessage(mensaje);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }


  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    if (name === 'department') {
      const provs = ubigeos
        .filter(u => u.departamento === value)
        .map(u => u.provincia);
      setProvincias(Array.from(new Set(provs)));
      setDistritos([]);
      setForm(prev => ({ ...prev, state: '', city: '', department: value }));
    }

    if (name === 'state') {
      const dists = ubigeos
        .filter(u => u.departamento === form.department && u.provincia === value)
        .map(u => u.distrito);
      setDistritos(Array.from(new Set(dists)));
      setForm(prev => ({ ...prev, city: '', state: value }));
    }

    if (name === 'city') {
      setForm(prev => ({ ...prev, city: value }));
    }
  }
  

  // =====================================
  // GENERAR FORM TOKEN PARA IZIPAY
  // =====================================
  const generarPago = async (e: FormEvent) => {
    e.preventDefault();

    try {
      // 1. Validar que el carrito no esté vacío
      if (!carrito?.items?.length) {
        alert("Tu carrito está vacío");
        return;
      }

      // 2. Obtener el usuario logueado
      const storedUser = localStorage.getItem("usuario");
      const usuarioId = storedUser ? JSON.parse(storedUser).id : null;

      if (!usuarioId) {
        alert("Debes iniciar sesión para continuar.");
        return;
      }

      // 3. Calcular subtotal
      const subtotal = carrito.items.reduce(
        (t: number, i: any) => t + i.cantidad * i.producto.precio,
        0
      );

      // 4. Preparar body para enviar al backend
      const bodyIzipay = {
        amount: subtotal * 1, // IZIPAY usa centavos
        currency: form.currency,
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: form.phoneNumber,
        identityType: form.identityType,
        identityCode: form.identityCode,
        address: form.address,
        country: "PE",
        state: form.state,
        city: form.city,
        zipCode: form.zipCode,
        shippingMethod: form.shippingMethod,

        metadata: {
          usuarioId: String(usuarioId),
          orderId: String(form.orderId),
          items: JSON.stringify(
            carrito.items.map((item: any) => ({
              productoId: item.producto.id,
              nombreProducto: item.producto.nombre,
              precio: item.producto.precio,
              cantidad: item.cantidad,
              talla: item.talla || null
            }))
          )
        }

      };

      // 5. Solicitar formToken al backend
      // Log temporal para depuración: ver exactamente lo que enviamos
      console.log("[IziPay] bodyIzipay ->", bodyIzipay);
      const res = await axios.post(
        "https://backend-project-677e.onrender.com/api/izipay/form-token",
        bodyIzipay,
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("🔹 Respuesta del backend:", res.data);

      // 6. Guardar token para mostrar formulario IziPay
      setFormToken(res.data.formToken);
      setShowForm(true);

    } catch (err: any) {
      console.error("Error al generar pago:", err.response?.data || err);
      alert("Error al generar pago");
    }
  };

  // =====================================
  // EMBED IZIPAY
  // =====================================
useEffect(() => {
  if (!formToken || !carrito) return;

  // 1️⃣ OBTENER usuarioId desde localStorage
  const storedUser = localStorage.getItem("usuario");
  const usuario = storedUser ? JSON.parse(storedUser) : null;
  const usuarioId = usuario?.id || null;

  if (!usuarioId) {
    console.error("⚠️ No existe usuarioId.");
  }

  // 2️⃣ CONTENEDOR DEL FORM
  const target = document.getElementById("izipay-form");
  if (!target) return;

  target.innerHTML = "";

  // 3️⃣ CSS UNA SOLA VEZ
  if (!document.getElementById("krypton-style")) {
    const link = document.createElement("link");
    link.id = "krypton-style";
    link.rel = "stylesheet";
    link.href =
      "https://static.micuentaweb.pe/static/js/krypton-client/V4.0/ext/classic-reset.css";
    document.head.appendChild(link);
  }

  // 4️⃣ CREAR FORMULARIO
  const container = document.createElement("div");
  container.className = "kr-embedded";
  container.setAttribute("kr-form-token", formToken);
  container.setAttribute("kr-language", "es-PE");
  container.setAttribute(
    "kr-public-key",
    "84426447:testpublickey_QCOElYQ9EppkGyhK4vn9LVgZaoq5sgvrriJkgDpiei39L"
  );

  // 5️⃣ ENVIAR METADATA A TU BACKEND (Izipay NO LO GUARDA)
  container.setAttribute(
    "kr-post-url-success",
    `https://backend-project-677e.onrender.com/api/izipay/pago-exitoso`
  );



  // Los parámetros extra van mediante inputs ocultos
  // Enviar metadata correctamente a IziPay
  const metadataInput = document.createElement("input");
  metadataInput.type = "hidden";
  metadataInput.name = "kr-hash-metadata";
  metadataInput.value = JSON.stringify({
    usuarioId,
    orderId: form.orderId,
    items: carrito.items.map((item: any) => ({
      productoId: item.producto.id,
      nombreProducto: item.producto.nombre,
      precio: item.producto.precio,
      cantidad: item.cantidad,
      talla: item.talla || null
    }))
  });
  // Log temporal para depuración en cliente: ver el contenido del input oculto
  console.log("[IziPay] kr-hash-metadata ->", metadataInput.value);
  container.appendChild(metadataInput);

  // Enviar orderId explícito
  const orderIdInput = document.createElement("input");
  orderIdInput.type = "hidden";
  orderIdInput.name = "kr-hash-orderId";
  orderIdInput.value = form.orderId;
  container.appendChild(orderIdInput);


  container.setAttribute("kr-post-url-refused", "https://sgstudio.shop/pago-fallido");

  const button = document.createElement("button");
  button.className = "kr-payment-button";
  container.appendChild(button);

  target.appendChild(container);

  // 6️⃣ CARGAR SCRIPTS SOLO UNA VEZ
  if (!document.getElementById("krypton-script-main")) {
    const script1 = document.createElement("script");
    script1.id = "krypton-script-main";
    script1.src =
      "https://static.micuentaweb.pe/static/js/krypton-client/V4.0/stable/kr-payment-form.min.js";
    script1.async = true;
    document.body.appendChild(script1);
  }

  if (!document.getElementById("krypton-script-ext")) {
    const script2 = document.createElement("script");
    script2.id = "krypton-script-ext";
    script2.src =
      "https://static.micuentaweb.pe/static/js/krypton-client/V4.0/ext/classic.js";
    script2.async = true;
    document.body.appendChild(script2);
  }
}, [formToken, carrito]);

// FORZAR estilos inline en inputs del checkout para evitar overrides externos (temporal)
// NOTE: Removed temporary inline style enforcer; inputs now use Tailwind-like classes.


  if (loading) return <p>Cargando...</p>;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-20">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">

        {/* IZQUIERDA */}
        <div className="bg-white p-8 rounded-lg shadow space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Datos del Pago</h2>

          {!showForm ? (
            <>
              <input className="mb-2 px-3 py-2 border border-gray-200 rounded text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" placeholder="Nombre"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })} />

              <input className="mb-2 px-3 py-2 border border-gray-200 rounded text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" placeholder="Apellido"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })} />

              <input className="mb-2 px-3 py-2 border border-gray-200 rounded text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />

              <input className="mb-2 px-3 py-2 border border-gray-200 rounded text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" placeholder="Teléfono"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />

              <input className="mb-2 px-3 py-2 border border-gray-200 rounded text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" placeholder="DNI"
                value={form.identityCode}
                onChange={(e) => setForm({ ...form, identityCode: e.target.value })} />

              <input className="mb-2 px-3 py-2 border border-gray-200 rounded text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" placeholder="Dirección"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })} />


              <input className="mb-2 px-3 py-2 border border-gray-200 rounded text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" placeholder="País"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })} />

              <div className="form-section">
                <label className="form-label">Ubicación</label>
                <select className="mb-2 px-3 py-2 border border-gray-200 rounded text-sm bg-white appearance-none pr-10" 
                  name="department"
                  value={form.department}
                  onChange={handleChange}>
                  <option value="">Seleccione departamento</option>
                  {departamentos.map((d: any) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select className="mb-2 px-3 py-2 border border-gray-200 rounded text-sm bg-white appearance-none pr-10"
                  name="state"
                  value={form.state}
                  onChange={handleChange}>
                  <option value="">Seleccione provincia</option>
                  {provincias.map((p: any) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>

                <select className="mb-2 px-3 py-2 border border-gray-200 rounded text-sm bg-white appearance-none pr-10"
                  name="city"
                  value={form.city}
                  onChange={handleChange}>
                  <option value="">Seleccione distrito</option>
                  {distritos.map((dd: any) => (
                    <option key={dd} value={dd}>{dd}</option>
                  ))}
                </select>
              </div>

              <input className="mb-2 px-3 py-2 border border-gray-200 rounded text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" placeholder="Referencia"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })} />

              <select
                className="mb-2 px-3 py-2 border border-gray-200 rounded text-sm bg-white appearance-none pr-10"
                value={form.shippingMethod}
                onChange={(e) => setForm({ ...form, shippingMethod: e.target.value })}
              >
                <option value="">Seleccione método de envío</option>
                <option value="shalom">Shalom</option>
                <option value="olva">Olva Courier</option>
              </select>

              <button
                onClick={generarPago}
                className="w-full bg-black text-white py-2 rounded"
              >
                Proceder al Pago
              </button>
            </>
          ) : (
            <div id="izipay-form" className="mt-4"></div>
          )}
        </div>


        {/* DERECHA */}
        <div className="bg-white p-8 rounded-lg shadow space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Resumen del Pedido</h2>

          {!carrito?.items?.length ? (
            <p>Tu carrito está vacío.</p>
          ) : (
            carrito.items.map((item: any, index: number) => (
              <div key={index} className="flex items-center gap-4 border-b pb-4">
                <img
                  src={item.producto.imagen[0]}
                  className="w-16 h-16 object-cover rounded"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.producto.nombre}</p>
                  <p className="text-sm font-semibold text-gray-700">
                    S/. {item.cantidad * item.producto.precio}
                  </p>
                  <p className="text-xs text-gray-500">Cantidad: {item.cantidad}</p>
                  <p className="text-xs text-gray-500">Orden: {form.orderId}</p>



                </div>
              </div>
            ))
          )}

          {carrito?.items?.length > 0 && (
            <div className="mt-4 text-right">
              <p className="text-lg text-black font-semibold">
                Total: S/.{' '}
                {carrito.items.reduce(
                  (t: number, i: any) => t + i.cantidad * i.producto.precio,
                  0
                )}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

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

  // Generador seguro de orderId (útil si se necesita forzar uno antes de enviar)
  const generateOrderId = () => `SG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

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
            `${process.env.NEXT_PUBLIC_API_URL}/carrito/${user.id}`
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
      const itemsTotal = carrito.items.reduce(
        (acc: number, item: any) => acc + item.cantidad * item.producto.precio,
        0
      );
      const shipping = form.shippingMethod === 'olva' ? 20 : (form.shippingMethod === 'recojo' ? 0 : 0);
      setForm((prev) => ({ ...prev, amount: itemsTotal + shipping }));
    }
  }, [carrito, form.shippingMethod]);

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

      // Calcular costo de envío según método (OLVA = S/ 20, Recojo = S/ 0)
      const shippingCost = form.shippingMethod === 'olva' ? 20 : 0;

      // Validar que se haya seleccionado un método de envío
      if (!form.shippingMethod) {
        alert('Selecciona un método de envío.');
        return;
      }

      // Asegurar orderId antes de armar el payload
      const orderIdToUse = form.orderId || generateOrderId();
      if (!form.orderId) setForm(prev => ({ ...prev, orderId: orderIdToUse }));

      // 4. Preparar body para enviar al backend
      const bodyIzipay = {
        // Asegurar que el backend reciba orderId y metodoEnvio para persistirlos
        orderId: orderIdToUse,
        metodoEnvio: form.shippingMethod || null,
        amount: (subtotal + shippingCost) * 1, // IZIPAY usa centavos
        shippingCost: shippingCost,
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
        distrito: form.city || form.district || null,
        referencia: form.reference || null,
        zipCode: form.zipCode,
        shippingMethod: form.shippingMethod,

        metadata: {
          usuarioId: String(usuarioId),
          orderId: String(orderIdToUse),
          referencia: form.reference || null,
          distrito: form.city || form.district || null,
          shippingMethod: form.shippingMethod || null,
          shippingCost: shippingCost,
          items: JSON.stringify(
            carrito.items.map((item: any) => ({
              productoId: item.producto.id,
              nombreProducto: item.producto.nombre,
              precio: item.producto.precio,
              cantidad: item.cantidad,
              talla: item.talla || null,
              color: item.color || null,
              imagen: (item.producto && item.producto.imagen && item.producto.imagen[0]) || null
            }))
          )
        }

      };

      // 5. Solicitar formToken al backend
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/izipay/form-token`,
        bodyIzipay,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

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

  // Evitar doble inicialización si ya existe el formulario
  if (target.querySelector('.kr-embedded')) return;

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

  // Cargar CSS de personalización IziPay (si no existe)
  if (!document.getElementById("krypton-style-personal")) {
    const link2 = document.createElement("link");
    link2.id = "krypton-style-personal";
    link2.rel = "stylesheet";
    link2.href = "https://raw.githubusercontent.com/izipay-pe/Personalizacion/main/Formulario%20Incrustado/Style-Personalization-Incrustado.css";
    document.head.appendChild(link2);
  }

  // 4️⃣ CREAR FORMULARIO
  const container = document.createElement("div");
  // Dejar solo la clase `kr-embedded` para evitar duplicar el contenedor `.Contains-form`
  container.className = "kr-embedded";
  container.setAttribute("kr-form-token", formToken);
  container.setAttribute("kr-language", "es-PE");
  container.setAttribute(
      "kr-public-key",
      "84426447:testpublickey_QCOElYQ9EppkGyhK4vn9LVgZaoq5sgvrriJkgDpiei39L"
  );

 
  container.setAttribute(
    "kr-post-url-success",
    `${process.env.NEXT_PUBLIC_API_URL}/api/izipay/pago-exitoso`

  );
  
  // kr-post-url-refused: cuando el pago es RECHAZADO/FALLIDO
  container.setAttribute(
    "kr-post-url-refused", 
    "http://localhost:3000/usuario/perfil?success=false"
  );

  // Los parámetros extra van mediante inputs ocultos
  // Enviar metadata correctamente a IziPay
  const currentOrderId = form.orderId || generateOrderId();
  if (!form.orderId) setForm(prev => ({ ...prev, orderId: currentOrderId }));

  const metadataInput = document.createElement("input");
  metadataInput.type = "hidden";
  metadataInput.name = "kr-hash-metadata";
  metadataInput.value = JSON.stringify({
    usuarioId,
    orderId: currentOrderId,
    referencia: form.reference || null,
    distrito: form.city || form.district || null,
    shippingMethod: form.shippingMethod || null,
    items: carrito.items.map((item: any) => ({
      productoId: item.producto.id,
      nombreProducto: item.producto.nombre,
      precio: item.producto.precio,
      cantidad: item.cantidad,
      talla: item.talla || null,
        color: item.color || null,
        imagen: (item.producto && item.producto.imagen && item.producto.imagen[0]) || null
    }))
  });
  // Metadata para IziPay (debug log removido)
  container.appendChild(metadataInput);

  // Enviar orderId explícito
  const orderIdInput = document.createElement("input");
  orderIdInput.type = "hidden";
  orderIdInput.name = "kr-hash-orderId";
  orderIdInput.value = String(currentOrderId);
  container.appendChild(orderIdInput);

  const button = document.createElement("button");
  button.className = "kr-payment-button";
  container.appendChild(button);

  target.appendChild(container);

  const parentContains = target.closest('.Contains-form');
  let observer: MutationObserver | null = null;
  const updateLogoClass = () => {
    const hasIframe = !!target.querySelector('iframe');
    const hasHeaderImg = !!target.querySelector('.kr-header img, .kr-embedded-header img');
    if (parentContains) {
      // Si hay iframe (cross-origin) o no hay header img, mostramos logo local
      if (hasIframe || !hasHeaderImg) parentContains.classList.add('show-local-logo');
      else parentContains.classList.remove('show-local-logo');
    }
  };

  // comprobar ahora y luego observar cambios (cuando IziPay inyecte contenido async)
  updateLogoClass();
  observer = new MutationObserver(() => updateLogoClass());
  observer.observe(target, { childList: true, subtree: true });

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

  // Cleanup: remover el contenedor cuando el modal se cierra o cambian deps
  return () => {
    const t = document.getElementById("izipay-form");
    if (t) t.innerHTML = "";
    try { if (observer) observer.disconnect(); } catch (e) { /* noop */ }
  };
}, [formToken, carrito]);

// FORZAR estilos inline en inputs del checkout para evitar overrides externos (temporal)
// NOTE: Removed temporary inline style enforcer; inputs now use Tailwind-like classes.

  // Calcular subtotal y costo de envío para mostrar en el resumen
  const subtotalCalc = carrito?.items?.reduce((t: number, i: any) => t + i.cantidad * i.producto.precio, 0) || 0;
  const shippingCost = form.shippingMethod === 'olva' ? 20 : (form.shippingMethod === 'recojo' ? 0 : null);
  const totalCalc = subtotalCalc + (shippingCost ?? 0);

  if (loading) return <p>Cargando...</p>;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-40">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">

        {/* IZQUIERDA */}
        <div className="bg-white p-8 rounded-lg shadow space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">Pago</h2>
          <h3 className='text-sm font-light text-gray-500 mb-4' >Todas las transacciones son seguras y están encriptadas.</h3>

          {!showForm ? (
            <>
              {/* Nombre y Apellido */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input className="w-full px-3 py-2 border border-gray-200 rounded text-sm text-black bg-white focus:outline-none focus:border-black transition-colors duration-300 ease-in-out" placeholder="Nombre"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })} />

                <input className="w-full px-3 py-2 border border-gray-200 rounded text-sm text-black bg-white focus:outline-none  focus:border-black transition-colors duration-300 ease-in-out" placeholder="Apellido"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>

              <input className="w-full px-3 py-2 border border-gray-200 rounded text-sm text-black bg-white focus:outline-none  focus:border-black transition-colors duration-300 ease-in-out" placeholder="Email (obligatorio)"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />

              <input className="w-full px-3 py-2 border border-gray-200 rounded text-sm text-black bg-white focus:outline-none  focus:border-black transition-colors duration-300 ease-in-out" placeholder="DNI (obligatorio)"
                value={form.identityCode}
                onChange={(e) => setForm({ ...form, identityCode: e.target.value })} />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input className="sm:col-span-2 w-full px-3 py-2 border border-gray-200 rounded text-sm text-black bg-white focus:outline-none  focus:border-black transition-colors duration-300 ease-in-out" placeholder="Dirección"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })} />

                <input className="w-full px-3 py-2 border border-gray-200 rounded text-sm text-black bg-white bg-gray-100 cursor-not-allowed" placeholder="País"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })} 
                  disabled/>
              </div>

              <div className='relative'>
              <input className="w-full px-3 py-2 border border-gray-200 rounded text-sm text-black bg-white focus:outline-none  focus:border-black transition-colors duration-300 ease-in-out pr-10" placeholder="Teléfono"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />

                <div className="absolute inset-y-0 right-3 flex items-center group">
                  <span className="w-4 h-4 flex items-center justify-center rounded-full
                                  border-2 border-gray-600 text-xs text-gray-600
                                  cursor-pointer select-none">
                    ?
                  </span>

                  <div
                    className="
                      absolute right-0 top-full mt-2 w-48
                      bg-black text-white text-xs rounded-md px-3 py-2
                      opacity-0 scale-95 pointer-events-none
                      group-hover:opacity-100 group-hover:scale-100
                      transition
                    "
                  >
                    En caso de que tengamos que contactarte sobre tu pedido.
                  </div>
                </div>

              </div>

              <div className="space-y-2">
                <label className="text-base font-semibold text-gray-800">Ubicación</label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select className="w-full px-3 py-2 border border-gray-200 rounded text-sm bg-white appearance-none pr-10 focus:outline-none focus:border-black transition-colors duration-200 ease-in-out" 
                    name="department"
                    value={form.department}
                    onChange={handleChange}>
                    <option value="">Departamento</option>
                    {departamentos.map((d: any) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>

                  <select className="w-full px-3 py-2 border border-gray-200 rounded text-sm bg-white appearance-none pr-10 focus:outline-none focus:border-black transition-colors duration-200 ease-in-out"
                    name="state"
                    value={form.state}
                    onChange={handleChange}>
                    <option value="">Provincia</option>
                    {provincias.map((p: any) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>

                  <select className="w-full px-3 py-2 border border-gray-200 rounded text-sm bg-white  appearance-none pr-10 focus:outline-none focus:border-black transition-colors duration-200 ease-in-out"
                    name="city"
                    value={form.city}
                    onChange={handleChange}>
                    <option value="">Distrito</option>
                    {distritos.map((dd: any) => (
                      <option key={dd} value={dd}>{dd}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input className="w-full px-3 py-2 border border-gray-200 rounded text-sm text-black bg-white focus:outline-none  focus:border-black transition-colors duration-300 ease-in-out" placeholder="Referencia"
                  value={form.reference}
                  onChange={(e) => setForm({ ...form, reference: e.target.value })} />

                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm bg-white appearance-none pr-10 focus:outline-none focus:border-black transition-colors duration-200 ease-in-out"
                  value={form.shippingMethod}
                  onChange={(e) => setForm({ ...form, shippingMethod: e.target.value })}
                >
                  <option value="">Seleccione método de envío</option>
                  <option value="recojo">Recojo en tienda</option>
                  <option value="olva">OLVA COURIER</option>
                </select>
              </div>
              <button
                onClick={generarPago}
                className="btn-animated w-full rounded"
              >
                Proceder al Pago
              </button>
            </>
          ) : (
            <div className="Contains-form">
              <div id="izipay-form"></div>
            </div>
          )}
        </div>


        {/* DERECHA */}
        <div className="bg-white p-8 rounded-lg shadow space-y-6 self-start">
          <h2 className="text-xl font-semibold text-gray-900">Resumen del Pedido</h2>

          {!carrito?.items?.length ? (
            <p className="text-sm text-gray-500">Tu carrito está vacío.</p>
          ) : (
            <div className="space-y-4">
              {carrito.items.map((item: any, index: number) => (
                <div 
                  key={index} 
                  className="flex items-start justify-between gap-4"
                >
                  {/* IZQUIERDA */}
                  <div className="flex gap-3">
                    <img
                      src={item.producto.imagen[0]}
                      className="w-14 h-16 object-cover rounded-md border"
                    />

                    <div>
                      <p className="text-sm font-medium text-gray-800 leading-tight">
                        {item.producto.nombre}
                      </p>
                      <p className="text-xs text-gray-500">
                        Cantidad: {item.cantidad}
                      </p>
                      <p className="text-xs text-gray-500">
                        Orden: {form.orderId}
                      </p>
                    </div>
                  </div>

                  {/* DERECHA */}
                  <p className="text-sm font-medium text-gray-900 whitespace-nowrap">
                    S/ {item.cantidad * item.producto.precio}
                  </p>
                </div>
              ))}
            </div>
          )}

          <hr className="border-gray-200" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal</span>
              <span>S/ {subtotalCalc}</span>
            </div>

            <div className="flex justify-between text-gray-500">
              <span>Envío</span>
              <span>
                {shippingCost === null ? 'Se calcula al ingresar la dirección' : shippingCost === 0 ? 'Gratis' : `S/ ${shippingCost}`}
              </span>
            </div>
          </div>

          {carrito?.items?.length > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold text-gray-900">
                Total
              </span>

              <span className="text-xl font-semibold text-gray-900">
                S/ {totalCalc}
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

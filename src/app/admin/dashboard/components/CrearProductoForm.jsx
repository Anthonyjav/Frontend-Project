'use client';

import { useEffect, useState } from 'react';

export default function CrearProductoForm() {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [imagenes, setImagenes] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [coloresSeleccionados, setColoresSeleccionados] = useState([]);
  const [tallasSeleccionadas, setTallasSeleccionadas] = useState([]);
  const [cantidad, setCantidad] = useState('');
  const [composicion, setComposicion] = useState('');
  const [info, setInfo] = useState('');
  const [cuidados, setCuidados] = useState('');

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await fetch( `${process.env.NEXT_PUBLIC_API_URL}/categorias`);
        const data = await res.json();
        setCategorias(data);
      } catch (error) {
        console.error('Error al cargar categorías:', error);
      }
    };
    fetchCategorias();
  }, []);

  useEffect(() => {
    if (!imagenes || imagenes.length === 0) {
      setPreviews([]);
      return;
    }

    const newPreviews = imagenes.map((img) => URL.createObjectURL(img));
    setPreviews(newPreviews);

    return () => {
      newPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagenes]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nombre || !precio || !categoriaId || coloresSeleccionados.length === 0 || tallasSeleccionadas.length === 0 || !cantidad || !composicion || !info || !cuidados) {
      setMensaje('Por favor, completa los campos requeridos');
      return;
    }

    // Convertimos los arrays a strings separados por comas para el envío
    const color = coloresSeleccionados.join(',');
    const talla = tallasSeleccionadas.join(',');

    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('descripcion', descripcion);
    formData.append('precio', precio);
    formData.append('categoriaId', categoriaId);
    formData.append('color', color);
    formData.append('talla', talla);
    formData.append('cantidad', cantidad);
    formData.append('composicion', composicion);
    formData.append('info', info);
    formData.append('cuidados', cuidados);
    imagenes.forEach((img) => formData.append('imagen', img));

    try {
      const token = localStorage.getItem('token');
      const res = await fetch( `${process.env.NEXT_PUBLIC_API_URL}/productos`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setMensaje(data.error || 'Error al crear producto');
        return;
      }

      setMensaje(`Producto "${data.nombre}" creado con éxito!`);
      setNombre('');
      setDescripcion('');
      setPrecio('');
      setCategoriaId('');
      setColoresSeleccionados([]);
      setTallasSeleccionadas([]);
      setCantidad('');
      setComposicion('');
      setInfo('');
      setCuidados('');
      setImagenes([]);
      setPreviews([]);
    } catch (error) {
      setMensaje('Error al conectar con el servidor');
      console.error(error);
    }
  };

  // --- Opciones para seleccionar ---
  const initialColors = [
    { name: 'Rojo', hex: '#DC2626' },
    { name: 'Azul', hex: '#2563EB' },
    { name: 'Verde', hex: '#16A34A' },
    { name: 'Negro', hex: '#000000' },
    { name: 'Blanco', hex: '#FFFFFF' },
    { name: 'Gris', hex: '#4B5563' },
    { name: 'Amarillo', hex: '#CA8A04' },
  ];
  const [availableColors, setAvailableColors] = useState(initialColors);
  const [newColorHex, setNewColorHex] = useState('#000000');
  const [newColorName, setNewColorName] = useState('');
  const [colorMessageLocal, setColorMessageLocal] = useState('');
  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const handleColorChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setColoresSeleccionados((prev) => [...prev, value]); // value será el hex
    } else {
      setColoresSeleccionados((prev) => prev.filter((hex) => hex !== value));
    }
  };

  const handleTallaChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setTallasSeleccionadas((prev) => [...prev, value]);
    } else {
      setTallasSeleccionadas((prev) =>
        prev.filter((talla) => talla !== value)
      );
    }
  };

  // Permite agregar un color personalizado a la paleta
  const handleAddColor = () => {
    const hex = (newColorHex || '#000000').toUpperCase();
    const name = newColorName.trim() || hex;
    if (availableColors.some((c) => c.hex.toUpperCase() === hex)) {
      setColorMessageLocal('Este color ya está en la paleta');
      setTimeout(() => setColorMessageLocal(''), 2500);
      return;
    }
    const newColor = { name, hex };
    setAvailableColors((prev) => [newColor, ...prev]);
    setColoresSeleccionados((prev) => [...prev, hex]);
    setNewColorName('');
    setNewColorHex('#000000');
    setColorMessageLocal('Color agregado');
    setTimeout(() => setColorMessageLocal(''), 2000);
  }; 

  return (
    <div className="bg-white rounded-xl p-8 shadow-md mt-12 max-w-4xl mx-auto">
      <h3 className="text-3xl font-semibold mb-6 text-center text-gray-900">
        Crear Nuevo Producto
      </h3>

      <form onSubmit={handleSubmit} encType="multipart/form-data" className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Columna 1 */}
        <div className="space-y-4">
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre *"
            required
            className="w-full px-4 py-2 rounded-md border border-gray-200 bg-gray-100 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
          />

          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción"
            rows={3}
            maxLength={255} 
            className="w-full px-4 py-2 rounded-md border border-gray-200 bg-gray-100 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
          <p className="text-sm text-gray-500 mt-1 text-right">
            {descripcion.length}/255 caracteres
          </p>

          <textarea
            value={composicion}
            onChange={(e) => setComposicion(e.target.value)}
            placeholder="Composición"
            rows={2}
            className="w-full px-4 py-2 rounded-md border border-gray-200 bg-gray-100 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
          />

          <textarea
            value={info}
            onChange={(e) => setInfo(e.target.value)}
            placeholder="Información adicional"
            rows={2}
            className="w-full px-4 py-2 rounded-md border border-gray-200 bg-gray-100 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>

        {/* Columna 2 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Colores *</label>
            <div className="grid grid-cols-3 gap-2 p-2 rounded-md border border-gray-200 bg-gray-100">
              {availableColors.map((color) => (
                <label key={color.hex} className="flex items-center space-x-2 text-sm text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    value={color.hex}
                    checked={coloresSeleccionados.includes(color.hex)}
                    onChange={handleColorChange}
                    className="sr-only peer"
                  />

                  <span
                    className={`w-6 h-6 rounded-full inline-block ${color.hex.toUpperCase() === '#FFFFFF' ? 'border border-gray-400' : ''} peer-checked:ring-2 peer-checked:ring-offset-2 peer-checked:ring-indigo-500`}
                    style={{ backgroundColor: color.hex }}
                    aria-hidden
                  ></span>

                  <span className="text-xs">{color.name}</span>
                </label>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input
                type="color"
                value={newColorHex}
                onChange={(e) => setNewColorHex(e.target.value)}
                className="w-10 h-10 p-0 border rounded"
                aria-label="Seleccionar color"
              />

              <input
                type="text"
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                placeholder="Nombre (opcional)"
                className="px-2 py-1 rounded border w-full text-sm"
              />

              <button
                type="button"
                onClick={handleAddColor}
                className="px-3 py-2 bg-gray-800 text-white rounded text-sm"
              >
                Agregar
              </button>
            </div>

            {colorMessageLocal && <p className="text-xs text-gray-600 mt-1">{colorMessageLocal}</p>}
          </div>

          <input
            type="number"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            placeholder="Cantidad *"
            required
            className="w-full px-4 py-2 rounded-md border border-gray-200 bg-gray-100 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
          />

          <textarea
            value={cuidados}
            onChange={(e) => setCuidados(e.target.value)}
            placeholder="Cuidados"
            rows={2}
            className="w-full px-4 py-2 rounded-md border border-gray-200 bg-gray-100 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tallas *</label>
            <div className="grid grid-cols-3 gap-2 p-2 rounded-md border border-gray-200 bg-gray-100">
              {availableSizes.map((talla) => (
                <label key={talla} className="flex items-center space-x-2 text-sm text-gray-800">
                  <input
                    type="checkbox"
                    value={talla}
                    checked={tallasSeleccionadas.includes(talla)}
                    onChange={handleTallaChange}
                    className="rounded border-gray-300 text-gray-600 shadow-sm focus:border-gray-300 focus:ring focus:ring-gray-200 focus:ring-opacity-50"
                  />
                  <span>{talla}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Campos globales */}
        <div className="md:col-span-2 space-y-4">
          <input
            type="number"
            step="0.01"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            placeholder="Precio *"
            required
            className="w-full px-4 py-2 rounded-md border border-gray-200 bg-gray-100 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
          />

          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-md border border-gray-200 bg-gray-100 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            <option value="">Selecciona una categoría *</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImagenes(Array.from(e.target.files))}
            className="w-full text-sm text-gray-700"
          />

          {previews.length > 0 && (
            <div className="flex flex-wrap gap-4 mt-2">
              {previews.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`preview-${idx}`}
                  className="w-32 h-32 object-cover border border-gray-300 rounded"
                />
              ))}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2 px-4 bg-gray-800 text-white rounded-md shadow hover:bg-gray-700 transition"
          >
            Crear Producto
          </button>

          {mensaje && <p className="text-center mt-4 text-sm text-gray-700">{mensaje}</p>}
        </div>
      </form>
    </div>
  );
}

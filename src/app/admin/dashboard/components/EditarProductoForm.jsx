'use client';

import { useState, useEffect } from 'react';

export default function EditarProductoForm({ producto, onGuardado, onCancelar }) {
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    descripcion: '',
    imagen: [],
    activo: true,
  });

  const [nuevasImagenes, setNuevasImagenes] = useState([]);

  useEffect(() => {
    if (producto) {
      setFormData({
        nombre: producto.nombre || '',
        precio: producto.precio || '',
        descripcion: producto.descripcion || '',
        imagen: producto.imagen || [],
        // Normalize activo so it works if backend/frontend send true/false, '1'/'0', or 1/0
        activo: producto.activo === true || producto.activo === '1' || producto.activo === 1,
      });
    }
  }, [producto]);

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleRemoveImagen = (index) => {
    setFormData((prev) => ({
      ...prev,
      imagen: prev.imagen.filter((_, i) => i !== index),
    }));
  };

  const handleNuevaImagen = (e) => {
    const archivos = Array.from(e.target.files);
    setNuevasImagenes(archivos);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData();
    data.append('nombre', formData.nombre);
    data.append('precio', formData.precio);
    data.append('descripcion', formData.descripcion);
    // Send activo as 'true' or 'false' to match backend expectation
    data.append('activo', formData.activo ? 'true' : 'false');

    formData.imagen.forEach((url) => data.append('imagenesActuales', url));
    nuevasImagenes.forEach((img) => data.append('nuevasImagenes', img));

    // Debug: log the FormData contents to the console (remove after testing)
    for (const pair of data.entries()) {
      console.log('FormData:', pair[0], pair[1]);
    }

    try {
      const token = localStorage.getItem('token'); 
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/productos/${producto.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`, 
        },
        body: data,
      });

      if (!res.ok) throw new Error('Error al actualizar producto');

      alert('Producto actualizado exitosamente');
      onGuardado(); 
    } catch (error) {
      alert(error.message);
    }
  };



  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
      <div>
        <label className="block font-semibold">Nombre</label>
        <input
          type="text"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block font-semibold">Precio</label>
        <input
          type="number"
          name="precio"
          value={formData.precio}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block font-semibold">Descripción</label>
        <textarea
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="activo"
          type="checkbox"
          name="activo"
          checked={!!formData.activo}
          onChange={handleChange}
          className="h-4 w-4"
        />
        <label htmlFor="activo" className="font-semibold">Activo</label>
      </div>

      <div>
        <label className="block font-semibold">Imágenes actuales</label>
        <div className="flex flex-wrap gap-2">
          {formData.imagen.map((url, index) => (
            <div key={index} className="relative">
              <img src={url} alt={`Imagen ${index + 1}`} className="w-24 h-24 object-cover rounded" />
              <button
                type="button"
                onClick={() => handleRemoveImagen(index)}
                className="absolute top-0 right-0 bg-red-600 text-white px-1 rounded"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block font-semibold">Agregar nuevas imágenes</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleNuevaImagen}
          className="w-full text-sm text-gray-700"
        />
      </div>

      <div className="flex gap-4">
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Guardar cambios
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

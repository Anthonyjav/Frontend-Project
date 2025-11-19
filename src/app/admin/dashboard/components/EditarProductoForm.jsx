'use client';

import { useState, useEffect } from 'react';

export default function EditarProductoForm({ producto, onGuardado, onCancelar }) {
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    descripcion: '',
    imagen: [], 
  });

  const [nuevasImagenes, setNuevasImagenes] = useState([]);

  useEffect(() => {
    if (producto) {
      setFormData({
        nombre: producto.nombre || '',
        precio: producto.precio || '',
        descripcion: producto.descripcion || '',
        imagen: producto.imagen || [],
      });
    }
  }, [producto]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

    // Enviar las URLs de las imágenes que se conservaron
    formData.imagen.forEach((url) => {
      data.append('imagenesActuales', url);
    });

    // Enviar nuevas imágenes (archivos)
    nuevasImagenes.forEach((img) => {
      data.append('nuevasImagenes', img);
    });

    try {
      const res = await fetch(`https://backend-project-677e.onrender.com/productos/${producto.id}`, {
        method: 'PUT',
        body: data,
      });

      if (!res.ok) throw new Error('Error al actualizar producto');

      alert('Producto actualizado exitosamente');
      onGuardado(); // Notifica al padre para refrescar lista o cerrar modal
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

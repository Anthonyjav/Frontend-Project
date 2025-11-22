'use client';

import { useEffect, useState } from 'react';

type Usuario = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'admin' | 'user' | 'employee';
};

export default function ListarUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  useEffect(() => {
    obtenerUsuarios();
  }, []);

  const obtenerUsuarios = async () => {
    try {
      const res = await fetch('https://backend-project-677e.onrender.com/usuarios');
      const data = await res.json();
      setUsuarios(data);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    id: number
  ) => {
    const value = e.target.value as 'admin' | 'user' | 'employee';
    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? { ...u, rol: value } : u))
    );
  };

  const actualizarUsuario = async (usuario: Usuario) => {
    try {
      const body = {
        rol: usuario.rol,
      };

      await fetch(`https://backend-project-677e.onrender.com/usuarios/${usuario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      setEditandoId(null);
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
    }
  };


  const eliminarUsuario = async (id: number) => {
    if (!confirm('¿Eliminar este usuario?')) return;

    try {
      await fetch(`https://backend-project-677e.onrender.com/usuarios/${id}`, {
        method: 'DELETE',
      });
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
    }
  };

  if (loading) {
    return <p className="text-center text-gray-600">Cargando usuarios...</p>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 uppercase text-black">Usuarios registrados</h2>

      <div className="overflow-x-auto">
        <table className="w-full border border-black text-sm">
          <thead className="bg-black text-white uppercase">
            <tr>
              <th className="border border-black px-3 py-2 text-left">ID</th>
              <th className="border border-black px-3 py-2 text-left">Nombre</th>
              <th className="border border-black px-3 py-2 text-left">Apellido</th>
              <th className="border border-black px-3 py-2 text-left">Email</th>
              <th className="border border-black px-3 py-2 text-left">Rol</th>
              <th className="border border-black px-3 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-black">
            {usuarios.map((u) => (
              <tr key={u.id} className="hover:bg-gray-100">
                <td className="border border-black px-3 py-2">{u.id}</td>
                <td className="border border-black px-3 py-2">{u.nombre}</td>
                <td className="border border-black px-3 py-2">{u.apellido}</td>
                <td className="border border-black px-3 py-2">{u.email}</td>
                <td className="border border-black px-3 py-2">
                  {editandoId === u.id ? (
                    <select
                      value={u.rol}
                      onChange={(e) => handleInputChange(e, u.id)}
                      className="border px-1 rounded w-full"
                    >
                      <option value="admin">admin</option>
                      <option value="user">user</option>
                      <option value="employee">employee</option>
                    </select>
                  ) : (
                    u.rol
                  )}
                </td>
                <td className="border border-black px-3 py-2 space-x-2">
                  {editandoId === u.id ? (
                    <>
                      <button
                        onClick={() => actualizarUsuario(u)}
                        className="px-2 py-1 border border-black text-black hover:bg-black hover:text-white transition rounded text-xs"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditandoId(null)}
                        className="px-2 py-1 border border-black text-black hover:bg-black hover:text-white transition rounded text-xs"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditandoId(u.id)}
                        className="px-2 py-1 border border-black text-black hover:bg-black hover:text-white transition rounded text-xs"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminarUsuario(u.id)}
                        className="px-2 py-1 border border-black text-black hover:bg-black hover:text-white transition rounded text-xs"
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

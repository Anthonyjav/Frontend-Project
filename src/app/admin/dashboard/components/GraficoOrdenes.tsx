'use client';

import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardGraficos() {
  const [productosVendidos, setProductosVendidos] = useState([]);
  const [ordenesPorDia, setOrdenesPorDia] = useState([]);
  const [ingresosPorDia, setIngresosPorDia] = useState([]);
  const [usuariosPorMes, setUsuariosPorMes] = useState([]);
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    // Productos más vendidos
    Promise.all([
      fetch('https://backend-project-677e.onrender.com/orden-items').then(res => res.json()),
      fetch('https://backend-project-677e.onrender.com/productos').then(res => res.json()),
    ]).then(([ordenItems, productos]) => {
      const mapaNombres = productos.reduce((acc, prod) => {
        acc[prod.id] = prod.nombre;
        return acc;
      }, {});

      const resumen = ordenItems.reduce((acc, item) => {
        const nombre = mapaNombres[item.productoId] || `Producto ${item.productoId}`;
        const existente = acc.find(p => p.nombreProducto === nombre);
        if (existente) {
          existente.cantidad += item.cantidad;
        } else {
          acc.push({ nombreProducto: nombre, cantidad: item.cantidad });
        }
        return acc;
      }, []);

      setProductosVendidos(resumen);
    });

    // Órdenes e ingresos por día
    fetch('https://backend-project-677e.onrender.com/ordenes')
      .then(res => res.json())
      .then(ordenes => {
        const agrupado = ordenes.reduce((acc, orden) => {
          const fecha = new Date(orden.createdAt).toISOString().split('T')[0];
          const existente = acc.find(item => item.fecha === fecha);
          if (existente) {
            existente.ordenes++;
            existente.total += orden.total;
          } else {
            acc.push({ fecha, ordenes: 1, total: orden.total });
          }
          return acc;
        }, []);
        setOrdenesPorDia(agrupado);
        setIngresosPorDia(agrupado);
      });

    // Usuarios por mes
    fetch('https://backend-project-677e.onrender.com/usuarios')
      .then(res => res.json())
      .then(usuarios => {
        const agrupado = usuarios.reduce((acc, u) => {
          const fecha = new Date(u.createdAt);
          const key = `${fecha.getFullYear()}-${fecha.getMonth() + 1}`;
          const existente = acc.find(i => i.mes === key);
          if (existente) {
            existente.cantidad++;
          } else {
            acc.push({ mes: key, cantidad: 1 });
          }
          return acc;
        }, []);
        setUsuariosPorMes(agrupado);
      });

    // Productos por categoría
    Promise.all([
      fetch('https://backend-project-677e.onrender.com/productos').then(res => res.json()),
      fetch('https://backend-project-677e.onrender.com/categorias').then(res => res.json())
    ]).then(([productos, categorias]) => {
      const resumen = categorias.map(cat => {
        const cantidad = productos.filter(p => p.categoriaId === cat.id).length;
        return { nombre: cat.nombre, cantidad };
      });
      setCategorias(resumen);
    });
  }, []);

  return (
    <div className="grid gap-8 md:grid-cols-2 mt-10">
      <Card titulo="Productos más vendidos">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={productosVendidos}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="nombreProducto" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="cantidad" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card titulo="Órdenes por día">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={ordenesPorDia}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="ordenes" stroke="#10b981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card titulo="Ingresos por día">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={ingresosPorDia}>
            <defs>
              <linearGradient id="colorIngreso" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="fecha" />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip />
            <Area type="monotone" dataKey="total" stroke="#f59e0b" fillOpacity={1} fill="url(#colorIngreso)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card titulo="Usuarios registrados por mes">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={usuariosPorMes}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="cantidad" stroke="#8b5cf6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card titulo="Productos por categoría">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie dataKey="cantidad" data={categorias} cx="50%" cy="50%" outerRadius={100} label>
              {categorias.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function Card({ titulo, children }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">{titulo}</h2>
      {children}
    </div>
  );
}

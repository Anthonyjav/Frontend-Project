'use client';

import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { format, parseISO, eachMonthOfInterval, eachDayOfInterval, startOfYear, endOfToday } from 'date-fns';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingBag, Percent } from 'lucide-react';

interface Orden {
  id: number;
  total: number;
  createdAt: string;     // ⇦ asegúrate de que tu backend lo devuelva
}

/* ---------- helpers ---------- */
const formatterSoles = (n: number) =>
  `S/. ${n.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;

export default function VentasView() {
  /* ---------- estado --------- */
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---------- fetch --------- */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get<Orden[]>('https://api.sgstudio.shop/ordenes');
        setOrdenes(data);
      } catch (e) {
        setError('No se pudieron cargar las ventas 😓');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ---------- derivados ---------- */
  const totalVentas = useMemo(
    () => ordenes.reduce((s, o) => s + o.total, 0),
    [ordenes]
  );
 

  /* ---- ventas por mes (current year) ---- */
  const ventasMes = useMemo(() => {
    const meses = eachMonthOfInterval({
      start: startOfYear(new Date()),
      end: endOfToday(),
    }).map((d) => ({
      mes: format(d, 'MMM'),
      total: 0,
    }));

    ordenes.forEach((o) => {
      const date = parseISO(o.createdAt);
      const idx = date.getMonth(); // 0–11
      meses[idx].total += o.total;
    });

    return meses;
  }, [ordenes]);

  /* ---- órdenes últimos 7 días ---- */
  const ordenesDia = useMemo(() => {
    const dias = eachDayOfInterval({
      start: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      end: endOfToday(),
    }).map((d) => ({
      dia: format(d, 'dd/MM'),
      ordenes: 0,
    }));

    ordenes.forEach((o) => {
      const date = parseISO(o.createdAt);
      const key = format(date, 'dd/MM');
      const obj = dias.find((d) => d.dia === key);
      if (obj) obj.ordenes += 1;
    });

    return dias;
  }, [ordenes]);

  /* ---------- UI ---------- */
  if (loading) return <p className="p-6">Cargando…</p>;
  if (error)   return <p className="p-6 text-red-600">{error}</p>;

  return (
    <section className="p-6 space-y-8">
      <h2 className="text-3xl font-extrabold">Resumen de ventas</h2>

      {/* --- tarjetas resumen --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          icon={DollarSign}
          label="Total vendido"
          value={formatterSoles(totalVentas)}
          accent="bg-gradient-to-r from-green-400 to-green-600"
        />
        <StatCard
          icon={ShoppingBag}
          label="Órdenes totales"
          value={ordenes.length.toString()}
          accent="bg-gradient-to-r from-blue-400 to-blue-600"
        />
    
      </div>

      {/* --- Ventas por mes (bar) --- */}
      <div className="bg-white rounded-xl shadow border p-6">
        <h3 className="text-lg font-semibold mb-4">Ventas por mes (año actual)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={ventasMes}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis tickFormatter={(v) => v / 1000 + 'k'} />
            <Tooltip formatter={(v: number) => formatterSoles(v)} />
            <Bar dataKey="total" barSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* --- Órdenes últimos 7 días (line) --- */}
      <div className="bg-white rounded-xl shadow border p-6">
        <h3 className="text-lg font-semibold mb-4">Órdenes últimos 7 días</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={ordenesDia}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dia" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line dataKey="ordenes" strokeWidth={3} dot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

/* ---------- componente tarjeta ---------- */
function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`p-6 rounded-xl shadow text-white flex items-center gap-4 ${accent}`}
    >
      <div className="p-3 bg-white/20 rounded-full">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-extrabold">{value}</p>
      </div>
    </motion.article>
  );
}

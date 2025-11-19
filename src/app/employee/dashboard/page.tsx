'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// 🟦 IMPORT CORRECTO DEL SIDEBAR
import EmployeeSidebar from "@/app/employee/dashboard/sidebarEmployee";

import CrearCategoriaForm from "@/app/admin/dashboard/components/CrearCategoriaForm";
import CrearProductoForm from "@/app/admin/dashboard/components/CrearProductoForm";
import VistaOrdenes from "@/app/admin/dashboard/components/VistaOrdenes";

export default function EmployeeDashboard() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [vista, setVista] = useState("dashboard");

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const role = localStorage.getItem("role");

    if (!isLoggedIn || role !== "employee") {
      router.push("/login");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("role");
    router.push("/login");
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900">

      <EmployeeSidebar onSelect={setVista} onLogout={handleLogout} />

      <main className="flex-grow p-8 max-w-6xl mx-auto">
        
        {vista === "dashboard" && (
          <h1 className="text-2xl font-bold">Bienvenido Empleado</h1>
        )}

        {vista === "categorias" && (
          <div className="bg-white p-6 rounded-xl shadow border max-w-lg">
            <h2 className="text-xl font-semibold mb-2"></h2>
            <CrearCategoriaForm onCategoriaCreada={undefined} />
          </div>
        )}

        {vista === "productos" && (
          <div className="bg-white p-6 rounded-xl shadow border max-w-lg">
            <h2 className="text-xl font-semibold mb-2"></h2>
            <CrearProductoForm />
          </div>
        )}

        {vista === "ordenes" && (
          <div className="bg-white p-6 rounded-xl shadow border">
            <h2 className="text-xl font-semibold mb-2"></h2>
            <VistaOrdenes />
          </div>
        )}

      </main>
    </div>
  );
}

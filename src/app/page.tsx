"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaIdCard,
  FaCalendarAlt,
  FaSpinner,
  FaUserCheck,
  FaExclamationCircle,
  FaUniversity,
  FaShieldAlt,
} from "react-icons/fa";

export default function Home() {
  const router = useRouter();
  const [cedula, setCedula] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!cedula.trim() || !fechaNacimiento.trim()) {
      setError("Por favor, ingrese su cédula y seleccione su fecha de nacimiento.");
      setLoading(false);
      return;
    }

    // El input type="date" devuelve YYYY-MM-DD, lo convertimos a DD-MM-YYYY para la API
    let fechaParaEnviar = fechaNacimiento;
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)) {
      const [year, month, day] = fechaNacimiento.split("-");
      fechaParaEnviar = `${day}-${month}-${year}`;
    }

    try {
      const response = await fetch("/api/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cedula: cedula.trim(),
          fechaNacimiento: fechaParaEnviar,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al verificar los datos.");
      }

      if (data.success) {
        if (data.isAdmin) {
          // El administrador va al portal de administración
          sessionStorage.setItem("unerg-admin-auth", "true");
          router.push("/admin");
        } else if (data.data) {
          // El jubilado va al formulario de censo
          sessionStorage.setItem("unerg-jubilado-data", JSON.stringify(data.data));
          router.push("/formulario");
        }
      } else {
        throw new Error("Respuesta inválida del servidor.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocurrió un error inesperado. Intente de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-slate-900 overflow-hidden font-sans">
      {/* Fondo decorativo */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md px-4 z-10">
        {/* Logo y nombre de la universidad */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-700 to-amber-500 flex items-center justify-center shadow-xl shadow-blue-500/20 mb-4 ring-4 ring-slate-800/80">
            <FaUniversity className="text-white text-3xl" />
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">
            Censo de Jubilados
          </h1>
          <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-semibold">
            UNERG
          </p>
          <p className="text-slate-500 text-[11px] mt-2 max-w-xs leading-relaxed">
            Universidad Nacional Experimental de los Llanos Centrales Rómulo Gallegos
          </p>
        </div>

        {/* Tarjeta de acceso */}
        <div className="bg-slate-950/50 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white text-lg font-semibold mb-2 flex items-center gap-2">
            <FaUserCheck className="text-blue-500" /> Ingresar al Sistema
          </h2>
          <p className="text-slate-400 text-xs mb-6 leading-relaxed">
            Para actualizar sus datos, por favor ingrese su número de cédula y seleccione su fecha de nacimiento haciendo clic en el calendario.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo Cédula */}
            <div>
              <label htmlFor="cedula" className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Número de Cédula
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <FaIdCard />
                </div>
                <input
                  type="text"
                  id="cedula"
                  inputMode="numeric"
                  placeholder="Ej: 12345678"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value.replace(/\D/g, ""))}
                  className="w-full pl-10 pr-4 py-3.5 bg-slate-900/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Campo Fecha de Nacimiento (selector de calendario) */}
            <div>
              <label htmlFor="fechaNacimiento" className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Fecha de Nacimiento
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 z-10">
                  <FaCalendarAlt />
                </div>
                <input
                  type="date"
                  id="fechaNacimiento"
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  min="1920-01-01"
                  className="w-full pl-10 pr-4 py-3.5 bg-slate-900/70 border border-slate-700 rounded-xl text-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all [color-scheme:dark] cursor-pointer"
                  disabled={loading}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                <FaCalendarAlt className="text-[9px]" />
                Haga clic en el campo para seleccionar su fecha en el calendario.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 flex items-start gap-2.5">
                <FaExclamationCircle className="text-red-500 text-base mt-0.5 shrink-0" />
                <p className="text-red-400 text-sm leading-relaxed">{error}</p>
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-xl text-base shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Verificando...
                </>
              ) : (
                "Ingresar al Censo"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 flex flex-col items-center gap-2">
          <p className="text-slate-600 text-[10px] text-center leading-relaxed max-w-sm">
            Sistema de uso exclusivo para el personal jubilado de la UNERG. Sus datos están protegidos bajo políticas de confidencialidad institucional.
          </p>
          <div className="flex items-center gap-1 text-slate-700 text-[10px]">
            <FaShieldAlt className="text-[9px]" />
            <span>Acceso Seguro</span>
          </div>
        </div>
      </div>
    </div>
  );
}

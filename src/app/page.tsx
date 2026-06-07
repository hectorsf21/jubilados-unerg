"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaIdCard, FaCalendarAlt, FaSpinner, FaUserCheck, FaExclamationCircle } from "react-icons/fa";

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
      setError("Por favor, ingrese todos los campos requeridos.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/verificar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cedula: cedula.trim(),
          fechaNacimiento: fechaNacimiento.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al verificar los datos.");
      }

      if (data.success && data.data) {
        // Guardar datos en sessionStorage para el siguiente paso
        sessionStorage.setItem("unerg-jubilado-data", JSON.stringify(data.data));
        router.push("/formulario");
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
      {/* Elementos Decorativos de Fondo (Efecto Gradiente) */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md p-6 z-10">
        {/* Encabezado/Logo de la Universidad */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-700 to-amber-500 flex items-center justify-center shadow-xl shadow-blue-500/20 mb-4 ring-4 ring-slate-800/80">
            <span className="text-white text-3xl font-extrabold tracking-wider">U</span>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">
            Censo de Jubilados
          </h1>
          <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-semibold">
            UNERG
          </p>
          <p className="text-slate-500 text-xs mt-2 max-w-xs leading-relaxed">
            Universidad Nacional Experimental de los Llanos Centrales Rómulo Gallegos
          </p>
        </div>

        {/* Tarjeta de Verificación */}
        <div className="bg-slate-950/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white text-lg font-semibold mb-6 flex items-center gap-2">
            <FaUserCheck className="text-blue-500" /> Verificar Identidad
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input Cédula */}
            <div>
              <label htmlFor="cedula" className="block text-slate-300 text-xs font-medium uppercase tracking-wider mb-2">
                Cédula de Identidad
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <FaIdCard className="text-sm" />
                </div>
                <input
                  type="text"
                  id="cedula"
                  placeholder="Ej. 12345678"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value.replace(/\D/g, ""))}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Input Fecha Nacimiento */}
            <div>
              <label htmlFor="fechaNacimiento" className="block text-slate-300 text-xs font-medium uppercase tracking-wider mb-2">
                Fecha de Nacimiento
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <FaCalendarAlt className="text-sm" />
                </div>
                <input
                  type="text"
                  id="fechaNacimiento"
                  placeholder="DD-MM-YYYY (Ej. 15-08-1950)"
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  disabled={loading}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">
                Utilice el formato de guiones (Ej: 03-01-1933) o barras (Ej: 03/01/1933).
              </p>
            </div>

            {/* Mensaje de Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 flex items-start gap-2.5">
                <FaExclamationCircle className="text-red-500 text-base mt-0.5 shrink-0" />
                <p className="text-red-400 text-xs leading-relaxed">{error}</p>
              </div>
            )}

            {/* Botón de Envío */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium rounded-xl text-sm shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin text-sm" />
                  Verificando...
                </>
              ) : (
                "Ingresar al Censo"
              )}
            </button>
          </form>
        </div>

        {/* Nota Legal/Instrucciones de pie de página */}
        <p className="text-slate-600 text-[10px] text-center mt-8 leading-relaxed max-w-sm mx-auto">
          Este sistema es de uso exclusivo para el personal jubilado de la UNERG. Sus datos están protegidos bajo políticas de confidencialidad institucional.
        </p>
      </div>
    </div>
  );
}

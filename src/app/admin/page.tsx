"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaUsers,
  FaCheckCircle,
  FaClock,
  FaDownload,
  FaSignOutAlt,
  FaSpinner,
  FaUserTie,
  FaChalkboardTeacher,
  FaHardHat,
  FaSearch,
  FaUniversity,
  FaSync,
  FaChartBar,
} from "react-icons/fa";

interface Stats {
  total: number;
  completados: number;
  pendientes: number;
  porcentajeCompletado: number;
  porTipo: { tipoPersonal: string; _count: { _all: number } }[];
  porStatus: { statusLaboral: string; _count: { _all: number } }[];
}

interface Reciente {
  cedula: string;
  nombres: string;
  apellidos: string;
  tipoPersonal: string;
  statusLaboral: string;
  estado: string | null;
  fechaCenso: string | null;
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  color: string;
}) {
  return (
    <div
      className={`rounded-2xl p-6 border flex flex-col gap-2 ${color}`}
    >
      <div className="flex items-center justify-between">
        <div className="text-2xl opacity-80">{icon}</div>
        {sub && (
          <span className="text-xs font-bold opacity-60 bg-white/10 px-2 py-0.5 rounded-full">
            {sub}
          </span>
        )}
      </div>
      <div className="text-3xl font-extrabold mt-1">{value}</div>
      <div className="text-xs font-semibold uppercase tracking-widest opacity-70">{label}</div>
    </div>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-700"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

const TIPO_ICONS: Record<string, React.ReactNode> = {
  ADMINISTRATIVO: <FaUserTie />,
  DOCENTE: <FaChalkboardTeacher />,
  OBRERO: <FaHardHat />,
};

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recientes, setRecientes] = useState<Reciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar que el admin está autenticado
    const auth = sessionStorage.getItem("unerg-admin-auth");
    if (!auth || auth !== "true") {
      router.push("/");
      return;
    }
    fetchStats();
  }, [router]);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Error al cargar las estadísticas.");
      const data = await res.json();
      setStats(data.stats);
      setRecientes(data.recientes || []);
    } catch (e: any) {
      setError(e.message || "Error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const handleDescargar = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/admin/descargar");
      if (!res.ok) throw new Error("No se pudo generar el archivo.");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ts = new Date().toISOString().slice(0, 10);
      a.download = `censo-jubilados-unerg-${ts}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert("Error al descargar: " + (e.message || "Intente de nuevo."));
    } finally {
      setDownloading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("unerg-admin-auth");
    router.push("/");
  };

  // Filtrar recientes por búsqueda
  const filtrados = recientes.filter(
    (r) =>
      r.cedula.includes(busqueda) ||
      r.nombres.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.apellidos.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header de Administración */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-auto flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="w-full h-auto drop-shadow-md" />
          </div>
          <div>
            <h1 className="text-white text-sm font-bold leading-none">Portal Administrativo</h1>
            <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Censo UNERG</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={loading}
            title="Actualizar datos"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer disabled:opacity-50"
          >
            <FaSync className={loading ? "animate-spin text-xs" : "text-xs"} />
          </button>
          <button
            onClick={handleDescargar}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow transition-all cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {downloading ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaDownload />
            )}
            {downloading ? "Generando..." : "Descargar Excel"}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            <FaSignOutAlt className="text-xs" />
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Titulo de sección */}
        <div className="flex items-center gap-2 text-slate-400">
          <FaChartBar className="text-blue-500" />
          <span className="text-xs uppercase tracking-widest font-bold">Resumen del Censo</span>
        </div>

        {/* Estado de carga */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <FaSpinner className="text-4xl text-blue-500 animate-spin" />
            <p className="text-slate-400 text-sm">Cargando estadísticas...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {stats && !loading && (
          <>
            {/* Tarjetas de estadísticas principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<FaUsers />}
                label="Total Registrados"
                value={stats.total}
                color="bg-slate-900 border-slate-800 text-slate-100"
              />
              <StatCard
                icon={<FaCheckCircle />}
                label="Han Completado el Censo"
                value={stats.completados}
                sub={`${stats.porcentajeCompletado}%`}
                color="bg-emerald-900/30 border-emerald-700/40 text-emerald-100"
              />
              <StatCard
                icon={<FaClock />}
                label="Pendientes por Actualizar"
                value={stats.pendientes}
                sub={`${100 - stats.porcentajeCompletado}%`}
                color="bg-amber-900/30 border-amber-700/40 text-amber-100"
              />
              <div className="rounded-2xl p-6 border bg-blue-900/20 border-blue-700/30 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl text-blue-400 opacity-80"><FaChartBar /></span>
                  <span className="text-xs font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full">
                    {stats.porcentajeCompletado}% Completado
                  </span>
                </div>
                <div className="mt-1">
                  <ProgressBar percent={stats.porcentajeCompletado} />
                </div>
                <div className="text-xs font-semibold uppercase tracking-widest text-blue-300 opacity-70">
                  Avance General del Censo
                </div>
              </div>
            </div>

            {/* Desglose por Tipo de Personal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-5">
                  Censados por Tipo de Personal
                </h3>
                <div className="space-y-4">
                  {["ADMINISTRATIVO", "DOCENTE", "OBRERO"].map((tipo) => {
                    const item = stats.porTipo.find((t) => t.tipoPersonal === tipo);
                    const count = item?._count._all || 0;
                    const pct = stats.completados > 0 ? Math.round((count / stats.completados) * 100) : 0;
                    return (
                      <div key={tipo}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                            <span className="text-slate-400">{TIPO_ICONS[tipo]}</span>
                            <span className="capitalize">{tipo.charAt(0) + tipo.slice(1).toLowerCase()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-sm">{count}</span>
                            <span className="text-slate-500 text-[10px]">({pct}%)</span>
                          </div>
                        </div>
                        <ProgressBar percent={pct} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Desglose por Status Laboral */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-5">
                  Total por Status Laboral
                </h3>
                <div className="space-y-3">
                  {stats.porStatus
                    .sort((a, b) => b._count._all - a._count._all)
                    .map((item) => {
                      const pct = stats.total > 0 ? Math.round((item._count._all / stats.total) * 100) : 0;
                      const colors: Record<string, string> = {
                        JUBILADO: "bg-blue-500",
                        INCAPACITADO: "bg-purple-500",
                        SOBREVIVIENTE: "bg-amber-500",
                        ACTIVO: "bg-emerald-500",
                      };
                      return (
                        <div key={item.statusLaboral} className="flex items-center gap-3">
                          <div
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors[item.statusLaboral] || "bg-slate-500"}`}
                          />
                          <div className="flex-1 text-xs text-slate-300 capitalize font-medium">
                            {item.statusLaboral.charAt(0) + item.statusLaboral.slice(1).toLowerCase()}
                          </div>
                          <div className="font-bold text-white text-sm">{item._count._all}</div>
                          <div className="text-slate-500 text-[10px] w-8 text-right">({pct}%)</div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Tabla de Actividad Reciente */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 border-b border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FaCheckCircle className="text-emerald-500" />
                  Últimos Jubilados en Completar el Censo
                </h3>
                {/* Buscador */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <FaSearch className="text-xs" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar por cédula o nombre..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-8 pr-4 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-56"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-800/60 text-slate-400 uppercase tracking-wider">
                      <th className="px-4 py-3 text-left font-semibold">Cédula</th>
                      <th className="px-4 py-3 text-left font-semibold">Apellidos y Nombres</th>
                      <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Estado</th>
                      <th className="px-4 py-3 text-left font-semibold">Fecha Censo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filtrados.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-slate-500 py-10">
                          {busqueda
                            ? "No se encontraron coincidencias."
                            : "Aún no hay registros completados."}
                        </td>
                      </tr>
                    ) : (
                      filtrados.map((r) => (
                        <tr
                          key={r.cedula}
                          className="hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-4 py-3 font-mono text-slate-300">{r.cedula}</td>
                          <td className="px-4 py-3 font-medium text-white">
                            {r.apellidos}, {r.nombres}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {r.tipoPersonal.charAt(0) + r.tipoPersonal.slice(1).toLowerCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                r.statusLaboral === "JUBILADO"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : r.statusLaboral === "INCAPACITADO"
                                  ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              }`}
                            >
                              {r.statusLaboral.charAt(0) + r.statusLaboral.slice(1).toLowerCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400">{r.estado || "N/D"}</td>
                          <td className="px-4 py-3 text-slate-400">
                            {r.fechaCenso
                              ? new Date(r.fechaCenso).toLocaleDateString("es-VE", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  timeZone: "America/Caracas",
                                })
                              : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {recientes.length > 0 && (
                <div className="px-5 py-3 border-t border-slate-800 text-[10px] text-slate-600">
                  Mostrando los últimos {recientes.length} registros actualizados.
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

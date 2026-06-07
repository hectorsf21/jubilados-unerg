"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBriefcase,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaLock,
  FaPrint,
  FaArrowLeft,
  FaArrowRight,
  FaSignOutAlt,
  FaSpinner,
  FaExclamationCircle,
} from "react-icons/fa";

interface JubiladoData {
  cedula: string;
  nombres: string;
  apellidos: string;
  sexo: string;
  fechaNacimiento: string;
  email: string | null;
  telefonoCelular: string | null;
  telefonoResidencial: string | null;
  direccion: string | null;
  pais: string;
  estado: string | null;
  municipio: string | null;
  parroquia: string | null;
  tipoPersonal: string;
  fechaIngreso: string | null;
  fechaJubilacion: string | null;
  tiempoServicio: number | null;
  dependencia: string | null;
  statusLaboral: string;
  censoCompletado: boolean;
  fechaCenso: string | null;
}

export default function FormularioCenso() {
  const router = useRouter();
  const [jubilado, setJubilado] = useState<JubiladoData | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<JubiladoData | null>(null);

  // Campos del formulario
  const [email, setEmail] = useState("");
  const [telefonoCelular, setTelefonoCelular] = useState("");
  const [telefonoResidencial, setTelefonoResidencial] = useState("");
  const [direccion, setDireccion] = useState("");
  const [pais, setPais] = useState("Venezuela");
  const [estado, setEstado] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [parroquia, setParroquia] = useState("");
  const [tipoPersonal, setTipoPersonal] = useState("ADMINISTRATIVO");
  const [tiempoServicio, setTiempoServicio] = useState("");
  const [dependencia, setDependencia] = useState("");
  const [statusLaboral, setStatusLaboral] = useState("JUBILADO");

  useEffect(() => {
    // Recuperar los datos guardados en sessionStorage al cargar
    const stored = sessionStorage.getItem("unerg-jubilado-data");
    if (!stored) {
      router.push("/");
      return;
    }

    try {
      const parsed: JubiladoData = JSON.parse(stored);
      setJubilado(parsed);

      // Prellenar campos
      setEmail(parsed.email || "");
      setTelefonoCelular(parsed.telefonoCelular || "");
      setTelefonoResidencial(parsed.telefonoResidencial || "");
      setDireccion(parsed.direccion || "");
      setPais(parsed.pais || "Venezuela");
      setEstado(parsed.estado || "");
      setMunicipio(parsed.municipio || "");
      setParroquia(parsed.parroquia || "");
      setTipoPersonal(parsed.tipoPersonal || "ADMINISTRATIVO");
      setTiempoServicio(parsed.tiempoServicio ? String(parsed.tiempoServicio) : "");
      setDependencia(parsed.dependencia || "");
      setStatusLaboral(parsed.statusLaboral || "JUBILADO");

      if (parsed.censoCompletado) {
        // Si ya completó el censo, ir directamente a pantalla de éxito
        setSubmittedData(parsed);
        setSuccess(true);
      }
    } catch (e) {
      console.error(e);
      router.push("/");
    }
  }, [router]);

  if (!jubilado) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <FaSpinner className="animate-spin text-4xl text-blue-500" />
          <p className="text-slate-400 text-sm">Cargando datos...</p>
        </div>
      </div>
    );
  }

  // Calcular edad
  const getEdad = () => {
    if (!jubilado.fechaNacimiento) return "N/D";
    const str = jubilado.fechaNacimiento.trim();
    const match = str.match(/\b(19\d\d|20\d\d)\b/);
    if (match) {
      const birthYear = parseInt(match[1], 10);
      const currentYear = new Date().getFullYear();
      return currentYear - birthYear;
    }
    return "N/D";
  };

  const handleLogout = () => {
    sessionStorage.removeItem("unerg-jubilado-data");
    router.push("/");
  };

  const validateStep = (currentStep: number) => {
    setError(null);
    if (currentStep === 1) {
      if (!email.trim()) {
        setError("El correo electrónico es obligatorio.");
        return false;
      }
      if (!/\S+@\S+\.\S+/.test(email)) {
        setError("Por favor, ingrese un correo electrónico válido.");
        return false;
      }
      if (!telefonoCelular.trim()) {
        setError("El teléfono celular es obligatorio.");
        return false;
      }
    } else if (currentStep === 2) {
      if (!tipoPersonal) {
        setError("El tipo de personal es obligatorio.");
        return false;
      }
      if (!statusLaboral) {
        setError("El estatus laboral es obligatorio.");
        return false;
      }
      if (!tiempoServicio || isNaN(Number(tiempoServicio)) || Number(tiempoServicio) < 0) {
        setError("Ingrese un tiempo de servicio válido (número mayor o igual a 0).");
        return false;
      }
    } else if (currentStep === 3) {
      if (!pais.trim()) {
        setError("El país es obligatorio.");
        return false;
      }
      if (!estado.trim()) {
        setError("El estado es obligatorio.");
        return false;
      }
      if (!municipio.trim()) {
        setError("El municipio es obligatorio.");
        return false;
      }
      if (!parroquia.trim()) {
        setError("La parroquia es obligatoria.");
        return false;
      }
      if (!direccion.trim()) {
        setError("La dirección de habitación detallada es obligatoria.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setError(null);
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateStep(3)) return;

    setLoading(true);

    try {
      const response = await fetch("/api/censo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cedula: jubilado.cedula,
          nombres: jubilado.nombres,
          apellidos: jubilado.apellidos,
          sexo: jubilado.sexo,
          fechaNacimiento: jubilado.fechaNacimiento,
          email: email.trim(),
          telefonoCelular: telefonoCelular.trim(),
          telefonoResidencial: telefonoResidencial.trim() || null,
          direccion: direccion.trim(),
          pais: pais.trim(),
          estado: estado.trim(),
          municipio: municipio.trim(),
          parroquia: parroquia.trim(),
          tipoPersonal,
          tiempoServicio: parseInt(tiempoServicio, 10),
          dependencia: dependencia.trim() || null,
          statusLaboral,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al procesar la solicitud.");
      }

      if (data.success && data.data) {
        // Actualizar sessionStorage con la nueva información cargada
        sessionStorage.setItem("unerg-jubilado-data", JSON.stringify(data.data));
        setSubmittedData(data.data);
        setSuccess(true);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocurrió un error al guardar el censo.");
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de éxito con el comprobante imprimible
  if (success) {
    const data = submittedData || jubilado;
    return (
      <div className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 font-sans flex flex-col items-center">
        {/* Recibo Imprimible */}
        <div id="receipt-print-area" className="w-full max-w-2xl bg-white text-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-200 print:shadow-none print:border-none print:p-0 print:my-0">
          
          {/* Encabezado del Recibo */}
          <div className="flex flex-col items-center pb-6 border-b-2 border-dashed border-slate-200 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-700 flex items-center justify-center shadow-md mb-3 print:bg-blue-700 print:text-white">
              <span className="text-white text-2xl font-bold">U</span>
            </div>
            <h1 className="text-xl font-extrabold text-blue-900">UNIVERSIDAD RÓMULO GALLEGOS</h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-0.5">Dirección de Recursos Humanos</p>
            <h2 className="text-lg font-bold text-slate-700 mt-4 px-4 py-1 bg-slate-100 rounded-full print:bg-slate-100 print:text-slate-800">
              COMPROBANTE DE CENSO
            </h2>
            <p className="text-xs text-slate-400 mt-2">
              Fecha de Registro: {data.fechaCenso ? new Date(data.fechaCenso).toLocaleString("es-VE", { timeZone: "America/Caracas" }) : new Date().toLocaleString()}
            </p>
          </div>

          {/* Estado de Éxito para pantalla */}
          <div className="my-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-800 print:hidden">
            <FaCheckCircle className="text-emerald-500 text-2xl shrink-0" />
            <div>
              <h3 className="font-semibold text-sm">¡Censo Completado Exitosamente!</h3>
              <p className="text-xs text-emerald-700 mt-0.5">Sus datos han sido actualizados en la base de datos institucional.</p>
            </div>
          </div>

          {/* Datos del Comprobante */}
          <div className="space-y-6 mt-6 text-sm">
            {/* Sección 1: Datos Personales */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-slate-100 pb-1.5 mb-3">
                1. Datos Personales
              </h3>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Nombres y Apellidos</span>
                  <span className="font-semibold text-slate-700">{data.nombres} {data.apellidos}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Cédula de Identidad</span>
                  <span className="font-semibold text-slate-700">{data.cedula}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Fecha de Nacimiento</span>
                  <span className="font-semibold text-slate-700">{data.fechaNacimiento}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Sexo</span>
                  <span className="font-semibold text-slate-700">{data.sexo === "M" ? "Masculino" : "Femenino"}</span>
                </div>
              </div>
            </div>

            {/* Sección 2: Datos Laborales */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-slate-100 pb-1.5 mb-3">
                2. Información Laboral y de Servicio
              </h3>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Tipo de Personal</span>
                  <span className="font-semibold text-slate-700 capitalize">{data.tipoPersonal.toLowerCase()}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Estatus Laboral</span>
                  <span className="font-semibold text-slate-700 capitalize">{data.statusLaboral.toLowerCase()}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Años de Servicio</span>
                  <span className="font-semibold text-slate-700">{data.tiempoServicio !== null ? `${data.tiempoServicio} años` : "No especificado"}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Dependencia / Ubicación</span>
                  <span className="font-semibold text-slate-700">{data.dependencia || "No especificada"}</span>
                </div>
              </div>
            </div>

            {/* Sección 3: Datos de Contacto */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-slate-100 pb-1.5 mb-3">
                3. Información de Contacto y Dirección
              </h3>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-3">
                <div className="col-span-2">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Correo Electrónico</span>
                  <span className="font-semibold text-slate-700">{data.email}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Teléfono Celular</span>
                  <span className="font-semibold text-slate-700">{data.telefonoCelular}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Teléfono Residencial</span>
                  <span className="font-semibold text-slate-700">{data.telefonoResidencial || "N/A"}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Ubicación (País, Estado, Municipio, Parroquia)</span>
                  <span className="font-semibold text-slate-700">{data.pais}, Edo. {data.estado}, Mun. {data.municipio}, Parr. {data.parroquia}</span>
                </div>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Dirección de Habitación Detallada</span>
                <span className="font-semibold text-slate-700 leading-relaxed block bg-slate-50 p-2.5 rounded border border-slate-100 mt-1 print:bg-transparent print:border-none print:p-0">
                  {data.direccion}
                </span>
              </div>
            </div>
          </div>

          {/* Firma/Fondo del Recibo */}
          <div className="mt-8 pt-8 border-t border-slate-200 text-center flex flex-col items-center">
            <p className="text-[10px] text-slate-400 max-w-md">
              Este comprobante es constancia digital de haber participado en el censo nacional de jubilados de la UNERG. Conserve una copia física o PDF para trámites administrativos.
            </p>
            <div className="mt-4 text-xs font-bold text-blue-900 print:hidden">
              UNERG - Dirección de Tecnología y Sistemas
            </div>
          </div>
        </div>

        {/* Botones de acción de pantalla */}
        <div className="mt-8 flex gap-4 print:hidden">
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <FaPrint /> Imprimir Comprobante
          </button>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-sm border border-slate-700 transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <FaSignOutAlt /> Salir del Sistema
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 font-sans flex flex-col items-center">
      {/* Elementos Decorativos */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[100px] pointer-events-none"></div>

      {/* Navegación Superior */}
      <div className="w-full max-w-3xl flex items-center justify-between mb-8 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-700 to-amber-500 flex items-center justify-center shadow-md ring-2 ring-slate-800">
            <span className="text-white text-lg font-bold">U</span>
          </div>
          <div>
            <h1 className="text-white text-base font-bold">Censo UNERG</h1>
            <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold">Jubilados</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="px-3 py-1.5 bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-800 hover:border-slate-700 transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
        >
          <FaSignOutAlt className="text-xs" /> Salir
        </button>
      </div>

      {/* Contenedor Principal */}
      <div className="w-full max-w-3xl bg-slate-950/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl p-6 sm:p-8 z-10">
        
        {/* Pasos / Indicador de Progreso */}
        <div className="mb-8 border-b border-slate-800 pb-5">
          <div className="flex justify-between items-center max-w-md mx-auto">
            <div className="flex flex-col items-center">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${step >= 1 ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-slate-800 text-slate-400"}`}>1</span>
              <span className={`text-[10px] mt-1.5 font-medium tracking-wide uppercase ${step >= 1 ? "text-blue-500" : "text-slate-500"}`}>Contacto</span>
            </div>
            <div className={`flex-1 h-0.5 mx-2 rounded transition-all duration-300 ${step >= 2 ? "bg-blue-600" : "bg-slate-800"}`}></div>
            <div className="flex flex-col items-center">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${step >= 2 ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-slate-800 text-slate-400"}`}>2</span>
              <span className={`text-[10px] mt-1.5 font-medium tracking-wide uppercase ${step >= 2 ? "text-blue-500" : "text-slate-500"}`}>Laboral</span>
            </div>
            <div className={`flex-1 h-0.5 mx-2 rounded transition-all duration-300 ${step >= 3 ? "bg-blue-600" : "bg-slate-800"}`}></div>
            <div className="flex flex-col items-center">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${step >= 3 ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-slate-800 text-slate-400"}`}>3</span>
              <span className={`text-[10px] mt-1.5 font-medium tracking-wide uppercase ${step >= 3 ? "text-blue-500" : "text-slate-500"}`}>Dirección</span>
            </div>
          </div>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 flex items-start gap-2.5 mb-6">
            <FaExclamationCircle className="text-red-500 text-base mt-0.5 shrink-0" />
            <p className="text-red-400 text-xs leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* PASO 1: DATOS GENERALES Y CONTACTO */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Sección Fija (Datos de la base de datos) */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <FaLock className="text-slate-500 text-[10px]" /> Información de Identidad (Bloqueado)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/50">
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Nombres y Apellidos</label>
                    <div className="text-sm font-semibold text-slate-200">{jubilado.nombres} {jubilado.apellidos}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Cédula de Identidad</label>
                    <div className="text-sm font-semibold text-slate-200">{jubilado.cedula}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Fecha de Nacimiento</label>
                    <div className="text-sm font-semibold text-slate-200">{jubilado.fechaNacimiento}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Edad Estimada / Sexo</label>
                    <div className="text-sm font-semibold text-slate-200">
                      {getEdad()} años / {jubilado.sexo === "M" ? "Masculino" : "Femenino"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección de Contacto */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-4 flex items-center gap-1.5">
                  <FaUser className="text-sm" /> Información de Contacto
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Correo */}
                  <div className="sm:col-span-2">
                    <label htmlFor="email" className="block text-slate-300 text-xs font-medium uppercase tracking-wider mb-2">
                      Correo Electrónico <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <FaEnvelope className="text-xs" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        placeholder="Ej. correo@ejemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                      />
                    </div>
                  </div>

                  {/* Teléfono Celular */}
                  <div>
                    <label htmlFor="celular" className="block text-slate-300 text-xs font-medium uppercase tracking-wider mb-2">
                      Teléfono Celular <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <FaPhone className="text-xs" />
                      </div>
                      <input
                        type="tel"
                        id="celular"
                        placeholder="Ej. 04141234567"
                        value={telefonoCelular}
                        onChange={(e) => setTelefonoCelular(e.target.value.replace(/\D/g, ""))}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                      />
                    </div>
                  </div>

                  {/* Teléfono Residencial */}
                  <div>
                    <label htmlFor="residencial" className="block text-slate-300 text-xs font-medium uppercase tracking-wider mb-2">
                      Teléfono Residencial
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <FaPhone className="text-xs" />
                      </div>
                      <input
                        type="tel"
                        id="residencial"
                        placeholder="Ej. 02461234567"
                        value={telefonoResidencial}
                        onChange={(e) => setTelefonoResidencial(e.target.value.replace(/\D/g, ""))}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: DATOS LABORALES */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-4 flex items-center gap-1.5">
                  <FaBriefcase className="text-sm" /> Información Laboral en la UNERG
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tipo de Personal */}
                  <div>
                    <label htmlFor="tipoPersonal" className="block text-slate-300 text-xs font-medium uppercase tracking-wider mb-2">
                      Tipo de Personal <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="tipoPersonal"
                      value={tipoPersonal}
                      onChange={(e) => setTipoPersonal(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option className="bg-slate-950" value="ADMINISTRATIVO">Administrativo</option>
                      <option className="bg-slate-950" value="DOCENTE">Docente</option>
                      <option className="bg-slate-950" value="OBRERO">Obrero</option>
                    </select>
                  </div>

                  {/* Estatus Laboral */}
                  <div>
                    <label htmlFor="statusLaboral" className="block text-slate-300 text-xs font-medium uppercase tracking-wider mb-2">
                      Estatus Laboral <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="statusLaboral"
                      value={statusLaboral}
                      onChange={(e) => setStatusLaboral(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option className="bg-slate-950" value="JUBILADO">Jubilado</option>
                      <option className="bg-slate-950" value="INCAPACITADO">Incapacitado</option>
                      <option className="bg-slate-950" value="ACTIVO">Activo</option>
                      <option className="bg-slate-950" value="SOBREVIVIENTE">Sobreviviente (Pensionado)</option>
                    </select>
                  </div>

                  {/* Tiempo de Servicio */}
                  <div>
                    <label htmlFor="tiempoServicio" className="block text-slate-300 text-xs font-medium uppercase tracking-wider mb-2">
                      Años de Servicio en la UNERG <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="tiempoServicio"
                      min="0"
                      placeholder="Ej. 18"
                      value={tiempoServicio}
                      onChange={(e) => setTiempoServicio(e.target.value.replace(/\D/g, ""))}
                      className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>

                  {/* Dependencia */}
                  <div>
                    <label htmlFor="dependencia" className="block text-slate-300 text-xs font-medium uppercase tracking-wider mb-2">
                      Dependencia o Ubicación Física de la cual se Jubiló
                    </label>
                    <input
                      type="text"
                      id="dependencia"
                      placeholder="Ej. Decanato de Medicina"
                      value={dependencia}
                      onChange={(e) => setDependencia(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASO 3: DIRECCIÓN DE HABITACIÓN */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-4 flex items-center gap-1.5">
                  <FaMapMarkerAlt className="text-sm" /> Dirección de Habitación Actual
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* País */}
                  <div>
                    <label htmlFor="pais" className="block text-slate-300 text-xs font-medium uppercase tracking-wider mb-2">
                      País <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="pais"
                      placeholder="Ej. Venezuela"
                      value={pais}
                      onChange={(e) => setPais(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>

                  {/* Estado */}
                  <div>
                    <label htmlFor="estado" className="block text-slate-300 text-xs font-medium uppercase tracking-wider mb-2">
                      Estado <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="estado"
                      placeholder="Ej. Guárico"
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>

                  {/* Municipio */}
                  <div>
                    <label htmlFor="municipio" className="block text-slate-300 text-xs font-medium uppercase tracking-wider mb-2">
                      Municipio <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="municipio"
                      placeholder="Ej. Roscio"
                      value={municipio}
                      onChange={(e) => setMunicipio(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>

                  {/* Parroquia */}
                  <div>
                    <label htmlFor="parroquia" className="block text-slate-300 text-xs font-medium uppercase tracking-wider mb-2">
                      Parroquia <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="parroquia"
                      placeholder="Ej. San Juan de los Morros"
                      value={parroquia}
                      onChange={(e) => setParroquia(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>

                  {/* Dirección Detallada */}
                  <div className="sm:col-span-2">
                    <label htmlFor="direccion" className="block text-slate-300 text-xs font-medium uppercase tracking-wider mb-2">
                      Dirección de Habitación Completa / Detallada <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="direccion"
                      rows={3}
                      placeholder="Indique sector, calle, número de casa/apto y puntos de referencia"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botones de Navegación del Formulario */}
          <div className="flex items-center justify-between border-t border-slate-850 pt-5 mt-8">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-750 flex items-center gap-1.5 transition-all duration-150 cursor-pointer disabled:opacity-50"
              >
                <FaArrowLeft className="text-[10px]" /> Anterior
              </button>
            ) : (
              <div></div> // Espaciador
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-500/10 transition-all duration-150 cursor-pointer active:scale-95"
              >
                Siguiente <FaArrowRight className="text-[10px]" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 transition-all duration-150 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    Completar Censo <FaCheckCircle />
                  </>
                )}
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}

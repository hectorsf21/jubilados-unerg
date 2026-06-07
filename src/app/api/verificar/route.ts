import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Función para normalizar fechas y permitir comparaciones flexibles
function normalizeDate(dateStr: string): string {
  let cleaned = dateStr.trim().replace(/\//g, "-");
  
  const parts = cleaned.split("-");
  if (parts.length === 3) {
    const day = parts[0].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    let year = parts[2];
    if (year.length === 2) {
      const currentYearShort = new Date().getFullYear() % 100;
      const yr = parseInt(year, 10);
      year = yr > currentYearShort ? `19${year}` : `20${year}`;
    }
    return `${day}-${month}-${year}`;
  }
  return cleaned;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cedula, fechaNacimiento } = body;

    if (!cedula || !fechaNacimiento) {
      return NextResponse.json(
        { error: "La cédula y la fecha de nacimiento son obligatorias." },
        { status: 400 }
      );
    }

    // Limpiar cédula ingresada (eliminar puntos, espacios, etc.)
    const cleanCedula = String(cedula).replace(/\D/g, "").trim();

    if (!cleanCedula) {
      return NextResponse.json(
        { error: "Cédula inválida." },
        { status: 400 }
      );
    }

    // Buscar el jubilado en la base de datos
    const jubilado = await prisma.jubilado.findUnique({
      where: { cedula: cleanCedula },
    });

    if (!jubilado) {
      return NextResponse.json(
        { error: "No se encontró ningún jubilado con esta cédula en nuestros registros." },
        { status: 404 }
      );
    }

    // Comparar fecha de nacimiento normalizada
    const enteredDateNormalized = normalizeDate(fechaNacimiento);
    const dbDateNormalized = normalizeDate(jubilado.fechaNacimiento);

    if (enteredDateNormalized !== dbDateNormalized) {
      return NextResponse.json(
        { error: "La fecha de nacimiento no coincide con la registrada para esta cédula." },
        { status: 401 }
      );
    }

    // Retornar los datos del jubilado
    return NextResponse.json({
      success: true,
      data: jubilado,
    });

  } catch (error: any) {
    console.error("Error en API verificar:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al verificar los datos." },
      { status: 500 }
    );
  }
}

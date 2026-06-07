import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Normaliza fechas para poder comparar distintos formatos
function normalizeDate(dateStr: string): string {
  let cleaned = dateStr.trim().replace(/\//g, "-");
  const parts = cleaned.split("-");
  if (parts.length === 3) {
    // Si viene en formato YYYY-MM-DD (desde el input date), convertir a DD-MM-YYYY
    if (parts[0].length === 4) {
      return `${parts[2].padStart(2, "0")}-${parts[1].padStart(2, "0")}-${parts[0]}`;
    }
    // Si viene en formato DD-MM-YYYY, normalizar padding
    return `${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}-${parts[2]}`;
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

    const cleanCedula = String(cedula).replace(/\D/g, "").trim();

    if (!cleanCedula) {
      return NextResponse.json({ error: "Cédula inválida." }, { status: 400 });
    }

    // --- Verificar si es Administrador ---
    const adminCedula = process.env.ADMIN_CEDULA || "";
    const adminFecha = process.env.ADMIN_FECHA_NACIMIENTO || "";

    if (cleanCedula === adminCedula.replace(/\D/g, "")) {
      // Normalizar la fecha ingresada y la del admin para comparar
      const enteredNorm = normalizeDate(fechaNacimiento);
      const adminNorm = normalizeDate(adminFecha);

      if (enteredNorm === adminNorm) {
        return NextResponse.json({ success: true, isAdmin: true });
      } else {
        return NextResponse.json(
          { error: "La fecha de nacimiento no coincide." },
          { status: 401 }
        );
      }
    }

    // --- Verificar si es Jubilado ---
    const jubilado = await prisma.jubilado.findUnique({
      where: { cedula: cleanCedula },
    });

    if (!jubilado) {
      return NextResponse.json(
        {
          error:
            "No se encontró ningún jubilado con esta cédula en nuestros registros. Por favor, verifique el número ingresado.",
        },
        { status: 404 }
      );
    }

    // Comparar fecha de nacimiento normalizada
    const enteredDateNorm = normalizeDate(fechaNacimiento);
    const dbDateNorm = normalizeDate(jubilado.fechaNacimiento);

    if (enteredDateNorm !== dbDateNorm) {
      return NextResponse.json(
        {
          error:
            "La fecha de nacimiento no coincide con la registrada para esta cédula. Verifique el día, mes y año.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, isAdmin: false, data: jubilado });
  } catch (error: any) {
    console.error("Error en API verificar:", error);
    return NextResponse.json(
      { error: "Ocurrió un error interno. Intente de nuevo." },
      { status: 500 }
    );
  }
}

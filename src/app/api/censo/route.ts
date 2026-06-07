import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      cedula,
      nombres,
      apellidos,
      sexo,
      fechaNacimiento,
      email,
      telefonoCelular,
      telefonoResidencial,
      direccion,
      pais,
      estado,
      municipio,
      parroquia,
      tipoPersonal,
      tiempoServicio,
      dependencia,
      statusLaboral,
    } = body;

    // Validación básica de campos requeridos
    if (!cedula) {
      return NextResponse.json(
        { error: "La cédula es requerida." },
        { status: 400 }
      );
    }

    if (!email || !telefonoCelular || !direccion || !estado || !municipio || !parroquia || !statusLaboral || !tipoPersonal) {
      return NextResponse.json(
        { error: "Por favor, complete todos los campos obligatorios del censo." },
        { status: 400 }
      );
    }

    // Verificar que el jubilado exista
    const cleanCedula = String(cedula).replace(/\D/g, "").trim();
    const jubiladoExistente = await prisma.jubilado.findUnique({
      where: { cedula: cleanCedula },
    });

    if (!jubiladoExistente) {
      return NextResponse.json(
        { error: "El jubilado no está registrado en el sistema." },
        { status: 404 }
      );
    }

    // Actualizar los datos del jubilado
    const updatedJubilado = await prisma.jubilado.update({
      where: { cedula: cleanCedula },
      data: {
        nombres: nombres || jubiladoExistente.nombres,
        apellidos: apellidos || jubiladoExistente.apellidos,
        sexo: sexo || jubiladoExistente.sexo,
        fechaNacimiento: fechaNacimiento || jubiladoExistente.fechaNacimiento,
        email,
        telefonoCelular,
        telefonoResidencial: telefonoResidencial || null,
        direccion,
        pais: pais || "Venezuela",
        estado,
        municipio,
        parroquia,
        tipoPersonal,
        tiempoServicio: tiempoServicio ? parseInt(String(tiempoServicio), 10) : null,
        dependencia: dependencia || null,
        statusLaboral,
        censoCompletado: true,
        fechaCenso: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Censo completado con éxito.",
      data: updatedJubilado,
    });

  } catch (error: any) {
    console.error("Error en API censo:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al guardar los datos del censo." },
      { status: 500 }
    );
  }
}

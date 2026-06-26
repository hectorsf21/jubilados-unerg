import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    const jubilados = await prisma.jubilado.findMany({
      where: { censoCompletado: true },
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    });

    // Construir las filas del Excel
    const rows = jubilados.map((j) => ({
      "Cédula": j.cedula,
      "Apellidos": j.apellidos,
      "Nombres": j.nombres,
      "Sexo": j.sexo === "M" ? "Masculino" : "Femenino",
      "Fecha Nacimiento": j.fechaNacimiento,
      "Correo": j.email || "",
      "Teléfono Celular": j.telefonoCelular || "",
      "Teléfono Residencial": j.telefonoResidencial || "",
      "País": j.pais,
      "Estado": j.estado || "",
      "Municipio": j.municipio || "",
      "Parroquia": j.parroquia || "",
      "Dirección": j.direccion || "",
      "Tipo Personal": j.tipoPersonal,
      "Años de Servicio": j.tiempoServicio ?? "",
      "Fecha Ingreso": j.fechaIngreso || "",
      "Fecha Jubilación": j.fechaJubilacion || "",
      "Dependencia": j.dependencia || "",
      "Status Laboral": j.statusLaboral,
      "Fecha del Censo": j.fechaCenso
        ? new Date(j.fechaCenso).toLocaleDateString("es-VE", { timeZone: "America/Caracas" })
        : "",
    }));

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No hay registros completados para descargar." },
        { status: 404 }
      );
    }

    // Crear el workbook de Excel
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Ajustar anchos de columna automáticamente
    const colWidths = Object.keys(rows[0] || {}).map((key) => ({
      wch: Math.max(
        key.length,
        ...rows.map((r) => String((r as any)[key] || "").length)
      ) + 2,
    }));
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Censo Completados");

    // Escribir en buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Retornar como archivo descargable
    const timestamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="censo-unerg-actualizados-${timestamp}.xlsx"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error: any) {
    console.error("Error al generar Excel de completados:", error);
    return NextResponse.json(
      { error: "Error interno al generar el archivo Excel." },
      { status: 500 }
    );
  }
}

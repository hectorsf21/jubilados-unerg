import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const total = await prisma.jubilado.count();
    const completados = await prisma.jubilado.count({ where: { censoCompletado: true } });
    const pendientes = total - completados;

    // Desglose por tipo de personal (solo los que completaron el censo)
    const porTipo = await prisma.jubilado.groupBy({
      by: ["tipoPersonal"],
      _count: { _all: true },
      where: { censoCompletado: true },
    });

    // Desglose por status laboral (sobre el total)
    const porStatus = await prisma.jubilado.groupBy({
      by: ["statusLaboral"],
      _count: { _all: true },
    });

    // Últimos 10 registros actualizados (para la tabla de actividad)
    const recientes = await prisma.jubilado.findMany({
      where: { censoCompletado: true },
      orderBy: { fechaCenso: "desc" },
      take: 10,
      select: {
        cedula: true,
        nombres: true,
        apellidos: true,
        tipoPersonal: true,
        statusLaboral: true,
        estado: true,
        fechaCenso: true,
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        total,
        completados,
        pendientes,
        porcentajeCompletado: total > 0 ? Math.round((completados / total) * 100) : 0,
        porTipo,
        porStatus,
      },
      recientes,
    });
  } catch (error: any) {
    console.error("Error en API stats:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas." },
      { status: 500 }
    );
  }
}

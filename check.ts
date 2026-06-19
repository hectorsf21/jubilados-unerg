import { prisma } from "./src/lib/db";
import * as XLSX from "xlsx";

async function main() {
  const cedula = "15081719";
  
  // Revisar la DB
  const inDb = await prisma.jubilado.findUnique({ where: { cedula } });
  console.log("En Base de Datos Prisma:", inDb ? "SÍ ENCONTRADO" : "NO ENCONTRADO");
  
  // Revisar el Excel
  const workbook = XLSX.readFile("./personal.xls");
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  const inExcel = data.find((row: any) => {
    // Buscar en todos los valores de la fila
    return Object.values(row).some(v => String(v).includes(cedula));
  });
  
  console.log("En Archivo Excel:", inExcel ? "SÍ ENCONTRADO" : "NO ENCONTRADO");
  if (inExcel) {
    console.log("Fila Excel:", inExcel);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

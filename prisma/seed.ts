import { prisma } from "../src/lib/db";
import * as xlsx from "xlsx";
import * as path from "path";

function getYearFromDateVal(val: any): number | null {
  if (!val) return null;
  const str = String(val).trim();
  const match = str.match(/\b(19\d\d|20\d\d)\b/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

async function main() {
  console.log("Iniciando la carga de datos desde el archivo Excel...");

  const excelPath = path.resolve(process.cwd(), "personal.xls");
  
  // Leer el archivo Excel
  const workbook = xlsx.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convertir a JSON, omitiendo el encabezado y obteniendo filas como arrays
  const rawData: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  if (rawData.length < 2) {
    console.error("El archivo Excel no tiene suficientes filas.");
    return;
  }

  // Las cabeceras están en rawData[0]
  // Los datos comienzan en rawData[1]
  const headers = rawData[0];
  console.log("Columnas detectadas en el Excel:", headers);
  console.log(`Total de filas leídas (incluyendo cabecera): ${rawData.length}`);

  const processedCedulas = new Set<string>();
  let insertedCount = 0;
  let skippedCount = 0;
  let duplicateCount = 0;

  // Limpiar la base de datos antes de sembrar (opcional, pero recomendado)
  console.log("Limpiando registros previos de jubilados...");
  await prisma.jubilado.deleteMany({});

  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length === 0) continue;

    // Obtener la cédula y limpiarla
    const rawCedula = row[2]; // Columna 2: CEDULA
    if (rawCedula === undefined || rawCedula === null || String(rawCedula).trim() === "") {
      skippedCount++;
      continue;
    }

    // Limpiar cédula: eliminar decimales .0 si vienen como números
    const cedula = String(Math.round(Number(rawCedula))).trim();

    if (processedCedulas.has(cedula)) {
      // Si ya procesamos esta cédula, omitimos para evitar violación de llave única.
      // Podríamos preferir la fila que tenga estatus de Jubilado sobre Sobreviviente.
      duplicateCount++;
      continue;
    }

    // Datos generales
    const apellidos = String(row[3] || "").trim(); // Columna 3
    const nombres = String(row[4] || "").trim(); // Columna 4
    const sexo = String(row[5] || "M").trim().toUpperCase(); // Columna 5
    const fechaNacimiento = String(row[6] || "").trim(); // Columna 6
    const email = row[11] ? String(row[11]).trim() : null; // Columna 11: CORREO_ELECTRONICO
    const tlfCelular = row[8] ? String(row[8]).trim() : null; // Columna 8: TLF CELULAR
    const tlfResidencial = row[9] ? String(row[9]).trim() : null; // Columna 9: TLF RESIDENCIAL
    const direccion = row[10] ? String(row[10]).trim() : null; // Columna 10: DIRECCION

    // Personal y servicio
    const tipoNomina = String(row[0] || "").toUpperCase(); // Columna 0: TIPO DE NOMINA
    let tipoPersonal = "ADMINISTRATIVO";
    if (tipoNomina.includes("OBRERO")) {
      tipoPersonal = "OBRERO";
    } else if (tipoNomina.includes("DOCENTE")) {
      tipoPersonal = "DOCENTE";
    }

    const fechaIngreso = row[16] ? String(row[16]).trim() : null; // Columna 16: FEC INGRESO
    const fechaJubilacion = row[22] ? String(row[22]).trim() : null; // Columna 22: FECHA JUBILACION

    // Calcular años de servicio
    let tiempoServicio: number | null = null;
    const yearIngreso = getYearFromDateVal(fechaIngreso);
    const yearJubilacion = getYearFromDateVal(fechaJubilacion);
    if (yearIngreso && yearJubilacion) {
      tiempoServicio = yearJubilacion - yearIngreso;
      if (tiempoServicio < 0) {
        tiempoServicio = 0;
      }
    }

    // Dirección
    const estado = row[18] ? String(row[18]).trim() : null; // Columna 18: ESTADO
    const municipio = row[19] ? String(row[19]).trim() : null; // Columna 19: MUNICIPIO
    const parroquia = row[20] ? String(row[20]).trim() : null; // Columna 20: PARROQUIA

    // Status laboral y dependencia
    const estatusRaw = String(row[1] || "").toUpperCase(); // Columna 1: ESTATUS
    const cargoRaw = String(row[12] || "").toUpperCase(); // Columna 12: NOMBRE DEL CARGO
    
    let statusLaboral = "JUBILADO";
    if (estatusRaw.includes("INCAPACID") || cargoRaw.includes("INCAPACITADO")) {
      statusLaboral = "INCAPACITADO";
    } else if (estatusRaw.includes("SOBREVIV") || cargoRaw.includes("SOBREVIVIENTE")) {
      statusLaboral = "SOBREVIVIENTE";
    } else if (estatusRaw.includes("ACTIVO")) {
      statusLaboral = "ACTIVO";
    }

    const dependencia = row[17] ? String(row[17]).trim() : null; // Columna 17: UBICACION FISICA

    await prisma.jubilado.create({
      data: {
        cedula,
        nombres,
        apellidos,
        sexo,
        fechaNacimiento,
        email,
        telefonoCelular: tlfCelular,
        telefonoResidencial: tlfResidencial,
        direccion,
        estado,
        municipio,
        parroquia,
        tipoPersonal,
        fechaIngreso,
        fechaJubilacion,
        tiempoServicio,
        dependencia,
        statusLaboral,
        censoCompletado: false,
      },
    });

    processedCedulas.add(cedula);
    insertedCount++;
  }

  console.log("\nProceso de carga completado con éxito:");
  console.log(`- Registros insertados en la base de datos: ${insertedCount}`);
  console.log(`- Registros omitidos (sin cédula): ${skippedCount}`);
  console.log(`- Registros omitidos (duplicados de cédula): ${duplicateCount}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Error cargando los datos:", e);
    await prisma.$disconnect();
    process.exit(1);
  });

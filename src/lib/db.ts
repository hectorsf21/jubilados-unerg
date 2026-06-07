import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { URL } from "url";

// Cargar variables de entorno en caso de que no estén cargadas (útil para scripts externos)
if (!process.env.DATABASE_URL) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("dotenv").config();
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("La variable de entorno DATABASE_URL no está configurada.");
}

// Parsear la URL de conexión de MySQL para extraer los parámetros de mariadb
const parsedUrl = new URL(dbUrl);
const dbConfig = {
  host: parsedUrl.hostname || "localhost",
  port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : 3306,
  user: parsedUrl.username || "root",
  password: decodeURIComponent(parsedUrl.password || ""),
  database: parsedUrl.pathname.replace(/^\//, ""),
  connectionLimit: 10,
};

const adapter = new PrismaMariaDb(dbConfig);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

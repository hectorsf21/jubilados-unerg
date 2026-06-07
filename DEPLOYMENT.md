# Guía de Despliegue en VPS con CloudPanel

Esta guía describe los pasos necesarios para desplegar la aplicación del censo de jubilados en tu VPS utilizando **CloudPanel**.

---

## Requisitos Previos en VPS

1. **CloudPanel instalado** y funcionando.
2. **Base de Datos MySQL/MariaDB**: Creada desde el panel de CloudPanel (Base de datos, Usuario y Contraseña).
3. **Node.js**: Asegúrate de tener habilitado el soporte de Node.js (versión 20 o 22 recomendada) en tu sitio de CloudPanel.

---

## Paso 1: Configurar el Sitio en CloudPanel

1. Inicia sesión en tu panel de CloudPanel.
2. Ve a **Sites** > **Add Site** y selecciona **Create a Node.js Site**.
3. Completa los datos:
   - **Domain Name**: El dominio o subdominio que usarás (ej. `censo.unerg.edu.ve`).
   - **Node.js Version**: Selecciona **v22.x** (o la versión que uses).
   - **App Port**: Define un puerto libre para tu aplicación, por ejemplo, `3000`.
   - **App Project Root**: Deja el valor por defecto (ej. `/home/cloudpanel/htdocs/tu-dominio.com`).

---

## Paso 2: Subir el Código del Proyecto

Puedes subir el código mediante SFTP o Git:

### Archivos a subir (Subir todo EXCEPTO):
*   `node_modules/` (se generará de nuevo en la VPS)
*   `.next/` (se compilará de nuevo en la VPS)
*   `.env` (se creará una versión de producción directamente en la VPS)

> [!IMPORTANT]
> El archivo `personal.xls` **DEBE** subirse junto con el proyecto en el directorio raíz de la VPS para poder sembrar la base de datos inicial.

---

## Paso 3: Configurar Variables de Entorno en la VPS

Crea un archivo `.env` en la raíz del proyecto en la VPS con los datos de la base de datos de producción que creaste en CloudPanel:

```env
# Reemplaza con los datos reales creados en CloudPanel
DATABASE_URL="mysql://usuario_db:contraseña_db@127.0.0.1:3306/nombre_db"
PORT=3000
NODE_ENV=production
```

---

## Paso 4: Instalación y Preparación (Vía SSH)

Conéctate a tu VPS mediante SSH y entra en el directorio de tu proyecto:

```bash
# Cambiar al directorio del dominio
cd /home/cloudpanel/htdocs/tu-dominio.com
```

### 1. Instalar dependencias
Instala los paquetes en producción:
```bash
npm install
```

### 2. Generar el cliente Prisma
Genera los archivos del cliente de base de datos adaptado a la VPS:
```bash
npx prisma generate
```

### 3. Ejecutar Migraciones
Crea las tablas en la base de datos de producción de MySQL:
```bash
npx prisma migrate deploy
```

### 4. Cargar la data del Excel (Sembrar base de datos)
Ejecuta el script de siembra para leer `personal.xls` e insertar los registros en la base de datos de producción de la VPS:
```bash
npx prisma db seed
```
*(Deberías ver el mensaje de éxito confirmando que se insertaron más de 1000 registros).*

### 5. Compilar la aplicación Next.js
Compila el proyecto para producción:
```bash
npm run build
```

---

## Paso 5: Iniciar la Aplicación en CloudPanel

CloudPanel incluye un supervisor interno para Node.js que apunta al script de inicio configurado.

1. Ve a CloudPanel > **Sites** > selecciona tu dominio > pestaña **Node.js**.
2. Verifica que el puerto (`3000`) sea el mismo definido en tu `.env`.
3. Configura el **Entry Point** (Punto de entrada) como:
   - `npm run start` o `node_modules/next/dist/bin/next start`
4. Presiona **Restart App** (Reiniciar aplicación).

### Opción alternativa usando PM2 (Recomendado para robustez)
Si prefieres administrar el proceso manualmente mediante SSH con PM2:
1. Instala PM2 globalmente en la VPS (si no está instalado):
   ```bash
   npm install -g pm2
   ```
2. Inicia la aplicación:
   ```bash
   pm2 start npm --name "censo-unerg" -- run start -- -p 3000
   ```
3. Guarda la lista de procesos para que se inicie tras reinicios de la VPS:
   ```bash
   pm2 save
   pm2 startup
   ```

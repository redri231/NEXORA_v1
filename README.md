# NEXORA

## Ejecutar el proyecto en desarrollo

1. Configura PostgreSQL con el modelo físico vigente y asegúrate de que exista el rol `Administrador`.
2. En `server`, copia `.env.example` como `.env` y ajusta `DATABASE_URL`. Cambia `AUTH_SECRET` por un valor aleatorio de al menos 32 caracteres.
3. Si la tabla `usuario` está vacía, configura `INITIAL_ADMIN_USERNAME`, `INITIAL_ADMIN_PASSWORD` y `INITIAL_ADMIN_EMAIL` en `server/.env` y ejecuta una sola vez:

   ```bash
   cd server
   npm install
   npm run crear-admin-inicial
   ```

   El comando solo crea la cuenta cuando todavía no existe ningún usuario. Si ya tienes una cuenta activa, usa esa cuenta para ingresar.

4. Inicia el backend en una terminal:

   ```bash
   cd server
   npm run dev
   ```

5. Inicia Vite en otra terminal:

   ```bash
   cd client
   npm install
   npm run dev
   ```

El login usa el `username` y la contraseña del usuario. La sesión vence a las 8 horas. Las rutas de usuarios, CRM y reportes requieren una sesión activa; al cerrar sesión o desactivar el usuario, las solicitudes dejan de estar autorizadas. Actualmente el rol se muestra en la interfaz, pero todavía no se aplican permisos por módulo.

## Validación y contratos de API

El servidor usa Zod para validar y normalizar los cuerpos de login, usuarios y CRM, además de los IDs de ruta. Las solicitudes inválidas responden con HTTP 400 y detalles por campo. Los DTO de salida limitan las propiedades que se devuelven para usuarios, clientes, leads, oportunidades, responsables y seguimientos.

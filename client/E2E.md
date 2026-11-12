# Flujo E2E con Playwright

La prueba `e2e/crm-flow.spec.js` ejecuta Login → CRM → crear cliente → abrir detalle → cerrar sesión en Chromium. Usa la interfaz web y la API reales.

## Requisitos

- Una base PostgreSQL exclusiva para E2E con el esquema de la aplicación y una cuenta sembrada con acceso al CRM.
- Variables de entorno `E2E_DATABASE_URL`, `E2E_AUTH_SECRET` (mínimo 32 caracteres), `E2E_USERNAME` y `E2E_PASSWORD`.
- Chromium de Playwright instalado.

El servidor de pruebas exige `E2E_DATABASE_URL` explícitamente y no toma la base configurada en `server/.env`. La prueba crea un cliente con nombre y documento únicos en esa base; el registro queda allí después de la ejecución.

En PowerShell, define esas variables en la terminal de pruebas y ejecuta desde `client`:

```powershell
$env:E2E_DATABASE_URL = "postgresql://usuario:clave@localhost:5432/nexora_e2e"
$env:E2E_AUTH_SECRET = "secreto-e2e-de-32-caracteres-o-mas"
$env:E2E_USERNAME = "usuario-de-pruebas"
$env:E2E_PASSWORD = "clave-de-pruebas"
npm run test:e2e
```

Instala Chromium una sola vez con `npx playwright install chromium`. Playwright arranca el servidor E2E aislado en el puerto 3000 y Vite en el 5173; falla si esos puertos ya están ocupados para evitar conectarse por accidente a otra instancia.

El informe HTML se genera en `client/playwright-report` y los rastros/capturas fallidos en `client/test-results`.

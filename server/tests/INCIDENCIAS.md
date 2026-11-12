# Incidencias y alcance de las pruebas unitarias

## Incidencias detectadas

- Dos aserciones esperaban `id_servicio` e `id_proyecto` con valor `null` cuando esos campos se omitían. Los esquemas Zod los dejan fuera del objeto validado. Se corrigieron las expectativas; no se modificó el comportamiento de la aplicación.
- Una prueba de CRM devolvía desde el mock el objeto original, aunque el servicio entrega al modelo un objeto normalizado. Se ajustó el mock para representar la respuesta del repositorio.
- La primera ejecución de la nueva matriz HTTP no incluyó configuración en el mapa de servicios de prueba. Se agregó y las 47 pruebas de integración pasaron; la aplicación no necesitó cambios.
- No quedan incidencias conocidas en las pruebas unitarias ejecutadas en esta fase.

## Aislamiento

- Los servicios que acceden a PostgreSQL se prueban con modelos o `pool.query` simulados. No se requiere una base de datos para ejecutar las pruebas unitarias.
- Cloudinary se simula; las pruebas no suben archivos ni necesitan credenciales del servicio.
- La utilidad ExcelJS opera sobre libros en memoria.
- Las pruebas HTTP de `tests/integration` son integración y se excluyen del comando `npm run test:unit`.
- En esta fase pasaron 91 pruebas unitarias del servidor, 13 del cliente y 47 pruebas de integración del servidor.

## Alcance de integración

- Supertest ejercita la app Express real: autenticación, permisos, rutas, validadores, controladores y formato de respuesta en los módulos protegidos.
- Los servicios que consultan PostgreSQL y los proveedores externos se simulan. La suite no verifica SQL contra una base real ni credenciales o disponibilidad de Cloudinary; esas comprobaciones requieren un entorno de integración aislado.

## Cobertura pendiente fuera de esta fase

- Las pruebas del cliente cubren permisos, servicio API y contexto de autenticación. Las páginas individuales no tienen pruebas unitarias de renderizado; sus flujos completos se dejan para pruebas de componentes o interfaz.
- Las pruebas unitarias simuladas no validan consultas reales, migraciones, credenciales ni disponibilidad de PostgreSQL o Cloudinary. Eso corresponde a pruebas de integración con entornos de prueba.

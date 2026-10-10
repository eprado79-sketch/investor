# Investor

**Inteligencia inmobiliaria de remates judiciales en Chile** — plataforma para investigar, valorar y comparar oportunidades de inversión con fuentes verificables.

> **Estado actual: versión base técnica.** La interfaz, el esquema de datos, la API, la importación estructurada y el motor financiero están implementados en código. **No** están configuradas ni autorizadas las integraciones automáticas de Clasificados.cl y Mercado Libre; no existe un ranking real hasta validarlas.

## Qué queremos construir

Investor debe analizar diariamente remates publicados en **Clasificados.cl**, buscar inmuebles realmente comparables en **Mercado Libre Inmuebles Chile**, estimar rangos de precios solicitados, proyectar gastos y utilidades y explicar los riesgos. La actualización objetivo es a las **07:30 America/Santiago**, desde un servidor que permanezca activo.

La plataforma nunca debe inventar propiedades, cifras, permisos o verificaciones. Ante ausencia de datos o falta de autorización, debe mostrar el estado pendiente. Los precios anunciados en Mercado Libre **no son** ventas acreditadas. Los mínimos de postura **no son** precios de adjudicación.

## Tecnologías

- **Frontend:** React + TypeScript + Vite, diseño adaptable.
- **API:** Node.js 22, endpoints JSON; sin secretos en el frontend.
- **Datos:** PostgreSQL compatible con Supabase, con políticas RLS cerradas para clientes.
- **Cálculos:** módulos deterministas con pruebas de unidad.
- **Ejecución programada:** proceso Node a las 07:30 de Chile, pendiente despliegue siempre activo.
- **Repositorios:** desarrollar y modificar el código exclusivamente en **eprado79-sketch/investor**.
- **Lovable:** el repositorio se sincroniza para previsualizar, pero no se usa su agente de IA ni se ejecutan operaciones que consuman sus créditos sin autorización explícita.

## Archivos principales

- src/App.tsx, src/index.css — dashboard, remates, comparador, fuentes, metodología y panel administrativo.
- server/index.mjs — API segura y simulación financiera.
- server/engine.mjs — valoración y matemáticas financieras.
- server/import.mjs — importaciones autorizadas y deduplicación.
- server/uf.mjs — indicador UF de fuente oficial CMF, sujeto a API Key.
- server/refresh.mjs — actualización programada y registro transparente de bloqueos.
- database/001_init.sql — esquema PostgreSQL.
- tests/ — pruebas básicas del motor.
- docs/PRODUCT.md — alcance y criterios del producto.
- docs/SETUP.md — configuración y credenciales requeridas.
- docs/STATUS.md — funcionalidades completadas, pendientes y bloqueadas.

## Arranque local

1. Instalar Node.js 22 y ejecutar: npm ci
2. Crear una base PostgreSQL dedicada a Investor e instalar database/001_init.sql.
3. Copiar .env.example a .env y configurar las variables de entorno del servidor.
4. Terminal API: node --env-file=.env server/index.mjs
5. Terminal web: npm run dev
6. Ejecutar pruebas: node --test tests/*.test.mjs

El frontend funciona en http://localhost:8080 con proxy /api hacia localhost:8787. Si no está disponible la API o la base de datos, muestra un aviso en lugar de inventar datos.

**Nunca publicar SUPABASE_SERVICE_ROLE_KEY ni INVESTOR_ADMIN_TOKEN en GitHub, Vite, Lovable frontend o capturas de pantalla.** Configurarlos como secretos del despliegue.

## Fuentes y autorizaciones

- Clasificados.cl, sección remates: https://www.clasificados.cl/Clasificados.aspx?categoria=clasificacion&clasificacion=1616
- Mercado Libre Chile: https://www.mercadolibre.cl/ y documentación https://developers.mercadolibre.cl/
- UF, API oficial CMF: https://api.cmfchile.cl/documentacion/UF.html

El código mantiene los conectores de extracción y búsqueda masiva **desactivados** mientras no se verifiquen sus accesos y permisos. La importación manual requiere confirmar el derecho de uso de los datos y siempre conserva sus enlaces originales.

Investor es una ayuda al análisis, no asesoría legal ni promesa de ganancias. La revisión de expedientes, dominio, ocupación, cargas y obligaciones debe realizarse antes de participar en remates.

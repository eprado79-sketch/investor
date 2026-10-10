# Investor — puesta en marcha segura (Etapa 1)

## Requisitos
- Node.js 22 o superior.
- Un proyecto **exclusivo para Investor** de Supabase/PostgreSQL, separado de cualquier otro sistema.
- Credenciales válidas. Nunca introducir claves en el frontend, el README o commits.

## Arranque local
1. Ejecutar npm ci.
2. Copiar .env.example a .env y completar valores en el entorno del servidor (no en Vite).
3. Ejecutar la migración database/001_init.sql en el editor SQL del proyecto de base de datos de Investor.
4. Iniciar la API mediante variables de entorno: node --env-file=.env server/index.mjs.
5. En otra terminal ejecutar npm run dev. El frontend se conectará a /api mediante el proxy Vite configurado.
6. Ejecutar node --test tests/*.test.mjs.

En producción se necesita alojar server/index.mjs en un proceso Node siempre activo, con HTTPS y el frontend conectado a /api. La actualización se intenta ejecutar a las 07:30 de America/Santiago usando un temporizador de servidor. No se ejecutará si el proceso o la infraestructura están suspendidos; configure supervisión y monitoreo antes de declararla automatizada en producción.

## Importación estructurada, sin scraping
POST /api/admin/import
Authorization: Bearer <INVESTOR_ADMIN_TOKEN>
Content-Type: application/json

El usuario debe disponer de autorización para utilizar los datos. El parámetro confirmAuthorized:true documenta su afirmación; no constituye permiso otorgado por la fuente. Importaciones quedan marcadas como "extracted", no verificadas automáticamente. Un administrador debe cotejar manualmente los avisos originales y los antecedentes judiciales.

Estructura:
{
  "confirmAuthorized": true,
  "items": [
    {
      "auction": {
        "source_url": "URL HTTPS REAL de un aviso en clasificados.cl",
        "title": "TÍTULO EXTRAÍDO DEL AVISO REAL",
        "commune": "COMUNA REAL",
        "property_type": "TIPO DOCUMENTADO",
        "rights_type": "unknown",
        "auction_at": null,
        "minimum_bid_clp": null,
        "raw_notice": "TEXTO DEL AVISO, SI SU USO ESTÁ AUTORIZADO"
      },
      "comparables": []
    }
  ]
}

Los campos desconocidos deben permanecer null. No utilizar URL, precio, superficie o fecha ficticios en importaciones reales. Si el mínimo está compuesto por UF más CLP, usar minimum_bid_uf y minimum_extra_clp: no convertir sin cotización oficial actualizada.

## Endpoints
- GET /api/status — estado de fuentes, base de datos y actualizaciones.
- GET /api/opportunities — solo registros importados con procedencia, tasación condicionada a calidad.
- POST /api/finance/simulate — escenario matemático con costos indicados.
- POST /api/admin/import — importación manual autorizada con token de administrador.
- POST /api/admin/refresh — intenta cotizar UF si dispone de API Key y registra las limitaciones de fuentes.
- GET /api/health — salud del proceso API (no implica fuentes conectadas).

## Credenciales pendientes
- SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY, extraídas del proyecto Supabase dedicado a Investor.
- INVESTOR_ADMIN_TOKEN, valor aleatorio de al menos 24 caracteres, guardado solo en secreto del servidor.
- CMF_API_KEY obtenida de https://api.cmfchile.cl/ para cotización oficial UF.
- Acceso autorizado a la base de remates Clasificados.cl; no existe extracción automática habilitada.
- Permisos de acceso concretos a búsqueda del inventario inmobiliario de Mercado Libre Chile / Portal Inmobiliario; consultar documentación oficial y su soporte.

## Seguridad
No abrir acceso directo a las tablas desde una clave pública; todas las tablas tienen RLS habilitada sin políticas públicas. Solo el backend utiliza la service role. La autenticación de usuarios y permisos de administración diferenciados aún no están implementados. No exponer el token administrativo en páginas públicas o almacenamiento persistente del navegador.

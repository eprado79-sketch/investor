# Estado verificado de Investor

## Código implementado
- Interfaz React/Vite: panel principal, remates importados, buscador, comparador, detalle con secciones, cálculo financiero, estado de fuentes, metodología y administración.
- API Node: estado de base de datos, oportunidades, simulación de reventa, importación controlada por token y petición de actualización.
- Base PostgreSQL: propiedades, remates, cambios, comparables, precios históricos, cotizaciones UF, riesgos, resultados, favoritos, preferencias e informes.
- Importación estructurada con URLs del origen y señal "extraído, no verificado", deduplicación básica y registro de cambios.
- Valorización prudente: misma comuna/tipo, tamaño +/-20%, datos de hasta 90 días, mínimo 5, cuantiles e incertidumbre.
- Rentabilidad calculada sobre inversión total con costos declarados y depósito no duplicado.
- Cliente CMF UF preparado para una API Key oficial, nunca con cotización ficticia.
- Planificación horaria de servidor por zona America/Santiago.
- Pruebas de unidad básicas y workflow de CI añadido al repositorio.

## Validaciones
- Comprobados manualmente casos básicos del motor de valoración y escenario financiero con el código guardado en GitHub.
- Commit de GitHub sincronizado con proyecto Lovable Investor, sin utilizar su agente.
- Compilación, test CI completo y pruebas end-to-end con infraestructura real: **aún sin confirmar**.

## Bloqueado o pendiente
- Conector automático de Clasificados.cl: mecanismo de acceso autorizado sin verificar.
- API de búsqueda del inventario inmobiliario de Mercado Libre/Portal: permisos y alcance de consulta sin verificar.
- Base Supabase: no se han suministrado todavía claves de conexión al proceso Node, ni ejecutado la migración en un entorno configurado.
- Actividad diaria 07:30 real: necesita servidor siempre activo, secretos y fuentes autorizadas.
- Análisis IA y revisión judicial automáticos, puntuación 0–100, ranking real y reportes PDF: etapas posteriores, no operativas.
- Autenticación de usuarios, guardado persistente de favoritos y perfiles: pendiente.
- No se han importado a la nueva base de datos remates reales ni comparables.

## Resguardos
- Cuenta GitHub exclusiva eprado79-sketch/investor; no consultar ni modificar Calmy.
- No usar agente de Lovable ni consumir créditos de IA sin permiso explícito.
- No presentar funciones pendientes como si estuvieran operativas.

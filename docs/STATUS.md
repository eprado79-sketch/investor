# Estado de implementación — Investor

## Implementado en la base inicial
- Modelo de PostgreSQL segregado para remates, propiedades físicas, historial, comparables, UF, riesgos, puntuaciones, perfiles y procesos.
- Importación estructurada de avisos de Clasificados.cl y comparables de Mercado Libre con confirmación explícita de derecho de uso, URLs originales y deduplicación por URL.
- Cálculo determinista de valoración basado en comparables equivalentes y recientes; exige al menos 5; conserva incertidumbre; no presenta precios solicitados como ventas efectivas.
- Motor de escenarios con precio de adjudicación editable, gastos explícitos, rentabilidad y precio máximo; garantía separada para evitar duplicaciones.
- API y panel informativo de estado (con frontend integrado en construcción).
- Planificador horario America/Santiago ejecutado desde el proceso Node siempre activo.
- Conector oficial de UF CMF sujeto a credencial, sin valores predeterminados.

## Bloqueado hasta habilitar accesos o datos reales
- Extracción automática de remates de Clasificados.cl: permiso técnico/legal aún no confirmado.
- Consulta automática del inventario de Mercado Libre Chile: alcance/API/credenciales todavía no verificados en cuenta real.
- Datos bancarios / del Poder Judicial / títulos: no hay acceso configurado.
- Un ranking real calculado, números de remates vigentes, actualizaciones verificadas y reportes PDF: dependerán de datos comprobados.
- Autenticación multiusuario, favoritos persistentes y análisis IA: etapas posteriores.
- Pruebas integrales con base de datos y fuentes en producción: pendientes.

No declarar operativos estos componentes antes de verificar credenciales, consultas reales y despliegue. No usar el agente Lovable. El único repositorio autorizado para el código es eprado79-sketch/investor.

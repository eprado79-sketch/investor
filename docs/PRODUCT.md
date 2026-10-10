# Especificación funcional de Investor

## Objetivo
Responder con datos reales y trazables: **¿Cuáles son los mejores remates disponibles hoy en Chile, cuánto capital requieren, qué ganancia podría obtenerse y qué riesgos existen?**

## Principios obligatorios
1. Remates reales de Clasificados.cl obtenidos únicamente a través de mecanismos autorizados.
2. Comparables reales de Mercado Libre Inmuebles y Portal Inmobiliario (si hay acceso permitido).
3. Diferenciar precios solicitados de transacciones efectivamente realizadas.
4. Evitar confundirse entre mínimo de postura y adjudicación.
5. Diferenciar adjudicación de dominio completo frente a cuotas/derechos.
6. Identificar fuentes, fechas, estado del dato y supuestos editables.
7. No crear datos ficticios, ni presumir la condición jurídica del inmueble.
8. Ejecutar actualizaciones desde el servidor a las 07:30 America/Santiago cuando se disponga de las integraciones.
9. No marcar una integración como activa sin consultas satisfactorias.
10. Priorización de confiabilidad del análisis, no número de resultados.

## Flujos
- Ingesta: consultar todos los avisos permitidos, distinguir anuncios y propiedades, registrar diferencias y vencimientos; usar importación estructurada cuando no haya permiso de automatización.
- Interpretación: extracción de tipo, ubicación, medidas, derechos, tribunal, rol, fecha, mínimo CLP/UF y conceptos adicionales, depósito y condiciones. Campos faltantes explícitos.
- Comparación: mismo tipo y comuna, barrio y distancia cuando sean fiables, área +/- 20% preferentemente; 5–15 publicaciones válidas y recientes, deduplicación y valores atípicos.
- Valorización: tres escenarios (conservador, central, optimista) sustentados en comparables. Sin evidencia suficiente, "valor comercial no verificable".
- Simulación financiera: mínimo, +0/+10/+20/+30% o precio manual; todos los costos explícitos; neto y ROI sobre inversión total, horizonte anualizado y máximo a ofertar. La garantía se muestra como liquidez requerida, sin duplicarla como gasto.
- Arriendo: rentabilidad bruta y neta solo si hay suficiente información verificable de arriendos.
- Evaluación: descuento 30%, rentabilidad 25%, calidad de datos 15%, riesgos 20%, capital 10%; penalizar incertidumbre; no confundir una gran diferencia de precios con oportunidad segura. Puntaje deshabilitado si los fundamentos no están disponibles.
- Riesgos judiciales: verificar tribunal, expediente, fechas, suspensión, inscripción, gravámenes, prohibiciones, ocupación, deuda, derechos parciales y plazos.
- Explicación IA: resumen en español sencillo, con ventajas, capital, potencial, riesgos, verificaciones pendientes y conclusión prudente.
- Interfaz: dashboard TOP 10, filtros, favoritos, perfil de inversionista, comparador 2–5 remates, ficha por pestañas e informes PDF.
- Historial: cambios de anuncio, precio y fecha, seguimiento de comparables conforme a condiciones de uso y evidencia de venta/retirada.
- Informe diario: cinco oportunidades nuevas, cinco próximas, cambios, vencimientos y advertencias, solo cuando se completó la actualización.
- Administración: fuentes, autorización, logs, errores, credenciales, criterios, costos, calidad y revisión manual.

## Datos de referencia y validación
- Moneda original y monto adicional por separado para mínimos mixtos de UF + CLP.
- Fuente oficial de UF con fecha de indicador; sin cotización válida, no convertir.
- Tasación: mediana y cuantiles por metro cuadrado de comparables. Los descuentos y ajustes deben ser transparentes y verificables.
- Calculadoras: fórmulas en servidor, no cifras inventadas por modelos generativos.
- Ranking: mantener por separado puntuación financiera, riesgo y confianza; no mostrar TOP 10 si el inventario no es verificable.

## Etapas
1. Esquema, ingestión autorizada y actualización.
2. API inmobiliaria real Mercado Libre/Portal.
3. Valorización con comparables verificables.
4. Finanzas, escenarios y rentabilidad.
5. Interpretación IA, riesgos judiciales, puntuación.
6. Dashboard, buscador, favoritos, comparación, informes.
7. Automatización real, controles de calidad, seguridad, producción.

Las etapas posteriores no deben presentarse como completadas antes de contar con sus pruebas y credenciales. El presente repositorio implementa una **base de las etapas 1, 3, 4 y 6**, con conectores externos pendientes.

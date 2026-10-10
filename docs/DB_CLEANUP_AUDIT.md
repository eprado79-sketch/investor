# Auditoría de limpieza de Lovable Cloud — Investor

Fecha: 2026-10-10. Proyecto Lovable **investor**, ID **6d936044-0356-4cf6-aa02-d1be49a1fb89**. Consultas realizadas **solo** al proyecto Investor; no se consultó Calmy.

## Resultado comprobado (consultas SELECT, sin DDL)
- Motor habilitado: PostgreSQL/Supabase dentro de Lovable Cloud.
- Se identificaron 19 tablas heredadas en `public`, **todas con 0 filas exactas**:
  `bookings`, `cancellation_policies`, `cities`, `countries`, `disputes`, `faqs`, `guest_debts`, `listing_availability`, `listing_moderation_feedback`, `listings`, `message_threads`, `messages`, `payouts`, `platform_settings`, `profiles`, `reviews`, `states_regions`, `transactions`, `user_roles`.
- Vistas heredadas: `public_listings`, `public_profiles`, `user_admin_view`.
- `auth.users` = **0**; `auth.identities` = **0**.
- Buckets de Storage: `avatars`, `dispute-attachments`, `listing-images`, `message-attachments`; cada uno con **0 objetos**. En la inspección aparecieron los cuatro como **públicos**.
- Se observaron funciones SQL de antiguos flujos de reservas, pagos, usuarios, disputas, informes y mensajería; hay **17 triggers propios** en public y **90 políticas RLS** en public.
- Se detectaron 11 tipos enum heredados: `app_role`, `booking_status`, `cancellation_policy`, `dispute_category`, `dispute_status`, `listing_status`, `payout_status_enum`, `property_type`, `review_status`, `thread_type`, `user_status`.
- Existen objetos de `storage` administrados por la plataforma; **no** se deben borrar las tablas internas de ese esquema.
- Existe la tabla del programador `cron.job`, pero **no se verificó su contenido**. Se deben revisar tareas antiguas antes de ejecutar limpieza.
- La interfaz Lovable muestra 4 Edge Functions heredadas del antiguo sistema; estas no se eliminan automáticamente al borrar código o tablas.
- El servicio cortó las consultas por alcanzar el **límite temporal de acciones MCP de base de datos del plan gratuito**. **No** se ejecutó ningún DELETE, DROP, cambio de schema ni agente de Lovable.

## Riesgos y pasos antes de limpiar
1. Revisar `cron.job` cuando se restablezca la cuota; detener/sustituir explícitamente tareas antiguas que dependan de reservas/arriendos, sin interferir con funciones internas.
2. Confirmar la existencia de respaldo o una restauración disponible en Lovable Cloud antes de cualquier DDL destructivo.
3. Ejecutar únicamente el script revisable `database/000_cleanup_legacy_tables.sql` sobre Investor. El script contiene comprobaciones y bloqueos para impedir borrar datos o tablas inesperadas. **No ha sido ejecutado**.
4. Revisar y retirar los objetos residuales (funciones, tipos, buckets y Edge Functions) por separado. No usar `CASCADE` indiscriminado ni borrar funciones de `auth` o `storage`.
5. Ejecutar la nueva migración `database/001_init.sql` para el producto de remates. Revisar compatibilidad con las funciones de Lovable Cloud y autorización de su administrador antes de conectar el backend.

## Regla operativa
Trabajar exclusivamente en `eprado79-sketch/investor`. No consultar ni modificar Calmy. No usar Lovable AI ni operaciones que consuman sus créditos sin autorización expresa. Distinguir consumo de cuota gratuita de consultas de créditos de IA.

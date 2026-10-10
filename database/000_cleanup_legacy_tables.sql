-- PENDIENTE DE REVISIÓN Y EJECUCIÓN MANUAL.
-- ÚNICAMENTE para el proyecto Lovable Cloud INVESTOR.
-- No se ejecutó este script al crearlo; SQL guardado en GitHub, no en Lovable AI.
-- Limpia vistas y tablas viejas solo si TODAS siguen vacías,
-- no hay usuarios/objetos ni tablas públicas inesperadas, y no hay cron jobs activos.
-- NO limpia funciones, enums, buckets, funciones Edge, secretos ni objetos internos.
BEGIN;
DO $cleanup$
DECLARE
  legacy_tables text[] := ARRAY[
    'bookings','cancellation_policies','cities','countries','disputes','faqs',
    'guest_debts','listing_availability','listing_moderation_feedback','listings',
    'message_threads','messages','payouts','platform_settings','profiles',
    'reviews','states_regions','transactions','user_roles'
  ];
  candidate text;
  record_count bigint;
  other_tables integer;
  unknown_views integer;
BEGIN
  SELECT count(*) INTO other_tables
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind IN ('r','p')
    AND NOT (c.relname = ANY(legacy_tables));
  IF other_tables <> 0 THEN
    RAISE EXCEPTION 'Abortado: hay % tablas nuevas/desconocidas en public.',other_tables;
  END IF;

  SELECT count(*) INTO unknown_views
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind IN ('v','m')
    AND c.relname <> ALL(ARRAY['public_listings','public_profiles','user_admin_view']);
  IF unknown_views <> 0 THEN
    RAISE EXCEPTION 'Abortado: hay % vistas nuevas/desconocidas en public.',unknown_views;
  END IF;

  SELECT count(*) INTO record_count FROM auth.users;
  IF record_count <> 0 THEN
    RAISE EXCEPTION 'Abortado: existen % cuentas de autenticación.',record_count;
  END IF;
  SELECT count(*) INTO record_count FROM storage.objects;
  IF record_count <> 0 THEN
    RAISE EXCEPTION 'Abortado: existen % objetos almacenados.',record_count;
  END IF;
  IF to_regclass('cron.job') IS NOT NULL THEN
    EXECUTE 'SELECT count(*) FROM cron.job' INTO record_count;
    IF record_count <> 0 THEN
      RAISE EXCEPTION 'Abortado: existen % tareas cron; revisar antes de continuar.',record_count;
    END IF;
  END IF;
  FOREACH candidate IN ARRAY legacy_tables LOOP
    IF to_regclass(format('public.%I',candidate)) IS NOT NULL THEN
      EXECUTE format('SELECT count(*) FROM public.%I',candidate) INTO record_count;
      IF record_count <> 0 THEN
        RAISE EXCEPTION 'Abortado: tabla public.% contiene % filas.',candidate,record_count;
      END IF;
    END IF;
  END LOOP;
END
$cleanup$;

-- RESTRICT: detenerse si quedan dependencias no previstas.
DROP VIEW IF EXISTS
  public.public_listings,
  public.public_profiles,
  public.user_admin_view
RESTRICT;

DROP TABLE IF EXISTS
  public.bookings,
  public.cancellation_policies,
  public.cities,
  public.countries,
  public.disputes,
  public.faqs,
  public.guest_debts,
  public.listing_availability,
  public.listing_moderation_feedback,
  public.listings,
  public.message_threads,
  public.messages,
  public.payouts,
  public.platform_settings,
  public.profiles,
  public.reviews,
  public.states_regions,
  public.transactions,
  public.user_roles
RESTRICT;

COMMIT;

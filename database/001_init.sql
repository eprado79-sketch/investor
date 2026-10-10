-- Investor schema v1. Execute only in Investor's own Supabase/PostgreSQL project.
create extension if not exists pgcrypto;
create table if not exists public.source_registry (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, name text not null, authorization_status text not null default 'pending',
  authorization_notes text, updated_at timestamptz not null default now()
);
insert into public.source_registry(code,name,authorization_status) values
('clasificados','Clasificados.cl','pending'),
('mercadolibre','Mercado Libre Inmuebles Chile','pending'),
('cmf_uf','CMF UF','requires_api_key') on conflict(code) do nothing;

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  identity_hash text unique not null,
  property_type text, region text, commune text, address text, created_at timestamptz not null default now()
);
create table if not exists public.auctions (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id),
  source_url text not null unique, source_notice_id text not null,
  title text not null, property_type text,region text,commune text,address text,
  area_m2 numeric(14,2),bedrooms numeric(4,1),bathrooms numeric(4,1),
  court text,case_number text,auction_at timestamptz,
  minimum_bid_clp numeric(20,2),minimum_bid_uf numeric(20,4),minimum_extra_clp numeric(20,2),deposit_clp numeric(20,2),
  rights_type text not null default 'unknown' check(rights_type in ('full','partial','unknown')),
  published_at timestamptz,raw_notice text,
  verification_status text not null default 'pending' check(verification_status in ('pending','extracted','verified')),
  source_digest text,last_seen_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists auctions_by_date on public.auctions(auction_at);
create index if not exists auctions_by_place on public.auctions(commune,property_type);
create table if not exists public.auction_changes (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.auctions(id) on delete cascade,
  source_digest text not null,
  change_kind text not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  unique(auction_id,source_digest)
);
create table if not exists public.comparables (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.auctions(id) on delete cascade,
  source_url text not null,title text not null,
  property_type text,commune text,area_m2 numeric(14,2),price_clp numeric(20,2),
  bedrooms numeric(4,1),bathrooms numeric(4,1),
  status text not null default 'unknown',
  verification_status text not null default 'extracted',
  observed_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique(auction_id,source_url)
);
create table if not exists public.comparable_price_observations (
  id uuid primary key default gen_random_uuid(),
  comparable_id uuid not null references public.comparables(id) on delete cascade,
  observed_at timestamptz not null,price_clp numeric(20,2) not null,
  unique(comparable_id,observed_at)
);
create table if not exists public.uf_quotes (
  quote_date date primary key,
  value_clp numeric(15,2) not null check(value_clp>0),
  source_url text not null,observed_at timestamptz not null default now()
);
create table if not exists public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,status text not null,
  reviewed integer not null default 0,new_count integer not null default 0,
  updated_count integer not null default 0,analyzed integer not null default 0,
  errors jsonb not null default '[]'::jsonb,detail jsonb,
  started_at timestamptz not null default now(),finished_at timestamptz
);
create table if not exists public.user_preferences (
  user_id uuid primary key,capital_clp numeric(20,2),regions text[],
  communes text[],investment_goal text,risk_tolerance text,
  target_roi numeric(10,3),updated_at timestamptz not null default now()
);
create table if not exists public.favorites (
  user_id uuid not null,auction_id uuid not null references public.auctions(id) on delete cascade,
  created_at timestamptz not null default now(),primary key(user_id,auction_id)
);
create table if not exists public.financial_scenarios (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.auctions(id) on delete cascade,
  user_id uuid,inputs jsonb not null,outputs jsonb,
  created_at timestamptz not null default now()
);
create table if not exists public.risk_reviews (
  id uuid primary key default gen_random_uuid(),auction_id uuid not null references public.auctions(id) on delete cascade,
  item text not null,status text not null default 'pending',evidence_url text,
  reviewed_at timestamptz,notes text,unique(auction_id,item)
);
create table if not exists public.analysis_results (
  id uuid primary key default gen_random_uuid(),auction_id uuid not null references public.auctions(id) on delete cascade,
  valuation jsonb,score numeric(5,2),confidence text,
  created_at timestamptz not null default now()
);
create table if not exists public.daily_reports (
  id uuid primary key default gen_random_uuid(),report_date date unique not null,
  status text not null,body jsonb,generated_at timestamptz not null default now()
);
-- Clients have no direct access. Server alone uses service role; never expose the key in Vite.
alter table public.source_registry enable row level security;
alter table public.properties enable row level security;
alter table public.auctions enable row level security;
alter table public.auction_changes enable row level security;
alter table public.comparables enable row level security;
alter table public.comparable_price_observations enable row level security;
alter table public.uf_quotes enable row level security;
alter table public.sync_runs enable row level security;
alter table public.user_preferences enable row level security;
alter table public.favorites enable row level security;
alter table public.financial_scenarios enable row level security;
alter table public.risk_reviews enable row level security;
alter table public.analysis_results enable row level security;
alter table public.daily_reports enable row level security;

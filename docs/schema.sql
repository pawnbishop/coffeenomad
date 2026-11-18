-- Coffee Nomad backend schema for Supabase (Postgres + PostGIS)
-- Run in the Supabase SQL editor. Not yet run against a live database: report any error and it gets fixed.

create extension if not exists postgis;
create extension if not exists pg_trgm;

create type user_role as enum ('user','owner','moderator','admin');
create type review_status as enum ('pending','approved','rejected');
create type claim_status as enum ('pending','approved','rejected');
create type listing_status as enum ('draft','published','hidden');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  role user_role not null default 'user',
  created_at timestamptz not null default now()
);

create table cafes (
  id uuid primary key default gen_random_uuid(),
  osm_id bigint unique,
  name text not null check (char_length(name) between 2 and 120),
  slug text unique not null,
  kind text not null default 'cafe' check (kind in ('cafe','specialty','roaster','chain','school')),
  geom geography(Point,4326) not null,
  address text, suburb text, city text not null default 'Nairobi',
  phone text, whatsapp text, website text, instagram text,
  description text check (char_length(description) <= 1200),
  amenities text[] not null default '{}',
  status listing_status not null default 'published',
  verified boolean not null default false,
  owner_id uuid references profiles on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cafes_geom_idx on cafes using gist (geom);
create index cafes_name_trgm on cafes using gin (name gin_trgm_ops);
create index cafes_amen_idx on cafes using gin (amenities);
create index cafes_city_idx on cafes (city) where status = 'published';

-- dow: 0 = Monday ... 6 = Sunday, in Africa/Nairobi time. closes <= opens means it closes after midnight.
create table cafe_hours (
  id bigint generated always as identity primary key,
  cafe_id uuid not null references cafes on delete cascade,
  dow smallint not null check (dow between 0 and 6),
  opens time not null,
  closes time not null,
  unique (cafe_id, dow, opens)
);
create index cafe_hours_cafe_idx on cafe_hours (cafe_id);

create table claims (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references cafes on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  status claim_status not null default 'pending',
  evidence text not null check (char_length(evidence) between 10 and 1000),
  reviewed_by uuid references profiles,
  created_at timestamptz not null default now(),
  unique (cafe_id, user_id)
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references cafes on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text check (char_length(body) <= 1500),
  status review_status not null default 'pending',
  owner_reply text check (char_length(owner_reply) <= 800),
  created_at timestamptz not null default now(),
  unique (cafe_id, user_id)
);
create index reviews_cafe_idx on reviews (cafe_id) where status = 'approved';

create table favourites (
  user_id uuid not null references profiles on delete cascade,
  cafe_id uuid not null references cafes on delete cascade,
  primary key (user_id, cafe_id)
);

create table caffeine_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  taken_at timestamptz not null default now(),
  mg integer not null check (mg between 0 and 1000),
  label text check (char_length(label) <= 60)
);
create index caffeine_user_time on caffeine_logs (user_id, taken_at desc);

create table reports (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references cafes on delete cascade,
  user_id uuid references profiles on delete set null,
  message text not null check (char_length(message) between 5 and 600),
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

-- Helpers -------------------------------------------------------------
create function is_staff() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('moderator','admin'));
$$;
create function is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;
create function owns_cafe(c uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from cafes where id = c and owner_id = auth.uid());
$$;

create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name) values (new.id, split_part(new.email,'@',1));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- Owners may edit their café's content but never ownership, status or the verified badge.
create function guard_cafe_update() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if not is_staff() then
    new.owner_id := old.owner_id; new.verified := old.verified;
    new.status := old.status; new.osm_id := old.osm_id; new.slug := old.slug;
  end if;
  return new;
end $$;
create trigger cafes_guard before update on cafes for each row execute function guard_cafe_update();

create function guard_profile_update() returns trigger language plpgsql as $$
begin
  if not is_admin() then new.role := old.role; end if;
  return new;
end $$;
create trigger profiles_guard before update on profiles for each row execute function guard_profile_update();

-- Reviews: edits go back to moderation; only staff change status; owners can only add a reply.
create function guard_review_update() returns trigger language plpgsql as $$
begin
  if is_staff() then return new; end if;
  if owns_cafe(old.cafe_id) and auth.uid() <> old.user_id then
    new.rating := old.rating; new.body := old.body; new.status := old.status; new.user_id := old.user_id;
  else
    new.status := 'pending'; new.owner_reply := old.owner_reply; new.cafe_id := old.cafe_id; new.user_id := old.user_id;
  end if;
  return new;
end $$;
create trigger reviews_guard before update on reviews for each row execute function guard_review_update();

-- Staff approve a claim: assigns the owner, upgrades the role, marks the café verified.
create function approve_claim(claim uuid) returns void language plpgsql security definer set search_path = public as $$
declare c claims;
begin
  if not is_staff() then raise exception 'not allowed'; end if;
  select * into c from claims where id = claim and status = 'pending' for update;
  if not found then raise exception 'claim not found or already reviewed'; end if;
  update claims set status = 'approved', reviewed_by = auth.uid() where id = claim;
  update cafes set owner_id = c.user_id, verified = true where id = c.cafe_id;
  update profiles set role = 'owner' where id = c.user_id and role = 'user';
end $$;
revoke all on function approve_claim(uuid) from public, anon;
grant execute on function approve_claim(uuid) to authenticated;

-- Is a café open right now, in Kenyan time? -------------------------------
create function cafe_is_open(c uuid, at timestamptz default now()) returns boolean language sql stable as $$
  with t as (
    select (extract(isodow from (at at time zone 'Africa/Nairobi'))::int - 1) as dow,
           (at at time zone 'Africa/Nairobi')::time as now_t
  )
  select exists (
    select 1 from cafe_hours h, t
    where h.cafe_id = c and (
      (h.dow = t.dow and ((h.opens < h.closes and t.now_t >= h.opens and t.now_t < h.closes)
                       or (h.opens >= h.closes and t.now_t >= h.opens)))
      or (h.dow = (t.dow + 6) % 7 and h.opens >= h.closes and t.now_t < h.closes)
    )
  );
$$;

-- Nearby cafés, nearest first, optionally only those open now ----------------
create function cafes_nearby(lat double precision, lon double precision, radius_m integer default 2000, open_only boolean default false, max_rows integer default 60)
returns table (id uuid, name text, slug text, kind text, verified boolean, address text, lat double precision, lon double precision, distance_m integer, is_open boolean, has_hours boolean)
language sql stable as $$
  select c.id, c.name, c.slug, c.kind, c.verified, c.address,
         st_y(c.geom::geometry), st_x(c.geom::geometry),
         st_distance(c.geom, st_makepoint(lon, lat)::geography)::integer,
         cafe_is_open(c.id),
         exists (select 1 from cafe_hours h where h.cafe_id = c.id)
  from cafes c
  where c.status = 'published'
    and st_dwithin(c.geom, st_makepoint(lon, lat)::geography, least(radius_m, 20000))
    and (not open_only or cafe_is_open(c.id))
  order by c.geom <-> st_makepoint(lon, lat)::geography
  limit least(max_rows, 100);
$$;

create view cafe_ratings with (security_invoker = true) as
  select cafe_id, round(avg(rating)::numeric, 1) as avg_rating, count(*) as review_count
  from reviews where status = 'approved' group by cafe_id;

-- Row Level Security: deny by default, then allow exactly what each role needs ----
alter table profiles enable row level security;
alter table cafes enable row level security;
alter table cafe_hours enable row level security;
alter table claims enable row level security;
alter table reviews enable row level security;
alter table favourites enable row level security;
alter table caffeine_logs enable row level security;
alter table reports enable row level security;

create policy profiles_read on profiles for select using (true);
create policy profiles_update_own on profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy cafes_read on cafes for select using (status = 'published' or owner_id = auth.uid() or is_staff());
create policy cafes_owner_update on cafes for update using (owner_id = auth.uid() or is_staff());
create policy cafes_staff_insert on cafes for insert with check (is_staff());
create policy cafes_staff_delete on cafes for delete using (is_admin());

create policy hours_read on cafe_hours for select using (exists (select 1 from cafes c where c.id = cafe_id and (c.status = 'published' or c.owner_id = auth.uid() or is_staff())));
create policy hours_write on cafe_hours for all using (owns_cafe(cafe_id) or is_staff()) with check (owns_cafe(cafe_id) or is_staff());

create policy claims_insert on claims for insert with check (user_id = auth.uid() and status = 'pending');
create policy claims_read on claims for select using (user_id = auth.uid() or is_staff());
create policy claims_staff_update on claims for update using (is_staff());

create policy reviews_read on reviews for select using (status = 'approved' or user_id = auth.uid() or owns_cafe(cafe_id) or is_staff());
create policy reviews_insert on reviews for insert with check (user_id = auth.uid() and status = 'pending');
create policy reviews_update on reviews for update using (user_id = auth.uid() or owns_cafe(cafe_id) or is_staff());
create policy reviews_delete on reviews for delete using (user_id = auth.uid() or is_staff());

create policy fav_own on favourites for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy caf_own on caffeine_logs for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy reports_insert on reports for insert with check (user_id = auth.uid());
create policy reports_staff_read on reports for select using (is_staff() or owns_cafe(cafe_id));
create policy reports_staff_update on reports for update using (is_staff());

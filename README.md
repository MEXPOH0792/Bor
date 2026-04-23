# BOR Tracker

РџСЂРѕСЃС‚РѕР№ СЃС‚Р°С‚РёС‡РµСЃРєРёР№ С‚СЂРµРєРµСЂ РІРѕРґРёС‚РµР»РµР№ РЅР° `HTML + CSS + Vanilla JavaScript` СЃ РїСѓР±Р»РёРєР°С†РёРµР№ РЅР° GitHub Pages Рё С…СЂР°РЅРµРЅРёРµРј РґР°РЅРЅС‹С… РІ Supabase.

РџСЂРѕРµРєС‚ СЂР°СЃСЃС‡РёС‚Р°РЅ РЅР° СЃР»Р°Р±С‹Р№ РёРЅС‚РµСЂРЅРµС‚:

- СЃС‚СЂР°РЅРёС†С‹ РєСЌС€РёСЂСѓСЋС‚СЃСЏ С‡РµСЂРµР· service worker
- РїСѓР±Р»РёС‡РЅР°СЏ СЃС‚СЂР°РЅРёС†Р° РїРѕРєР°Р·С‹РІР°РµС‚ РїРѕСЃР»РµРґРЅРёРµ СЃРѕС…СЂР°РЅРµРЅРЅС‹Рµ РґР°РЅРЅС‹Рµ СЃ СѓСЃС‚СЂРѕР№СЃС‚РІР°, РµСЃР»Рё СЃРµС‚СЊ СЃР»Р°Р±Р°СЏ
- РЅР° СЃС‚СЂР°РЅРёС†Рµ РІРѕРґРёС‚РµР»СЏ РµСЃС‚СЊ Р»РѕРєР°Р»СЊРЅР°СЏ РѕС‡РµСЂРµРґСЊ РЅРµРѕС‚РїСЂР°РІР»РµРЅРЅС‹С… РѕР±РЅРѕРІР»РµРЅРёР№
- РґР»СЏ РєР°Р¶РґРѕРіРѕ РІРѕРґРёС‚РµР»СЏ РІ РѕС‡РµСЂРµРґРё С…СЂР°РЅРёС‚СЃСЏ С‚РѕР»СЊРєРѕ РїРѕСЃР»РµРґРЅРµРµ РЅРµРѕС‚РїСЂР°РІР»РµРЅРЅРѕРµ РѕР±РЅРѕРІР»РµРЅРёРµ
- С‡РµСЂРЅРѕРІРёРє С„РѕСЂРјС‹ СЃРѕС…СЂР°РЅСЏРµС‚СЃСЏ РЅР° СѓСЃС‚СЂРѕР№СЃС‚РІРµ

## РЎС‚СЂСѓРєС‚СѓСЂР° РїСЂРѕРµРєС‚Р°

```text
index.html
driver.html
styles.css
app.js
driver.js
supabase.js
service-worker.js
site.webmanifest
icon-16.png
icon-32.png
apple-touch-icon.png
icon-192.png
icon-512.png
README.md
.nojekyll
```

## Р§С‚Рѕ РґРµР»Р°РµС‚ С‚РµРєСѓС‰Р°СЏ РІРµСЂСЃРёСЏ

- РїРѕРєР°Р·С‹РІР°РµС‚ РІСЃРµС… Р°РєС‚РёРІРЅС‹С… РІРѕРґРёС‚РµР»РµР№ РёР· С‚Р°Р±Р»РёС†С‹ `drivers`
- РІС‹РІРѕРґРёС‚ РёРјСЏ, С‚РµР»РµС„РѕРЅ, СЃС‚Р°С‚СѓСЃ, РјРµСЃС‚РѕРїРѕР»РѕР¶РµРЅРёРµ Рё РІСЂРµРјСЏ РїРѕСЃР»РµРґРЅРµРіРѕ РѕР±РЅРѕРІР»РµРЅРёСЏ
- РїРѕРєР°Р·С‹РІР°РµС‚ РїРѕР»Рµ `collect_until_date` РєР°Рє РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅСѓСЋ РґР°С‚Сѓ РЅР° РєР»РёРµРЅС‚СЃРєРѕР№ Рё РІРѕРґРёС‚РµР»СЊСЃРєРѕР№ СЃС‚СЂР°РЅРёС†Р°С…
- РїРѕРґСЃРІРµС‡РёРІР°РµС‚ СЃРІРµР¶РµСЃС‚СЊ СЃС‚Р°С‚СѓСЃР° С†РІРµС‚РѕРј
- Р°РІС‚РѕРѕР±РЅРѕРІР»СЏРµС‚ РїСѓР±Р»РёС‡РЅСѓСЋ СЃС‚СЂР°РЅРёС†Сѓ СЂР°Р· РІ 3 РјРёРЅСѓС‚С‹
- РїРѕРґРґРµСЂР¶РёРІР°РµС‚ `navigator.geolocation` РґР»СЏ СЃРѕС…СЂР°РЅРµРЅРёСЏ `lat/lon`
- РїРѕРґРґРµСЂР¶РёРІР°РµС‚ СЃРєСЂС‹С‚С‹Р№ СЂРµР¶РёРј РєРѕРѕСЂРґРёРЅР°С‚РѕСЂР° `driver.html?admin=1`
- РєСЌС€РёСЂСѓРµС‚ СЃС‚Р°С‚РёС‡РµСЃРєРёРµ С„Р°Р№Р»С‹ Рё РїРѕСЃР»РµРґРЅРёРµ РґР°РЅРЅС‹Рµ РґР»СЏ СЃР»Р°Р±РѕРіРѕ РёРЅС‚РµСЂРЅРµС‚Р°
- СЃРѕС…СЂР°РЅСЏРµС‚ РЅРµРѕС‚РїСЂР°РІР»РµРЅРЅС‹Рµ РѕР±РЅРѕРІР»РµРЅРёСЏ Р»РѕРєР°Р»СЊРЅРѕ Рё РѕС‚РїСЂР°РІР»СЏРµС‚ РёС… РїРѕР·Р¶Рµ

## Р’Р°Р¶РЅРѕ РїСЂРѕ РєРѕР»РёС‡РµСЃС‚РІРѕ РІРѕРґРёС‚РµР»РµР№

РџСЂРѕРµРєС‚ Р±РѕР»СЊС€Рµ РЅРµ Р¶РµСЃС‚РєРѕ Р·Р°РІСЏР·Р°РЅ РЅР° 4 РєР°СЂС‚РѕС‡РєРё. РќР° СЃР°Р№С‚Рµ РїРѕРєР°Р·С‹РІР°СЋС‚СЃСЏ С‚РѕР»СЊРєРѕ Р°РєС‚РёРІРЅС‹Рµ РІРѕРґРёС‚РµР»Рё РёР· С‚Р°Р±Р»РёС†С‹ `drivers`, Сѓ РєРѕС‚РѕСЂС‹С… `is_active = true`.

Р•СЃР»Рё РѕРґРёРЅ РІРѕРґРёС‚РµР»СЊ Р±РѕР»СЊС€Рµ РЅРµ РЅСѓР¶РµРЅ:

- Р»РёР±Рѕ РїРѕСЃС‚Р°РІСЊС‚Рµ РµРјСѓ `is_active = false`
- Р»РёР±Рѕ СѓРґР°Р»РёС‚Рµ Р·Р°РїРёСЃСЊ РёР· `drivers`

РРЅС‚РµСЂС„РµР№СЃ СЃР°Рј РїРѕРєР°Р¶РµС‚ СЃС‚РѕР»СЊРєРѕ РІРѕРґРёС‚РµР»РµР№, СЃРєРѕР»СЊРєРѕ СЂРµР°Р»СЊРЅРѕ Р°РєС‚РёРІРЅРѕ РІ Р±Р°Р·Рµ.

## 1. РљР°Рє СЃРѕР·РґР°С‚СЊ РїСЂРѕРµРєС‚ Supabase

1. Р—Р°Р№РґРёС‚Рµ РЅР° [https://supabase.com/](https://supabase.com/) Рё СЃРѕР·РґР°Р№С‚Рµ РїСЂРѕРµРєС‚.
2. РћС‚РєСЂРѕР№С‚Рµ `Project Settings -> API`.
3. РЎРєРѕРїРёСЂСѓР№С‚Рµ:
   - `Project URL`
   - `Publishable key` РёР»Рё `anon public key`
4. РћС‚РєСЂРѕР№С‚Рµ `SQL Editor` Рё РІС‹РїРѕР»РЅРёС‚Рµ SQL РЅРёР¶Рµ.

## 2. SQL РґР»СЏ С‚Р°Р±Р»РёС† Рё С„СѓРЅРєС†РёРё РѕР±РЅРѕРІР»РµРЅРёСЏ

```sql
create table if not exists public.drivers (
  id bigint primary key generated always as identity,
  number integer not null unique,
  name text not null,
  phone text,
  is_active boolean not null default true
);

create table if not exists public.driver_status (
  id bigint primary key generated always as identity,
  driver_id bigint not null unique references public.drivers(id) on delete cascade,
  status text not null,
  location_text text,
  lat double precision null,
  lon double precision null,
  is_collecting_in_russia boolean not null default false,
  collect_until_date date null,
  updated_at timestamptz not null default now()
);

insert into public.drivers (number, name, phone, is_active)
values
  (1, 'РђС…Р»РёРґРґРёРЅ', '+7 900 000-00-01', true),
  (2, 'РђСЃР»РёРґРґРёРЅ', '+7 900 000-00-02', true),
  (3, 'Р”Р¶Р°РјС€РµРґ', '+7 900 000-00-03', true)
on conflict (number) do update set
  name = excluded.name,
  phone = excluded.phone,
  is_active = excluded.is_active;

alter table public.drivers enable row level security;
alter table public.driver_status enable row level security;

drop policy if exists "public read drivers" on public.drivers;
create policy "public read drivers"
on public.drivers
for select
to anon, authenticated
using (true);

drop policy if exists "public read driver status" on public.driver_status;
create policy "public read driver status"
on public.driver_status
for select
to anon, authenticated
using (true);

create or replace function public.update_driver_status_simple(
  p_driver_id bigint,
  p_status text,
  p_location_text text,
  p_lat double precision default null,
  p_lon double precision default null,
  p_is_collecting_in_russia boolean default false,
  p_collect_until_date date default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.driver_status (
    driver_id,
    status,
    location_text,
    lat,
    lon,
    is_collecting_in_russia,
    collect_until_date,
    updated_at
  )
  values (
    p_driver_id,
    p_status,
    p_location_text,
    p_lat,
    p_lon,
    p_is_collecting_in_russia,
    p_collect_until_date,
    now()
  )
  on conflict (driver_id) do update set
    status = excluded.status,
    location_text = excluded.location_text,
    lat = excluded.lat,
    lon = excluded.lon,
    is_collecting_in_russia = excluded.is_collecting_in_russia,
    collect_until_date = excluded.collect_until_date,
    updated_at = now();

  return;
end;
$$;

grant execute on function public.update_driver_status_simple(
  bigint,
  text,
  text,
  double precision,
  double precision,
  boolean,
  date
) to anon, authenticated;
```

## 3. SQL-РїР°С‚С‡ РґР»СЏ СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РµР№ Р±Р°Р·С‹

Р•СЃР»Рё РїСЂРѕРµРєС‚ СѓР¶Рµ СЃРѕР·РґР°РЅ Рё С‚Р°Р±Р»РёС†С‹ СѓР¶Рµ РµСЃС‚СЊ, Р° Р»РѕРјР°РµС‚СЃСЏ Р·Р°РіСЂСѓР·РєР° РёР»Рё РѕР±РЅРѕРІР»РµРЅРёРµ, РІС‹РїРѕР»РЅРёС‚Рµ СЌС‚Рѕ:

```sql
alter table public.driver_status
add column if not exists collect_until_date date null;

create or replace function public.update_driver_status_simple(
  p_driver_id bigint,
  p_status text,
  p_location_text text,
  p_lat double precision default null,
  p_lon double precision default null,
  p_is_collecting_in_russia boolean default false,
  p_collect_until_date date default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.driver_status (
    driver_id,
    status,
    location_text,
    lat,
    lon,
    is_collecting_in_russia,
    collect_until_date,
    updated_at
  )
  values (
    p_driver_id,
    p_status,
    p_location_text,
    p_lat,
    p_lon,
    p_is_collecting_in_russia,
    p_collect_until_date,
    now()
  )
  on conflict (driver_id) do update set
    status = excluded.status,
    location_text = excluded.location_text,
    lat = excluded.lat,
    lon = excluded.lon,
    is_collecting_in_russia = excluded.is_collecting_in_russia,
    collect_until_date = excluded.collect_until_date,
    updated_at = now();
end;
$$;

grant execute on function public.update_driver_status_simple(
  bigint,
  text,
  text,
  double precision,
  double precision,
  boolean,
  date
) to anon, authenticated;
```

## 4. РљР°Рє РѕС‚РєР»СЋС‡РёС‚СЊ Р»РёС€РЅРµРіРѕ РІРѕРґРёС‚РµР»СЏ

Р•СЃР»Рё РѕРґРёРЅ РІРѕРґРёС‚РµР»СЊ Р±РѕР»СЊС€Рµ РЅРµ СЂР°Р±РѕС‚Р°РµС‚ РІ РїСЂРѕРµРєС‚Рµ, РЅРµ РЅСѓР¶РЅРѕ РјРµРЅСЏС‚СЊ HTML РІСЂСѓС‡РЅСѓСЋ. Р”РѕСЃС‚Р°С‚РѕС‡РЅРѕ РІ Supabase:

```sql
update public.drivers
set is_active = false
where number = 4;
```

РР»Рё РїРѕ РёРјРµРЅРё:

```sql
update public.drivers
set is_active = false
where name = 'Р­СЂР°С‡';
```

## 5. РљР°Рє РІСЃС‚Р°РІРёС‚СЊ URL Рё РєР»СЋС‡ РІ `supabase.js`

РћС‚РєСЂРѕР№С‚Рµ [supabase.js](/D:/codex/Р±РѕСЂ/supabase.js) Рё Р·Р°РјРµРЅРёС‚Рµ:

```js
export const SUPABASE_URL = "PASTE_YOUR_SUPABASE_URL";
export const SUPABASE_ANON_KEY = "PASTE_YOUR_SUPABASE_ANON_KEY";
```

РЅР° СЂРµР°Р»СЊРЅС‹Рµ Р·РЅР°С‡РµРЅРёСЏ РёР· РІР°С€РµРіРѕ РїСЂРѕРµРєС‚Р° Supabase.

Р’Р°Р¶РЅРѕ:

- РІ Р±СЂР°СѓР·РµСЂ РјРѕР¶РЅРѕ РІСЃС‚Р°РІР»СЏС‚СЊ С‚РѕР»СЊРєРѕ `Publishable key` РёР»Рё `anon public key`
- `service_role` Рё `secret key` РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РЅРµР»СЊР·СЏ

## 6. РљР°Рє Р·Р°РїСѓСЃС‚РёС‚СЊ Р»РѕРєР°Р»СЊРЅРѕ

```powershell
cd D:\codex\Р±РѕСЂ
py -m http.server 8080
```

РџРѕСЃР»Рµ СЌС‚РѕРіРѕ РѕС‚РєСЂРѕР№С‚Рµ:

- [http://localhost:8080/index.html](http://localhost:8080/index.html)
- [http://localhost:8080/driver.html?driver_number=1](http://localhost:8080/driver.html?driver_number=1)

## 7. РљР°Рє РѕРїСѓР±Р»РёРєРѕРІР°С‚СЊ РЅР° GitHub Pages

1. Р—Р°РіСЂСѓР·РёС‚Рµ РІСЃРµ С„Р°Р№Р»С‹ РёР· СЌС‚РѕР№ РїР°РїРєРё РІ СЂРµРїРѕР·РёС‚РѕСЂРёР№.
2. РћС‚РєСЂРѕР№С‚Рµ `Settings -> Pages`.
3. Р’С‹Р±РµСЂРёС‚Рµ `Deploy from a branch`.
4. Р’С‹Р±РµСЂРёС‚Рµ РІРµС‚РєСѓ `main` Рё РїР°РїРєСѓ `/(root)`.
5. Р”РѕР¶РґРёС‚РµСЃСЊ РїСѓР±Р»РёРєР°С†РёРё.

Р’Р°Р¶РЅРѕ:

- РїСЂРё РёР·РјРµРЅРµРЅРёРё `service-worker.js` Р·Р°РіСЂСѓР·РёС‚Рµ Рё РµРіРѕ С‚РѕР¶Рµ
- РїРѕСЃР»Рµ РїСѓР±Р»РёРєР°С†РёРё Р»СѓС‡С€Рµ РѕР±РЅРѕРІРёС‚СЊ СЃС‚СЂР°РЅРёС†Сѓ С‡РµСЂРµР· `Ctrl+F5`
- РїРѕСЃР»Рµ Р·Р°РјРµРЅС‹ РёРєРѕРЅРєРё РёР»Рё manifest РЅР° С‚РµР»РµС„РѕРЅРµ Р»СѓС‡С€Рµ СѓРґР°Р»РёС‚СЊ СЃС‚Р°СЂСѓСЋ РёРєРѕРЅРєСѓ СЃР°Р№С‚Р° Рё РґРѕР±Р°РІРёС‚СЊ СЃР°Р№С‚ Р·Р°РЅРѕРІРѕ

## 8. РЎРєСЂС‹С‚С‹Р№ СЂРµР¶РёРј РєРѕРѕСЂРґРёРЅР°С‚РѕСЂР°

РЎР»СѓР¶РµР±РЅР°СЏ СЃСЃС‹Р»РєР°:

- `driver.html?admin=1`

Р§С‚Рѕ РґР°РµС‚ СЌС‚РѕС‚ СЂРµР¶РёРј:

- РјРѕР¶РЅРѕ РІС‹Р±СЂР°С‚СЊ Р»СЋР±РѕРіРѕ Р°РєС‚РёРІРЅРѕРіРѕ РІРѕРґРёС‚РµР»СЏ РёР· СЃРїРёСЃРєР°
- РјРѕР¶РЅРѕ Р±С‹СЃС‚СЂРѕ РїРµСЂРµР№С‚Рё РЅР° Р»РёС‡РЅСѓСЋ СЃСЃС‹Р»РєСѓ Р°РєС‚РёРІРЅРѕРіРѕ РІРѕРґРёС‚РµР»СЏ
- РїРѕР»РµР·РЅРѕ РєР°Рє СЂРµР·РµСЂРІРЅС‹Р№ СЂРµР¶РёРј, РµСЃР»Рё РІРѕРґРёС‚РµР»СЊ СЃР°Рј РЅРµ РјРѕР¶РµС‚ РѕР±РЅРѕРІРёС‚СЊСЃСЏ

## 9. РљР°Рє СЂР°Р±РѕС‚Р°РµС‚ СЃР»Р°Р±С‹Р№ РёРЅС‚РµСЂРЅРµС‚

- РµСЃР»Рё РїСѓР±Р»РёС‡РЅР°СЏ СЃС‚СЂР°РЅРёС†Р° РЅРµ СЃРјРѕРіР»Р° РґРѕСЃС‚СѓС‡Р°С‚СЊСЃСЏ РґРѕ Supabase, РѕРЅР° РїРѕРєР°Р·С‹РІР°РµС‚ РїРѕСЃР»РµРґРЅРёРµ СЃРѕС…СЂР°РЅРµРЅРЅС‹Рµ РґР°РЅРЅС‹Рµ СЃ СЌС‚РѕРіРѕ СѓСЃС‚СЂРѕР№СЃС‚РІР°
- РµСЃР»Рё РЅР° СЃС‚СЂР°РЅРёС†Рµ РІРѕРґРёС‚РµР»СЏ СЃРІСЏР·СЊ РїСЂРѕРїР°Р»Р°, РѕР±РЅРѕРІР»РµРЅРёРµ СЃРѕС…СЂР°РЅСЏРµС‚СЃСЏ Р»РѕРєР°Р»СЊРЅРѕ
- РєРѕРіРґР° СЃРІСЏР·СЊ РїРѕСЏРІР»СЏРµС‚СЃСЏ, СЃС‚СЂР°РЅРёС†Р° РїСЂРѕР±СѓРµС‚ РѕС‚РїСЂР°РІРёС‚СЊ СЃРѕС…СЂР°РЅРµРЅРЅС‹Рµ РґР°РЅРЅС‹Рµ
- РµСЃР»Рё РІРѕРґРёС‚РµР»СЊ РЅРµСЃРєРѕР»СЊРєРѕ СЂР°Р· РјРµРЅСЏРµС‚ СЃС‚Р°С‚СѓСЃ Р±РµР· СЃРІСЏР·Рё, РІ Р»РѕРєР°Р»СЊРЅРѕР№ РѕС‡РµСЂРµРґРё РѕСЃС‚Р°РµС‚СЃСЏ С‚РѕР»СЊРєРѕ РµРіРѕ РїРѕСЃР»РµРґРЅРµРµ РѕР±РЅРѕРІР»РµРЅРёРµ

## Р§С‚Рѕ РѕСЃС‚Р°Р»РѕСЃСЊ СѓРїСЂРѕС‰РµРЅРЅС‹Рј

- РЅРµС‚ РїРѕР»РЅРѕС†РµРЅРЅРѕР№ Р°РІС‚РѕСЂРёР·Р°С†РёРё
- РЅРµС‚ РёСЃС‚РѕСЂРёРё РІСЃРµС… СЃС‚Р°С‚СѓСЃРѕРІ
- РЅРµС‚ РєР°СЂС‚ Рё live tracking
- Р»РѕРєР°Р»СЊРЅР°СЏ РѕС‡РµСЂРµРґСЊ Рё РєСЌС€ РїСЂРёРІСЏР·Р°РЅС‹ Рє РєРѕРЅРєСЂРµС‚РЅРѕРјСѓ С‚РµР»РµС„РѕРЅСѓ РёР»Рё Р±СЂР°СѓР·РµСЂСѓ

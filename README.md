# Простой трекер 4 водителей

Очень простой статический проект на `HTML + CSS + Vanilla JavaScript` с публикацией на GitHub Pages и хранением данных в Supabase.

Проект сделан под слабый интернет:

- страницы кэшируются через service worker
- публичная страница показывает последние сохраненные данные с устройства, если сеть слабая
- на странице водителя есть локальная очередь неотправленных обновлений
- для каждого водителя в очереди хранится только последнее неотправленное обновление
- черновик формы сохраняется на устройстве
- если связь пропала, обновление не теряется

## Структура проекта

```text
index.html
driver.html
styles.css
app.js
driver.js
supabase.js
service-worker.js
site.webmanifest
icons/
README.md
.nojekyll
```

## Что делает текущая версия

- показывает 4 карточки водителей на публичной странице
- выводит имя, телефон, статус, местоположение и время последнего обновления
- подсвечивает свежесть статуса цветом
- автообновляет публичную страницу раз в 60 секунд
- использует личные ссылки водителей вида `driver.html?driver_number=1`
- скрывает выбор водителя на личной ссылке
- не требует кода доступа
- поддерживает `navigator.geolocation` для сохранения `lat/lon`
- поддерживает скрытый режим координатора `driver.html?admin=1`
- кэширует статические файлы и последние данные для слабого интернета
- сохраняет неотправленные обновления локально и отправляет их позже
- может устанавливаться на телефон как легкое PWA-приложение

## Водители

- `1` — Ахлиддин
- `2` — Аслиддин
- `3` — Джамшед

## Шаблоны мест

Общие точки:

- сбор в России — `ВДНХ`
- разгрузка в России — `Есенина 109`
- маршрут — `Узбекистон`
- маршрут — `Казок`

Персональные точки в Шайдоне:

- Ахлиддин — `Гаражи Зариф (кумур фуруш)`
- Аслиддин — `Се кучаги лаби сой`
- Джамшед — `Назди Азизхуча`

## 1. Как создать проект Supabase

1. Зайдите на [https://supabase.com/](https://supabase.com/) и создайте проект.
2. Откройте `Project Settings -> API`.
3. Скопируйте:
   - `Project URL`
   - `Publishable key` или `anon public key`
4. Откройте `SQL Editor` и выполните SQL ниже.

## 2. SQL для таблиц и функции обновления

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
  updated_at timestamptz not null default now()
);

insert into public.drivers (number, name, phone)
values
  (1, 'Ахлиддин', '+7 900 000-00-01'),
  (2, 'Аслиддин', '+7 900 000-00-02'),
  (3, 'Джамшед', '+7 900 000-00-03')
on conflict (number) do update set
  name = excluded.name,
  phone = excluded.phone;

-- удалить водителя №4 (Эрач) и его статус
delete from public.drivers
where number = 4;

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
  p_is_collecting_in_russia boolean default false
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
    updated_at
  )
  values (
    p_driver_id,
    p_status,
    p_location_text,
    p_lat,
    p_lon,
    p_is_collecting_in_russia,
    now()
  )
  on conflict (driver_id) do update set
    status = excluded.status,
    location_text = excluded.location_text,
    lat = excluded.lat,
    lon = excluded.lon,
    is_collecting_in_russia = excluded.is_collecting_in_russia,
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
  boolean
) to anon, authenticated;
```

## 3. Как вставить URL и ключ в `supabase.js`

Откройте [supabase.js](/D:/codex/бор/supabase.js) и замените:

```js
export const SUPABASE_URL = "PASTE_YOUR_SUPABASE_URL";
export const SUPABASE_ANON_KEY = "PASTE_YOUR_SUPABASE_ANON_KEY";
```

на реальные значения из вашего проекта Supabase.

Важно:

- в браузер можно вставлять только `Publishable key` или `anon public key`
- `service_role` и `secret key` использовать нельзя

## 4. Как запустить локально

Пример для Windows:

```powershell
cd D:\codex\бор
py -m http.server 8080
```

После этого откройте:

- [http://localhost:8080/index.html](http://localhost:8080/index.html)
- [http://localhost:8080/driver.html?driver_number=1](http://localhost:8080/driver.html?driver_number=1)

## 5. Как опубликовать на GitHub Pages

1. Загрузите все файлы из этой папки в репозиторий.
2. Откройте `Settings -> Pages`.
3. Выберите `Deploy from a branch`.
4. Выберите ветку `main` и папку `/(root)`.
5. Дождитесь публикации.

Важно:

- при изменении `service-worker.js` загрузите и его тоже
- при первом обновлении PWA лучше загрузить также `site.webmanifest` и папку `icons`
- после публикации лучше обновить страницу через `Ctrl+F5`

## 6. Как установить на телефон

После публикации на GitHub Pages:

1. Откройте сайт в браузере телефона.
2. В Chrome нажмите `Добавить на главный экран`.
3. В Safari нажмите `Поделиться -> На экран Домой`.
4. После установки сайт будет открываться как отдельное легкое приложение.

Что это дает:

- быстрее открыть страницу водителя
- лучше работает кэш при слабом интернете
- удобнее держать под рукой личную ссылку или страницу клиента

## 7. Как заменить логотип приложения

Если хотите использовать свой реальный логотип для иконки на рабочем экране:

1. Положите исходный PNG в папку `icons` под именем `source-logo.png`.
2. Запустите:

```powershell
powershell -ExecutionPolicy Bypass -File .\icons\build-icons.ps1
```

3. Скрипт сам создаст:
   - `icon-16.png`
   - `icon-32.png`
   - `apple-touch-icon.png`
   - `icon-192.png`
   - `icon-512.png`
4. Загрузите эти файлы в GitHub Pages.
   Эти иконки должны лежать в корне сайта рядом с `index.html`:
   - `icon-16.png`
   - `icon-32.png`
   - `apple-touch-icon.png`
   - `icon-192.png`
   - `icon-512.png`
5. После публикации удалите старую иконку сайта с телефона и добавьте сайт на экран заново.

Важно:

- исходный логотип лучше использовать квадратный PNG
- если логотип не квадратный, скрипт аккуратно впишет его в квадрат без обрезки

## Личные ссылки водителей

- Ахлиддин — `driver.html?driver_number=1`
- Аслиддин — `driver.html?driver_number=2`
- Джамшед — `driver.html?driver_number=3`

## Скрытый режим координатора

Служебная ссылка:

- `driver.html?admin=1`

Что даёт этот режим:

- можно выбрать любого водителя из списка
- можно быстро перейти на личную ссылку любого водителя
- полезно как резервный режим, если водитель сам не может обновиться

## Как работает слабый интернет

- если публичная страница не смогла достучаться до Supabase, она показывает последние сохраненные данные с этого устройства
- если на странице водителя связь пропала, обновление сохраняется локально
- когда связь появляется, страница пробует отправить сохраненные данные
- если водитель несколько раз меняет статус без связи, в локальной очереди остается только его последнее обновление

## Что осталось упрощенным

- нет полноценной авторизации
- нет истории всех статусов
- нет карт и live tracking
- локальная очередь и кэш привязаны к конкретному телефону или браузеру

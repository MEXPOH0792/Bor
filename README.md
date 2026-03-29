# Простой трекер 4 водителей

Очень простой статический проект на `HTML + CSS + Vanilla JavaScript` с публикацией на GitHub Pages и хранением данных в Supabase.

Проект состоит из двух страниц:

- `index.html` — публичная страница для клиентов
- `driver.html` — страница, где водитель вручную обновляет свой статус

## Структура проекта

```text
index.html
driver.html
styles.css
app.js
driver.js
supabase.js
README.md
.nojekyll
```

## Что делает MVP

- показывает 4 карточки водителей на публичной странице
- выводит имя, телефон, статус, текстовое местоположение и время последнего обновления
- подсвечивает свежесть статуса цветом
- автообновляет публичную страницу раз в 60 секунд
- позволяет водителю выбрать себя, ввести код доступа, статус и место
- поддерживает `navigator.geolocation` для сохранения `lat/lon` в базе
- не показывает координаты клиентам, только хранит их на будущее

## 1. Как создать проект Supabase

1. Зайдите в [https://supabase.com/](https://supabase.com/) и создайте новый проект.
2. После создания откройте `Project Settings -> API`.
3. Скопируйте:
   - `Project URL`
   - `anon public key`
4. Откройте SQL Editor и выполните SQL ниже.

## 2. Как создать таблицы и начальные данные

Ниже SQL для максимально простой структуры.

Особенности решения:

- таблица `drivers` хранит водителей
- таблица `driver_status` хранит одну текущую запись на водителя
- поле `driver_id` в `driver_status` сделано `unique`, поэтому статус просто обновляется через `upsert`
- добавлена таблица `driver_access_codes` для простого кода доступа
- добавлена RPC-функция `update_driver_status_with_code`, чтобы не давать прямую запись в таблицу через anon key

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

create table if not exists public.driver_access_codes (
  driver_id bigint primary key references public.drivers(id) on delete cascade,
  access_code text not null
);

insert into public.drivers (number, name, phone)
values
  (1, 'Водитель 1', '+7 900 000-00-01'),
  (2, 'Водитель 2', '+7 900 000-00-02'),
  (3, 'Водитель 3', '+7 900 000-00-03'),
  (4, 'Водитель 4', '+7 900 000-00-04')
on conflict (number) do update set
  name = excluded.name,
  phone = excluded.phone;

insert into public.driver_access_codes (driver_id, access_code)
select id, code_value
from (
  values
    (1, '1111'),
    (2, '2222'),
    (3, '3333'),
    (4, '4444')
) as seed(driver_number, code_value)
join public.drivers d on d.number = seed.driver_number
on conflict (driver_id) do update set
  access_code = excluded.access_code;

alter table public.drivers enable row level security;
alter table public.driver_status enable row level security;
alter table public.driver_access_codes enable row level security;

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

create or replace function public.update_driver_status_with_code(
  p_driver_id bigint,
  p_access_code text,
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
declare
  existing_code text;
begin
  select access_code
  into existing_code
  from public.driver_access_codes
  where driver_id = p_driver_id;

  if existing_code is null then
    raise exception 'Код доступа для водителя не найден';
  end if;

  if existing_code <> p_access_code then
    raise exception 'Неверный код доступа';
  end if;

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

grant execute on function public.update_driver_status_with_code(
  bigint,
  text,
  text,
  text,
  double precision,
  double precision,
  boolean
) to anon, authenticated;
```

## 3. Как вставить URL и anon key в `supabase.js`

Откройте файл `supabase.js` и замените:

```js
export const SUPABASE_URL = "PASTE_YOUR_SUPABASE_URL";
export const SUPABASE_ANON_KEY = "PASTE_YOUR_SUPABASE_ANON_KEY";
```

на реальные значения из вашего проекта Supabase.

## 4. Как запустить локально

Статические файлы лучше открывать через локальный сервер, а не напрямую через `file://`.

Пример для Windows:

```powershell
cd D:\codex\бор
py -m http.server 8080
```

После этого откройте:

- [http://localhost:8080/index.html](http://localhost:8080/index.html)
- [http://localhost:8080/driver.html](http://localhost:8080/driver.html)

Важно:

- геолокация обычно работает только на `localhost` или по `https`
- если открыть HTML-файл напрямую двойным кликом, часть функций браузера может работать нестабильно

## 5. Как опубликовать на GitHub Pages

1. Создайте отдельный GitHub-репозиторий.
2. Загрузите в корень репозитория все файлы из этой папки.
3. В настройках GitHub откройте `Settings -> Pages`.
4. Включите публикацию из ветки `main` и папки `/root`.
5. Дождитесь публикации сайта.

После публикации:

- `index.html` станет публичной страницей для клиентов
- `driver.html` можно отправить водителям как отдельную ссылку
- можно сразу давать ссылки вида `driver.html?driver_id=1`

## Минимальная защита

В этой версии сделана только очень простая защита:

- у каждого водителя есть короткий код доступа
- код проверяется в Supabase через RPC-функцию
- прямую запись в `driver_status` через анонимный ключ проект не использует

Это не полноценная авторизация. Для MVP этого достаточно, но позже лучше добавить:

- отдельные одноразовые ссылки или magic link
- логирование изменений
- историю статусов
- отдельные роли пользователей

## Как тестировать

1. Укажите реальные `SUPABASE_URL` и `SUPABASE_ANON_KEY` в `supabase.js`.
2. Выполните SQL из раздела выше в Supabase.
3. Откройте `driver.html`.
4. Выберите водителя, например `Водитель 1`.
5. Введите его код, например `1111`.
6. Выберите статус и напишите местоположение.
7. Нажмите `Обновить`.
8. Откройте `index.html` и проверьте карточку.
9. Проверьте цвет свежести:
   - меньше 2 часов — зеленый
   - от 2 до 8 часов — желтый
   - больше 8 часов — красный

## Что осталось упрощенным

- нет полноценной системы авторизации
- нет истории перемещений, хранится только один текущий статус
- нет карты и live tracking
- нет push-обновлений, только ручная кнопка и обновление раз в 60 секунд
- коды доступа простые и подходят только для первой версии

-- Rode isto no SQL Editor do Supabase (uma vez).
-- Em Authentication > Providers deixe "Email" ligado.
-- Para testar rápido, desligue "Confirm email"; em produção, deixe ligado.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  created_at timestamptz not null default now()
);

create table public.scores (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  mode text not null check (mode in ('country', 'city')),
  day int not null,
  tries int not null check (tries between 1 and 20),
  score int not null,
  won boolean not null,
  created_at timestamptz not null default now(),
  unique (user_id, mode, day),
  -- a pontuação precisa bater com a regra: 1000 - 50 por palpite extra
  check (score = case when won then greatest(0, 1000 - 50 * (tries - 1)) else 0 end)
);

-- cria o perfil automaticamente no cadastro
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 6)));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ranking geral
create view public.leaderboard as
  select p.username, sum(s.score)::int as total, count(*)::int as games
  from public.scores s join public.profiles p on p.id = s.user_id
  group by p.username;

-- segurança (RLS)
alter table public.profiles enable row level security;
alter table public.scores enable row level security;

create policy "perfis são públicos" on public.profiles for select using (true);
create policy "editar o próprio perfil" on public.profiles for update using (auth.uid() = id);

create policy "pontuações são públicas" on public.scores for select using (true);
create policy "salvar a própria pontuação" on public.scores for insert with check (auth.uid() = user_id);
-- sem update/delete: cada dia só conta uma vez

grant select on public.leaderboard to anon, authenticated;

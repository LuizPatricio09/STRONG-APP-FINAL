-- =============================================
-- STRONG APP 2 — Supabase Migration
-- Execute no SQL Editor do painel do Supabase
-- =============================================

-- Tabela de treinos
CREATE TABLE IF NOT EXISTS public.treinos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  date        TEXT NOT NULL,
  dia_semana  INTEGER,
  nome_dia    TEXT,
  exercises   JSONB NOT NULL DEFAULT '[]',
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS treinos_user_id_idx ON public.treinos(user_id);
CREATE INDEX IF NOT EXISTS treinos_date_idx ON public.treinos(date);

-- Row Level Security: cada usuário vê só os próprios treinos
ALTER TABLE public.treinos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário lê seus treinos"
  ON public.treinos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário insere seus treinos"
  ON public.treinos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário deleta seus treinos"
  ON public.treinos FOR DELETE
  USING (auth.uid() = user_id);

-- Habilitar Realtime para a tabela treinos
ALTER PUBLICATION supabase_realtime ADD TABLE public.treinos;

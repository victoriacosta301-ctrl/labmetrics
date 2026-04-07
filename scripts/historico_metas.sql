-- Tabela de snapshots mensais de metas
-- Execute este script no Supabase SQL Editor
-- Nenhum dado existente será alterado

CREATE TABLE IF NOT EXISTS historico_metas (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  mes TEXT NOT NULL,             -- "2026-03" (ano-mês)
  setor_id TEXT DEFAULT NULL,    -- NULL = metas globais, valor = metas do setor
  xd INT, xs INT, xm INT,
  xpd INT, xps INT, xpm INT,
  md INT, ms INT, mm INT,
  mpd INT, mps INT, mpm INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(mes, setor_id)
);

-- Permitir leitura/escrita via anon key (RLS)
ALTER TABLE historico_metas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon" ON historico_metas
  FOR ALL
  USING (true)
  WITH CHECK (true);

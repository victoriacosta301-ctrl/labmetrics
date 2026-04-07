-- Adicionar colunas de Meta Mínima (Mensal) nas tabelas de configurações

ALTER TABLE config ADD COLUMN IF NOT EXISTS nm integer DEFAULT 330;
ALTER TABLE config ADD COLUMN IF NOT EXISTS npm integer DEFAULT 30;

ALTER TABLE scfg ADD COLUMN IF NOT EXISTS nm integer;
ALTER TABLE scfg ADD COLUMN IF NOT EXISTS npm integer;

ALTER TABLE historico_metas ADD COLUMN IF NOT EXISTS nm integer;
ALTER TABLE historico_metas ADD COLUMN IF NOT EXISTS npm integer;

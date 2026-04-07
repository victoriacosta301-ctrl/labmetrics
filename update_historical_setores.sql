-- Migration: Add colaboradores to historico_metas to preserve historical sector assignments
ALTER TABLE historico_metas ADD COLUMN IF NOT EXISTS colaboradores jsonb;

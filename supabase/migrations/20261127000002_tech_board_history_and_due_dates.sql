-- Migration: Kanban - prazos, histórico de movimentações e comentários
-- Description:
--   1. tech_board_cards ganha due_date (prazo), started_at e completed_at
--   2. tech_board_card_events: histórico do card (criação, mudança de coluna,
--      responsável, prazo) e comentários do time, sempre com data/hora

ALTER TABLE public.tech_board_cards
    ADD COLUMN IF NOT EXISTS due_date DATE,
    ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_tech_board_cards_due_date ON public.tech_board_cards(due_date);

CREATE TABLE IF NOT EXISTS public.tech_board_card_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES public.tech_board_cards(id) ON DELETE CASCADE,
    event_type VARCHAR(20) NOT NULL
        CHECK (event_type IN ('CREATED', 'MOVED', 'ASSIGNED', 'DUE_DATE', 'EDITED', 'COMMENT')),
    author_name VARCHAR(255),
    from_value VARCHAR(255),
    to_value VARCHAR(255),
    body TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tech_board_card_events_card ON public.tech_board_card_events(card_id, created_at);

ALTER TABLE public.tech_board_card_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for service role" ON public.tech_board_card_events
    FOR ALL USING (auth.role() = 'service_role');

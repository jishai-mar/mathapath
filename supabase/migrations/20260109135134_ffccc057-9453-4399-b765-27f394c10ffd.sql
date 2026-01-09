-- Drop existing check constraint and add updated one that includes topic-overview
ALTER TABLE public.theory_blocks DROP CONSTRAINT IF EXISTS theory_blocks_block_type_check;

ALTER TABLE public.theory_blocks ADD CONSTRAINT theory_blocks_block_type_check 
  CHECK (block_type IN ('definition', 'theorem', 'property', 'method', 'visual', 'worked-example', 'proof', 'remark', 'common-mistake', 'deep-dive', 'topic-overview'));
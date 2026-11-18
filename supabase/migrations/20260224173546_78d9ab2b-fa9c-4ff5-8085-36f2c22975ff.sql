
-- Replace individual boolean columns with a single accelerator column
ALTER TABLE public.companies ADD COLUMN accelerator text;
ALTER TABLE public.companies DROP COLUMN is_yc;
ALTER TABLE public.companies DROP COLUMN is_ef;
ALTER TABLE public.companies DROP COLUMN is_neo;

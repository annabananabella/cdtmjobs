
-- Add stage column to job_listings
ALTER TABLE public.job_listings ADD COLUMN stage text;

-- Add affiliation columns to companies
ALTER TABLE public.companies ADD COLUMN is_yc boolean NOT NULL DEFAULT false;
ALTER TABLE public.companies ADD COLUMN is_ef boolean NOT NULL DEFAULT false;
ALTER TABLE public.companies ADD COLUMN is_neo boolean NOT NULL DEFAULT false;

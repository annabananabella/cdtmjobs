
-- Companies table (identified by email for returning)
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Anyone can create a company
CREATE POLICY "Anyone can insert companies" ON public.companies FOR INSERT WITH CHECK (true);
-- Anyone can view companies
CREATE POLICY "Anyone can view companies" ON public.companies FOR SELECT USING (true);
-- Anyone can update companies (by email verification)
CREATE POLICY "Anyone can update companies" ON public.companies FOR UPDATE USING (true);

-- Job listings table
CREATE TABLE public.job_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  job_url TEXT NOT NULL,
  work_mode TEXT NOT NULL CHECK (work_mode IN ('remote', 'hybrid', 'onsite')),
  location TEXT,
  salary TEXT,
  equity TEXT,
  cdtm_only BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert job listings" ON public.job_listings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view job listings" ON public.job_listings FOR SELECT USING (true);
CREATE POLICY "Anyone can update job listings" ON public.job_listings FOR UPDATE USING (true);

-- Subscribers table
CREATE TABLE public.subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  is_cdtm BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe" ON public.subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view subscribers" ON public.subscribers FOR SELECT USING (true);
CREATE POLICY "Anyone can update subscribers" ON public.subscribers FOR UPDATE USING (true);

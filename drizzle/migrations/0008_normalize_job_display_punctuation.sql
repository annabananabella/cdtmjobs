CREATE OR REPLACE FUNCTION public.normalize_job_display_punctuation() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE key text; fields text[]; patch jsonb := '{}'::jsonb; value text;
BEGIN
  fields := CASE WHEN TG_TABLE_NAME = 'companies' THEN ARRAY['name'] WHEN TG_TABLE_NAME = 'job_candidates' THEN ARRAY['company_name','job_title','description','location','salary','equity','stage','accelerator'] ELSE ARRAY['job_title','description','location','salary','equity','stage','accelerator'] END;
  FOREACH key IN ARRAY fields LOOP
    value := to_jsonb(NEW)->>key;
    IF value IS NOT NULL THEN
      patch := patch || jsonb_build_object(key, regexp_replace(value, '\s*(' || chr(8212) || '|&mdash;|&#8212;|&#x2014;)\s*', ' - ', 'gi'));
    END IF;
  END LOOP;
  NEW := jsonb_populate_record(NEW, patch);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.normalize_job_display_punctuation() FROM PUBLIC;
CREATE TRIGGER normalize_listing_display_punctuation BEFORE INSERT OR UPDATE ON public.job_listings FOR EACH ROW EXECUTE FUNCTION public.normalize_job_display_punctuation();
CREATE TRIGGER normalize_candidate_display_punctuation BEFORE INSERT OR UPDATE ON public.job_candidates FOR EACH ROW EXECUTE FUNCTION public.normalize_job_display_punctuation();
CREATE TRIGGER normalize_company_display_punctuation BEFORE INSERT OR UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.normalize_job_display_punctuation();
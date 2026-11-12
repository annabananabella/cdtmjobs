ALTER TABLE public.job_listings ADD COLUMN IF NOT EXISTS auto_extracted boolean NOT NULL DEFAULT false;
UPDATE public.job_listings l SET auto_extracted = true WHERE EXISTS (SELECT 1 FROM public.job_candidates c WHERE c.published_listing_id = l.id);
CREATE OR REPLACE FUNCTION public.mark_listing_auto_extracted() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.published_listing_id IS NOT NULL AND NEW.published_listing_id IS DISTINCT FROM OLD.published_listing_id THEN
    UPDATE public.job_listings SET auto_extracted = true WHERE id = NEW.published_listing_id;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.mark_listing_auto_extracted() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_mark_listing_auto_extracted AFTER UPDATE OF published_listing_id ON public.job_candidates FOR EACH ROW EXECUTE FUNCTION public.mark_listing_auto_extracted();
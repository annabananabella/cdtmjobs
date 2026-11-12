ALTER TABLE public.job_candidates ADD COLUMN IF NOT EXISTS sender_email text;

CREATE OR REPLACE FUNCTION public.mark_listing_auto_extracted()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.published_listing_id IS NOT NULL AND NEW.published_listing_id IS DISTINCT FROM OLD.published_listing_id THEN
    UPDATE public.job_listings SET auto_extracted = true WHERE id = NEW.published_listing_id;
    -- Notify only the direct sender of the email the job came from.
    IF NEW.sender_email IS NOT NULL THEN
      PERFORM public.admin_send_email(
        'job-published', NEW.sender_email,
        jsonb_build_object('firstName', public.person_name_from_email(NEW.sender_email),
                           'jobTitle', NEW.job_title, 'companyName', NEW.company_name),
        'job-published-' || NEW.id::text);
    END IF;
  END IF;
  RETURN NEW;
END $function$;
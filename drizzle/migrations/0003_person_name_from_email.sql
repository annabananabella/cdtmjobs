-- Derive a person's name from an email address, so reminder emails can greet the
-- contact by name without anyone typing it in.
--   jane.doe@example.com -> Jane Doe
--   lena@example.io         -> Lena
--   jd@samplecorp.example / info@samplecorp.example -> null (not a person / shared mailbox)
--
-- Mirrored in the app by src/lib/contact-name.ts, which shows the same name on
-- the review page next to the contact email field.

CREATE OR REPLACE FUNCTION public.person_name_from_email(p_email text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $fn$
DECLARE
  v_local text;
  v_brand text;
  v_words text[];
  v_word text;
  v_name text := '';
BEGIN
  IF p_email IS NULL OR position('@' in p_email) = 0 THEN
    RETURN NULL;
  END IF;

  v_local := lower(trim(p_email));
  v_brand := split_part(split_part(v_local, '@', 2), '.', 1);
  v_local := split_part(split_part(v_local, '@', 1), '+', 1);

  IF v_local = '' OR v_local ~ '[0-9]' THEN
    RETURN NULL;
  END IF;

  v_words := ARRAY(
    SELECT t.w
    FROM unnest(regexp_split_to_array(v_local, '[^a-z]+')) AS t(w)
    WHERE t.w <> ''
  );

  IF array_length(v_words, 1) IS NULL THEN
    RETURN NULL;
  END IF;

  -- Shared mailboxes are never a person's name.
  IF EXISTS (
    SELECT 1
    FROM unnest(v_words) AS t(w)
    WHERE t.w = ANY (ARRAY[
      'info','hello','hi','hey','contact','jobs','job','career','careers',
      'hiring','team','hr','humanresources','support','help','admin','office',
      'mail','email','feedback','privacy','legal','billing','finance',
      'accounting','sales','marketing','growth','press','media','talent',
      'recruiting','recruitment','people','founder','founders','ceo','studio',
      'general','all','everyone','newsletter','noreply','donotreply','no',
      'reply','postmaster','abuse','webmaster','root','test','example','demo',
      'mailerdaemon','mailer','bounce','unsubscribe','dev','eng','it','security'
    ])
  ) THEN
    RETURN NULL;
  END IF;

  -- Initials ("jd") or the company itself ("samplecorp@samplecorp.example") are not a name.
  IF array_length(v_words, 1) = 1
     AND (length(v_words[1]) < 3 OR v_words[1] = v_brand) THEN
    RETURN NULL;
  END IF;

  FOREACH v_word IN ARRAY v_words LOOP
    v_name := v_name
      || CASE WHEN v_name = '' THEN '' ELSE ' ' END
      || upper(left(v_word, 1)) || substring(v_word FROM 2);
  END LOOP;

  RETURN v_name;
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.person_name_from_email(text) TO service_role;

-- Allow company owners to update their own company
CREATE POLICY "Company owners can update their company"
ON public.companies
FOR UPDATE
TO authenticated
USING (lower(email) = public.current_user_email())
WITH CHECK (lower(email) = public.current_user_email());

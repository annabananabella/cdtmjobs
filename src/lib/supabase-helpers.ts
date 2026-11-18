import { supabase } from "@/integrations/supabase/client";

export async function findCompanyByEmail(email: string) {
  const { data, error } = await supabase
    .rpc("lookup_company_by_email", { lookup_email: email });
  if (error) throw error;
  // RPC returns an array; we want a single result or null
  return data && data.length > 0 ? data[0] : null;
}

export async function createCompany(name: string, email: string, affiliations?: { accelerator?: string }) {
  const { data, error } = await supabase
    .from("companies")
    .insert({ name, email, ...affiliations })
    .select()
    .single();
  if (error) throw error;
  return data;
}


export async function createJobListing(listing: {
  company_id: string;
  job_title: string;
  job_url: string;
  work_mode: string;
  location?: string;
  salary?: string;
  equity?: string;
  cdtm_only: boolean;
  stage?: string;
  description?: string;
  accelerator?: string;
}) {
  const { data, error } = await supabase
    .from("job_listings")
    .insert(listing)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteJobListing(id: string) {
  const { error } = await supabase
    .from("job_listings")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function toggleJobActive(id: string, is_active: boolean) {
  const { error } = await supabase
    .from("job_listings")
    .update({ is_active })
    .eq("id", id);
  if (error) throw error;
}

export async function subscribeEmail(email: string) {
  const lowerEmail = email.toLowerCase();
  const { data, error } = await supabase.functions.invoke("subscribe-newsletter", {
    body: { email: lowerEmail },
  });
  if (error) throw error;
  return { is_cdtm: Boolean(data?.is_cdtm) };
}


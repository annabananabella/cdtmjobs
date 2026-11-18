import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import type { Tables } from "@/integrations/supabase/types";
import { useAuthReady } from "@/hooks/use-auth-ready";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { personNameFromEmail } from "@/lib/contact-name";
import { AlertTriangle, Check, ChevronDown, ExternalLink, Loader2, Plus, Sparkles, X } from "lucide-react";

type Candidate = Tables<"job_candidates">;
type Company = { id: string; name: string; email: string; accelerator: string | null };
type Status = "pending" | "approved" | "rejected";

const NEW_COMPANY = "__new__";
const WORK_MODES = ["remote", "hybrid", "onsite"] as const;

async function autofillFromUrl(url: string) {
  const { data, error } = await supabase.functions.invoke("extract-job-details", {
    body: { url },
  });
  if (error || !data?.success || !data.data) return null;
  return data.data as Partial<Pick<Candidate, "job_title" | "description" | "location" | "salary" | "equity" | "work_mode">> & { contact_email?: string | null };
}

const AdminReview = () => {
  const { session, isReady } = useAuthReady();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) return;
    if (!session) { setIsAdmin(false); return; }
    setIsAdmin(null);
    setCheckError(null);
    supabase.rpc("is_admin").then(({ data, error }) => {
      if (error) {
        // Don't report a failed check as "no access": it usually means the
        // database migration for this page hasn't been applied yet.
        setCheckError(error.message);
        setIsAdmin(false);
        return;
      }
      setIsAdmin(data === true);
    });
  }, [isReady, session]);

  const signIn = async () => {
    await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/admin/review`,
      extraParams: { hd: "*", prompt: "select_account" },
    });
  };

  let body: React.ReactNode;
  if (!isReady || (session && isAdmin === null)) {
    body = <Loader2 className="animate-spin h-6 w-6 text-primary mx-auto" />;
  } else if (!session) {
    body = (
      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">Sign in to review job postings.</p>
        <Button onClick={signIn}>Sign in with Google</Button>
      </div>
    );
  } else if (checkError) {
    body = (
      <div className="text-center space-y-3 max-w-md mx-auto">
        <p className="text-sm text-foreground">Couldn't check admin rights for {session.user.email}.</p>
        <p className="text-xs text-muted-foreground">
          This usually means the database setup for this page hasn't been applied yet
          (migration <code>job_candidates_review_queue</code>).
        </p>
        <p className="text-xs text-muted-foreground break-words">Details: {checkError}</p>
      </div>
    );
  } else if (!isAdmin) {
    body = (
      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          {session.user.email} doesn't have access to this page.
        </p>
        <Button variant="outline" onClick={() => supabase.auth.signOut()}>Sign out</Button>
      </div>
    );
  } else {
    body = <ReviewQueue />;
  }

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <Header />
      <main className="container max-w-3xl mx-auto px-4 sm:px-6 py-10 relative z-10 w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-lg tracking-wider text-foreground">Job review</h1>
        </div>
        {body}
      </main>
      <div className="flex-1" />
      <Footer />
    </div>
  );
};

function ReviewQueue() {
  const { toast } = useToast();
  const [status, setStatus] = useState<Status>("pending");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [cands, comps] = await Promise.all([
      supabase
        .from("job_candidates")
        .select("*")
        .eq("status", status)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.rpc("admin_list_companies"),
    ]);
    if (cands.error) toast({ title: "Couldn't load jobs", description: cands.error.message, variant: "destructive" });
    setCandidates(cands.data ?? []);
    setCompanies((comps.data as Company[] | null) ?? []);
    setLoading(false);
  }, [status, toast]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={status} onValueChange={(v) => { setStatus(v as Status); setShowAdd(false); }}>
          <TabsList>
            <TabsTrigger value="pending">To review</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button size="sm" variant="outline" onClick={() => { setStatus("pending"); setShowAdd((s) => !s); }}>
          <Plus className="h-4 w-4 mr-1" /> Add jobs
        </Button>
      </div>

      {showAdd && status === "pending" && (
        <AddCandidateForm
          onAdded={() => { setStatus("pending"); void load(); }}
        />
      )}

      {loading ? (
        <Loader2 className="animate-spin h-6 w-6 text-primary mx-auto" />
      ) : candidates.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">
          {status === "pending" ? "Nothing to review right now." : "Nothing here yet."}
        </p>
      ) : (
        <div className="space-y-4">
          {status === "approved" ? candidates.map((c) => (
            <div key={c.id} className="border border-border/60 rounded-lg text-sm">
              <button
                type="button"
                onClick={() => setOpenId(openId === c.id ? null : c.id)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left"
              >
                <span>
                  <span className="text-foreground">{c.job_title ?? "Untitled role"}</span>
                  <span className="text-muted-foreground"> · {c.company_name ?? "Unknown company"}</span>
                </span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openId === c.id ? "rotate-180" : ""}`} />
              </button>
              {openId === c.id && (
                <div className="px-2 pb-2">
                  <CandidateCard candidate={c} companies={companies} onChanged={load} />
                </div>
              )}
            </div>
          )) : status === "rejected" ? candidates.map((c) => (
            <div key={c.id} className="border border-border/60 rounded-lg px-4 py-3 text-sm">
              <span className="text-foreground">{c.job_title ?? "Untitled role"}</span>
              <span className="text-muted-foreground"> · {c.company_name ?? "Unknown company"}</span>
            </div>
          )) : candidates.map((c) => (
            <CandidateCard key={c.id} candidate={c} companies={companies} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}

type ExtractResult = {
  success: boolean;
  error?: string;
  found: number;
  created: { id: string; job_title: string | null; company_name: string | null }[];
  skipped: { job_title: string | null; company_name: string | null; reason: string }[];
};

function AddCandidateForm({ onAdded }: { onAdded: () => void }) {
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<ExtractResult | null>(null);

  const extract = async () => {
    if (!text.trim()) return;
    setSaving(true);
    setResult(null);
    const { data, error } = await supabase.functions.invoke<ExtractResult>("extract-job-candidates", {
      body: { text: text.trim(), source: "manual" },
    });
    setSaving(false);
    if (error || !data?.success) {
      toast({
        title: "Couldn't read that message",
        description: data?.error ?? error?.message ?? "Please try again.",
        variant: "destructive",
      });
      return;
    }
    setResult(data);
    if (data.created.length > 0) {
      toast({ title: `Added ${data.created.length} job${data.created.length === 1 ? "" : "s"} to the review list` });
      setText("");
      onAdded();
    } else if (data.found === 0) {
      toast({ title: "No job openings found in that message" });
    } else {
      toast({ title: "Nothing new: all jobs were duplicates" });
    }
  };

  const label = (j: { job_title: string | null; company_name: string | null }) =>
    [j.job_title ?? "Untitled role", j.company_name].filter(Boolean).join(" @ ");

  return (
    <div className="border border-border/60 rounded-lg p-4 space-y-3">
      <div className="space-y-1">
        <Label htmlFor="add-text">Paste a message or a job link</Label>
        <Textarea
          id="add-text"
          rows={6}
          placeholder="Paste a Slack post, an email, or just a link. The agent finds every job in it."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <Button size="sm" onClick={extract} disabled={saving || !text.trim()}>
        {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
        {saving ? "Reading…" : "Find jobs"}
      </Button>
      {result && result.skipped.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-1">
          {result.skipped.map((s, i) => (
            <li key={i}>Skipped {label(s)}: {s.reason}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CandidateCard({
  candidate,
  companies,
  onChanged,
}: {
  candidate: Candidate;
  companies: Company[];
  onChanged: () => void;
}) {
  const { toast } = useToast();
  const [draft, setDraft] = useState<Candidate>(candidate);
  const [companyChoice, setCompanyChoice] = useState<string>(candidate.company_id ?? "");
  const [newCompanyEmail, setNewCompanyEmail] = useState("");
  const [busy, setBusy] = useState<null | "save" | "approve" | "reject" | "autofill">(null);
  const [duplicates, setDuplicates] = useState<{ job_title: string; company_name: string; is_active: boolean }[]>([]);
  const editable = candidate.status === "pending";

  useEffect(() => { setDraft(candidate); setCompanyChoice(candidate.company_id ?? ""); }, [candidate]);

  // Suggest an existing company whose name matches.
  useEffect(() => {
    if (companyChoice || !draft.company_name) return;
    const name = draft.company_name.trim().toLowerCase();
    const match = companies.find((c) => c.name.trim().toLowerCase() === name);
    if (match) setCompanyChoice(match.id);
  }, [companies, draft.company_name, companyChoice]);

  // Flag listings already on the board with the same link.
  useEffect(() => {
    const url = draft.job_url?.trim();
    if (!url || !editable) { setDuplicates([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase.rpc("admin_find_listing_by_url", { p_url: url });
      setDuplicates(data ?? []);
    }, 400);
    return () => clearTimeout(t);
  }, [draft.job_url, editable]);

  const set = <K extends keyof Candidate>(key: K, value: Candidate[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  useEffect(() => {
    if (companyChoice || !candidate.company_name) return;
    const base = (n: string) => n.toLowerCase().replace(/\([^)]*\)/g, "").replace(/[,.]?\s*\b(gmbh|ag|ug|inc|ltd|llc|se|co|corp)\b\.?/g, "").trim();
    const name = base(candidate.company_name);
    const match = companies
      .filter((c) => base(c.name) === name)
      .sort((a, b) => b.name.length - a.name.length)[0];
    if (match) setCompanyChoice(match.id);
  }, [companies, candidate.company_name, companyChoice]);
  const [linkBroken, setLinkBroken] = useState<number | null>(null);
  useEffect(() => {
    setLinkBroken(null);
    const url = candidate.job_url?.trim();
    if (!editable || !url) return;
    let cancelled = false;
    supabase.functions.invoke("extract-job-details", { body: { url, checkOnly: true } }).then(({ data }) => {
      if (!cancelled && data?.success && data.reachable === false) setLinkBroken(data.status ?? 0);
    });
    return () => { cancelled = true; };
  }, [candidate.job_url, editable]);
  const isNewCompany = companyChoice === NEW_COMPANY || !companyChoice;
  const selectedCompany = useMemo(() => companies.find((c) => c.id === companyChoice), [companies, companyChoice]);
  const contactName = useMemo(() => personNameFromEmail(newCompanyEmail), [newCompanyEmail]);

  // Check the role's preferred contact before asking the reviewer to supply one.
  useEffect(() => {
    const url = candidate.job_url?.trim();
    if (!editable || !isNewCompany || !url) return;
    let cancelled = false;
    autofillFromUrl(url).then((details) => {
      if (!cancelled && details?.contact_email) {
        const email = details.contact_email;
        setNewCompanyEmail((current) => current || email);
      }
    });
    return () => { cancelled = true; };
  }, [candidate.id, candidate.job_url, editable, isNewCompany]);

  const save = async () => {
    const { error } = await supabase
      .from("job_candidates")
      .update({
        job_title: draft.job_title?.trim() || null,
        job_url: draft.job_url?.trim() || null,
        company_name: isNewCompany ? draft.company_name?.trim() || null : selectedCompany?.name ?? null,
        company_id: isNewCompany ? null : companyChoice,
        work_mode: draft.work_mode,
        location: draft.location?.trim() || null,
        salary: draft.salary?.trim() || null,
        equity: draft.equity?.trim() || null,
        description: draft.description?.trim() || null,
        cdtm_only: draft.cdtm_only,
      })
      .eq("id", candidate.id);
    if (error) throw error;
  };

  const run = async (kind: "save" | "approve" | "reject", fn: () => Promise<void>, success: string) => {
    setBusy(kind);
    try {
      await fn();
      toast({ title: success });
      onChanged();
    } catch (e) {
      toast({ title: "Something went wrong", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const approve = () =>
    run("approve", async () => {
      if (isNewCompany && !newCompanyEmail.trim()) {
        throw new Error('This is a new company, so it needs a contact email. Fill in "Company contact email" before publishing.');
      }
      await save();
      const { error } = await supabase.rpc("approve_job_candidate", {
        p_candidate_id: candidate.id,
        p_new_company_email: isNewCompany ? newCompanyEmail.trim() || undefined : undefined,
      });
      if (error) throw error;
    }, "Published on the job board");

  const reject = () =>
    run("reject", async () => {
      const { error } = await supabase
        .from("job_candidates")
        .update({ status: "rejected", reviewed_at: new Date().toISOString() })
        .eq("id", candidate.id);
      if (error) throw error;
    }, "Rejected");

  const autofill = async () => {
    if (!draft.job_url) return;
    setBusy("autofill");
    const f = await autofillFromUrl(draft.job_url.trim());
    setBusy(null);
    if (!f) { toast({ title: "Couldn't read that page", variant: "destructive" }); return; }
    if (f.contact_email) setNewCompanyEmail((current) => current || f.contact_email || "");
    setDraft((d) => ({
      ...d,
      job_title: d.job_title || f.job_title || null,
      description: d.description || f.description || null,
      location: d.location || f.location || null,
      salary: d.salary || f.salary || null,
      equity: d.equity || f.equity || null,
      work_mode: d.work_mode || (f.work_mode && WORK_MODES.includes(f.work_mode as never) ? f.work_mode : null),
    }));
  };

  return (
    <div className="border border-border/60 rounded-lg p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary">{candidate.source}</Badge>
        <span>{new Date(candidate.created_at).toLocaleString()}</span>
        {candidate.source_ref?.startsWith("http") && (
          <a href={candidate.source_ref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
            original <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {candidate.reviewed_by && <span>· reviewed by {candidate.reviewed_by}</span>}
      </div>

      {candidate.source_text && (
        <blockquote className="text-xs text-muted-foreground border-l-2 border-border pl-3 whitespace-pre-wrap max-h-40 overflow-auto">
          {candidate.source_text}
        </blockquote>
      )}

      {duplicates.length > 0 && (
        <div className="flex items-start gap-2 text-xs text-amber-500">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Already on the board: {duplicates.map((d) => `${d.job_title} (${d.company_name}${d.is_active ? "" : ", inactive"})`).join("; ")}
          </span>
        </div>
      )}

      {editable && !draft.job_url?.trim() && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          No job link yet. Add one before publishing.
        </div>
      )}
      {editable && draft.job_url?.trim() && linkBroken !== null && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          This job link doesn't work{linkBroken ? ` (page returns ${linkBroken})` : ""}. The role may be closed or the link expired.
        </div>
      )}
      <fieldset disabled={!editable} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Job title">
          <Input value={draft.job_title ?? ""} onChange={(e) => set("job_title", e.target.value)} />
        </Field>
        <Field label="Job link">
          <div className="flex gap-2">
            <Input value={draft.job_url ?? ""} onChange={(e) => set("job_url", e.target.value)} />
            {editable && (
              <Button type="button" size="icon" variant="outline" onClick={autofill} disabled={!draft.job_url || busy !== null} title="Auto-fill from link">
                {busy === "autofill" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </Field>

        <Field label="Company">
          <div className="flex gap-2">
            {isNewCompany && (
              <Input
                className="flex-1"
                placeholder="Company name"
                value={draft.company_name ?? ""}
                onChange={(e) => set("company_name", e.target.value)}
              />
            )}
            <Select value={companyChoice || NEW_COMPANY} onValueChange={setCompanyChoice} disabled={!editable}>
              <SelectTrigger className={isNewCompany ? "w-28 shrink-0" : undefined}>
                {isNewCompany ? <span className="text-muted-foreground">existing…</span> : <SelectValue />}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NEW_COMPANY}>+ New company</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Field>
        <Field label="Work mode">
          <Select value={draft.work_mode ?? ""} onValueChange={(v) => set("work_mode", v)} disabled={!editable}>
            <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
            <SelectContent>
              {WORK_MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>

        {isNewCompany && (
          <>
            {editable && (
              <Field
                label="Company contact email (required)"
                hint={contactName
                  ? `we'll address the reminders to ${contactName}`
                  : "Gets the 'is this job still open?' reminders"}
              >
                <Input type="email" value={newCompanyEmail} onChange={(e) => setNewCompanyEmail(e.target.value)} />
              </Field>
            )}
          </>
        )}

        <Field label="Location">
          <Input value={draft.location ?? ""} onChange={(e) => set("location", e.target.value)} />
        </Field>
        <Field label="Salary">
          <Input value={draft.salary ?? ""} onChange={(e) => set("salary", e.target.value)} />
        </Field>
        <Field label="Equity">
          <Input value={draft.equity ?? ""} onChange={(e) => set("equity", e.target.value)} />
        </Field>
        <div className="flex items-center gap-2 pt-6">
          <Switch id={`cdtm-${candidate.id}`} checked={draft.cdtm_only} onCheckedChange={(v) => set("cdtm_only", v)} />
          <Label htmlFor={`cdtm-${candidate.id}`}>CDTM only</Label>
        </div>
        <div className="sm:col-span-2">
          <Field label="Description">
            <Textarea rows={3} value={draft.description ?? ""} onChange={(e) => set("description", e.target.value)} />
          </Field>
        </div>
      </fieldset>

      {editable && (
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => run("save", save, "Saved")} disabled={busy !== null}>
            {busy === "save" && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Save
          </Button>
          <Button variant="outline" size="sm" onClick={reject} disabled={busy !== null}>
            {busy === "reject" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <X className="h-4 w-4 mr-1" />}Reject
          </Button>
          <Button size="sm" onClick={approve} disabled={busy !== null} title={!draft.work_mode || !draft.location ? "Missing work mode or location is copied from this company's other jobs, or left empty" : undefined}>
            {busy === "approve" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}Approve &amp; publish
          </Button>
        </div>
      )}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default AdminReview;

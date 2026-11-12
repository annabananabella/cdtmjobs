import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { findCompanyByEmail, createCompany, createJobListing, deleteJobListing } from "@/lib/supabase-helpers";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Loader2, MapPin, ExternalLink, X, Mail, Briefcase } from "lucide-react";

interface JobListing {
  id: string;
  job_title: string;
  job_url: string;
  work_mode: string;
  location: string | null;
  salary: string | null;
  equity: string | null;
  cdtm_only: boolean;
  is_active: boolean;
}

export default function JobSubmissionForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { session, isReady: authReady } = useAuthReady();
  const pendingLookupEmailRef = useRef<string | null>(null);
  const [magicLinkSending, setMagicLinkSending] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [step, setStep] = useState<"email" | "form" | "success">("email");
  const [loading, setLoading] = useState(false);
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [isCdtmCompany, setIsCdtmCompany] = useState<boolean | null>(null);
  const [existingListings, setExistingListings] = useState<JobListing[]>([]);
  const [isNewCompany, setIsNewCompany] = useState(false);

  const [jobTitle, setJobTitle] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [equity, setEquity] = useState("");
  const [cdtmOnly, setCdtmOnly] = useState(false);
  const [description, setDescription] = useState("");
  const [stage, setStage] = useState("");
  const [accelerators, setAccelerators] = useState<string[]>([]);
  const [extracting, setExtracting] = useState(false);

  const handleSendMagicLink = async () => {
    const normalizedEmail = companyEmail.trim().toLowerCase();
    if (!normalizedEmail) return;

    sessionStorage.setItem("postJobPendingEmail", normalizedEmail);
    sessionStorage.setItem("postJobPendingCdtm", String(isCdtmCompany === true));
    setMagicLinkSending(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { emailRedirectTo: window.location.origin + "/post-job" },
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setCompanyEmail(normalizedEmail);
      setMagicLinkSent(true);
    }

    setMagicLinkSending(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem("postJobPendingEmail");
    sessionStorage.removeItem("postJobPendingCdtm");
    pendingLookupEmailRef.current = null;
    setStep("email");
    setCompanyEmail("");
    setCompanyId(null);
    setCompanyName("");
    setExistingListings([]);
    setIsNewCompany(false);
    setIsCdtmCompany(null);
    setMagicLinkSent(false);
  };

  const handleUrlPaste = async (url: string) => {
    if (!url || !url.startsWith("http")) return;
    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-job-details", {
        body: { url },
      });
      if (!error && data?.success && data.data) {
        const d = data.data;
        if (d.job_title && !jobTitle) setJobTitle(d.job_title);
        if (d.description && !description) setDescription(d.description);
        if (d.location && !location) setLocation(d.location);
        if (d.salary && !salary) setSalary(d.salary);
        if (d.equity && !equity) setEquity(d.equity);
        if (d.work_mode && !workMode) setWorkMode(d.work_mode);
        toast({ title: "Auto-filled from job page" });
      }
    } catch {
      // silent fail - user can fill manually
    } finally {
      setExtracting(false);
    }
  };

  const resetFormFields = () => {
    setJobTitle("");
    setJobUrl("");
    setWorkMode("");
    setLocation("");
    setSalary("");
    setEquity("");
    setCdtmOnly(false);
    setDescription("");
    setAccelerators([]);
  };

  const handleEmailLookup = useCallback(async (emailOverride?: string) => {
    const lookupEmail = (emailOverride ?? companyEmail).trim().toLowerCase();
    if (!lookupEmail) return;

    setLoading(true);
    try {
      const company = await findCompanyByEmail(lookupEmail);
      if (company) {
        setCompanyId(company.id);
        setCompanyName(company.name);
        setExistingListings((company.job_listings as unknown as JobListing[]) || []);
        setIsNewCompany(false);
        // Pre-fill company-level data only (name + membership)
        if (company.accelerator) {
          setAccelerators(company.accelerator.split(",").map((s: string) => s.trim()).filter(Boolean));
        }
      } else {
        setIsNewCompany(true);
        setCompanyName("");
        setAccelerators([]);
      }
      setStep("form");
    } catch {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [companyEmail, toast]);

  useEffect(() => {
    if (!authReady) return;

    const pendingEmail = sessionStorage.getItem("postJobPendingEmail");
    const pendingCdtm = sessionStorage.getItem("postJobPendingCdtm");
    const authenticatedEmail = session?.user?.email ?? null;

    if (pendingCdtm === "true") {
      setIsCdtmCompany(true);
    }

    if (pendingEmail) {
      setCompanyEmail(pendingEmail);
      setMagicLinkSent(!authenticatedEmail || authenticatedEmail.toLowerCase() !== pendingEmail.toLowerCase());
    }

    if (authenticatedEmail) {
      setCompanyEmail(authenticatedEmail);
    }

    // Auto-progress: user has a session (from magic link) and we haven't looked them up yet
    if (
      authenticatedEmail &&
      pendingLookupEmailRef.current !== authenticatedEmail.toLowerCase()
    ) {
      // Either we have pending state (same tab) or user landed in a new tab via magic link
      const hasPendingState = pendingEmail && pendingCdtm === "true" &&
        authenticatedEmail.toLowerCase() === pendingEmail.toLowerCase();
      const isNewTabReturn = !pendingEmail && step === "email";

      if (hasPendingState || isNewTabReturn) {
        pendingLookupEmailRef.current = authenticatedEmail.toLowerCase();
        setIsCdtmCompany(true);
        setMagicLinkSent(false);
        sessionStorage.removeItem("postJobPendingEmail");
        sessionStorage.removeItem("postJobPendingCdtm");
        void handleEmailLookup(authenticatedEmail);
      }
    }
  }, [authReady, session?.user?.email, handleEmailLookup, step]);

  const handleDeleteListing = async (id: string) => {
    try {
      await deleteJobListing(id);
      setExistingListings(prev => prev.filter(l => l.id !== id));
    } catch {
      toast({ title: "Error removing listing", variant: "destructive" });
    }
  };

  const validateLocation = (loc: string): string | null => {
    if (!loc.trim()) return null; // empty is ok (optional-ish, but label says *)
    const entries = loc.split(";").map(e => e.trim()).filter(e => e.length > 0);
    for (const entry of entries) {
      const parts = entry.split(",").map(p => p.trim());
      if (parts.length < 2 || !parts[0] || !parts[parts.length - 1]) {
        return `Each location must be "City, Country". "${entry}" is missing a country.`;
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle || !jobUrl || !workMode) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }

    if (workMode === "onsite" && !location.trim()) {
      toast({ title: "Location is required for on-site roles", variant: "destructive" });
      return;
    }

    const locError = validateLocation(location);
    if (location && locError) {
      toast({ title: "Invalid location", description: locError, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (!authReady) {
        toast({
          title: "Finishing sign-in",
          description: "Please wait a second for your verified session to load, then try again.",
          variant: "destructive",
        });
        return;
      }

      const { data: { session: liveSession } } = await supabase.auth.getSession();
      const activeSession = liveSession ?? session;
      const authenticatedEmail = activeSession?.user?.email?.toLowerCase();

      if (!authenticatedEmail) {
        toast({
          title: "Please verify your email first",
          description: "We couldn't restore your verified session yet. Open the magic link again and wait for the page to finish signing you in.",
          variant: "destructive",
        });
        return;
      }

      let cId = companyId;
      const normalizedCompanyEmail = authenticatedEmail;

      if (companyEmail.toLowerCase() !== normalizedCompanyEmail) {
        setCompanyEmail(normalizedCompanyEmail);
      }

      if (isNewCompany) {
        if (!companyName) {
          toast({ title: "Please enter a company name", variant: "destructive" });
          return;
        }

        const company = await createCompany(companyName, normalizedCompanyEmail);
        cId = company.id;
        setCompanyId(cId);
        setIsNewCompany(false);
      }

      if (!cId) {
        throw new Error("Company verification is incomplete. Please restart the post job flow.");
      }

      await createJobListing({
        company_id: cId,
        job_title: jobTitle,
        job_url: jobUrl,
        work_mode: workMode,
        location: location || undefined,
        salary: salary || undefined,
        equity: equity || undefined,
        cdtm_only: cdtmOnly,
        stage: stage || undefined,
        description: description || undefined,
        accelerator: accelerators.length > 0 ? accelerators.join(",") : undefined,
      });
      setStep("success");
    } catch (error) {
      const description = error instanceof Error ? error.message : "Something went wrong while saving the listing.";
      toast({ title: "Error submitting job", description, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div className="border border-primary/40 rounded-xl p-12 text-center bg-card/30">
        <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-primary" />
        <h3 className="text-xl font-display font-bold mb-8">Listed.</h3>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => { resetFormFields(); setStep("form"); }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-primary bg-transparent text-foreground font-display text-xs tracking-wider font-semibold hover:bg-primary hover:text-primary-foreground active:bg-primary/80 transition-colors">
            add new listing.
          </button>
          <button onClick={() => navigate("/?view=board")} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-secondary bg-transparent text-foreground font-display text-xs tracking-wider font-semibold hover:bg-secondary hover:text-secondary-foreground active:bg-secondary/80 transition-colors">
            see all listings.
          </button>
        </div>
        
      </div>
    );
  }

  if (step === "email") {
    return (
      <div className="relative w-full border border-primary/40 rounded-xl p-8 bg-card/30 overflow-hidden flex flex-col justify-center min-h-[360px]">
        {/* Subtle gradient glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />
        
        {!(magicLinkSent && !session) && (
          <div className="relative z-10 text-center">
            <div className="mb-3">
              <h2 className="font-display font-bold text-lg text-gradient">Post a Job</h2>
            </div>
            <p className="text-xs text-foreground leading-relaxed">
              Enter your company email.
            </p>
            <p className="text-xs text-foreground leading-relaxed">
              <span className="text-primary">Returning?</span> We help you manage your existing listings.
            </p>
          </div>
        )}

        {magicLinkSent && !session ? (
          <div className="relative z-10 text-center">
            <div className="mb-3">
              <h2 className="font-display font-bold text-lg text-gradient">Check your inbox.</h2>
            </div>
            <p className="text-xs text-foreground leading-relaxed">
              We sent a login link to <span className="text-primary">{companyEmail}</span>.
            </p>
            <button
              type="button"
              className="mt-5 font-display text-[10px] tracking-wider text-muted-foreground/60 hover:text-muted-foreground transition-colors underline underline-offset-2"
              onClick={() => void handleSignOut()}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <div className="space-y-5 relative z-10 text-center flex flex-col items-center mt-6">
            <div className="w-64">
              <Label htmlFor="company-email" className="sr-only">Company Email</Label>
              <Input
                id="company-email"
                type="email"
                placeholder="you@company.com"
                value={companyEmail}
                onChange={e => setCompanyEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (session ? handleEmailLookup() : handleSendMagicLink())}
                className="input-styled text-center mt-1.5"
                disabled={!!session}
              />
              {session && (
                <p className="text-[10px] text-primary mt-1 font-display tracking-wider">
                  verified ✓
                </p>
              )}
            </div>
            <div className="text-center">
              <Label className="font-display text-xs tracking-wider text-foreground mb-2 block">
                Are you a CDTM company? *
              </Label>
              <div className="flex items-center gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setIsCdtmCompany(true)}
                  className={`px-4 py-1.5 rounded-lg border font-display text-xs tracking-wider font-semibold transition-all ${
                    isCdtmCompany === true
                      ? "border-primary bg-primary text-background"
                      : "border-border bg-transparent text-foreground hover:border-primary/50"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setIsCdtmCompany(false)}
                  className={`px-4 py-1.5 rounded-lg border font-display text-xs tracking-wider font-semibold transition-all ${
                    isCdtmCompany === false
                      ? "border-destructive bg-destructive text-background"
                      : "border-border bg-transparent text-foreground hover:border-destructive/50"
                  }`}
                >
                  No
                </button>
              </div>
              {isCdtmCompany === false && (
                <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                  Sorry, this job board is exclusively for companies founded or led by CDTM alumni.
                </p>
              )}
            </div>

            {session ? (
              <button type="button" onClick={() => void handleEmailLookup()} disabled={loading || !companyEmail || isCdtmCompany !== true} className="w-48 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border border-primary bg-transparent text-foreground font-display text-xs tracking-wider font-semibold hover:bg-primary hover:text-background active:bg-primary/80 active:text-background transition-all disabled:border-primary/30 disabled:cursor-not-allowed disabled:text-foreground disabled:hover:border-primary/50">
                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : null}
                continue.
              </button>
            ) : (
              <button type="button" onClick={handleSendMagicLink} disabled={magicLinkSending || !companyEmail || isCdtmCompany !== true} className="w-48 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border border-primary bg-transparent text-foreground font-display text-xs tracking-wider font-semibold hover:bg-primary hover:text-background active:bg-primary/80 active:text-background transition-all disabled:border-primary/30 disabled:cursor-not-allowed disabled:text-foreground disabled:hover:border-primary/50">
                {magicLinkSending ? <Loader2 className="animate-spin h-4 w-4" /> : null}
                verify & continue.
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl w-full mx-auto">
      {existingListings.length > 0 && (
        <div className="relative border border-primary/40 rounded-xl p-6 bg-card/30 overflow-hidden">
          <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between mb-1 relative z-10">
            <h3 className="font-display font-semibold text-sm text-foreground">Your Listings</h3>
            {existingListings.length > 1 && (
              <button
                type="button"
                onClick={() => existingListings.forEach(l => handleDeleteListing(l.id))}
                className="font-display text-[10px] tracking-wider text-muted-foreground hover:text-destructive transition-colors"
              >
                Remove all
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-4 relative z-10">Remove listings that are no longer open.</p>
          <div className="space-y-2 relative z-10">
            {existingListings.map(listing => (
              <div
                key={listing.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:border-primary/30 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display font-medium text-xs truncate text-foreground">
                    {listing.job_title}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                    {listing.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5" />
                        {listing.location}
                      </span>
                    )}
                    <span className="capitalize">{listing.work_mode}</span>
                    <a href={listing.job_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-primary hover:underline">
                      <ExternalLink className="h-2.5 w-2.5" />
                      see job description
                    </a>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteListing(listing.id)}
                  className="h-6 w-6 flex items-center justify-center rounded-full border border-border/60 text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
                  title="Remove listing"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative border border-primary/40 rounded-xl p-6 bg-card/30 overflow-hidden">
        <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <h3 className="font-display font-semibold text-sm mb-4 text-foreground relative z-10">New Listing</h3>
        <p className="text-xs text-muted-foreground mb-4 relative z-10">Prefer email? Send the job link or description to <a href="mailto:hello@cdtmjobs.com" className="text-primary hover:underline">hello@cdtmjobs.com</a> and we will post it for you.</p>
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {/* === MANDATORY FIELDS === */}
          <div>
            <Label htmlFor="company-name" className="font-display text-xs tracking-wider text-foreground">Company Name *</Label>
            <Input id="company-name" placeholder="Your company name" value={companyName} onChange={e => setCompanyName(e.target.value)} className="input-styled" />
          </div>
          <div>
            <Label htmlFor="job-url" className="font-display text-xs tracking-wider text-foreground">Link to Job Description *</Label>
            <div className="relative">
              <Input
                id="job-url"
                placeholder="https://..."
                value={jobUrl}
                onChange={e => setJobUrl(e.target.value)}
                onBlur={e => handleUrlPaste(e.target.value)}
                onPaste={e => {
                  const pasted = e.clipboardData.getData("text");
                  setTimeout(() => handleUrlPaste(pasted), 100);
                }}
                className="input-styled"
              />
              {extracting && (
                <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 text-primary animate-spin" />
              )}
            </div>
            {extracting && (
              <p className="text-[10px] text-primary mt-1 font-display tracking-wider">extracting job details...</p>
            )}
          </div>
          <div>
            <Label htmlFor="job-title" className="font-display text-xs tracking-wider text-foreground">Job Title *</Label>
            <Input id="job-title" placeholder="Product Manager" value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="input-styled" />
          </div>
          <div>
            <Label htmlFor="description" className="font-display text-xs tracking-wider text-foreground">Job Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the role..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="input-styled min-h-[80px]"
            />
          </div>
          <div>
            <Label className="font-display text-xs tracking-wider text-foreground">Work Mode *</Label>
            <Select value={workMode} onValueChange={setWorkMode}>
              <SelectTrigger className="input-styled">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="onsite">On-site</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="location" className="font-display text-xs tracking-wider text-foreground">Location{workMode === "onsite" ? " *" : ""}</Label>
            <Input id="location" placeholder="Munich, Germany; Berlin, Germany" value={location} onChange={e => setLocation(e.target.value)} className="input-styled" />
            <p className="text-[10px] text-muted-foreground/50 mt-1 font-display tracking-wider">
              Format: City, Country. Separate multiple with semicolons
            </p>
          </div>

          {/* === OPTIONAL FIELDS === */}
          <div className="border-t border-border/30 pt-4 mt-2">
            <p className="font-display text-[10px] tracking-widest uppercase text-muted-foreground/50 mb-4">Additional details (optional)</p>
          </div>
          <div>
            <Label className="font-display text-xs tracking-wider text-foreground">Stage</Label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger className="input-styled">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bootstrapped">Bootstrapped</SelectItem>
                <SelectItem value="pre-seed">Pre-Seed</SelectItem>
                <SelectItem value="seed">Seed</SelectItem>
                <SelectItem value="series-a">Series A</SelectItem>
                <SelectItem value="series-b">Series B+</SelectItem>
                <SelectItem value="unicorn">Unicorn</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="salary" className="font-display text-xs tracking-wider text-foreground">Salary Range</Label>
              <Input id="salary" placeholder="€60k–€80k" value={salary} onChange={e => setSalary(e.target.value)} className="input-styled" />
            </div>
            <div>
              <Label htmlFor="equity" className="font-display text-xs tracking-wider text-foreground">Equity</Label>
              <Input id="equity" placeholder="0.5%–1%" value={equity} onChange={e => setEquity(e.target.value)} className="input-styled" />
            </div>
          </div>
          <div>
            <Label className="font-display text-xs tracking-wider text-foreground mb-2 block">Member of any of these programs?</Label>
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background input-styled">
                  <span className="truncate text-left">
                    {accelerators.length === 0
                      ? "Select programs"
                      : [
                          accelerators.includes("ef") && "Entrepreneur First",
                          accelerators.includes("ewor") && "EWOR",
                          accelerators.includes("neo") && "Neo",
                          accelerators.includes("schub") && "Schub",
                          accelerators.includes("yc") && "Y Combinator",
                        ].filter(Boolean).join(", ")}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1 bg-popover border border-border rounded-md shadow-md z-50" align="start">
                {[
                  { value: "ef", label: "Entrepreneur First" },
                  { value: "ewor", label: "EWOR" },
                  { value: "neo", label: "Neo" },
                  { value: "schub", label: "Schub" },
                  { value: "yc", label: "Y Combinator" },
                ].map(opt => (
                  <div key={opt.value} className="flex items-center gap-2 rounded-sm py-1.5 pl-2 pr-2 cursor-pointer hover:bg-primary/15 hover:text-primary transition-colors" onClick={() => {
                    setAccelerators(prev =>
                      prev.includes(opt.value) ? prev.filter(v => v !== opt.value) : [...prev, opt.value]
                    );
                  }}>
                    <Checkbox
                      checked={accelerators.includes(opt.value)}
                      onCheckedChange={() => {}}
                      className="pointer-events-none border-muted-foreground/40 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary"
                    />
                    <span className="font-display text-xs tracking-wider text-muted-foreground">{opt.label}</span>
                  </div>
                ))}
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:border-primary/30 transition-colors">
            <div>
              <Label htmlFor="cdtm-only" className="font-display font-medium text-xs text-foreground">CDTM Only</Label>
              <p className="text-[10px] text-muted-foreground">Visible only to CDTM job newsletter subscribers</p>
            </div>
            <Switch id="cdtm-only" checked={cdtmOnly} onCheckedChange={setCdtmOnly} />
          </div>
          <div className="flex justify-center">
            <button type="submit" disabled={loading} className="w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-primary bg-transparent text-foreground font-display text-xs tracking-wider font-semibold hover:bg-primary hover:text-primary-foreground active:bg-primary/80 transition-all disabled:bg-transparent disabled:text-foreground disabled:border-primary/30 disabled:cursor-not-allowed">
              {loading ? <Loader2 className="animate-spin h-4 w-4" /> : null}
              submit listing.
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, ExternalLink, Briefcase, ChevronDown, ChevronUp, Check, Gem } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import CdtmUnlockBanner from "@/components/CdtmUnlockBanner";
import { locationCountryLabel } from "@/lib/location-country";
import { companySummary } from "@/lib/company-summaries";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface JobWithCompany {
  id: string;
  auto_extracted?: boolean;
  job_title: string;
  job_url: string;
  work_mode: string | null;
  location: string | null;
  salary: string | null;
  equity: string | null;
  description: string | null;
  stage: string | null;
  accelerator: string | null;
  cdtm_only: boolean;
  created_at: string;
  companies: {
    name: string;
    accelerator: string | null;
  };
}

const allWorkModes = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];
const allStages = [
  { value: "bootstrapped", label: "Bootstrapped" },
  { value: "pre-seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series-a", label: "Series A" },
  { value: "series-b", label: "Series B+" },
  { value: "unicorn", label: "Unicorn" },
];
const acceleratorLabels: Record<string, string> = {
  yc: "Y Combinator",
  ef: "Entrepreneur First",
  neo: "Neo",
  ewor: "EWOR",
  schub: "Schub",
};


const allAccelerators = [
  { value: "ef", label: acceleratorLabels.ef },
  { value: "ewor", label: acceleratorLabels.ewor },
  { value: "neo", label: acceleratorLabels.neo },
  { value: "schub", label: acceleratorLabels.schub },
  { value: "yc", label: acceleratorLabels.yc },
];

function toggleSet(set: Set<string>, value: string): Set<string> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function formatPostedAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.max(1, Math.floor(diffMs / 1000));
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk}w ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  const yr = Math.floor(day / 365);
  return `${yr}y ago`;
}

interface FilterOption {
  value: string;
  label: string;
}

interface FilterGroup {
  groupLabel: string;
  groupValue?: string; // selectable group header
  options: FilterOption[];
}

function FilterDropdown({ label, options, selected, available, onToggle, onClear, groups }: {
  label: string;
  options?: FilterOption[];
  selected: Set<string>;
  available: Set<string>;
  onToggle: (value: string) => void;
  onClear: () => void;
  groups?: FilterGroup[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const count = selected.size;

  const renderOption = (o: FilterOption, indent = false) => {
    const isAvailable = available.has(o.value);
    const isSelected = selected.has(o.value);
    return (
      <button
        key={o.value}
        onClick={() => isAvailable && onToggle(o.value)}
        disabled={!isAvailable}
        className={`w-full flex items-center gap-2 ${indent ? "pl-5" : "px-3"} pr-3 py-1.5 text-left font-display text-xs tracking-wider transition-colors ${
          isAvailable
            ? "text-foreground hover:bg-muted/50 cursor-pointer"
            : "text-muted-foreground/30 cursor-default"
        }`}
      >
        <span className={`h-3.5 w-3.5 flex items-center justify-center rounded-sm border ${
          isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border"
        }`}>
          {isSelected && <Check className="h-2.5 w-2.5" />}
        </span>
        {o.label}
      </button>
    );
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 font-display text-xs tracking-wider px-3 py-1.5 rounded-lg border transition-all ${
          count > 0
            ? "border-secondary text-foreground hover:border-primary"
            : "border-primary text-muted-foreground hover:text-foreground hover:border-secondary"
        }`}
      >
        {label}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[200px] max-h-[300px] overflow-y-auto rounded-lg border border-border bg-card shadow-lg py-1">
          {groups ? (
            groups.map((group, gi) => (
              <div key={group.groupLabel}>
                {gi > 0 && <div className="border-t border-border/50 my-0.5" />}
                {group.groupValue
                  ? renderOption({ value: group.groupValue, label: group.groupLabel })
                  : (
                    <div className="px-3 py-1 font-display text-[10px] tracking-wider uppercase text-muted-foreground/60">
                      {group.groupLabel}
                    </div>
                  )}
                {group.options.map(o => renderOption(o, true))}
              </div>
            ))
          ) : (
            options?.map(o => renderOption(o))
          )}
          {count > 0 && (
            <>
              <div className="border-t border-border my-1" />
              <button
                onClick={onClear}
                className="w-full px-3 py-1.5 text-right font-display text-xs tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                Clear all
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function JobListings() {
  const [jobs, setJobs] = useState<JobWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedSalaryId, setExpandedSalaryId] = useState<string | null>(null);
  const [selectedWorkModes, setSelectedWorkModes] = useState<Set<string>>(new Set());
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [selectedStages, setSelectedStages] = useState<Set<string>>(new Set());
  const [selectedAccelerators, setSelectedAccelerators] = useState<Set<string>>(new Set());

  const fetchJobs = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);

    const { data, error } = await supabase
      .from("job_listings")
      .select("id, job_title, job_url, work_mode, location, salary, equity, description, stage, accelerator, cdtm_only, created_at, auto_extracted, companies(name, accelerator)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setJobs(data as unknown as JobWithCompany[]);
    }

    setLoading(false);
  }, []);

  const handleAuthChange = useCallback(() => {
    void fetchJobs(false);
  }, [fetchJobs]);

  useEffect(() => {
    void fetchJobs(true);
  }, [fetchJobs]);

  const availableWorkModes = new Set(jobs.map(j => j.work_mode).filter(Boolean) as string[]);
  const availableStages = new Set(jobs.map(j => j.stage).filter(Boolean) as string[]);
  const availableAccelerators = new Set(
    jobs
      .flatMap(j => (j.accelerator || "").split(","))
      .map(value => value.trim())
      .filter(Boolean)
  );
  const companies = [...new Set(jobs.map(j => j.companies?.name).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  // Capitalize first letter of each word
  const titleCase = (s: string) => s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

  // Parse locations: format is "City, Country; City2, Country2"
  const countryToCities = new Map<string, Set<string>>();
  const parseLocationEntries = (loc: string) => {
    return loc.split(";").map(e => e.trim()).filter(e => e.length > 0).map(entry => {
      const parts = entry.split(",").map(p => p.trim());
      if (parts.length >= 2) {
        return { city: titleCase(parts.slice(0, -1).join(", ")), country: locationCountryLabel(parts[parts.length - 1]) };
      }
      return { city: titleCase(parts[0]), country: null };
    });
  };
  jobs.forEach(j => {
    if (!j.location) return;
    for (const { city, country } of parseLocationEntries(j.location)) {
      if (!country) continue; // skip entries without a country
      if (!countryToCities.has(country)) countryToCities.set(country, new Set());
      countryToCities.get(country)?.add(city);
    }
  });

  // Build grouped location options sorted alphabetically
  const locationGroups: FilterGroup[] = [...countryToCities.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([country, cities]) => ({
      groupLabel: country,
      groupValue: `country:${country}`,
      options: [...cities].sort((a, b) => a.localeCompare(b)).map(city => ({
        value: `city:${city}`,
        label: city,
      })),
    }));

  const allLocationValues = new Set<string>();
  locationGroups.forEach(g => {
    if (g.groupValue) allLocationValues.add(g.groupValue);
    g.options.forEach(o => allLocationValues.add(o.value));
  });

  const hasActiveFilters = selectedWorkModes.size > 0 || selectedCompanies.size > 0 || selectedLocations.size > 0 || selectedStages.size > 0 || selectedAccelerators.size > 0;

  const filtered = jobs.filter(job => {
    if (selectedWorkModes.size > 0 && !selectedWorkModes.has(job.work_mode ?? "")) return false;
    if (selectedCompanies.size > 0 && !selectedCompanies.has(job.companies?.name)) return false;
    if (selectedLocations.size > 0) {
      if (!job.location) return false;
      const entries = parseLocationEntries(job.location);
      // Build a set of countries that have at least one specific city selected
      const countriesWithCityFilter = new Set<string>();
      selectedLocations.forEach(v => {
        if (v.startsWith("city:")) {
          // find which country this city belongs to
          locationGroups.forEach(g => {
            if (g.options.some(o => o.value === v) && g.groupValue) {
              countriesWithCityFilter.add(g.groupValue.replace("country:", ""));
            }
          });
        }
      });
      const matches = entries.some(({ city, country }) => {
        if (!country) return false; // entries without a country are excluded from location filtering
        if (selectedLocations.has(`country:${country}`)) {
          if (countriesWithCityFilter.has(country)) {
            return selectedLocations.has(`city:${city}`);
          }
          return true;
        }
        if (selectedLocations.has(`city:${city}`)) return true;
        return false;
      });
      if (!matches) return false;
    }
    if (selectedStages.size > 0 && (!job.stage || !selectedStages.has(job.stage))) return false;
    if (selectedAccelerators.size > 0) {
      const jobAccelerators = new Set(
        (job.accelerator || "")
          .split(",")
          .map(value => value.trim())
          .filter(Boolean)
      );
      if (![...selectedAccelerators].some(value => jobAccelerators.has(value))) return false;
    }
    return true;
  });

  const clearAll = () => {
    setSelectedWorkModes(new Set());
    setSelectedCompanies(new Set());
    setSelectedLocations(new Set());
    setSelectedStages(new Set());
    setSelectedAccelerators(new Set());
  };

  const renderFilters = () => {
    if (loading || jobs.length === 0) return null;
    return (
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="font-display text-xs tracking-wider text-muted-foreground uppercase">
          {filtered.length} open position{filtered.length !== 1 ? "s" : ""}
        </span>
        <div className="flex-1 h-px bg-border/50" />
        <div className="flex items-center gap-2 flex-wrap">
          {companies.length > 0 && (
            <FilterDropdown
              label="Company"
              options={companies.map(c => ({ value: c, label: c }))}
              selected={selectedCompanies}
              available={new Set(companies)}
              onToggle={(v) => setSelectedCompanies(toggleSet(selectedCompanies, v))}
              onClear={() => setSelectedCompanies(new Set())}
            />
          )}
          {locationGroups.length > 0 && (
            <FilterDropdown
              label="Location"
              groups={locationGroups}
              selected={selectedLocations}
              available={allLocationValues}
              onToggle={(v) => setSelectedLocations(toggleSet(selectedLocations, v))}
              onClear={() => setSelectedLocations(new Set())}
            />
          )}
          <FilterDropdown
            label="Work Mode"
            options={allWorkModes}
            selected={selectedWorkModes}
            available={availableWorkModes}
            onToggle={(v) => setSelectedWorkModes(toggleSet(selectedWorkModes, v))}
            onClear={() => setSelectedWorkModes(new Set())}
          />
          <FilterDropdown
            label="Stage"
            options={allStages}
            selected={selectedStages}
            available={availableStages}
            onToggle={(v) => setSelectedStages(toggleSet(selectedStages, v))}
            onClear={() => setSelectedStages(new Set())}
          />
          <FilterDropdown
            label="Member of"
            options={allAccelerators}
            selected={selectedAccelerators}
            available={availableAccelerators}
            onToggle={(v) => setSelectedAccelerators(toggleSet(selectedAccelerators, v))}
            onClear={() => setSelectedAccelerators(new Set())}
          />
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full rounded-lg bg-muted/50" />
          ))}
        </div>
      );
    }

    if (filtered.length === 0) {
      return (
        <div className="border border-dashed border-border rounded-xl py-16 text-center animate-fade-in">
          <Briefcase className="mx-auto mb-4 h-8 w-8 text-muted-foreground/50" />
          <p className="font-display text-sm text-muted-foreground">No open positions yet.</p>
          <p className="text-xs text-muted-foreground/50 mt-1">Check back soon</p>
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="mt-3 font-display text-xs tracking-wider text-primary hover:text-primary/80 underline transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      );
    }

    return (
      <>
        {filtered.map(job => (
          <div key={job.id} className="block group">
            <div className="border border-border/60 rounded-lg px-5 py-4 transition-all duration-300 hover:border-primary/40 hover:bg-card/80 hover:shadow-[0_0_20px_hsl(160_90%_45%/0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-display font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                      {job.job_title}
                    </p>
                    {job.cdtm_only && (
                      <span className="inline-flex items-center gap-0.5 shrink-0 px-1.5 py-0.5 rounded bg-primary/10 text-primary font-display text-[10px] tracking-wider whitespace-nowrap" title="CDTM Exclusive">
                        <Gem className="h-3 w-3" />
                        CDTM
                      </span>
                    )}
                    {job.location && (
                      <span className="inline-flex items-center gap-1 text-muted-foreground font-display text-xs tracking-wider whitespace-nowrap shrink-0">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {(() => {
                          const entries = parseLocationEntries(job.location!);
                          if (entries.length > 3) return "Various";
                          return entries.map(e => e.city).join(", ");
                        })()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground/80 mt-0.5 truncate">
                    {companySummary(job.companies?.name ?? "") ? (
                      <Tooltip delayDuration={250}>
                        <TooltipTrigger asChild>
                          <span tabIndex={0} className="cursor-help outline-none hover:text-foreground focus-visible:text-foreground transition-colors">
                            {job.companies?.name}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          align="start"
                          sideOffset={8}
                          collisionPadding={12}
                          className="max-w-[min(20rem,calc(100vw-2rem))] min-w-[10rem] whitespace-normal break-words rounded-lg border border-primary/25 bg-surface/95 px-3 py-2 text-xs leading-relaxed text-surface-foreground backdrop-blur-md shadow-[0_8px_24px_hsl(220_20%_2%/0.5)]"
                        >
                          {companySummary(job.companies?.name ?? "")}
                        </TooltipContent>
                      </Tooltip>
                    ) : job.companies?.name}
                    <span className="text-muted-foreground/50"> · posted {formatPostedAgo(job.created_at)}</span>
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {job.work_mode && (
                    <span className="inline-block font-display text-[10px] tracking-wider uppercase px-2 py-0.5 rounded border border-secondary text-muted-foreground whitespace-nowrap">
                      {job.work_mode}
                    </span>
                    )}
                    {job.salary && (
                      <button
                        type="button"
                        onClick={() => setExpandedSalaryId(expandedSalaryId === job.id ? null : job.id)}
                        title={job.salary}
                        className={`inline-block px-2 py-0.5 rounded border border-primary text-primary font-display text-[10px] tracking-wider text-left max-w-full ${
                          expandedSalaryId === job.id
                            ? "whitespace-normal break-words"
                            : "truncate max-w-[10rem]"
                        }`}
                      >
                        {job.salary}
                      </button>
                    )}
                    {job.equity && (
                      <span className="inline-block px-2 py-0.5 rounded border border-accent text-accent font-display text-[10px] tracking-wider whitespace-nowrap">
                        {job.equity}
                      </span>
                    )}
                    {job.accelerator && job.accelerator.split(",").map(v => v.trim()).filter(Boolean).map(value => (
                      <span
                        key={value}
                        className="inline-block px-2 py-0.5 rounded border border-muted-foreground/30 text-muted-foreground/70 font-display text-[10px] tracking-wider whitespace-nowrap"
                      >
                        {acceleratorLabels[value] ?? value}
                      </span>
                    ))}
                  </div>
                  {expandedId === job.id && job.description && (
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed whitespace-pre-line border-t border-border/50 pt-2">
                      {job.description}
                      {job.auto_extracted && (
                        <span className="block mt-2 text-[10px] italic text-muted-foreground/70">
                          This post was created automatically from our inbox and might contain mistakes.
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div className="shrink-0 flex flex-col items-end justify-between self-stretch">
                  {job.description ? (
                    <button
                      type="button"
                      onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}
                      className="inline-flex items-center gap-1 font-display text-[10px] tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {expandedId === job.id ? "less" : "read more"}
                      <ChevronDown className={`h-3 w-3 transition-transform ${expandedId === job.id ? "rotate-180" : ""}`} />
                    </button>
                  ) : <span />}
                  <a href={job.job_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    <ExternalLink className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-all" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </>
    );
  };

  return (
    <div className="space-y-4">
      <CdtmUnlockBanner onAuthChange={handleAuthChange} />
      {renderFilters()}
      {renderContent()}
    </div>
  );
}

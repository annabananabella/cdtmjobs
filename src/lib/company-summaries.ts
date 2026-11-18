// Short summaries based on the companies' current job pages.
export const companySummaries: Record<string, string> = {
  emdash: "A platform for running and managing coding agents.",
  furo: "Software for optimizing industrial battery storage.",
  avoltra: "Software for industrial energy procurement and optimization.",
  dataleap: "AI agents that automate enterprise workflows.",
  sitefire: "Helps companies improve visibility in AI search.",
  "zeit ai": "An AI data engineer for business analytics.",
};

export function companySummary(
  name: string,
  summaries: Record<string, string> = companySummaries,
): string | undefined {
  const key = name.toLowerCase().replace(/\s*\([^)]*\)/g, "").replace(/\s+gmbh$/i, "").trim();
  return summaries[key];
}
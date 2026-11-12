// Derives a person's display name from an email address:
//   "jane.doe@example.com" -> "Jane Doe"
//   "lena@example.io"         -> "Lena"
//   "jd@samplecorp.example"                -> null (not a person)
//   "info@samplecorp.example"                -> null (shared mailbox)
//
// Used on the review page so the admin can see who a contact address belongs
// to, and mirrored by public.person_name_from_email() in the database, which
// fills the greeting of the "is this job still open?" reminder emails.

const GENERIC = new Set([
  "info", "hello", "hi", "hey", "contact", "jobs", "job", "career", "careers",
  "hiring", "team", "hr", "humanresources", "support", "help", "admin",
  "office", "mail", "email", "feedback", "privacy", "legal", "billing",
  "finance", "accounting", "sales", "marketing", "growth", "press", "media",
  "talent", "recruiting", "recruitment", "people", "founder", "founders",
  "ceo", "studio", "general", "all", "everyone", "newsletter", "noreply",
  "donotreply", "no", "reply", "postmaster", "abuse", "webmaster", "root",
  "test", "example", "demo", "mailerdaemon", "mailer", "bounce",
  "unsubscribe", "dev", "eng", "it", "security",
]);

export function personNameFromEmail(
  email: string | null | undefined,
): string | null {
  const value = (email ?? "").trim().toLowerCase();
  const at = value.indexOf("@");
  if (at <= 0 || at === value.length - 1) return null;

  const local = value.slice(0, at).split("+")[0];
  const brand = value.slice(at + 1).split(".")[0];
  if (!local || /\d/.test(local)) return null;

  const words = local.split(/[^a-z]+/).filter(Boolean);
  if (words.length === 0) return null;
  if (words.some((w) => GENERIC.has(w))) return null;
  // "jd@samplecorp.example" / "samplecorp@samplecorp.example": initials or the company itself.
  if (words.length === 1 && (words[0].length < 3 || words[0] === brand)) {
    return null;
  }

  return words.map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

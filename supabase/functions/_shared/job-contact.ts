// Only accept an explicitly selected hiring address that actually appears on the page.
export function verifiedJobContact(value: unknown, html: string): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (!/^[^\s@<>,]+@[^\s@<>,]+\.[a-z]{2,}$/i.test(email)) return null;
  const addresses: string[] = html.toLowerCase().match(/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}/g) ?? [];
  return addresses.includes(email) ? email : null;
}

export function explicitApplicationContact(html: string): string | null {
  const section = html.match(/<h[1-6]\b[^>]*>\s*How to apply\s*<\/h[1-6]>([\s\S]*?)(?:<\/section>|<h[1-6]\b)/i)?.[1];
  if (!section) return null;
  const emails = [...section.matchAll(/mailto:([^"'?\s<>]+)/gi)].map((match) => match[1].toLowerCase());
  const unique = [...new Set(emails)];
  return unique.length === 1 ? verifiedJobContact(unique[0], html) : null;
}
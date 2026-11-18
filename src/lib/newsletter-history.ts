export type NewsletterRow = { sent_at: string; recipient_email: string; status: string; bounced: boolean };
export type NewsletterSend = { date: string; rows: NewsletterRow[]; delivered: number; bounced: number; failed: number };

/** Groups send-log rows into newsletter sends (one per day), keeping the latest outcome per recipient. */
export function groupNewsletterSends(rows: NewsletterRow[]): NewsletterSend[] {
  const byDay = new Map<string, Map<string, NewsletterRow>>();
  for (const r of rows) {
    const day = r.sent_at.slice(0, 10);
    const m = byDay.get(day) ?? new Map<string, NewsletterRow>();
    const prev = m.get(r.recipient_email);
    if (!prev || prev.sent_at < r.sent_at) m.set(r.recipient_email, r);
    byDay.set(day, m);
  }
  return [...byDay.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, m]) => {
      const list = [...m.values()].sort((a, b) => a.recipient_email.localeCompare(b.recipient_email));
      return {
        date,
        rows: list,
        delivered: list.filter((r) => r.status === "sent" && !r.bounced).length,
        bounced: list.filter((r) => r.bounced).length,
        failed: list.filter((r) => r.status !== "sent").length,
      };
    });
}

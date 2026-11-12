import { describe, it, expect } from "vitest";
import { groupNewsletterSends } from "@/lib/newsletter-history";

describe("groupNewsletterSends", () => {
  it("a retry that succeeded counts as delivered, not failed", () => {
    const [s] = groupNewsletterSends([
      { sent_at: "2026-06-24T12:27:00Z", recipient_email: "a@x.com", status: "failed", bounced: false },
      { sent_at: "2026-06-24T12:28:00Z", recipient_email: "a@x.com", status: "sent", bounced: false },
    ]);
    expect(s.delivered).toBe(1);
    expect(s.failed).toBe(0);
  });
  it("splits sends by day, newest first, and counts bounces", () => {
    const s = groupNewsletterSends([
      { sent_at: "2026-06-24T12:28:00Z", recipient_email: "a@x.com", status: "sent", bounced: false },
      { sent_at: "2026-07-13T10:26:00Z", recipient_email: "b@x.com", status: "sent", bounced: true },
    ]);
    expect(s.map((x) => x.date)).toEqual(["2026-07-13", "2026-06-24"]);
    expect(s[0].bounced).toBe(1);
    expect(s[0].delivered).toBe(0);
  });
});

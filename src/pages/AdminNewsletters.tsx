import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuthReady } from "@/hooks/use-auth-ready";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Loader2 } from "lucide-react";
import { groupNewsletterSends, type NewsletterSend } from "@/lib/newsletter-history";

const fmtDay = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Berlin" });
const fmtTime = (t: string) =>
  new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });

const AdminNewsletters = () => {
  const { session, isReady } = useAuthReady();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [sends, setSends] = useState<NewsletterSend[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) return;
    if (!session) { setIsAdmin(false); return; }
    supabase.rpc("is_admin").then(({ data, error }) => setIsAdmin(!error && data === true));
  }, [isReady, session]);

  useEffect(() => {
    if (!isAdmin) return;
    supabase.rpc("admin_newsletter_history").then(({ data }) => {
      const s = groupNewsletterSends((data ?? []) as never);
      setSends(s);
      setOpen(s[0]?.date ?? null);
    });
  }, [isAdmin]);

  const signIn = () =>
    lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/admin/newsletters`,
      extraParams: { hd: "*", prompt: "select_account" },
    });

  let body: React.ReactNode;
  if (!isReady || (session && isAdmin === null) || (isAdmin && !sends)) {
    body = <Loader2 className="animate-spin h-6 w-6 text-primary mx-auto" />;
  } else if (!session) {
    body = (
      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">Sign in to see newsletter history.</p>
        <Button onClick={signIn}>sign in with google.</Button>
      </div>
    );
  } else if (!isAdmin) {
    body = <p className="text-sm text-muted-foreground text-center">{session.user.email} doesn't have access to this page.</p>;
  } else if (!sends!.length) {
    body = <p className="text-sm text-muted-foreground text-center">No newsletters sent yet.</p>;
  } else {
    body = (
      <div className="space-y-3">
        {sends!.map((s) => (
          <div key={s.date} className="rounded-lg border border-border bg-background/85 backdrop-blur">
            <button
              onClick={() => setOpen(open === s.date ? null : s.date)}
              className="w-full flex items-center justify-between gap-3 p-4 text-left"
            >
              <div>
                <div className="text-sm text-foreground">{fmtDay(s.date)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {s.rows.length} recipients · {s.delivered} delivered
                  {s.bounced ? ` · ${s.bounced} bounced` : ""}
                  {s.failed ? ` · ${s.failed} not delivered` : ""}
                </div>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open === s.date ? "rotate-180" : ""}`} />
            </button>
            {open === s.date && (
              <ul className="border-t border-border divide-y divide-border">
                {s.rows.map((r) => (
                  <li key={r.recipient_email} className="flex items-center justify-between gap-3 px-4 py-2 text-xs">
                    <span className="text-foreground truncate">{r.recipient_email}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="text-muted-foreground">{fmtTime(r.sent_at)}</span>
                      {r.bounced ? <Badge variant="destructive">bounced</Badge>
                        : r.status === "sent" ? <Badge variant="secondary">delivered</Badge>
                        : r.status === "suppressed" ? <Badge variant="outline">unsubscribed</Badge>
                        : <Badge variant="destructive">failed</Badge>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
        <p className="text-xs text-muted-foreground pt-2">
          Goes out automatically every other Monday at 10:00. Opens aren't tracked.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <Header />
      <main className="container max-w-3xl mx-auto px-4 sm:px-6 py-10 relative z-10 w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-lg tracking-wider text-foreground">Newsletters</h1>
          <Link to="/admin/review" className="text-xs text-muted-foreground hover:text-foreground">job review.</Link>
        </div>
        {body}
      </main>
      <div className="flex-1" />
      <Footer />
    </div>
  );
};

export default AdminNewsletters;

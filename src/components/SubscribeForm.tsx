import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { subscribeEmail } from "@/lib/supabase-helpers";
import { CheckCircle2, Loader2, Mail } from "lucide-react";

export default function SubscribeForm() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [isCdtm, setIsCdtm] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const result = await subscribeEmail(email);
      setIsCdtm(result.is_cdtm);
      setSubscribed(true);
    } catch (err) {
      if ((err as { code?: string } | null)?.code === "23505") {
        toast({ title: "Already subscribed!", description: "This email is already on our list." });
      } else {
        toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className="border border-accent/40 rounded-xl p-8 text-center bg-card/30">
        <CheckCircle2 className="mx-auto mb-3 h-6 w-6 text-primary" />
        <p className="font-display font-semibold text-sm">You're in.</p>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          {isCdtm
            ? "You'll receive bi-weekly job listings, including community-exclusive ones."
            : "You'll receive public job listings bi-weekly."}
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full border border-accent/40 rounded-xl p-8 bg-card/30 overflow-hidden flex flex-col justify-center min-h-[360px]">
      {/* Subtle gradient glow - matches job listing popup */}
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center">
        <div className="mb-4">
          <h3 className="font-display font-bold text-lg text-gradient">Newsletter</h3>
        </div>
        <p className="text-xs text-foreground leading-relaxed">
          Bi-weekly job listings. You can subscribe with any email address.
        </p>
        <p className="text-xs text-foreground leading-relaxed">
          Use your <span className="text-primary font-display text-[11px]">@cdtm.de</span> or <span className="text-primary font-display text-[11px]">.com</span> email for community exclusive listings.
        </p>
      </div>
      <form onSubmit={handleSubscribe} className="space-y-4 relative z-10 flex flex-col items-center mt-6">
        <div className="w-64">
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input-styled text-center"
          />
        </div>
        <button type="submit" disabled={loading || !email} className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border border-accent bg-transparent text-foreground font-display text-xs tracking-wider font-semibold hover:bg-accent hover:text-accent-foreground active:bg-accent/80 hover:shadow-[0_0_20px_hsl(var(--accent)/0.3)] transition-all disabled:border-accent/30 disabled:cursor-not-allowed disabled:text-foreground disabled:hover:shadow-none">
          {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "subscribe."}
        </button>
      </form>
    </div>
  );
}

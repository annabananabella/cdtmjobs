import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingParticles from "@/components/FloatingParticles";
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

type Status = "loading" | "valid" | "already_used" | "invalid" | "success" | "error";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }

    const validate = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
        );
        const data = await res.json();
        if (!res.ok) { setStatus("invalid"); return; }
        if (data.valid === false && data.reason === "already_unsubscribed") {
          setStatus("already_used");
        } else if (data.valid) {
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      } catch { setStatus("error"); }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    setStatus("loading");
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) setStatus("success");
      else if (data?.reason === "already_unsubscribed") setStatus("already_used");
      else setStatus("error");
    } catch { setStatus("error"); }
  };

  const content: Record<Status, React.ReactNode> = {
    loading: <Loader2 className="animate-spin h-6 w-6 text-primary mx-auto" />,
    valid: (
      <div className="text-center space-y-4">
        <AlertTriangle className="h-6 w-6 text-accent mx-auto" />
        <p className="font-display text-sm font-semibold">unsubscribe?</p>
        <p className="text-xs text-muted-foreground">you'll stop receiving job listing emails.</p>
        <button onClick={handleUnsubscribe} className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg border border-destructive bg-transparent text-destructive font-display text-xs tracking-wider font-semibold hover:bg-destructive hover:text-destructive-foreground transition-all">
          confirm unsubscribe.
        </button>
      </div>
    ),
    already_used: (
      <div className="text-center space-y-3">
        <CheckCircle2 className="h-6 w-6 text-primary mx-auto" />
        <p className="font-display text-sm font-semibold">already unsubscribed.</p>
        <p className="text-xs text-muted-foreground">you won't receive any more emails.</p>
      </div>
    ),
    success: (
      <div className="text-center space-y-3">
        <CheckCircle2 className="h-6 w-6 text-primary mx-auto" />
        <p className="font-display text-sm font-semibold">unsubscribed.</p>
        <p className="text-xs text-muted-foreground">you've been removed from our mailing list.</p>
      </div>
    ),
    invalid: (
      <div className="text-center space-y-3">
        <XCircle className="h-6 w-6 text-destructive mx-auto" />
        <p className="font-display text-sm font-semibold">invalid link.</p>
        <p className="text-xs text-muted-foreground">this unsubscribe link is invalid or has expired.</p>
      </div>
    ),
    error: (
      <div className="text-center space-y-3">
        <XCircle className="h-6 w-6 text-destructive mx-auto" />
        <p className="font-display text-sm font-semibold">something went wrong.</p>
        <p className="text-xs text-muted-foreground">please try again later.</p>
      </div>
    ),
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <FloatingParticles />
      <Header />
      <main className="container max-w-md mx-auto px-6 py-20 relative z-10">
        <div className="border border-accent/40 rounded-xl p-8 bg-card/30">
          {content[status]}
        </div>
      </main>
      <div className="flex-1" />
      <Footer />
    </div>
  );
};

export default Unsubscribe;

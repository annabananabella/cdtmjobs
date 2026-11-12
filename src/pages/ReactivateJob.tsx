import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingParticles from "@/components/FloatingParticles";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

type Status = "loading" | "success" | "already" | "invalid" | "error";

const ReactivateJob = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [jobTitle, setJobTitle] = useState<string>("");

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    const run = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("reactivate-job", {
          body: { token },
        });
        if (error) { setStatus("error"); return; }
        if (data?.success) {
          setJobTitle(data.job_title || "");
          setStatus(data.already ? "already" : "success");
        } else {
          setStatus("invalid");
        }
      } catch { setStatus("error"); }
    };
    run();
  }, [token]);

  const content: Record<Status, React.ReactNode> = {
    loading: <Loader2 className="animate-spin h-6 w-6 text-primary mx-auto" />,
    success: (
      <div className="text-center space-y-3">
        <CheckCircle2 className="h-6 w-6 text-primary mx-auto" />
        <p className="font-display text-sm font-semibold">listing reactivated.</p>
        {jobTitle && <p className="text-xs text-muted-foreground">"{jobTitle}" is back on the board.</p>}
      </div>
    ),
    already: (
      <div className="text-center space-y-3">
        <CheckCircle2 className="h-6 w-6 text-primary mx-auto" />
        <p className="font-display text-sm font-semibold">already active.</p>
        {jobTitle && <p className="text-xs text-muted-foreground">"{jobTitle}" is live on the board.</p>}
      </div>
    ),
    invalid: (
      <div className="text-center space-y-3">
        <XCircle className="h-6 w-6 text-destructive mx-auto" />
        <p className="font-display text-sm font-semibold">invalid link.</p>
        <p className="text-xs text-muted-foreground">this reactivation link is invalid or expired.</p>
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

export default ReactivateJob;

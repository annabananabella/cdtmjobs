import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import JobListings from "@/components/JobListings";
import FloatingParticles from "@/components/FloatingParticles";
import rocketVideo from "@/assets/rocket-to-moon-v4.mp4";

const Index = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialView = searchParams.get("view") === "board" ? "board" : "landing";
  const [view, setView] = useState<"landing" | "board">(initialView);

  useEffect(() => {
    if (searchParams.get("postjob") === "true") navigate("/post-job");
    if (searchParams.get("newsletter") === "true") navigate("/newsletter");
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background relative">
      <FloatingParticles />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header
          onPostJob={() => navigate("/post-job")}
          onJobBoard={() => setView("board")}
          onNewsletter={() => navigate("/newsletter")}
          onLogoClick={() => setView("landing")}
          activeView={view}
        />

        {/* Hero - only on landing view */}
        {view === "landing" && (
          <section className="relative overflow-hidden min-h-[70vh] flex items-center">
              {/* Video background - full width, blended into the page */}
              <div className="absolute inset-0 pointer-events-none select-none z-10" aria-hidden="true">
                <div className="absolute top-0 right-0 w-[65%] h-full bg-background" 
                  style={{
                    maskImage: "radial-gradient(ellipse 100% 100% at 70% 50%, black 30%, transparent 60%)",
                    WebkitMaskImage: "radial-gradient(ellipse 100% 100% at 70% 50%, black 30%, transparent 60%)",
                  }}
                />
                <video
                  src={rocketVideo}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute top-1/2 right-0 -translate-y-1/2 w-[50%] h-auto opacity-80"
                  style={{
                    maskImage: "radial-gradient(ellipse 80% 80% at 70% 50%, black 30%, transparent 70%)",
                    WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 70% 50%, black 30%, transparent 70%)",
                  }}
                />
              </div>

              <div className="container max-w-6xl mx-auto px-6 py-28 relative z-10">
                <div className="max-w-3xl">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tighter leading-[1] mb-8">
                    Discover your
                    <br />
                    next role at a
                    <br />
                    <span className="text-gradient">CDTM company.</span>
                  </h1>
                  <div className="flex items-center gap-3 mt-6">
                    <button
                      onClick={() => navigate("/post-job")}
                      className="inline-flex items-center justify-center w-36 px-5 py-2.5 rounded-lg border border-primary bg-transparent text-foreground font-display text-xs tracking-wider font-semibold hover:bg-primary hover:text-primary-foreground active:bg-primary/80 transition-colors"
                    >
                      post a job.
                    </button>
                    <button
                      onClick={() => setView("board")}
                      className="inline-flex items-center justify-center w-36 px-5 py-2.5 rounded-lg border border-secondary bg-transparent text-foreground font-display text-xs tracking-wider font-semibold hover:bg-secondary hover:text-secondary-foreground active:bg-secondary/80 transition-colors"
                    >
                      find a role.
                    </button>
                  </div>
                </div>
              </div>
          </section>
        )}

        {/* Main Content - only job listings */}
        {view === "board" && (
          <main className="container max-w-3xl mx-auto px-6 pb-32 flex-1">
            <div className="pt-10">
              <JobListings />
            </div>
          </main>
        )}

        {!( view === "board") && <div className="flex-1" />}

        <Footer />
      </div>


    </div>
  );
};

export default Index;

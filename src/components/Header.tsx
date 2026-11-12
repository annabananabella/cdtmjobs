import { Link, useLocation } from "react-router-dom";
import { Terminal } from "lucide-react";

interface HeaderProps {
  onPostJob?: () => void;
  onJobBoard?: () => void;
  onNewsletter?: () => void;
  onLogoClick?: () => void;
  activeView?: string;
}

export default function Header({ onPostJob, onJobBoard, onNewsletter, onLogoClick, activeView }: HeaderProps) {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isPostJob = location.pathname === "/post-job";
  const isNewsletter = location.pathname === "/newsletter";

  const navClass = (active: boolean, color: "primary" | "secondary" | "accent") => {
    const colorMap = {
      primary: { active: "bg-primary/80 text-primary-foreground", hover: "hover:text-primary/80" },
      secondary: { active: "bg-secondary/80 text-secondary-foreground", hover: "hover:text-secondary/80" },
      accent: { active: "bg-accent/80 text-accent-foreground", hover: "hover:text-accent/80" },
    };
    return `font-display text-xs tracking-wide sm:tracking-wider px-1.5 sm:px-3 py-1.5 rounded-md transition-colors text-center whitespace-nowrap ${
      active ? colorMap[color].active : `text-muted-foreground ${colorMap[color].hover}`
    }`;
  };

  return (
    <header className="border-b border-border/50 glass sticky top-0 z-50">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-2 sm:gap-4">
        {isHome ? (
          <button onClick={onLogoClick} className="flex items-center gap-2.5 group shrink-0">
            <Terminal className="h-4 w-4 text-primary animate-[blink_1s_step-end_infinite] shrink-0" />
            <span className="font-display font-semibold text-xs tracking-widest uppercase text-primary whitespace-nowrap">CDTM Jobs</span>
            <span className="text-foreground text-xs font-light hidden md:inline ml-2 whitespace-nowrap">An alumni project.</span>
          </button>
        ) : (
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <Terminal className="h-4 w-4 text-primary animate-[blink_1s_step-end_infinite] shrink-0" />
            <span className="font-display font-semibold text-xs tracking-widest uppercase text-primary whitespace-nowrap">CDTM Jobs</span>
            <span className="text-foreground text-xs font-light hidden md:inline ml-2 whitespace-nowrap">An alumni project.</span>
          </Link>
        )}
        <nav className="flex items-center gap-1">
          {onPostJob ? (
            <button onClick={onPostJob} className={navClass(isPostJob, "primary")}>
              Post a Job
            </button>
          ) : (
            <Link to="/post-job" className={navClass(isPostJob, "primary")}>
              Post a Job
            </Link>
          )}
          {onJobBoard ? (
            <button onClick={onJobBoard} className={navClass(activeView === "board", "secondary")}>
              Job Board
            </button>
          ) : (
            <Link to="/?view=board" className={navClass(false, "secondary")}>
              Job Board
            </Link>
          )}
          {onNewsletter ? (
            <button onClick={onNewsletter} className={navClass(isNewsletter, "accent")}>
              Newsletter
            </button>
          ) : (
            <Link to="/newsletter" className={navClass(isNewsletter, "accent")}>
              Newsletter
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

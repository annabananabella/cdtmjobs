import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border/50 glass sticky bottom-0 z-50">
      <div className="container max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <span className="font-display text-xs text-muted-foreground font-light tracking-wider">
          Open positions from companies founded, led by or affiliated with{" "}
          <a href="https://www.cdtm.com" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary transition-colors">
            CDTM
          </a>{" "}
          alumni.
        </span>
        <nav className="flex items-center gap-1">
          <Link to="/imprint" className="font-display text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wider px-3 py-1.5">Imprint</Link>
          <Link to="/privacy" className="font-display text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wider px-3 py-1.5">Privacy</Link>
          <Link to="/terms" className="font-display text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wider px-3 py-1.5">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}
